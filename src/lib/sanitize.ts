const STRIP_PATTERN = /<[^>]*>/g

export function sanitizeHtml(input: string): string {
  return input.replace(STRIP_PATTERN, "")
}

export function sanitizeMessage(input: string): string {
  return sanitizeHtml(input).trim().slice(0, 10000)
}
