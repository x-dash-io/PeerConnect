import { auth } from "@/lib/auth"
import { s3, generateS3Key, BUCKET } from "@/lib/s3"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { contentType, sizeBytes } = await req.json()

  if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Invalid image type (JPEG, PNG, WebP only)" },
      { status: 400 },
    )
  }

  if (sizeBytes > MAX_AVATAR_SIZE) {
    return NextResponse.json({ error: "Avatar must be under 5MB" }, { status: 413 })
  }

  const ext = contentType.split("/")[1]
  const key = `avatars/${session.user.id}-${Date.now()}.${ext}`

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 })

  return NextResponse.json({ url, key })
}
