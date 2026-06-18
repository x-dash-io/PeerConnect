# PeerConnect Remediation Plan

## Phase 1 — Critical Security & Operational Fixes ✅ **Complete**

| #   | Fix                                                                                        | Status |
| --- | ------------------------------------------------------------------------------------------ | ------ |
| 1.1 | `ROQ_API_KEY` → `GROQ_API_KEY` in `.env.local`                                             | ✅     |
| 1.2 | MarkdownRenderer XSS — `sanitizeUrl()`, `a`/`img` handlers                                 | ✅     |
| 1.3 | CSRF bypass — removed hardcoded localhost, reject missing headers                          | ✅     |
| 1.4 | Proxy file — renamed to Next.js 16 `proxy.ts` convention, lightweight session cookie check | ✅     |
| 1.5 | Rate limiting on message + reaction endpoints                                              | ✅     |
| 1.6 | Reactions unique index `(messageId, userId)` → `(messageId, userId, emoji)`                | ✅     |

---

## Phase 2 — High Severity Bugs

### 2.1 Fix TOCTOU race condition in `registerUser`

**Files:** `src/lib/auth.ts:66-91`, `src/app/api/auth/register/route.ts:56-68`

**Problem:** Between the existence check and the insert on line 72-73, a concurrent request can register the same email. The unique constraint catches it but throws an unhandled error.

**Fix:**

Wrap the check + insert in a Drizzle transaction, and catch unique constraint violations in the route handler.

```typescript
// src/lib/auth.ts
export async function registerUser(data: {
  name: string
  email: string
  password: string
  role?: "PEER" | "BUSINESS" | "FREELANCER"
}) {
  return db.transaction(async (tx) => {
    const existing = await tx.select().from(users).where(eq(users.email, data.email)).limit(1)
    if (existing.length > 0) throw new Error("Email already registered")

    const hashedPassword = await bcrypt.hash(data.password, 10)
    const id = generateId()

    const [user] = await tx
      .insert(users)
      .values({
        id,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "PEER",
        updatedAt: new Date(),
      })
      .returning()

    return user
  })
}
```

```typescript
// src/app/api/auth/register/route.ts — in the catch handler
catch (error) {
  const message = error instanceof Error ? error.message : "Registration failed"
  if (message === "Email already registered") {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }
  console.error("[Register] Error:", error)
  return NextResponse.json({ error: "Registration failed" }, { status: 400 })
}
```

---

### 2.2 Emoji validation in reactions route

**Files:** `src/app/api/conversations/[id]/messages/[messageId]/reactions/route.ts:24`

**Problem:** Emoji value is only type-checked as string. Users can submit arbitrary text as reaction.

**Fix:** Use Unicode emoji property regex to validate.

```typescript
if (!emoji || typeof emoji !== "string" || !/\p{Emoji}/u.test(emoji.trim())) {
  return NextResponse.json({ error: "A valid single emoji is required" }, { status: 400 })
}
```

**Note:** This was already added in Phase 1.5 alongside the rate limiting changes.

---

### 2.3 Validate upload ownership in signed-url endpoint

**Files:** `src/app/api/uploads/signed-url/route.ts`, `src/app/api/uploads/start/route.ts`, `src/lib/s3.ts`

**Problem:** Any authenticated user who knows an `uploadId` and `key` can generate signed URLs for upload parts they didn't initiate.

**Fix:**

1. **Store upload ownership** — In the `start` route, save `(uploadId, userId)` to a Redis key or a new DB table.
2. **Verify ownership** — In `signed-url/route.ts`, look up the upload and verify `session.user.id === ownerId` before generating the signed URL.

```typescript
// src/app/api/uploads/start/route.ts — after generating uploadId
await redis.set(`upload:${uploadId}`, session.user.id, { ex: 3600 }) // 1hr expiry
```

