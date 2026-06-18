import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { sanitizeMessage } from "@/lib/sanitize"
import { getIO } from "@/lib/socket-server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId, messageId } = await params
  const { content } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const sanitized = sanitizeMessage(content)
  if (sanitized.length < 1) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const [existing] = await db
    .select({ id: messages.id, senderId: messages.senderId })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 })
  if (existing.senderId !== session.user.id) {
    return NextResponse.json({ error: "Cannot edit another user's message" }, { status: 403 })
  }

  const [updated] = await db
    .update(messages)
    .set({ content: sanitized, editedAt: new Date(), updatedAt: new Date() })
    .where(eq(messages.id, messageId))
    .returning()

  const io = getIO()
  if (io) {
    io.to(`conversation:${conversationId}`).emit("message:edited", {
      conversationId,
      message: updated,
    })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId, messageId } = await params

  const [existing] = await db
    .select({ id: messages.id, senderId: messages.senderId })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.conversationId, conversationId)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: "Message not found" }, { status: 404 })
  if (existing.senderId !== session.user.id) {
    return NextResponse.json({ error: "Cannot delete another user's message" }, { status: 403 })
  }

  await db
    .update(messages)
    .set({ isDeleted: true, content: null, updatedAt: new Date() })
    .where(eq(messages.id, messageId))

  const io = getIO()
  if (io) {
    io.to(`conversation:${conversationId}`).emit("message:deleted", {
      conversationId,
      messageId,
    })
  }

  return NextResponse.json({ success: true })
}
