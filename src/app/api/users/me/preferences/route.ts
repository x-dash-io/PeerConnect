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
  wallpaper: z.string().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [user] = await db
    .select({ chatPreferences: users.chatPreferences })
    .from(users)
    .where(eq(users.id, session.user.id))

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({
    fontSize: "medium",
    bubbleTheme: "indigo",
    wallpaper: null,
    ...((user.chatPreferences as Record<string, unknown>) ?? {}),
  })
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
  const [existing] = await db
    .select({ chatPreferences: users.chatPreferences })
    .from(users)
    .where(eq(users.id, session.user.id))

  const current = (existing?.chatPreferences ?? {}) as Record<string, unknown>

  const merged = {
    fontSize: "medium",
    bubbleTheme: "indigo",
    wallpaper: null,
    ...current,
    ...parsed.data,
    ...(parsed.data.wallpaper === null ? { wallpaper: null } : {}),
  }

  await db
    .update(users)
    .set({ chatPreferences: merged, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))

  return NextResponse.json(merged)
}
