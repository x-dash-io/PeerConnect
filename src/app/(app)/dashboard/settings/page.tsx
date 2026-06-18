import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { SettingsLayout } from "./SettingsLayout"
import { SettingsForm } from "./SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/api/auth/clear-session")

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) redirect("/api/auth/clear-session")

  const initialPreferences = { fontSize: "medium", bubbleTheme: "indigo" }

  return (
    <SettingsLayout>
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-high">Settings</h1>
          <p className="mt-1 text-sm text-text-medium">
            Manage your profile and account preferences
          </p>
        </div>

        <SettingsForm user={user} initialPreferences={initialPreferences} />
      </div>
    </SettingsLayout>
  )
}
