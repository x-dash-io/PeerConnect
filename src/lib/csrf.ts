import { NextResponse } from "next/server"

const ALLOWED_ORIGINS = new Set([
  process.env.NEXTAUTH_URL || "http://localhost:3000",
  "http://localhost:3000",
])

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")

  // If neither header is present, allow (likely same-origin fetch)
  if (!origin && !referer) return true

  const url = origin || (referer ? new URL(referer).origin : null)
  if (!url) return false

  return ALLOWED_ORIGINS.has(url)
}

export function csrfGuard(req: Request): NextResponse | null {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
  }
  return null
}
