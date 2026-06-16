import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { messages, conversationParticipants, users } from "@/lib/schema"
import { eq, and, ilike, desc, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ messages: [] })
  }

  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50)

  // Get user's conversation IDs
  const userConvIds = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, session.user.id))

  const convIdSet = userConvIds.map((c) => c.conversationId)
  if (convIdSet.length === 0) return NextResponse.json({ messages: [] })

  // Search messages with ilike
  const searchPattern = `%${q}%`
  const rows = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      createdAt: messages.createdAt,
      senderName: users.name,
      senderImage: users.image,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(and(inArray(messages.conversationId, convIdSet), ilike(messages.content, searchPattern)))
    .orderBy(desc(messages.createdAt))
    .limit(limit)

  return NextResponse.json({ messages: rows })
}
