import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { verificationTokens } from "@/lib/schema"
import { sendVerificationEmail } from "@/lib/email"
import { z } from "zod"
import { csrfGuard } from "@/lib/csrf"
import { rateLimitAuth } from "@/lib/rate-limit"
import crypto from "crypto"

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["PEER", "BUSINESS", "FREELANCER"]).optional(),
})

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const rl = await rateLimitAuth(`register:${ip}`)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
          "X-RateLimit-Reset": String(rl.resetIn),
        },
      },
    )
  }

  try {
    const body = await req.json()
    const data = registerSchema.parse(body)
    const user = await registerUser(data)

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.insert(verificationTokens).values({
      identifier: data.email.toLowerCase().trim(),
      token,
      expires,
    })

    // Send verification email
    await sendVerificationEmail(data.email.toLowerCase().trim(), token)

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.message === "Email already registered") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error(
      "[Register] Unexpected error:",
      error instanceof Error ? error.message : error,
      error instanceof Error ? error.stack : "",
    )
    return NextResponse.json({ error: "Registration failed" }, { status: 400 })
  }
}
