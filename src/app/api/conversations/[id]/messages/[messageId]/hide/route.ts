import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hiddenMessages, conversationParticipants } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id: conversationId, messageId } = await params

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

  await db
    .insert(hiddenMessages)
    .values({ messageId, userId: session.user.id })
    .onConflictDoNothing()

  return NextResponse.json({ success: true })
}