```typescript
// src/app/api/uploads/signed-url/route.ts — after auth check
const ownerId = await redis.get(`upload:${uploadId}`)
if (ownerId !== session.user.id) {
  return NextResponse.json({ error: "Upload not found" }, { status: 404 })
}
```

---

### 2.4 Protect password reset tokens in logs

**Files:** `src/lib/email.ts:9-10`

**Problem:** When `RESEND_API_KEY` is not configured, reset tokens are logged to console in plain text.

**Fix:** Wrap the `console.log` in a dev-only guard.

```typescript
if (!RESEND_API_KEY) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Email] Would send password reset to ${email}`)
    console.log(`[Email] Reset URL: ${resetUrl}`)
  }
  return
}
```

---

### 2.5 Add brute-force protection on login

**Files:** `src/lib/auth.ts:17-47`

**Problem:** Credentials provider has no rate limiting — attacker can brute-force passwords.

**Fix:** Apply the existing `rateLimitAuth` helper inside the `authorize` callback.

```typescript
import { rateLimitAuth } from "@/lib/rate-limit"

// Inside authorize():
const rl = await rateLimitAuth(`login:${credentials.email}`)
if (!rl.allowed) return null
```

---

## Phase 3 — Medium Bugs & Code Quality

### 3.1 Fix Socket.io global type cast — create typed accessor

**Files:** All 6 route files using `(global as Record<string, unknown>).io`

**Problem:** The unsafe global type cast is repeated in 6+ files. If the global variable is renamed in `server.ts`, all break silently. If `io` is `undefined`, the socket emission silently no-ops.

**Fix:**

Create a single accessor and replace all usages.

```typescript
// src/lib/socket-server.ts
import type { Server as SocketIOServer } from "socket.io"

export function getIO(): SocketIOServer | null {
  const io = (global as Record<string, unknown>).io as SocketIOServer | undefined
  if (!io) {
    console.warn("[Socket] io is not initialized. Socket emissions will be skipped.")
  }
  return io ?? null
}
```

Then in each route file:

```typescript
// Before
const io: Server | undefined = (global as Record<string, unknown>).io as Server | undefined
if (io) { ... }

// After
import { getIO } from "@/lib/socket-server"
const io = getIO()
if (io) { ... }
```

**Files to update:**

| File                                                                     | Line    |
| ------------------------------------------------------------------------ | ------- |
| `src/app/api/conversations/[id]/messages/route.ts`                       | 247     |
| `src/app/api/conversations/[id]/messages/[messageId]/route.ts`           | 49      |
| `src/app/api/conversations/[id]/messages/[messageId]/hide/route.ts`      | —       |
| `src/app/api/conversations/[id]/messages/[messageId]/reactions/route.ts` | 73, 104 |
| `src/lib/deliver-campaign.ts`                                            | 72      |

---

### 3.2 Fix memory leak in mock Redis `memoryStore`

**File:** `src/lib/redis.ts:7`

**Problem:** The in-memory `Map<string, string>` for local dev has no TTL. Entries accumulate during long dev sessions with hot reloading.

**Fix:** Implement TTL-aware mock store.

```typescript
interface MemoryEntry {
  value: string
  expiresAt: number | null
}

const memoryStore = new Map<string, MemoryEntry>()

// Clean expired entries on access
function cleanExpired(): void {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      memoryStore.delete(key)
    }
  }
}
```

Update the mock methods to respect TTL via the `ex` option in `set` calls.

---

### 3.3 Fix stale closure in `scrollToMessage`

**File:** `src/components/chat/MessageList.tsx:148-189`

**Problem:** The `setInterval` callback in `scrollToMessage` captures `messages` at creation time. If messages load asynchronously, the interval may never find the target message and spin for 10 seconds.

**Fix:** Use a `useRef` for the message lookup so the interval always reads the latest data.

```typescript
const messagesRef = useRef(messages)
messagesRef.current = messages

