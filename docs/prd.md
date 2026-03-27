# Product Requirements Document (Updated): PeerConnect

> **Version:** 2.0 — Research-Validated  
> **Date:** March 2026  
> **Status:** Ready for Development

---

## 1. Vision & Goal

**PeerConnect** is a premium, high-performance professional messaging platform designed for peers, freelancers, and business owners. It bridges the informality of WhatsApp with the productivity of Slack — delivering a polished, professional-first communication environment.

### Key Differentiators

- **Professional Formatter:** Real-time AI-assisted tone correction, unlike any consumer messenger.
- **200MB File Vault:** Chunked multipart upload via pre-signed S3 URLs — enterprise-grade, consumer-simple.
- **Bulk 1-on-1 Delivery:** Campaign messaging that feels personal, not spammy.
- **Role-Based Personas:** `PEER`, `BUSINESS`, `FREELANCER` — switchable without account recreation.

---

## 2. Branding & Visual Identity

| Element              | Spec                                                         |
| -------------------- | ------------------------------------------------------------ |
| **Aesthetic**        | High-Contrast Minimalist, "Dark First"                       |
| **Background**       | `#09090B` (Vantablack/Slate)                                 |
| **Primary Accent**   | `#6366F1` (Electric Indigo)                                  |
| **Success/Presence** | `#10B981` (Emerald)                                          |
| **Typography**       | `Manrope` (headings) + `Lato` (body)                         |
| **Motion**           | Framer Motion — spring physics, 150ms pop                    |
| **Treatment**        | Glassmorphism navbars, inset shadows, no heavy outer shadows |

Full design token reference: `design_spec.md`

---

## 3. Core Features & Requirements

### A. Real-Time Communication

- **Messaging:** Text, audio messages, and large file support (up to **200MB** per file).
- **Status Indicators:** Online/offline presence via Redis, typing indicators, message `sent` → `delivered` → `read` receipts.
- **Architecture Note:** Socket.io runs on a **custom Express/Node server** (not Vercel serverless). This is required because Socket.io requires persistent WebSocket connections incompatible with serverless functions. Deploy to **Railway, Render, or a VPS**.

### B. Professionalism Formatter (Smart Editor)

- **Discreet AI Suggestions:** Floating tooltip with professional tone alternatives (powered by a lightweight LLM call).
- **Auto-formatting:** Real-time Markdown preview for code blocks and structured text.
- **Non-intrusive:** Suggestions appear only on explicit trigger (underline + click), never auto-replace.

### C. Flexible User Personas

- **Onboarding:** Animated role-selection screen with lateral slide transitions (Framer Motion).
- **Roles:** `PEER`, `BUSINESS`, `FREELANCER` — stored in DB, switchable from Settings.
- **Profile Adapts:** Role badge, dashboard layout, and default message templates adapt per role.

### D. Audio Messages & Transcription

- **Recording:** In-browser MediaRecorder API, sent as `.webm`/`.ogg` blob uploaded to S3.
- **Real-time Transcription:** Whisper API (OpenAI) or Web Speech API as fallback — manual toggle, not auto-on.

### E. Bulk Messaging (Personalized Campaigns)

- **Blast Tool:** Compose one message → select multiple recipients → send.
- **1-on-1 Delivery:** Backend delivers as individual private `conversation` records — recipients never see it's a blast.
- **Queue:** Bull/BullMQ with Redis for sequential background delivery to avoid spam triggers.

---

## 4. Technical Stack (Finalized & Research-Validated)

### Frontend

| Layer         | Technology                       | Notes                                 |
| ------------- | -------------------------------- | ------------------------------------- |
| Framework     | Next.js 15 (App Router)          | Server Components + Client Components |
| Styling       | Tailwind CSS v4 + shadcn/ui      | CSS variables for design tokens       |
| Animation     | Framer Motion 11                 | Spring physics, layout animations     |
| Icons         | Lucide React                     | Minimalist stroke icons               |
| State         | Zustand + React Query (TanStack) | Server state + client state split     |
| Forms         | React Hook Form + Zod            | Type-safe validation                  |
| Socket Client | socket.io-client                 | SSR-excluded (`dynamic` import)       |

### Backend

| Layer              | Technology                   | Notes                                   |
| ------------------ | ---------------------------- | --------------------------------------- |
| Runtime            | Node.js 20 LTS               | Custom server (not Vercel serverless)   |
| HTTP Framework     | Express.js                   | Serves Next.js + attaches Socket.io     |
| Real-Time          | Socket.io v4                 | Redis adapter for multi-instance scale  |
| Auth               | NextAuth.js v5 (Auth.js)     | JWT strategy, `@auth/drizzle-adapter`   |
| ORM                | Drizzle ORM                  | Type-safe, SQL-first, migration support |
| Database           | PostgreSQL (Neon serverless) | Serverless-compatible driver            |
| Cache/Presence     | Upstash Redis                | Serverless Redis, request-based billing |
| Queue              | BullMQ + Upstash Redis       | Bulk message delivery worker            |
| File Storage       | AWS S3 + Presigned URLs      | Multipart upload for files >5MB         |
| AI (Formatter)     | OpenAI GPT-4o-mini           | Tone suggestions, low-latency           |
| AI (Transcription) | OpenAI Whisper API           | Audio → text                            |

### Infrastructure

| Concern          | Solution                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Deployment       | Railway (backend) + Vercel (frontend, if split) OR Railway for monorepo |
| CI/CD            | GitHub Actions → Railway auto-deploy                                    |
| Containerization | Docker (dev parity)                                                     |
| Monitoring       | Sentry (errors) + Axiom (logs)                                          |
| CDN              | Cloudflare (DNS + proxy)                                                |

### Key Architecture Decision: Custom Server

> **Why not Vercel?** Socket.io requires persistent TCP connections. Vercel's serverless functions terminate after response, making WebSocket impossible. The recommended approach is a **custom Express + Next.js server** deployed to Railway or a VPS. SSE (Server-Sent Events) + Upstash is a Vercel-compatible alternative for <1000 concurrent users, but Socket.io is used here for full bi-directional real-time capability.

---

## 5. Database Schema Overview

### Tables

- `users` — id, email, name, avatar, role (PEER/BUSINESS/FREELANCER), createdAt
- `sessions` — NextAuth sessions
- `conversations` — id, type (DIRECT/GROUP), createdAt
- `conversation_participants` — conversationId, userId, joinedAt
- `messages` — id, conversationId, senderId, content, type (TEXT/AUDIO/FILE), status (SENT/DELIVERED/READ), createdAt
- `files` — id, messageId, s3Key, filename, mimeType, sizeBytes, uploadStatus
- `campaigns` — id, senderId, content, recipientCount, status, createdAt
- `campaign_recipients` — campaignId, userId, messageId, deliveredAt

---

## 6. Non-Functional Requirements

| Requirement         | Target                                                |
| ------------------- | ----------------------------------------------------- |
| Message latency     | < 100ms (Socket.io emit → receive)                    |
| File upload (200MB) | < 60s on 10Mbps (parallel multipart, 10MB chunks)     |
| Concurrent users    | 500+ per server instance (Socket.io + Redis adapter)  |
| Availability        | 99.9% uptime (Railway health checks + auto-restart)   |
| Security            | HTTPS only, HTTP-only JWT cookies, S3 private buckets |
| GDPR                | Data deletion endpoint, no third-party ad tracking    |

---

## 7. Out of Scope (v1)

- Group video/voice calls
- End-to-end encryption (E2EE) — planned for v2
- Mobile apps (React Native) — planned for v2
- Read receipts for bulk/campaign messages
