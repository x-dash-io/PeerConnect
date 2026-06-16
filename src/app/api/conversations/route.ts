import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, conversationParticipants, messages, users } from "@/lib/schema"
import { eq, and, ne, gt, desc, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

const CONVERSATIONS_PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get("cursor")
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(CONVERSATIONS_PAGE_SIZE), 10),
    100,
  )

  // Get conversations where user is a participant, ordered by latest activity
  const conditions = [eq(conversationParticipants.userId, currentUserId)]
  if (cursor) {
    conditions.push(
      sql`COALESCE((SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = conversations.id), conversations.created_at) < ${cursor}::timestamptz`,
    )
  }

  const userConversations = await db
    .select({
      id: conversations.id,
      type: conversations.type,
      createdAt: conversations.createdAt,
      lastReadAt: conversationParticipants.lastReadAt,
      lastActivity: sql<string>`COALESCE((SELECT MAX(m.created_at)::text FROM messages m WHERE m.conversation_id = conversations.id), conversations.created_at::text)`,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId),
    )
    .where(and(...conditions))
    .orderBy(
      desc(
        sql`COALESCE((SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = conversations.id), conversations.created_at)`,
      ),
    )
    .limit(limit + 1)

  const hasMore = userConversations.length > limit
  const page = hasMore ? userConversations.slice(0, limit) : userConversations
  const nextCursor = hasMore ? page[page.length - 1].lastActivity : null

  // For each conversation, get participants and last message
  const enriched = await Promise.all(
    page.map(async (conv) => {
      const participants = await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .innerJoin(conversationParticipants, eq(users.id, conversationParticipants.userId))
        .where(eq(conversationParticipants.conversationId, conv.id))

      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)

      // Count unread messages (from others, after lastReadAt)
      const unreadConditions = [
        eq(messages.conversationId, conv.id),
        ne(messages.senderId, currentUserId),
      ]
      if (conv.lastReadAt) {
        unreadConditions.push(gt(messages.createdAt, conv.lastReadAt))
      }

      const [{ count: unreadCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(...unreadConditions))

      return { ...conv, participants, lastMessage: lastMessage || null, unreadCount }
    }),
  )

  return NextResponse.json({ conversations: enriched, nextCursor })
}

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { recipientId } = await req.json()
  if (!recipientId) return NextResponse.json({ error: "recipientId required" }, { status: 400 })
  if (recipientId === session.user.id)
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })

  // Check if direct conversation already exists
  const existing = await db.execute<{ id: string }>(sql`
    SELECT c.id FROM conversations c
    INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ${session.user.id}
    INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ${recipientId}
    WHERE c.type = 'DIRECT'
    LIMIT 1
  `)

  if (existing.rows.length > 0) {
    return NextResponse.json({ id: existing.rows[0].id })
  }

  // Create new conversation
  const { generateId } = await import("@/lib/id")
  const convId = generateId()

  await db.insert(conversations).values({ id: convId, type: "DIRECT" })
  await db.insert(conversationParticipants).values([
    { conversationId: convId, userId: session.user.id },
    { conversationId: convId, userId: recipientId },
  ])

  return NextResponse.json({ id: convId }, { status: 201 })
}