// Inside scrollToMessage:
const id = setInterval(() => {
  const idx = messagesRef.current.findIndex((m) => m.id === targetId)
  if (idx !== -1) {
    virtualizer.scrollToIndex(idx, { align: "center" })
    clearInterval(id)
  }
}, 100)
```

---

### 3.4 Extract duplicated optimistic update pattern

**Files:** `src/hooks/useMessages.ts`, `src/hooks/useMessageReactions.ts`

**Problem:** The pattern `cancelQueries → getQueryData → setQueryData → return previous` is repeated 5+ times across hooks.

**Fix:** Create a shared helper.

```typescript
// src/lib/query-optimistic.ts
import type { QueryClient } from "@tanstack/react-query"

export function optimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updater: (old: T | undefined) => T,
): T | undefined {
  queryClient.cancelQueries({ queryKey })
  const previous = queryClient.getQueryData<T>(queryKey)
  queryClient.setQueryData<T>(queryKey, updater)
  return previous
}

export function rollbackUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  previous: T | undefined,
): void {
  if (previous !== undefined) {
    queryClient.setQueryData(queryKey, previous)
  }
}
```

---

### 3.5 Fix `Message.isDeleted` type from `string` to `boolean`

**Files:** `src/types/index.ts:101`, relevant DB migrations and comparisons

**Problem:** `isDeleted: string` with default `"false"` forces string comparisons (`=== "true"`) throughout the codebase.

**Fix:**

```typescript
// src/types/index.ts
isDeleted: boolean
```

Generate a Drizzle migration to change the column type:

```sql
ALTER TABLE messages ALTER COLUMN is_deleted TYPE boolean USING is_deleted::boolean;
ALTER TABLE messages ALTER COLUMN is_deleted SET DEFAULT false;
```

Update all comparisons:

- `=== "true"` → `=== true`
- `=== "false"` → `=== false`

---

## Phase 4 — Accessibility

### 4.1 Fix `contentEditable` accessibility

**File:** `src/components/chat/RichTextInput.tsx:162-178`

**Change:** Add ARIA attributes to the `contentEditable` div.

```typescript
<div
  contentEditable
  role="textbox"
  aria-multiline="true"
  aria-label="Message input"
  ...
/>
```

---

### 4.2 Add `aria-live` region for new messages

**File:** `src/components/chat/MessageList.tsx`

**Change:** Add a visually hidden live region that announces new messages.

```typescript
<div aria-live="polite" className="sr-only">
  {newMessageCount > 0 && `${newMessageCount} new message${newMessageCount > 1 ? "s" : ""}`}
</div>
```

---

### 4.3 Add `aria-label` to icon-only buttons

**Files:**

| File                                      | Line    | Element                   |
| ----------------------------------------- | ------- | ------------------------- |
| `src/components/chat/MessageComposer.tsx` | 238-243 | Reply banner close button |
| `src/components/chat/EmojiPicker.tsx`     | 86-91   | Search clear button       |

**Fix:** Add `aria-label` to each.

```typescript
<button aria-label="Close reply" ...>
<button aria-label="Clear search" ...>
```

---

### 4.4 Fix low contrast in light mode

**File:** `src/app/globals.css:93`

**Problem:** `--text-low: #8991ad` on `--bg: #f8f9fc` gives ~3.2:1 contrast ratio (WCAG AA requires ≥4.5:1 for normal text).

**Fix:** Darken the token.

```css
--text-low: #6b7280;
```

---

## Phase 5 — Testing Strategy

### 5.1 Unit tests — highest priority

