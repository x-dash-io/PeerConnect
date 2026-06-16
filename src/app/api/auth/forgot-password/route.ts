import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { csrfGuard } from "@/lib/csrf"
import { rateLimitAuth } from "@/lib/rate-limit"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const rl = await rateLimitAuth(`forgot-password:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Check if user exists (don't reveal existence)
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a reset link has been generated.",
    })
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Store in verification_tokens table
  const normalizedEmail = email.toLowerCase().trim()
  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token,
    expires,
  })

  // Send email
  await sendPasswordResetEmail(normalizedEmail, token)

  return NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been generated.",
  })
}
