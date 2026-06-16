import { auth } from "@/lib/auth"
import { s3, generateS3Key, BUCKET } from "@/lib/s3"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { generateId } from "@/lib/id"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

const MAX_SIMPLE_SIZE = 20 * 1024 * 1024 // 20MB max for single PUT

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { filename, contentType, sizeBytes } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 })
  }

  if (sizeBytes > MAX_SIMPLE_SIZE) {
    return NextResponse.json(
      { error: "File too large for simple upload (max 20MB). Use multipart upload." },
      { status: 413 },
    )
  }

  const key = generateS3Key(session.user.id, filename)

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 }) // 1 hour

  const fileId = generateId()
  await db.insert(files).values({
    id: fileId,
    messageId: null,
    s3Key: key,
    filename,
    mimeType: contentType,
    sizeBytes,
    uploadStatus: "UPLOADING",
  })

  return NextResponse.json({ url, fileId, key })
}
