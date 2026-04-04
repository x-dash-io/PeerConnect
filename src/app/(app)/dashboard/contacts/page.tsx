import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, conversationParticipants } from "@/lib/schema"
import { eq, ne, and, inArray } from "drizzle-orm"
import { redirect } from "next/navigation"
import { ContactsList } from "./ContactsList"
import { UserProfile } from "@/types"

export default async function ContactsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Get conversation IDs the user belongs to
  const userConvos = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, session.user.id))

  const convIds = userConvos.map((c) => c.conversationId)

  let contactList: UserProfile[] = []

  if (convIds.length > 0) {
    // Get distinct other participants from those conversations
    const rows = await db
      .selectDistinctOn([users.id], {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: users.role,
        bio: users.bio,
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(
        and(
          inArray(conversationParticipants.conversationId, convIds),
          ne(conversationParticipants.userId, session.user.id),
        ),
      )

    contactList = rows as UserProfile[]
  }

  return <ContactsList initialContacts={contactList} />
}
