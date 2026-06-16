# PeerConnect — Full Codebase Review & Analysis Report

**Date:** June 16, 2026
**Reviewer:** AI Code Analysis
**Scope:** Full codebase review — backend, API, frontend, UI/UX, architecture

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Bugs & Critical Issues](#3-bugs--critical-issues)
4. [Backend Weaknesses](#4-backend-weaknesses)
5. [API Weaknesses](#5-api-weaknesses)
6. [Database Schema Issues](#6-database-schema-issues)
7. [Frontend Weaknesses](#7-frontend-weaknesses)
8. [UI/UX Issues](#8-uiux-issues)
9. [Missing Features Compared to Modern Systems](#9-missing-features-compared-to-modern-systems)
10. [Design Analysis & Recommendations](#10-design-analysis--recommendations)
11. [Prioritized Fix Plan](#11-prioritized-fix-plan)

---

## 1. Project Overview

**PeerConnect** is a professional messaging platform built with:

- **Frontend:** Next.js 16.2.1 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Framer Motion 12
- **Backend:** Express 5 + Next.js custom server, Socket.io 4.8 for real-time, Drizzle ORM + PostgreSQL
- **Auth:** NextAuth.js v5 (Auth.js) — credentials-only, JWT strategy
- **Storage:** AWS S3 / Cloudflare R2 with pre-signed URLs, multipart upload up to 200MB
- **AI:** OpenAI Whisper for audio transcription
- **Infrastructure:** Docker Compose (PostgreSQL + Redis), Upstash Redis for presence/cache

**Stage:** Mid-development — core messaging works, many features stubbed or incomplete.

---

## 2. Architecture Summary

### Strengths

- Clean separation of concerns (App Router pages, API routes, lib utilities, components)
- Good use of React Server Components for authenticated layouts and data fetching
- Optimistic updates with React Query for snappy message sending
- Real-time via Socket.io with Redis adapter for horizontal scaling
- Comprehensive file upload system with chunked multipart + pre-signed URLs
- Complete design token system with light/dark themes

### Weaknesses at a Glance

- **No testing** — zero test files found
- **No error tracking** — no Sentry, no logging infrastructure
- **No rate limiting** — all endpoints unprotected
- **No input sanitization** — messages stored as-is
- **No E2EE** — data at rest only protected by DB-level security
- **Several stubbed features** — campaign creation UI exists but no creation form, AI formatter not implemented

---

## 3. Bugs & Critical Issues

### 3.1 Express Route Pattern is Wrong (`server.ts:214`)

```typescript
expressApp.all("/{*path}", (req, res) => {
  return handle(req, res)
})
```

`/{*path}` is Next.js dynamic route syntax, not Express. In Express v5, this should be `*` or `(.*)`. This likely means the route never matches, and all requests 404. However, Express has default `app.all("*")` behavior that might work depending on version — this needs verification.

**Severity:** CRITICAL — may break all API routes if Express handles requests before Next.js.

### 3.2 Double Socket.io Event Handler for Message Status (`server.ts:138` & `server.ts:182`)

Two different socket events handle the same conceptual action:

- `message:received:ack` (line 138) — triggered by client on receiving message, transitions SENT→DELIVERED
- `message:status` (line 182) — triggered by client on reading, transitions to READ

But the ChatWindow client (`ChatWindow.tsx:61`) also emits `message:status` with READ when focused. This creates potential race conditions where:

1. `message:received:ack` sets status to DELIVERED
2. `message:status` (READ) from same window overrides it
3. Meanwhile the server's conversation:join handler (line 106) bulk-updates all unread messages to READ on join

**Severity:** HIGH — inconsistent read receipt state, double writes to DB.

### 3.3 Missing Foreign Key on `messages.replyToId` (`schema.ts:101`)

```typescript
replyToId: text("reply_to_id"),  // No .references()
```

This column references `messages.id` but has no foreign key constraint. This can lead to orphaned references if the parent message is deleted (though cascade could cause issues too — the absence means no referential integrity).

**Severity:** MEDIUM — data integrity issue.

### 3.4 No Unique Constraint on `conversation_participants` (`schema.ts:76-85`)

```typescript
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: text("conversation_id").notNull().references(...),
  userId: text("user_id").notNull().references(...),
  // No composite primary key or unique constraint
})
```

No composite primary key or unique constraint on `(conversationId, userId)`. This allows duplicate participant entries, which would cause incorrect unread counts and duplicate sidebar entries.

**Severity:** HIGH — data corruption risk.

### 3.5 Landing Page Claims "End-to-End Privacy" (`page.tsx:24`)

The feature card states "End-to-End Privacy" and "Enterprise-grade security by default," but the PRD explicitly states E2EE is **Out of Scope v1** (PRD section 7). Messages are stored in plaintext in PostgreSQL. This is a false claim.

**Severity:** HIGH — legal/marketing liability.

### 3.6 Message Sending with No Content Validation (`routes.ts`)

Messages can be sent with content as a markdown string that is rendered with `react-markdown`. There is no server-side sanitization against XSS vectors in markdown. While `react-markdown` is generally safe (doesn't use `dangerouslySetInnerHTML`), custom renderers could introduce vulnerabilities.

**Severity:** MEDIUM — potential XSS vector.

### 3.7 Socket.io Global Store is Fragile (`server.ts:74`)

```typescript
;(global as Record<string, unknown>).io = io
```

This is used in API routes to emit Socket.io events. This is fragile:

- Not type-safe
- Won't work in serverless environments
- Could be overwritten by hot-reloads in dev
- No fallback if `io` is undefined (the API route silently skips emitting)

**Severity:** MEDIUM — potential silent failures in production.

---

## 4. Backend Weaknesses

### 4.1 No Rate Limiting

Every endpoint (login, register, message send, upload) is unprotected against brute force and DoS attacks. The PRD mentions "5 attempts/15min" rate limiting on auth but it's not implemented.

### 4.2 No Input Validation Library on Server

Client uses Zod for form validation, but most API routes (`POST /api/conversations`, `POST /api/uploads/*`) don't validate request bodies server-side beyond basic null checks.

### 4.3 No Helmet.js or Security Headers

No HTTP security headers (CSP, HSTS, X-Frame-Options, etc.) are configured.

### 4.4 No CSRF Protection

All mutation endpoints accept POST/PATCH/DELETE without CSRF tokens. NextAuth.js credentials provider with JWT cookies mitigates this somewhat but does not fully protect against CSRF.

### 4.5 No Request Logging

No structured logging. `console.error` and `console.log` are used throughout. No log levels, no request IDs, no correlation IDs.

### 4.6 Redis Adapter Fallback is Silent

If Redis connection fails, the server falls back to in-memory Socket.io adapter with only a single `console.error` message. In production with multiple instances, this would silently break cross-instance message delivery.

### 4.7 No Graceful Degradation for S3

If S3 credentials are missing, only a warning is logged (`s3.ts:31-33`). Any upload attempt will throw an unhandled error.

### 4.8 Transcribe Route Downloads Audio Through Server (`transcribe/route.ts:43-50`)

```typescript
const audioResponse = await fetch(signedUrl)
const audioBuffer = await audioResponse.arrayBuffer()
const audioFile = new File([audioBuffer], "audio.webm", { type: "audio/webm" })
```

The server downloads the entire audio file from S3, then uploads it to OpenAI. This doubles bandwidth and adds latency. OpenAI's Whisper API accepts URLs directly — the S3 signed URL should be passed directly.

**Severity:** MEDIUM — performance issue for large files.

### 4.9 No Campaign Delivery Queue

The campaign creation/management UI exists, but there's no BullMQ worker, no queue implementation, no actual campaign delivery logic. The "New Campaign" button renders but creates nothing — the create flow is missing entirely.

### 4.10 Conversation List Has No Pagination (`conversations/route.ts`)

```typescript
const userConversations = await db.select()...where(...)
```

Fetches ALL conversations for a user with a single query. A user with 1000+ conversations could experience slow load times. No cursor/offset pagination is implemented.

---

## 5. API Weaknesses

### 5.1 Inconsistent Error Response Format

Some routes return `{ error: "message" }`, others return raw strings or arrays. No standardized error envelope.

### 5.2 GET `/api/uploads/signed-url` — No Ownership Verification

Any authenticated user can request a signed URL for any uploadId. There's no check that the requesting user initiated the upload. A malicious user could enumerate uploadIds and steal signed upload URLs.

### 5.3 No Soft Delete / Message Deletion

No endpoint exists for deleting or editing messages. Once sent, a message is permanent.

### 5.4 No Email Verification

The register endpoint creates users without email verification. Accounts can be created with any email address (since there's no email sending infrastructure).

### 5.5 No Password Reset

No "forgot password" flow. The only recovery option is creating a new account.

### 5.6 No User Blocking/Reporting

No endpoints or DB schema for blocking users or reporting messages.

---

## 6. Database Schema Issues

### 6.1 Missing Indexes

| Table                       | Column(s)                     | Impact                                     |
| --------------------------- | ----------------------------- | ------------------------------------------ |
| `files`                     | `messageId`                   | Slow queries when loading files by message |
| `files`                     | `s3Key`                       | Slow for download URL generation           |
| `campaigns`                 | `senderId`                    | Slow when querying user's campaigns        |
| `campaign_recipients`       | `campaignId`                  | Slow for campaign detail views             |
| `conversation_participants` | `userId`                      | Slow when loading user's conversations     |
| `messages`                  | `(conversationId, createdAt)` | Better pagination performance              |

### 6.2 Missing `updatedAt` on `conversations`

The `conversations` table has no `updatedAt` — the `orderBy` uses a subquery on `messages.created_at` instead, which is expensive.

### 6.3 No ON DELETE Cascade on `messages.replyToId`

If a replied-to message is deleted, `replyToId` becomes a dangling reference.

### 6.4 `campaignRecipients` — No Unique Constraint

No unique constraint on `(campaignId, recipientId)`, which could lead to duplicate deliveries.

### 6.5 Session Table May Mismatch Auth.js v5

`src/lib/schema.ts` defines NextAuth tables (accounts, sessions, verificationTokens) but these may not match the latest Auth.js v5 schema requirements. Auth.js v5 has changed column requirements across beta versions.

---

## 7. Frontend Weaknesses

### 7.1 No Message Virtualization

The PRD specifies `TanStack Virtual` for message lists, but `MessageList.tsx` renders all messages as DOM nodes. For conversations with thousands of messages, this will cause massive performance degradation. The `messages.map()` at line 201 renders every message unconditionally.

### 7.2 ChatWindow Massive useEffect (`ChatWindow.tsx:43-152`)

A single useEffect handles:

- Socket event subscriptions (join room, message received, typing, status)
- Message status acknowledgment
- React Query cache updates for incoming messages

This is a 110-line useEffect with many dependencies and side effects. It should be split into smaller, focused hooks.

### 7.3 Inconsistent Typing Timeouts

- `ChatWindow.tsx:19` — `TYPING_FAILSAFE_MS = 5000` (5 seconds)
- `constants.ts:5` — `TYPING_TIMEOUT_MS = 3000` (3 seconds)

The sender stops typing after 3s of inactivity, but the receiver's failsafe waits 5s. This means the typing indicator can disappear on the sender's side but linger on the receiver's side for 2 extra seconds.

### 7.4 No Image Optimization

Images are rendered using plain `<img>` tags (`ImagePreview.tsx`, `MessageBubble.tsx`) instead of Next.js `<Image>`. No lazy loading, no responsive sizes, no WebP conversion.

### 7.5 No Loading States on Server Components

Server components (contacts page, campaigns page, settings page) fetch data with `await auth()` and `await db.select()` but have no fallback UI while these promises are pending. Since these are Server Components, the loading states are handled by Next.js Suspense boundaries — but none are configured.

### 7.6 `animate-bounce` on New Message Button (`MessageList.tsx:273`)

The floating "New Message" button has `animate-bounce` which is an **infinite animation**. This creates a perpetually bouncing UI element that will be very distracting.

### 7.7 No Proper Error Boundaries

No `error.tsx` files found. Any unhandled error in a client component will crash the entire page.

### 7.8 `usePresence` Hook Potential Race Condition

`usePresence.ts` subscribes to Socket.io events and fetches REST data concurrently. If the socket connects after the REST response, the initial state might be stale.

---

## 8. UI/UX Issues

### 8.1 Campaign "New" Button Does Nothing

The "New Campaign" button in `CampaignsDashboard.tsx:125` renders with no `onClick` handler (or it redirects nowhere useful). The create campaign modal/flow is not implemented.

### 8.2 No Avatar Upload UI

The `PATCH /api/users/me` endpoint supports updating `name`, `role`, `bio` but not `image`. The settings page has no file upload for avatars. Users are stuck with generated initials forever.

### 8.3 Mobile Layout Issues

- `NavRail` is hidden on mobile (`hidden md:flex`)
- `ConversationSidebar` is always rendered (no mobile toggle)
- `MobileNav` shows bottom tabs but doesn't hide when a conversation is active
- The conversation view on mobile likely makes the sidebar invisible but the layout doesn't adapt properly

### 8.4 No Message Search

No search functionality for messages within conversations. Users cannot find past messages.

### 8.5 No Keyboard Navigation

- No arrow key navigation in message list
- No tab navigation between messages
- No escape key to close reply/toast/emoji picker in many contexts

### 8.6 No Message Reactions

No ability to react to messages with emojis. This is a standard feature in all modern messaging apps (WhatsApp, Slack, Telegram, Discord).

### 8.7 No Message Editing or Deletion

Once sent, messages cannot be edited or deleted. This is a significant UX limitation.

### 8.8 No Loading Skeleton for Messages

When loading a conversation, the skeleton shows hardcoded alternating self/other messages (`MessageList.tsx:162-171`) instead of matching actual conversation patterns. This looks artificial.

### 8.9 No Empty State for Contacts Page

The contacts page (`dashboard/contacts/page.tsx`) fetches users but doesn't appear to have a meaningful empty state.

### 8.10 Theme Toggle Could Use System Preference Better

The `ThemeToggle` component cycles through modes but doesn't clearly indicate which mode is active.

---

## 9. Missing Features Compared to Modern Systems

| Feature                   | PeerConnect                     | Slack           | WhatsApp | Telegram          | Discord |
| ------------------------- | ------------------------------- | --------------- | -------- | ----------------- | ------- |
| E2E Encryption            | ❌ (v1 out of scope)            | ❌ (enterprise) | ✅       | ✅ (secret chats) | ❌      |
| Message Reactions         | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Message Editing           | ❌                              | ✅              | ❌       | ✅                | ✅      |
| Message Deletion          | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Message Search            | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Group Chats               | ❌ (DIRECT/CAMPAIGN only)       | ✅              | ✅       | ✅                | ✅      |
| Voice/Video Calls         | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Push Notifications        | ❌ (no mobile app)              | ✅              | ✅       | ✅                | ✅      |
| File Previews (PDF, docs) | ❌                              | ✅              | ✅       | ✅                | ✅      |
| User Blocking             | ❌                              | ✅              | ✅       | ✅                | ✅      |
| User Reporting            | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Rate Limiting             | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Email Verification        | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Password Reset            | ❌                              | ✅              | ✅       | ✅                | ✅      |
| 2FA                       | ❌                              | ✅              | ✅       | ✅                | ✅      |
| Bots/API                  | ❌                              | ✅              | ❌       | ✅                | ✅      |
| Threads                   | ❌ (replies only)               | ✅              | ❌       | ✅                | ✅      |
| Scheduled Messages        | ❌                              | ✅              | ❌       | ✅                | ❌      |
| Read Receipts Control     | ❌ (always sends read receipts) | ✅              | ✅       | ✅                | ❌      |
| Accessibility (WCAG)      | ❌ (no visible effort)          | ✅              | ✅       | ✅                | ✅      |

---

## 10. Design Analysis & Recommendations

### Current Design Style

PeerConnect uses **Glassmorphism** (frosted glass) as its primary visual language:

- `backdrop-filter: blur(...)` on navbars and panels
- Semi-transparent backgrounds with `color-mix(in srgb, var(--bg-surface) 80%, transparent)`
- Subtle borders with `var(--border-subtle)`
- Surface shadows with `surface-glow` utility
- Rounded corners everywhere (bubbles: 18px, cards: 12-16px)
- Brand color: Indigo (#6366F1)
- Two themes: "Pearl Slate" (light cool-tinted) and "Deep Space" (dark navy)

The design is **current and fairly polished** for 2026 standards. However, it lacks distinctiveness — it looks similar to many modern SaaS apps.

### Best Design Alternatives Ranked

Based on PeerConnect's positioning as a "premium professional messaging platform," here are the best design directions:

#### 1. **Bento Grids + Glassmorphism (Recommended)**

**Why:** Glassmorphism is already partially implemented. Bento Grids (modular block layouts) would bring structure to the dashboard, campaigns page, and landing page. Combining these creates a modern-but-professional look.

**Best for PeerConnect because:**

- Already uses glassmorphism — minimal rework
- Bento grids work perfectly for the campaigns dashboard, contact list, and file gallery
- Highly modular — each feature gets its own visual block
- Professional and clean, matching the "premium" brand positioning
- Implementation is low-effort (CSS grid + existing glass utilities)

**Example application:**

- Landing page feature grid → bento blocks with glass backgrounds
- Campaigns dashboard stats → bento card layout
- Settings page → bento-organized sections
- Contacts page → bento grid of contact cards

#### 2. **Neo-Brutalism (High Contrast / Raw)**

**Why:** Differentiates from every other messaging app. High contrast borders, bold typography, raw colors. Memorable and brand-distinct.

**Best for PeerConnect because:**

- Stands out from Slack/Discord/Teams clones
- High contrast improves accessibility
- Bold borders make interactive elements obvious
- Lower visual complexity than glassmorphism

**Trade-offs:**

- Less "premium" feel — might not match the brand vision
- Requires complete redesign from current glassmorphism
- Can feel harsh for long-form reading (chat)

#### 3. **Material Design (Tactile Surfaces) / Material You**

**Why:** Industry standard, well understood, great for interaction-heavy apps like messaging.

**Best for PeerConnect because:**

- Excellent for mobile touch interactions
- Strong accessibility patterns
- Large component ecosystem (could integrate MUI)
- Users are familiar with the patterns

**Trade-offs:**

- Looks like every other Google product — lacks brand identity
- Heavy component overhead (would need to replace shadcn/ui)
- Over-engineered for a messaging app

#### 4. **Claymorphism (Inflated 3D / Playful)**

**Why:** Emerging trend, highly distinctive. Squishy 3D elements with bright colors.

**Best for PeerConnect because:**

- Extremely distinctive
- Playful and approachable
- Works well with the "PEER" role (more casual)

**Trade-offs:**

- Not professional enough for BUSINESS/FREELANCER roles
- High CSS complexity
- Risky for long-term maintenance

#### 5. **Hyperrealism (Ultra-Detailed 3D)**

**Why:** Cutting edge, very premium feel. Photorealistic textures, 3D-rendered UI elements.

**Best for PeerConnect because:**

- Maximum premium feel
- Strong differentiation
- Matches "professional workspace" brand

**Trade-offs:**

- Extremely expensive to implement (design + dev effort)
- Heavy performance cost (3D rendering in browser)
- Risk of feeling dated as trends move on

#### 6. **Aurora UI (Mesh Gradients / Ethereal)**

**Why:** Beautiful animated mesh gradients, ethereal lighting effects.

**Best for PeerConnect because:**

- Already has `AnimatedBackground.tsx` with gradient blobs — partially implemented
- Very visually appealing
- Meshes well with glassmorphism

**Trade-offs:**

- Performance (GPU-heavy gradients on every page)
- Can distract from content/readability
- Trend-driven — may feel dated quickly

### Recommendation Summary

**Primary Recommendation: Stick with Glassmorphism + Add Bento Grids**

Glassmorphism is already 70% implemented. The best ROI is:

1. Keep the current glassmorphism design tokens (variables, utilities)
2. Refine the layout into Bento Grid patterns for dashboard, campaigns, contacts
3. Add micro-interactions (hover states, subtle float animations on cards)
4. Improve the color contrast ratios (current light theme has some WCAG issues — `--text-low: #8991ad` on `--background: #f0f2f8` is only ~3.5:1)
5. Add more sophisticated glass effects (multi-layered depth)

**Secondary Recommendation: Implement Strategic Minimalism**

Reduce visual noise:

- Simplify the chat message bubbles (current double-gradient and shadow may be too heavy)
- Remove unnecessary dividers/borders
- Increase whitespace in conversation list
- Reduce the number of visual "layers" (background → surface → card → border → shadow is 5 layers deep)

---

## 11. Prioritized Fix Plan

### Immediate (P0 — Bugs & Security)

| #   | Issue                                                                        | Effort | Impact   |
| --- | ---------------------------------------------------------------------------- | ------ | -------- |
| 1   | Fix Express route pattern in server.ts (`/{*path}` → `*`)                    | 5 min  | CRITICAL |
| 2   | Add unique constraint on `conversation_participants(conversationId, userId)` | 15 min | HIGH     |
| 3   | Add foreign key on `messages.replyToId` → `messages.id`                      | 10 min | MEDIUM   |
| 4   | Fix false "End-to-End Privacy" claim on landing page                         | 5 min  | HIGH     |
| 5   | Add CSRF protection using Next.js built-in CSRF tokens                       | 2 hr   | HIGH     |
| 6   | Add rate limiting on auth endpoints (login/register)                         | 2 hr   | HIGH     |

### Short-term (P1 — Architecture & UX)

| #   | Issue                                                         | Effort | Impact |
| --- | ------------------------------------------------------------- | ------ | ------ |
| 7   | Implement message list virtualization                         | 4 hr   | HIGH   |
| 8   | Add pagination to conversation list API                       | 2 hr   | MEDIUM |
| 9   | Fix `animate-bounce` infinite animation on New Message button | 5 min  | LOW    |
| 10  | Refactor ChatWindow useEffect into smaller hooks              | 3 hr   | MEDIUM |
| 11  | Implement error boundaries (`error.tsx` + `global-error.tsx`) | 1 hr   | HIGH   |
| 12  | Add input sanitization (server-side strip/escape)             | 1 hr   | HIGH   |
| 13  | Standardize API error response format                         | 2 hr   | MEDIUM |

### Medium-term (P2 — Missing Features)

| #   | Issue                                                    | Effort | Impact |
| --- | -------------------------------------------------------- | ------ | ------ |
| 14  | Implement campaign creation flow + BullMQ delivery queue | 8 hr   | MEDIUM |
| 15  | Add avatar upload UI and API                             | 3 hr   | MEDIUM |
| 16  | Implement message search                                 | 6 hr   | MEDIUM |
| 17  | Add message deletion/editing                             | 4 hr   | MEDIUM |
| 18  | Implement message reactions                              | 4 hr   | LOW    |
| 19  | Add user blocking/reporting                              | 3 hr   | LOW    |
| 20  | Implement forgot password flow                           | 4 hr   | MEDIUM |
| 21  | Add structured logging (pino/winston)                    | 2 hr   | MEDIUM |

### Long-term (P3 — Polish & Production)

| #   | Issue                                                    | Effort | Impact |
| --- | -------------------------------------------------------- | ------ | ------ |
| 22  | Add Sentry for error tracking                            | 2 hr   | MEDIUM |
| 23  | Implement WCAG accessibility audit fixes                 | 8+ hr  | MEDIUM |
| 24  | Add push notifications (Web Push API)                    | 6 hr   | MEDIUM |
| 25  | Add image optimization (Next.js Image + remote patterns) | 2 hr   | LOW    |
| 26  | Implement Bento Grid layout for dashboard                | 4 hr   | LOW    |
| 27  | Add comprehensive test suite (unit + integration + E2E)  | 40+ hr | HIGH   |

---

## Summary

PeerConnect is a **solid mid-stage project** with a good tech stack foundation. The core messaging flow works with real-time updates, file uploads, and optimistic UI. However, it has critical bugs (Express route pattern), security gaps (no rate limiting, CSRF, sanitization), and several unimplemented features that were planned.

**The most impactful actions are:**

1. Fix the Express route bug immediately
2. Add database constraints for data integrity
3. Implement rate limiting and CSRF protection
4. Add message list virtualization before scaling
5. Remove false E2EE marketing claims

The current glassmorphism design is good — **don't replace it**, but **refine it** with Bento Grid layouts and improved accessibility contrast ratios.
