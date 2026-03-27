import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversationParticipants, users } from "@/lib/schema"
import { eq, and, desc, lt } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { MESSAGE_PAGE_SIZE } from "@/lib/constants"
import { generateId } from "@/lib/id"
import type { Server } from "socket.io"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params
  const { searchParams } = req.nextUrl
  const cursor = searchParams.get("cursor")
  const limit = Math.min(parseInt(searchParams.get("limit") || String(MESSAGE_PAGE_SIZE), 10), 100)

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

  // Build query with optional cursor
  const conditions = [eq(messages.conversationId, conversationId)]
  if (cursor) {
    // Fetch cursor message's createdAt for keyset pagination
    const [cursorMsg] = await db
      .select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, cursor))
      .limit(1)

    if (cursorMsg) {
      conditions.push(lt(messages.createdAt, cursorMsg.createdAt))
    }
  }

  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      status: messages.status,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
      senderName: users.name,
      senderImage: users.image,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1) // fetch one extra to determine nextCursor

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? page[page.length - 1].id : null

  return NextResponse.json({ messages: page, nextCursor })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params
  const body = await req.json()
  const { content, type = "TEXT" } = body

  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 })

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

  const messageId = generateId()

  const [message] = await db
    .insert(messages)
    .values({
      id: messageId,
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
      type,
      status: "SENT",
    })
    .returning()

  // Emit via Socket.io
  const io: Server | undefined = (global as Record<string, unknown>).io as Server | undefined
  if (io) {
    io.to(`conversation:${conversationId}`).emit("message:received", {
      ...message,
      senderName: session.user.name,
      senderImage: session.user.image,
    })
  }

  return NextResponse.json(message, { status: 201 })
}
