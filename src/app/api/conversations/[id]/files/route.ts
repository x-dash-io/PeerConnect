import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, files, conversationParticipants, users } from "@/lib/schema"
import { eq, and, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params

  // Verify user is a participant
  const [membership] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
      ),
    )
    .limit(1)

  if (!membership) return NextResponse.json({ error: "Not a participant" }, { status: 403 })

  // Fetch all media messages with their file attachments
  const mediaMessages = await db
    .select({
      messageId: messages.id,
      type: messages.type,
      senderId: messages.senderId,
      senderName: users.name,
      createdAt: messages.createdAt,
      fileId: files.id,
      s3Key: files.s3Key,
      filename: files.filename,
      mimeType: files.mimeType,
      sizeBytes: files.sizeBytes,
      uploadStatus: files.uploadStatus,
    })
    .from(messages)
    .innerJoin(files, eq(files.messageId, messages.id))
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        inArray(messages.type, ["IMAGE", "VIDEO", "FILE", "AUDIO"]),
        eq(files.uploadStatus, "COMPLETE"),
      ),
    )
    .orderBy(messages.createdAt)

  // Group by media type
  const images = mediaMessages.filter((m) => m.type === "IMAGE")
  const videos = mediaMessages.filter((m) => m.type === "VIDEO")
  const fileItems = mediaMessages.filter((m) => m.type === "FILE")
  const audio = mediaMessages.filter((m) => m.type === "AUDIO")

  return NextResponse.json({ images, videos, files: fileItems, audio })
}
