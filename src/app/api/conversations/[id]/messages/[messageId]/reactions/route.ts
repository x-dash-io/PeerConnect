import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messageReactions, messages, conversationParticipants } from "@/lib/schema"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { generateId } from "@/lib/id"
import type { Server as SocketIOServer } from "socket.io"

// Add a reaction
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId, messageId } = await params
  const { emoji } = await req.json()

  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "Emoji is required" }, { status: 400 })
  }

  // Check user is participant
  const [participant] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, session.user.id),
      ),
    )
    .limit(1)

  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 })
  }

  // Check message exists in conversation
  const [msg] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
    .limit(1)

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  // Upsert reaction: delete if same emoji exists, else insert
  const [existing] = await db
    .select()
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, session.user.id),
        eq(messageReactions.emoji, emoji),
      ),
    )
    .limit(1)

  if (existing) {
    // Toggle off
    await db.delete(messageReactions).where(eq(messageReactions.id, existing.id))

    // Notify via Socket.io
    const io: SocketIOServer | undefined = (global as Record<string, unknown>).io as
      | SocketIOServer
      | undefined
    if (io) {
      io.to(`conversation:${conversationId}`).emit("message:reaction:removed", {
        conversationId,
        reactionId: existing.id,
      })
    }

    return NextResponse.json({ action: "removed", reactionId: existing.id })
  }

  // Insert new reaction
  const reactionId = generateId()
  await db.insert(messageReactions).values({
    id: reactionId,
    messageId,
    userId: session.user.id,
    emoji,
  })

  const newReaction = {
    id: reactionId,
    messageId,
    userId: session.user.id,
    emoji,
    createdAt: new Date().toISOString(),
  }

  // Notify via Socket.io
  const io: SocketIOServer | undefined = (global as Record<string, unknown>).io as
    | SocketIOServer
    | undefined
  if (io) {
    io.to(`conversation:${conversationId}`).emit("message:reaction:added", {
      conversationId,
      reaction: newReaction,
    })
  }

  return NextResponse.json({ action: "added", reaction: newReaction })
}
