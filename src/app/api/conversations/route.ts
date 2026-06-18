import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, conversationParticipants, messages, users } from "@/lib/schema"
import { eq, and, ne, gt, desc, sql, inArray } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { generateId } from "@/lib/id"
import { getIO } from "@/lib/socket-server"

const CONVERSATIONS_PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id

  const { searchParams } = req.nextUrl
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(CONVERSATIONS_PAGE_SIZE), 10),
    100,
  )

  // Last message per conversation via LATERAL join — runs once per conversation,
  // uses the composite index (conversation_id, created_at) for instant lookups
  const lastMsg = alias(messages, "last_msg")

  const conditions = [eq(conversationParticipants.userId, currentUserId)]

  // Get conversations with their last activity timestamp
  const userConversations = await db
    .select({
      id: conversations.id,
      type: conversations.type,
      createdAt: conversations.createdAt,
      lastReadAt: conversationParticipants.lastReadAt,
      lastActivity: sql<string>`COALESCE(${lastMsg.createdAt}::text, ${conversations.createdAt}::text)`,
    })
    .from(conversations)
    .innerJoin(
      conversationParticipants,
      eq(conversations.id, conversationParticipants.conversationId),
    )
    .leftJoin(
      lastMsg,
      sql`${lastMsg.id} = (SELECT m2.id FROM messages m2 WHERE m2.conversation_id = conversations.id ORDER BY m2.created_at DESC LIMIT 1)`,
    )
    .where(and(...conditions))
    .orderBy(desc(sql`COALESCE(${lastMsg.createdAt}, ${conversations.createdAt})`))
    .limit(limit + 1)

  const hasMore = userConversations.length > limit
  const page = hasMore ? userConversations.slice(0, limit) : userConversations
  const nextCursor = hasMore ? page[page.length - 1].lastActivity : null
  const convIds = page.map((c) => c.id)

  if (convIds.length === 0) {
    return NextResponse.json({ conversations: [], nextCursor: null })
  }

  // Batch-fetch all participants for all conversations (one query instead of N)
  const allParticipants = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      id: users.id,
      name: users.name,
      image: users.image,
      email: users.email,
      role: users.role,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(conversationParticipants.userId, users.id))
    .where(inArray(conversationParticipants.conversationId, convIds))

  const participantsByConv = allParticipants.reduce(
    (acc, p) => {
      if (!acc[p.conversationId]) acc[p.conversationId] = []
      acc[p.conversationId].push({
        id: p.id,
        name: p.name,
        image: p.image,
        email: p.email,
        role: p.role,
      })
      return acc
    },
    {} as Record<
      string,
      Array<{ id: string; name: string | null; image: string | null; email: string; role: string }>
    >,
  )

  // Batch-fetch last message per conversation via DISTINCT ON
  const lastMessages = await db.execute<{
    id: string
    conversation_id: string
    sender_id: string
    content: string | null
    type: string
    status: string
    created_at: string
  }>(sql`
    SELECT DISTINCT ON (m.conversation_id) m.id, m.conversation_id, m.sender_id, m.content, m.type, m.status, m.created_at
    FROM messages m
    WHERE m.conversation_id = ANY(ARRAY[${sql.join(convIds, sql`, `)}])
    ORDER BY m.conversation_id, m.created_at DESC
  `)

  const lastMsgByConv = Object.fromEntries(lastMessages.rows.map((m) => [m.conversation_id, m]))

  // Batch-fetch unread counts per conversation
  const unreadCounts = await db
    .select({
      conversationId: messages.conversationId,
      count: sql<number>`count(*)::int`,
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, convIds),
        ne(messages.senderId, currentUserId),
        gt(
          messages.createdAt,
          sql`COALESCE(
            (SELECT cp2.last_read_at FROM conversation_participants cp2 WHERE cp2.conversation_id = messages.conversation_id AND cp2.user_id = ${currentUserId}),
            '1970-01-01'::timestamp
          )`,
        ),
      ),
    )
    .groupBy(messages.conversationId)

  const unreadByConv = Object.fromEntries(unreadCounts.map((u) => [u.conversationId, u.count]))

  const enriched = page.map((conv) => ({
    ...conv,
    participants: participantsByConv[conv.id] || [],
    lastMessage: lastMsgByConv[conv.id] || null,
    unreadCount: unreadByConv[conv.id] || 0,
  }))

  return NextResponse.json({ conversations: enriched, nextCursor })
}

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const currentUserId = session.user.id

  const body = await req.json()
  const { recipientId } = body
  if (!recipientId) {
    return NextResponse.json({ error: "recipientId is required" }, { status: 400 })
  }

  const [recipient] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, recipientId))
    .limit(1)

  if (!recipient) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check for existing DIRECT conversation between the two users
  const cp1 = alias(conversationParticipants, "cp1")
  const cp2 = alias(conversationParticipants, "cp2")

  const [existing] = await db
    .select({ id: conversations.id, createdAt: conversations.createdAt })
    .from(conversations)
    .innerJoin(cp1, and(eq(conversations.id, cp1.conversationId), eq(cp1.userId, currentUserId)))
    .innerJoin(cp2, and(eq(conversations.id, cp2.conversationId), eq(cp2.userId, recipientId)))
    .where(eq(conversations.type, "DIRECT"))
    .limit(1)

  if (existing) {
    const participants = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        email: users.email,
        role: users.role,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, existing.id))

    return NextResponse.json({
      id: existing.id,
      type: "DIRECT",
      createdAt: existing.createdAt,
      participants,
    })
  }

  const conversationId = generateId()
  const now = new Date()

  await db.insert(conversations).values({
    id: conversationId,
    type: "DIRECT",
    createdAt: now,
  })

  await db.insert(conversationParticipants).values([
    { conversationId, userId: currentUserId },
    { conversationId, userId: recipientId },
  ])

  const participants = [
    {
      id: currentUserId,
      name: session.user.name,
      image: session.user.image,
      email: session.user.email!,
      role: (session.user as unknown as Record<string, unknown>).role as string,
    },
    {
      id: recipient.id,
      name: recipient.name,
      image: recipient.image,
      email: recipient.email,
      role: recipient.role,
    },
  ]

  const io = getIO()
  if (io) {
    io.to(`user:${recipientId}`).emit("conversation:new", {
      id: conversationId,
      type: "DIRECT",
      createdAt: now,
      participants,
    })
  }

  return NextResponse.json(
    { id: conversationId, type: "DIRECT", createdAt: now, participants },
    { status: 201 },
  )
}
