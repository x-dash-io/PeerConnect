import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { z } from "zod"

const fontSizeSchema = z.enum(["small", "medium", "large"])
const bubbleThemeSchema = z.enum(["indigo", "emerald", "violet", "rose", "amber", "sky"])

const preferencesSchema = z.object({
  fontSize: fontSizeSchema.optional(),
  bubbleTheme: bubbleThemeSchema.optional(),
})

const defaultPreferences = {
  fontSize: "medium",
  bubbleTheme: "indigo",
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [user] = await db
      .select({ chatPreferences: users.chatPreferences })
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!user) {
      return NextResponse.json(defaultPreferences)
    }

    return NextResponse.json({
      ...defaultPreferences,
      ...((user.chatPreferences as Record<string, unknown>) ?? {}),
    })
  } catch {
    return NextResponse.json(defaultPreferences)
  }
}

export async function PATCH(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = preferencesSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 },
    )
  }

  // Merge with existing preferences
  let current: Record<string, unknown> = {}
  try {
    const [existing] = await db
      .select({ chatPreferences: users.chatPreferences })
      .from(users)
      .where(eq(users.id, session.user.id))
    current = (existing?.chatPreferences ?? {}) as Record<string, unknown>
  } catch {
    // Column may not exist yet
  }

  const merged = {
    ...defaultPreferences,
    ...current,
    ...parsed.data,
  }

  try {
    await db
      .update(users)
      .set({ chatPreferences: merged, updatedAt: new Date() })
      .where(eq(users.id, session.user.id))
  } catch (error) {
    const isMissingColumn = error instanceof Error && error.message.includes("chat_preferences")
    if (isMissingColumn) {
      return NextResponse.json(
        { error: "chat_preferences column not found. Please run database migrations." },
        { status: 500 },
      )
    }
    console.error("Failed to save preferences:", error)
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 })
  }

  return NextResponse.json(merged)
}
