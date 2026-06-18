import { UPLOAD_CHUNK_SIZE_BYTES, UPLOAD_MAX_CONCURRENT_PARTS } from "./constants"

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadResult {
  fileId: string
  key: string
  s3Url: string
}

function uploadPartXHR(
  signedUrl: string,
  chunk: Blob,
  onProgress: (loaded: number, total: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", signedUrl)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag")?.replace(/"/g, "")
        if (etag) resolve(etag)
        else reject(new Error("No ETag in response"))
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(chunk)
  })
}

export async function uploadFile(
  file: File,
  messageId: string | null,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const { uploadId, key, fileId } = await fetch("/api/uploads/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      messageId,
    }),
  }).then((r) => r.json())

  const totalParts = Math.ceil(file.size / UPLOAD_CHUNK_SIZE_BYTES)
  const parts: { PartNumber: number; ETag: string }[] = []
  let uploadedBytes = 0

  // Upload parts with concurrency limit
  const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1)

  async function uploadPart(partNumber: number): Promise<void> {
    const start = (partNumber - 1) * UPLOAD_CHUNK_SIZE_BYTES
    const end = Math.min(start + UPLOAD_CHUNK_SIZE_BYTES, file.size)
    const chunk = file.slice(start, end)

    const { signedUrl } = await fetch(
      `/api/uploads/signed-url?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`,
    ).then((r) => r.json())

    const bytesBeforePart = uploadedBytes
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const etag = await uploadPartXHR(signedUrl, chunk, (loaded) => {
          const totalLoaded = bytesBeforePart + loaded
          onProgress?.({
            loaded: totalLoaded,
            total: file.size,
            percentage: (totalLoaded / file.size) * 100,
          })
        })

        parts.push({ PartNumber: partNumber, ETag: etag })
        uploadedBytes = bytesBeforePart + (end - start)
        onProgress?.({
          loaded: uploadedBytes,
          total: file.size,
          percentage: (uploadedBytes / file.size) * 100,
        })
        return
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < 3) continue
      }
    }

    throw lastError || new Error(`Failed to upload part ${partNumber}`)
  }

  // Process with concurrency limit
  const queue = [...partNumbers]
  const workers = Array.from(
    { length: Math.min(UPLOAD_MAX_CONCURRENT_PARTS, totalParts) },
    async () => {
      while (queue.length > 0) {
        const partNum = queue.shift()!
        await uploadPart(partNum)
      }
    },
  )
  await Promise.all(workers)

  // Complete upload
  await fetch("/api/uploads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      key,
      fileId,
      parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    }),
  })

  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || "peerconnect-uploads"
  return {
    fileId,
    key,
    s3Url: `https://${bucket}.s3.amazonaws.com/${key}`,
  }
}

export async function uploadAudioBlob(blob: Blob): Promise<{ fileId: string; key: string }> {
  const filename = `voice-${Date.now()}.webm`

  // For audio (<20MB): use single pre-signed PUT, not multipart
  const res = await fetch("/api/uploads/simple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      contentType: "audio/webm",
      sizeBytes: blob.size,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload setup failed" }))
    throw new Error(err.error || "Upload setup failed")
  }
  const { url, fileId, key } = await res.json()

  const uploadRes = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "audio/webm" },
  })
  if (!uploadRes.ok) {
    throw new Error(`Audio upload failed: ${uploadRes.status}`)
  }

  // Mark complete
  await fetch("/api/uploads/simple/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  })

  return { fileId, key }
}
