# Project Roadmap & Plan (Updated): PeerConnect
> **Version:** 2.0 — Research-Validated  
> **Date:** March 2026

---

## Overview

| Phase | Goal | Duration | Prompts |
|:---|:---|:---|:---|
| **Phase 1** | Repo, Tooling & Design System | Week 1 | 01–06 |
| **Phase 2** | Auth, DB Schema & User Personas | Week 1 | 07–12 |
| **Phase 3** | Real-Time Messaging MVP | Week 2 | 13–20 |
| **Phase 4** | File Vault & Audio Messages | Week 2–3 | 21–26 |
| **Phase 5** | Professionalism Formatter | Week 3 | 27–30 |
| **Phase 6** | Bulk Messaging Campaigns | Week 3–4 | 31–34 |
| **Phase 7** | Production Hardening | Week 4 | 35–40 |

Total estimated time: **4 weeks** (solo developer with AI coding agent)

---

## Phase 1: Repo, Tooling & Design System (Week 1)
**Goal:** Zero to running app with full design token system.

### 1.1 Project Scaffolding
- Initialize Next.js 15 App Router with TypeScript
- Configure Tailwind CSS v4 with custom design token CSS variables
- Install and configure shadcn/ui component library
- Set up `prettier`, `eslint`, and `husky` pre-commit hooks

### 1.2 Design System Implementation
- Implement all CSS variables from `design_spec.md` in `globals.css`
- Configure Tailwind to reference CSS variables
- Install Framer Motion 11, Lucide React, Google Fonts (Manrope + Lato + JetBrains Mono)
- Build and document base UI components: `Button`, `Avatar`, `Badge`, `Input`, `Card`, `Skeleton`

### 1.3 Custom Server Setup
- Create `server.ts` (Express + Next.js + Socket.io bootstrap)
- Configure `package.json` scripts for dev/prod server
- Verify Socket.io handshake on localhost
- Document: **cannot deploy to Vercel** — Railway/Render/VPS required

### 1.4 Environment & Tooling
- Configure `.env.local` template (DB, Redis, AWS, Auth secrets)
- Set up Docker Compose for local dev (PostgreSQL + Redis)
- Configure Drizzle ORM + Neon connection

---

## Phase 2: Auth, Database Schema & User Personas (Week 1)
**Goal:** Users can register, log in, and select a role.

### 2.1 Database Schema
- Define all Drizzle schemas: `users`, `sessions`, `conversations`, `conversation_participants`, `messages`, `files`, `campaigns`, `campaign_recipients`
- Generate and run initial migrations (`drizzle-kit push`)
- Seed script for development test users

### 2.2 Authentication
- Configure NextAuth.js v5 (Auth.js) with Drizzle adapter
- Implement Credentials provider (email + password, bcrypt 10 rounds)
- JWT session strategy with HTTP-only cookies
- Auth middleware protecting `/dashboard` routes

### 2.3 Onboarding Flow
- Registration page with Manrope typography, Dark UI
- Role selection screen with Framer Motion lateral slide animation (PEER / BUSINESS / FREELANCER)
- Role stored in `users.role` column
- Redirect to dashboard after onboarding complete

### 2.4 Profile & Settings
- Basic profile page: name, avatar upload (S3), role badge
- Settings page: role switcher (no account recreation)

---

## Phase 3: Real-Time Messaging MVP (Week 2)
**Goal:** Working 1-on-1 chat with status tracking.

### 3.1 Conversation & Message API
- REST endpoints: `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/:id/messages`
- Optimistic message insert (client-side before server ack)
- Message pagination (cursor-based, 50 messages per page)

### 3.2 Socket.io Integration
- Socket.io server-side: room management (`conversation:{id}`), message broadcasting
- Redis adapter (`@socket.io/redis-adapter`) for multi-instance pub/sub
- Client-side: `socket.io-client` loaded with `dynamic(() => import(...), { ssr: false })`
- Events: `message:send`, `message:received`, `message:status`, `user:typing`, `user:stop-typing`

### 3.3 Presence System
- Redis hash: `presence:{userId}` → `{ status: 'online', lastSeen: timestamp }`
- Socket.io `connection` / `disconnect` events update Redis
- Frontend polls presence or subscribes via `presence:update` Socket event
- Presence dot component (Online/Away/Offline) on avatar

### 3.4 Chat UI
- Dashboard layout: Glass sidebar (chat list) + main chat window
- Chat list item: Avatar, name, last message preview, timestamp, unread count badge
- Message thread: Virtualized list (`react-virtual` or `TanStack Virtual`) for performance
- Sent/Received bubble components with Framer Motion pop-in
- Message status ticks: `✓` sent, `✓✓` delivered, `✓✓` blue = read
- Typing indicator: 3-dot animation in chat window

---

## Phase 4: File Vault & Audio Messages (Week 2–3)
**Goal:** 200MB file sharing and audio messages.

### 4.1 Multipart File Upload (S3)
- **Backend endpoints:**
  - `POST /api/uploads/start` → returns `uploadId` + `key`
  - `GET /api/uploads/signed-url` → returns pre-signed URL per part
  - `POST /api/uploads/complete` → assembles parts, returns final S3 URL
  - `POST /api/uploads/abort` → cleans up failed uploads
- **Client-side logic:**
  - Chunk file into 10MB parts
  - Upload parts in parallel (max 3 concurrent)
  - Track per-part progress → aggregate total progress bar
  - Retry failed parts up to 3 times
- S3 CORS configuration: expose `ETag` header
- Store file record in `files` table on completion

