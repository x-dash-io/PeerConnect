import { auth } from "@/lib/auth"
import { getDownloadUrl } from "@/lib/s3"
import { db } from "@/lib/db"
import { files, conversationParticipants } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 })
  }

  try {
    // Find the file record by s3Key
    const [file] = await db
      .select({
        id: files.id,
        messageId: files.messageId,
        uploadStatus: files.uploadStatus,
      })
      .from(files)
      .where(eq(files.s3Key, key))
      .limit(1)

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    if (file.uploadStatus !== "COMPLETE") {
      return NextResponse.json({ error: "File not ready" }, { status: 400 })
    }

    // If the file is linked to a message, verify the requesting user is a participant
    // in that conversation. Unlinked files (still uploading) skip this check.
    if (file.messageId) {
      const { messages } = await import("@/lib/schema")
      const [msg] = await db
        .select({ conversationId: messages.conversationId })
        .from(messages)
        .where(eq(messages.id, file.messageId))
        .limit(1)

      if (msg) {
        const [userMembership] = await db
          .select({ userId: conversationParticipants.userId })
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.conversationId, msg.conversationId),
              eq(conversationParticipants.userId, session.user!.id),
            ),
          )
          .limit(1)

        if (!userMembership) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
    }

    const url = await getDownloadUrl(key, 900) // 15 minutes
    return NextResponse.json({ url })
  } catch (error) {
    console.error("[S3] Error generating download URL:", error)
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 })
  }
}
