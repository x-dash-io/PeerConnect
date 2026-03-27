import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["PEER", "BUSINESS", "FREELANCER"]).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)
    const user = await registerUser(data)
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Email already registered") {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 400 })
  }
}
