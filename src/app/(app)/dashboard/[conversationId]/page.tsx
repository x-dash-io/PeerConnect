import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, conversationParticipants, users } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { redirect, notFound } from "next/navigation"
import { ChatWindow } from "@/components/chat/ChatWindow"
import { UserProfile } from "@/types"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { conversationId } = await params
  const userId = session.user.id

  let participantsList: UserProfile[]
  try {
    participantsList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        bio: users.bio,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversationParticipants.conversationId, conversationId))
  } catch (err) {
    console.error("[ConversationPage] Failed to fetch participants:", err)
    redirect("/dashboard?error=database_error")
  }

  if (participantsList.length === 0) {
    notFound()
  }

  const isParticipant = participantsList.some((p) => p.id === userId)

  if (!isParticipant) {
    redirect("/dashboard")
  }

  // Fetch current user's specific participation data (like lastReadAt)
  let currentUserParticipant: { lastReadAt: Date | null } | null = null
  try {
    ;[currentUserParticipant] = await db
      .select({ lastReadAt: conversationParticipants.lastReadAt })
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId),
        ),
      )
      .limit(1)
  } catch (err) {
    console.error("[ConversationPage] Failed to fetch participant data:", err)
    redirect("/dashboard?error=database_error")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg-deep">
      <ChatWindow
        conversationId={conversationId}
        currentUserId={userId}
        initialParticipants={participantsList as UserProfile[]}
        lastReadAt={currentUserParticipant?.lastReadAt?.toISOString() || null}
      />
    </div>
  )
}