| Area               | Files to test                                                                                                            | Priority   | Approach                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------- | ---------------------------------------------------------------------------- |
| Auth logic         | `registerUser`, password hashing, token generation                                                                       | **High**   | Mock DB, test success + duplicate email + invalid data                       |
| Rate limiter       | `src/lib/rate-limit.ts`                                                                                                  | **High**   | Mock Redis `multi()`, test limit reached + Redis failure fallback            |
| URL sanitizer      | New `sanitizeUrl` in MarkdownRenderer                                                                                    | **High**   | Test http/https/mailto allowed, javascript: blocked, invalid URLs return `#` |
| CSRF validation    | `src/lib/csrf.ts`                                                                                                        | **High**   | Already covered (7 tests) — extend for edge cases                            |
| All untested hooks | `usePresence`, `useConversationRoom`, `useTypingReceiver`, `useAudioRecorder`, `useMessageReactions`, `useConversations` | **Medium** | Use `renderHook` from testing-library with mocked providers                  |
| Input sanitizer    | `src/lib/sanitize.ts`                                                                                                    | **High**   | Add XSS bypass patterns, unicode escapes, nested tags                        |

**Example — rate limiter test:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

vi.mock("@/lib/redis", () => ({
  redis: {
    multi: () => ({
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnValue(5),
      zadd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, 5, null, null]),
    }),
    zrange: vi.fn().mockResolvedValue([]),
  },
}))

describe("rateLimit", () => {
  it("blocks when limit exceeded", async () => {
    const result = await rateLimit("test", { maxRequests: 5, windowSeconds: 60 })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("allows under limit", async () => {
    // Mock zcard returning 2
    const result = await rateLimit("test", { maxRequests: 10, windowSeconds: 60 })
    expect(result.allowed).toBe(true)
  })
})
```

---

### 5.2 Integration tests — medium priority

| Area            | What to test                                                                            | Tooling                               |
| --------------- | --------------------------------------------------------------------------------------- | ------------------------------------- |
| Messages API    | POST message → 201, GET pagination → 200 + cursor, edit → 200, hide → 200, delete → 200 | `vitest` + MSW (mock handlers for DB) |
| Auth API        | Register → 201, duplicate → 409, login → 200/redirect, forgot-password → 200            | `vitest` + MSW                        |
| File upload API | Start → signed-url → complete flow                                                      | `vitest` + MSW + S3 mock              |
| Reactions API   | Add → 201, toggle off → 200, duplicate → 200 (toggle), invalid emoji → 400              | `vitest` + MSW                        |

**Recommended setup:** Use [MSW](https://mswjs.io/) (Mock Service Worker) to intercept fetch calls and mock API responses. Vitest + MSW is already supported and works with jsdom.

```typescript
// src/__tests__/setup.ts — add MSW server
import { setupServer } from "msw/node"
import { handlers } from "./mocks/handlers"

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

### 5.3 E2E tests — lower priority (from project plan)

| Feature      | Tool       | Scope                                                           |
| ------------ | ---------- | --------------------------------------------------------------- |
| Landing page | Playwright | Hero renders, CTA buttons work, snap-scroll sections visible    |
| Auth flow    | Playwright | Register → verify → login → redirect to dashboard               |
| Dashboard    | Playwright | NavRail renders, sidebar shows conversations, chat window loads |
| Message send | Playwright | Type → send → message appears in list                           |

**Setup:**

```bash
npm install --save-dev @playwright/test
npx playwright init
```

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Phase 6 — Performance

### 6.1 Virtualize conversation list

**File:** `src/components/chat/ConversationList.tsx`

**Problem:** All conversations render as full DOM nodes. For 100+ conversations, this causes layout thrashing.

**Fix:** Apply the same `@tanstack/react-virtual` pattern used in `MessageList.tsx`.

### 6.2 Optimize `isSameDay` calls in MessageList

**File:** `src/components/chat/MessageList.tsx:295-297`

**Problem:** For every virtual item, `date-fns isSameDay` is called. With hundreds of items, this is O(n) per render.

**Fix:** Pre-compute date separators once when data loads, store them alongside messages as a `showDateSeparator` boolean.

---

## Execution Order

```
Phase 1 ✅ ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6
(Critical)     (High)      (Medium)     (A11y)      (Tests)      (Perf)
```

Each phase should be completed and verified before starting the next. Run `npm run test && npm run lint && npm run type-check` after each phase to catch regressions.
