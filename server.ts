import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import next from "next"
import { createClient } from "redis"
import { createAdapter } from "@socket.io/redis-adapter"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
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
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL })
    const subClient = pubClient.duplicate()
    await Promise.all([pubClient.connect(), subClient.connect()])
    io.adapter(createAdapter(pubClient, subClient))
    console.log("[Socket.io] Redis adapter connected")
  }

  // Store io on global for access from API routes
  ;(global as Record<string, unknown>).io = io

  // Socket.io event handlers
  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`)

    // Join user's personal room for direct messages
    socket.on("user:join", (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`[Socket.io] User ${userId} joined their room`)
    })

    // Join a conversation room
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    // Typing events
    socket.on(
      "typing:start",
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        socket.to(`conversation:${conversationId}`).emit("typing:start", { userId })
      },
    )

    socket.on(
      "typing:stop",
      ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        socket.to(`conversation:${conversationId}`).emit("typing:stop", { userId })
      },
    )

    socket.on("disconnect", () => {
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
