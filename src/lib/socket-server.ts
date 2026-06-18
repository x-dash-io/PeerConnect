import type { Server as SocketIOServer } from "socket.io"

export function getIO(): SocketIOServer | null {
  const io = (global as Record<string, unknown>).io as SocketIOServer | undefined
  if (!io) {
    console.warn("[Socket] io is not initialized. Socket emissions will be skipped.")
  }
  return io ?? null
}
