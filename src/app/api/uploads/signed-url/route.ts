import { auth } from "@/lib/auth"
import { getUploadPartUrl } from "@/lib/s3"
import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const uploadId = searchParams.get("uploadId")
  const key = searchParams.get("key")
  const partNumberString = searchParams.get("partNumber")

  if (!uploadId || !key || !partNumberString) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const ownerId = await redis.get(`upload:${uploadId}`)
  if (ownerId !== session.user.id) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 })
  }

  const partNumber = parseInt(partNumberString)
  if (isNaN(partNumber)) {
    return NextResponse.json({ error: "Invalid partNumber" }, { status: 400 })
  }

  try {
    const signedUrl = await getUploadPartUrl(key, uploadId, partNumber)
    return NextResponse.json({ signedUrl })
  } catch (error) {
    console.error("[S3] Error generating signed URL:", error)
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 })
  }
}