### 4.2 File Message UI
- File preview card in chat bubble: file icon + name + size + download button
- Image files: inline preview thumbnail (max 240px)
- Video files: inline `<video>` player with controls
- Upload progress bar inside message composer

### 4.3 Audio Messages
- MediaRecorder API (`.webm`) in browser
- Waveform visualization during recording (Web Audio API `AnalyserNode`)
- Upload via standard S3 pre-signed URL (single PUT for audio, typically <5MB)
- Audio player in chat bubble: play/pause + duration + waveform SVG

### 4.4 Audio Transcription
- On-demand: User clicks "Transcribe" on audio message
- Calls `/api/transcribe` → sends audio S3 URL to OpenAI Whisper API
- Transcription displayed below audio player
- Toggle to hide/show transcription

---

## Phase 5: Professionalism Formatter (Week 3)
**Goal:** AI-assisted tone suggestions in the message composer.

### 5.1 Smart Editor
- Rich text input with `contenteditable` or Tiptap editor
- Real-time Markdown preview for code blocks (` ``` `) and bold/italic
- No AI call on every keystroke — trigger only on manual "Check Tone" button

### 5.2 Tone Suggestion Engine
- Debounced call to `/api/formatter/suggest` on button click
- Backend: GPT-4o-mini prompt → return 1–3 professional alternatives
- UI: Non-modal tooltip/popover above cursor with alternatives
- User clicks suggestion → replaces selected text in composer
- "Dismiss" closes without change

### 5.3 Formatter UI/UX
- Subtle underline on message that has suggestions
- Keyboard shortcut: `Cmd+Shift+P` → trigger tone check
- Suggestion popover uses glassmorphism treatment
- Loading state: animated indigo spinner in corner of composer

---

## Phase 6: Bulk Messaging Campaigns (Week 3–4)
**Goal:** Send 1-on-1-style messages to multiple recipients at once.

### 6.1 Campaign Composer
- "New Campaign" button in sidebar (visible to BUSINESS + FREELANCER roles)
- Multi-select recipient picker (searchable, from user's contacts)
- Compose message body (same rich text editor as chat)
- Preview: "This will send as individual private messages to X recipients"
- Send → creates `campaign` record, enqueues jobs

### 6.2 BullMQ Worker
- Queue: `campaign-delivery`
- Job per recipient: create `conversation` (if not existing) → insert `message` → emit Socket.io event to recipient
- Concurrency: 5 workers, rate limit: 10 messages/second (to avoid flooding)
- Job retry: 3 attempts with exponential backoff
- Campaign status updates: `PENDING` → `IN_PROGRESS` → `COMPLETED`

### 6.3 Campaign Dashboard
- Table of sent campaigns: date, message preview, recipients, status, delivery rate
- Individual campaign detail: per-recipient delivery status
- Only visible to sender — recipients experience messages as normal 1-on-1

---

## Phase 7: Production Hardening (Week 4)
**Goal:** Secure, monitored, deployable application.

### 7.1 Security
- Rate limiting on auth endpoints (5 attempts/15min using Upstash Redis)
- Input sanitization on all message content (DOMPurify client-side, server-side strip)
- S3 buckets: private, no public access — all downloads via signed URLs (15-min expiry)
- Helmet.js HTTP security headers
- CSRF protection on all mutation endpoints

### 7.2 Performance
- Virtualized message list for threads >100 messages (`TanStack Virtual`)
- React Query cache for conversations + messages (stale-while-revalidate)
- Image optimization: Next.js `<Image>` for all avatars and thumbnails
- Bundle analysis: `@next/bundle-analyzer`, eliminate unused shadcn components

### 7.3 Error Handling & Monitoring
- Sentry SDK: error capture on both client and server
- Axiom or Logtail: structured server logs
- Socket.io reconnection logic: exponential backoff, session restore on reconnect
- S3 multipart abort on upload failure (avoid orphaned incomplete uploads)
- Global error boundary (Next.js `error.tsx`) with user-friendly messages

### 7.4 Deployment
- **Backend (Custom Server):** Railway or Render — Docker container, health check endpoint
- **Database:** Neon PostgreSQL — connection pooling via `@neondatabase/serverless`
- **Redis:** Upstash — serverless Redis, environment variable injection
- **S3:** AWS S3 bucket per environment (dev/prod)
- **CI/CD:** GitHub Actions → lint → test → build → deploy to Railway
- Docker Compose for local dev environment parity

### 7.5 Testing
- Unit tests: Vitest for utility functions and API handlers
- Integration tests: socket event flows, message delivery
- E2E: Playwright — login → send message → verify delivery
- Load test: k6 script simulating 100 concurrent chat users

---

## Dependency Map

```
Phase 1 (Scaffolding)
    ↓
Phase 2 (Auth + DB)
    ↓
Phase 3 (Real-time MVP) ← Core deliverable
    ↓            ↓
Phase 4 (Files) Phase 5 (Formatter)  ← Can be parallel
    ↓
Phase 6 (Bulk)
    ↓
Phase 7 (Production)
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|:---|:---|:---|
| Socket.io + Next.js App Router complexity | High | Custom server pattern from Socket.io docs — well documented |
| Vercel deployment incompatibility | Certain | Plan for Railway from day 1, not an afterthought |
| S3 CORS ETag header blocked | Medium | Explicit `ExposeHeaders: ['ETag']` in S3 CORS config |
| Whisper API latency | Medium | Only call on-demand (user toggle), not auto |
| BullMQ Redis connection in serverless | Medium | Upstash supports BullMQ via `ioredis` compatible client |
| 200MB upload timeouts | Low | Pre-signed URLs go direct to S3 — no server bandwidth bottleneck |