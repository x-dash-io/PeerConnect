import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/schema"
import { eq, and, gt } from "drizzle-orm"
import { csrfGuard } from "@/lib/csrf"
import { rateLimitAuth } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const rl = await rateLimitAuth(`reset-password:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const { token, email, password } = await req.json()

  if (!token || !email || !password) {
    return NextResponse.json({ error: "Token, email, and password are required" }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
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
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
  }

  // Update password
  const hashedPassword = await bcrypt.hash(password, 10)
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.email, email.toLowerCase().trim()))

  // Delete used token
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

  return NextResponse.json({ success: true, message: "Password updated successfully" })
}
