import { auth } from "@/lib/auth"
import { completeMultipartUpload } from "@/lib/s3"
import { db } from "@/lib/db"
import { files } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { uploadId, key, fileId, parts } = await req.json()
  // parts structure: [{ PartNumber: 1, ETag: '...' }, ...]

  if (!uploadId || !key || !fileId || !parts || !Array.isArray(parts)) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 })
  }

  try {
    await completeMultipartUpload(key, uploadId, parts)

    await db
      .update(files)
      .set({ uploadStatus: "COMPLETE", updatedAt: new Date() })
      .where(eq(files.id, fileId))

    return NextResponse.json({ success: true, key })
  } catch (error) {
    console.error("[S3] Error completing multipart upload:", error)
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 })
  }
}
