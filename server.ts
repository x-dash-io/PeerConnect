import { loadEnvConfig } from "@next/env"
const projectDir = process.cwd()
loadEnvConfig(projectDir)

import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import next from "next"
import { createClient } from "redis"
import { createAdapter } from "@socket.io/redis-adapter"
import { db } from "@/lib/db"
import { messages, conversationParticipants } from "@/lib/schema"
import { eq, and, ne } from "drizzle-orm"
import type { MessageStatus } from "@/types"
import { setUserOnline, setUserOffline } from "@/lib/redis"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port, turbopack: false })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const expressApp = express()
  const httpServer = createServer(expressApp)

  // Socket.io setup
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  // Redis adapter for multi-instance scaling
  const redisUrl = process.env.REDIS_URL?.replace(/^["']|["']$/g, "")
  if (redisUrl) {
    let retryCount = 0
    const MAX_RETRIES = 5

    try {
      const pubClient = createClient({
        url: redisUrl,
        pingInterval: 30000,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > MAX_RETRIES) return false // stop retrying
            return Math.min(retries * 500, 5000)
          },
        },
      })
      const subClient = pubClient.duplicate()

      pubClient.on("error", (err) => {
        retryCount++
        console.error(`[Socket.io] Redis Pub Error (${retryCount}/${MAX_RETRIES}):`, err.message)
      })
      subClient.on("error", (err) => {
        console.error("[Socket.io] Redis Sub Error:", err.message)
      })

      await Promise.all([pubClient.connect(), subClient.connect()])
      io.adapter(createAdapter(pubClient, subClient))
      console.log("[Socket.io] Redis adapter connected")
    } catch (err) {
      console.error("[Socket.io] Redis adapter failed to connect. Falling back to in-memory.")
    }
  }

  // Store io on global for access from API routes
  ;(global as Record<string, unknown>).io = io

  // Socket.io event handlers
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    // Join user's personal room for direct messages + set online
    socket.on("user:join", async (userId: string) => {
      socket.join(`user:${userId}`)
      socket.data.userId = userId

      await setUserOnline(userId)
      io.emit("presence:update", { userId, status: "online" })

      console.log(`[Socket.io] User ${userId} joined their room`)
    })

    // Heartbeat to keep online status alive (client pings every 60s)
    socket.on("presence:heartbeat", async () => {
      const userId = socket.data.userId as string | undefined
      if (userId) {
        await setUserOnline(userId)
      }
    })

    // Join a conversation room + mark unread messages as READ
    socket.on("conversation:join", async (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
      const userId = socket.data.userId as string | undefined
      if (!userId) return

      // Bulk-mark all unread messages from other users as READ
      const updated = await db
        .update(messages)
        .set({ status: "READ", updatedAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderId, userId),
            ne(messages.status, "READ"),
          ),
        )
        .returning({ id: messages.id })

      // Notify senders so their ticks update
      for (const msg of updated) {
        socket
          .to(`conversation:${conversationId}`)
          .emit("message:status", { messageId: msg.id, status: "READ" })
      }

      // Update participant's lastReadAt
      await db
        .update(conversationParticipants)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, userId),
          ),
        )
    })

    // Acknowledge message delivery (SENT → DELIVERED)
    socket.on(
      "message:received:ack",
      async ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
        const userId = socket.data.userId as string | undefined
        if (!userId) return

        await db
          .update(messages)
          .set({ status: "DELIVERED", updatedAt: new Date() })
          .where(
            and(
              eq(messages.id, messageId),
              ne(messages.senderId, userId),
              eq(messages.status, "SENT"),
            ),
          )

        socket
          .to(`conversation:${conversationId}`)
          .emit("message:status", { messageId, status: "DELIVERED" })
      },
    )

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Typing events
    socket.on(
      "typing:start",
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        socket.to(`conversation:${conversationId}`).emit("typing:start", { conversationId, userId })
      },
    )

    socket.on(
      "typing:stop",
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        socket.to(`conversation:${conversationId}`).emit("typing:stop", { conversationId, userId })
      },
    )

    // Message status updates (SENT → DELIVERED → READ)
    socket.on(
      "message:status",
      async ({
        messageId,
        status,
        conversationId,
      }: {
        messageId: string
        status: MessageStatus
        conversationId: string
      }) => {
        await db
          .update(messages)
          .set({ status, updatedAt: new Date() })
          .where(eq(messages.id, messageId))

        // Notify other participants in the conversation
        socket.to(`conversation:${conversationId}`).emit("message:status", { messageId, status })
      },
    )

    socket.on("disconnect", async () => {
      const userId = socket.data.userId as string | undefined
      if (userId) {
        await setUserOffline(userId)
        io.emit("presence:update", { userId, status: "offline" })
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`)
    })
  })

  // Next.js request handling
  expressApp.all("/{*path}", (req, res) => {
    return handle(req, res)
  })

  httpServer.listen(port, () => {
    console.log(`[Server] Ready on http://${hostname}:${port}`)
    console.log(`[Server] Environment: ${dev ? "development" : "production"}`)
  })
})
