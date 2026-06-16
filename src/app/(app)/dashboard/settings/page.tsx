import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { SettingsForm } from "./SettingsForm"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: users.role,
      bio: users.bio,
      chatPreferences: users.chatPreferences,
    })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) redirect("/login")

  const defaultPrefs = { fontSize: "medium", bubbleTheme: "indigo", wallpaper: null }
  const initialPreferences = {
    ...defaultPrefs,
    ...((user.chatPreferences as Record<string, unknown>) ?? {}),
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-high">Settings</h1>
        <p className="mt-1 text-sm text-text-medium">Manage your profile and account preferences</p>
      </div>

      <SettingsForm user={user} initialPreferences={initialPreferences} />
    </div>
  )
}
