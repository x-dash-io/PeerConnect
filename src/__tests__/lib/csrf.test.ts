import { describe, it, expect, beforeEach } from "vitest"
import { validateOrigin, csrfGuard } from "@/lib/csrf"

function mockRequest(opts: { origin?: string; referer?: string } = {}): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (opts.origin) headers["origin"] = opts.origin
  if (opts.referer) headers["referer"] = opts.referer
  return new Request("http://localhost:3000/api/endpoint", { headers })
}

describe("validateOrigin", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_URL = "http://localhost:3000"
  })

  it("allows same-origin requests", () => {
    const req = mockRequest({ origin: "http://localhost:3000" })
    expect(validateOrigin(req)).toBe(true)
  })

  it("allows missing origin and referer", () => {
    const req = mockRequest({})
    expect(validateOrigin(req)).toBe(true)
  })

  it("blocks cross-origin requests", () => {
    const req = mockRequest({ origin: "https://evil.com" })
    expect(validateOrigin(req)).toBe(false)
  })

  it("validates via referer when origin is absent", () => {
    const req = mockRequest({ referer: "http://localhost:3000/login" })
    expect(validateOrigin(req)).toBe(true)
  })

  it("blocks cross-origin referer", () => {
    const req = mockRequest({ referer: "https://evil.com/login" })
    expect(validateOrigin(req)).toBe(false)
  })
})

describe("csrfGuard", () => {
  it("returns null for valid origin", () => {
    const req = mockRequest({ origin: "http://localhost:3000" })
    expect(csrfGuard(req)).toBeNull()
  })

  it("returns 403 response for invalid origin", () => {
    const req = mockRequest({ origin: "https://evil.com" })
    const res = csrfGuard(req)
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })
})
