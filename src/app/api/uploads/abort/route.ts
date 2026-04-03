import { auth } from "@/lib/auth"
import { abortMultipartUpload } from "@/lib/s3"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { uploadId, key, fileId } = await req.json()

  if (!uploadId || !key || !fileId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  try {
    await abortMultipartUpload(key, uploadId)

    await db
      .update(files)
      .set({ uploadStatus: "FAILED", updatedAt: new Date() })
      .where(eq(files.id, fileId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[S3] Error aborting multipart upload:", error)
    // Even if S3 abort fails (e.g. already aborted), we should mark DB as failed
    await db
      .update(files)
      .set({ uploadStatus: "FAILED", updatedAt: new Date() })
      .where(eq(files.id, fileId))
      .catch(() => {})

    return NextResponse.json({ error: "Failed to abort upload" }, { status: 500 })
  }
}
