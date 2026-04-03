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

  async function uploadPart(partNumber: number, attempt = 1): Promise<void> {
    const start = (partNumber - 1) * UPLOAD_CHUNK_SIZE_BYTES
    const end = Math.min(start + UPLOAD_CHUNK_SIZE_BYTES, file.size)
    const chunk = file.slice(start, end)

    const { signedUrl } = await fetch(
      `/api/uploads/signed-url?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`,
    ).then((r) => r.json())

    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: chunk,
    })

    if (!uploadRes.ok) {
      if (attempt < 3) return uploadPart(partNumber, attempt + 1)
      throw new Error(`Failed to upload part ${partNumber}`)
    }

    const etag = uploadRes.headers.get("ETag")?.replace(/"/g, "")
    if (!etag) throw new Error(`No ETag for part ${partNumber}`)

    parts.push({ PartNumber: partNumber, ETag: etag })
    uploadedBytes += end - start
    onProgress?.({
      loaded: uploadedBytes,
      total: file.size,
      percentage: (uploadedBytes / file.size) * 100,
    })
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
  const { url, fileId, key } = await fetch("/api/uploads/simple", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      contentType: "audio/webm",
      sizeBytes: blob.size,
    }),
  }).then((r) => r.json())

  const res = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "audio/webm" },
  })
  if (!res.ok) throw new Error("Audio upload to S3 failed")

  // Mark complete
  await fetch("/api/uploads/simple/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  })

  return { fileId, key }
}
