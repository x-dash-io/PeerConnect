"use client"
// Socket.io client — loaded dynamically to prevent SSR issues
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    socket = io(socketUrl || undefined, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    })
  }
  return socket
}

export function connectSocket(userId: string): Socket {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
    s.emit("user:join", userId)
  }
  return s
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect()
  }
}
