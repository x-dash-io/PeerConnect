import { describe, it, expect } from "vitest"
import { sanitizeHtml, sanitizeMessage } from "@/lib/sanitize"

describe("sanitizeHtml", () => {
  it("removes basic HTML tags", () => {
    expect(sanitizeHtml("<p>hello</p>")).toBe("hello")
  })

  it("removes nested tags", () => {
    expect(sanitizeHtml("<div><span>deep</span></div>")).toBe("deep")
  })

  it("removes tags with attributes", () => {
    expect(sanitizeHtml('<a href="http://evil.com">click</a>')).toBe("click")
  })

  it("removes self-closing tags", () => {
    expect(sanitizeHtml("hello<br/>world")).toBe("helloworld")
  })

  it("handles empty strings", () => {
    expect(sanitizeHtml("")).toBe("")
  })

  it("handles strings with no HTML", () => {
    expect(sanitizeHtml("plain text")).toBe("plain text")
  })

  it("removes script tags", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).toBe("alert('xss')")
  })

  it("removes style tags", () => {
    expect(sanitizeHtml("<style>body{color:red}</style>")).toBe("body{color:red}")
  })
})

describe("sanitizeMessage", () => {
  it("trims whitespace", () => {
    expect(sanitizeMessage("  hello  ")).toBe("hello")
  })

  it("strips HTML and trims", () => {
    expect(sanitizeMessage("  <b>bold</b>  ")).toBe("bold")
  })

  it("truncates to 10000 chars", () => {
    const long = "a".repeat(15000)
    const result = sanitizeMessage(long)
    expect(result.length).toBe(10000)
  })

  it("returns empty string for whitespace only", () => {
    expect(sanitizeMessage("   ")).toBe("")
  })
})
