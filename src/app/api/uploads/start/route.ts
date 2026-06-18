import { auth } from "@/lib/auth"
import { createMultipartUpload, generateS3Key } from "@/lib/s3"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { generateId } from "@/lib/id"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { redis } from "@/lib/redis"

const MAX_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { filename, contentType, sizeBytes, messageId } = await req.json()

  if (sizeBytes > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 200MB)" }, { status: 413 })
  }
  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 })
  }

  const key = generateS3Key(session.user.id, filename)
  const { uploadId } = await createMultipartUpload(key, contentType)

  const fileId = generateId()
  await db.insert(files).values({
    id: fileId,
    messageId: messageId || null,
    s3Key: key,
    filename,
    mimeType: contentType,
    sizeBytes,
    uploadStatus: "UPLOADING",
    uploadId,
  })

  await redis.set(`upload:${uploadId}`, session.user.id, { ex: 3600 })

  return NextResponse.json({ uploadId, key, fileId })
}
