import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversationParticipants, files as filesTable } from "@/lib/schema"
import { eq, and, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { rateLimitMessages } from "@/lib/rate-limit"
import { generateId } from "@/lib/id"
import { getIO } from "@/lib/socket-server"
import { sanitizeMessage } from "@/lib/sanitize"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await rateLimitMessages(session.user.id)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const { messageId, targetConversationIds } = await req.json()

  if (
    !messageId ||
    !targetConversationIds ||
    !Array.isArray(targetConversationIds) ||
    targetConversationIds.length === 0
  ) {
    return NextResponse.json(
      { error: "Missing messageId or targetConversationIds" },
      { status: 400 },
    )
  }

  if (targetConversationIds.length > 5) {
    return NextResponse.json(
      { error: "Cannot forward to more than 5 conversations at once" },
      { status: 400 },
    )
  }

  // Fetch the original message
  const [original] = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      metadata: messages.metadata,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)

  if (!original) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  // Verify user is participant in the source conversation
  const [sourceMembership] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, original.conversationId),
        eq(conversationParticipants.userId, session.user.id),
      ),
    )
    .limit(1)

  if (!sourceMembership) {
    return NextResponse.json({ error: "Not a participant in source conversation" }, { status: 403 })
  }

  // Verify user is participant in all target conversations
  const targetMemberships = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(
      and(
        inArray(conversationParticipants.conversationId, targetConversationIds),
        eq(conversationParticipants.userId, session.user.id),
      ),
    )

  const memberConversationIds = new Set(targetMemberships.map((m) => m.conversationId))
  for (const targetId of targetConversationIds) {
    if (!memberConversationIds.has(targetId)) {
      return NextResponse.json(
        { error: `Not a participant in conversation ${targetId}` },
        { status: 403 },
      )
    }
  }

  const forwardedMeta = {
    forwardedFrom: {
      messageId: original.id,
      conversationId: original.conversationId,
      senderName: session.user.name || "Unknown",
    },
  }

  // Find linked file
  const [linkedFile] = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.messageId, messageId))
    .limit(1)

  const io = getIO()
  const createdMessages = []

  for (const targetId of targetConversationIds) {
    const newMessageId = generateId()

    const [inserted] = await db
      .insert(messages)
      .values({
        id: newMessageId,
        conversationId: targetId,
        senderId: session.user.id,
        content: original.content ? sanitizeMessage(original.content) : original.content,
        type: original.type,
        status: "SENT",
        metadata: {
          ...(typeof original.metadata === "object" && original.metadata !== null
            ? original.metadata
            : {}),
          ...forwardedMeta,
        },
      })
      .returning()

    // Link file if original had one
    let fileData = null
    if (linkedFile) {
      const newFileId = generateId()
      const [insertedFile] = await db
        .insert(filesTable)
        .values({
          id: newFileId,
          messageId: newMessageId,
          s3Key: linkedFile.s3Key,
          filename: linkedFile.filename,
          mimeType: linkedFile.mimeType,
          sizeBytes: linkedFile.sizeBytes,
          uploadStatus: "COMPLETE",
        })
        .returning()

      fileData = {
        id: insertedFile.id,
        s3Key: insertedFile.s3Key,
        filename: insertedFile.filename,
        mimeType: insertedFile.mimeType,
        sizeBytes: insertedFile.sizeBytes,
      }
    }

    const fullMessage = {
      ...inserted,
      senderName: session.user.name,
      senderImage: session.user.image,
      file: fileData,
      replyTo: null,
    }

    createdMessages.push(fullMessage)

    // Emit socket events
    if (io) {
      io.to(`conversation:${targetId}`).emit("message:received", fullMessage)

      // Notify other participants for sidebar update
      const participants = await db
        .select({ userId: conversationParticipants.userId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, targetId))

      for (const p of participants) {
        if (p.userId !== session.user.id) {
          io.to(`user:${p.userId}`).emit("conversation:updated", {
            conversationId: targetId,
            lastMessage: fullMessage,
          })
        }
      }
    }
  }

  return NextResponse.json({ forwarded: createdMessages.length, messages: createdMessages })
}
