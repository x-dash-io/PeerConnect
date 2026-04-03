import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversationParticipants, users, files } from "@/lib/schema"
import { eq, and, desc, lt } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
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

  const replyMessages = alias(messages, "reply_messages")
  const replyUsers = alias(users, "reply_users")

  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      status: messages.status,
      replyToId: messages.replyToId,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
      updatedAt: messages.updatedAt,
      senderName: users.name,
      senderImage: users.image,
      replyContent: replyMessages.content,
      replySenderName: replyUsers.name,
      fileId: files.id,
      fileS3Key: files.s3Key,
      fileFilename: files.filename,
      fileMimeType: files.mimeType,
      fileSizeBytes: files.sizeBytes,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(replyMessages, eq(messages.replyToId, replyMessages.id))
    .leftJoin(replyUsers, eq(replyMessages.senderId, replyUsers.id))
    .leftJoin(files, eq(messages.id, files.messageId))
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? page[page.length - 1].id : null

  const formatted = page.map((row) => ({
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    type: row.type,
    status: row.status,
    replyToId: row.replyToId,
    replyTo: row.replyToId
      ? { id: row.replyToId, content: row.replyContent, senderName: row.replySenderName }
      : null,
    file: row.fileId
      ? {
          id: row.fileId,
          s3Key: row.fileS3Key,
          filename: row.fileFilename,
          mimeType: row.fileMimeType,
          sizeBytes: row.fileSizeBytes,
        }
      : null,
    metadata: row.metadata,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    senderName: row.senderName,
    senderImage: row.senderImage,
  }))

  return NextResponse.json({ messages: formatted, nextCursor })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId } = await params
  const body = await req.json()
  const { content, type = "TEXT", replyToId, fileId } = body

  if (!content?.trim() && !fileId) {
    return NextResponse.json({ error: "Content or file required" }, { status: 400 })
  }

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

  // If replying, fetch the reply preview
  let replyTo = null
  if (replyToId) {
    const [replyMsg] = await db
      .select({ id: messages.id, content: messages.content, senderName: users.name })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, replyToId))
      .limit(1)
    if (replyMsg) replyTo = replyMsg
  }

  const [message] = await db
    .insert(messages)
    .values({
      id: messageId,
      conversationId,
      senderId: session.user.id,
      content: content?.trim() || null,
      type,
      status: "SENT",
      replyToId: replyToId || null,
    })
    .returning()

  // Link file if provided
  let fileData = null
  if (fileId) {
    const [updatedFile] = await db
      .update(files)
      .set({ messageId })
      .where(eq(files.id, fileId))
      .returning()

    if (updatedFile) {
      fileData = {
        id: updatedFile.id,
        s3Key: updatedFile.s3Key,
        filename: updatedFile.filename,
        mimeType: updatedFile.mimeType,
        sizeBytes: updatedFile.sizeBytes,
      }
    }
  }

  const fullMessage = {
    ...message,
    senderName: session.user.name,
    senderImage: session.user.image,
    replyTo,
    file: fileData,
    metadata: body.metadata || null, // Ensure metadata (like duration) is passed through
  }

  // Emit via Socket.io
  const io: Server | undefined = (global as Record<string, unknown>).io as Server | undefined
  if (io) {
    // Broadcast to conversation room (all participants including sender)
    io.to(`conversation:${conversationId}`).emit("message:received", fullMessage)

    // Notify each other participant's personal room for sidebar update
    const participants = await db
      .select({ userId: conversationParticipants.userId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId))

    for (const p of participants) {
      if (p.userId !== session.user.id) {
        io.to(`user:${p.userId}`).emit("conversation:updated", {
          conversationId,
          lastMessage: fullMessage,
        })
      }
    }
  }

  return NextResponse.json(fullMessage, { status: 201 })
}
