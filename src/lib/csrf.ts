import { NextResponse } from "next/server"

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>()
  if (process.env.NEXTAUTH_URL) {
    origins.add(process.env.NEXTAUTH_URL.replace(/\/$/, ""))
  }
  return origins
}

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")

  if (!origin && !referer) return false

  const url = origin || (referer ? new URL(referer).origin : null)
  if (!url) return false

  return getAllowedOrigins().has(url)
}

export function csrfGuard(req: Request): NextResponse | null {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
  }
  return null
}
