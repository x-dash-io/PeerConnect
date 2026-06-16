import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"
import { csrfGuard } from "@/lib/csrf"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const { token, email } = await req.json()

  if (!token || !email) {
    return NextResponse.json({ error: "Token and email are required" }, { status: 400 })
  }

  // Verify token
  const [storedToken] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, email.toLowerCase().trim()),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    )
    .limit(1)

  if (!storedToken) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
  }

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(users.email, email.toLowerCase().trim()))

  // Delete used token
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

  return NextResponse.json({ success: true, message: "Email verified" })
}
