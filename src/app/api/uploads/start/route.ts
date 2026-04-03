import { auth } from "@/lib/auth"
import { createMultipartUpload, generateS3Key } from "@/lib/s3"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { generateId } from "@/lib/id"
import { NextRequest, NextResponse } from "next/server"

const MAX_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(req: NextRequest) {
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

  return NextResponse.json({ uploadId, key, fileId })
}
