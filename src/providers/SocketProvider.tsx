"use client"
import { createContext, useContext, useEffect, useState } from "react"
import { Socket } from "socket.io-client"

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // Dynamically import to prevent SSR
    import("@/lib/socket-client").then(({ connectSocket }) => {
      const s = connectSocket(userId)
      setSocket(s)
    })

    return () => {
      import("@/lib/socket-client").then(({ disconnectSocket }) => {
        disconnectSocket()
      })
    }
  }, [userId])

  // Heartbeat to keep presence alive (every 60s)
  useEffect(() => {
    if (!socket) return
    const interval = setInterval(() => {
      socket.emit("presence:heartbeat")
    }, 60_000)
    return () => clearInterval(interval)
  }, [socket])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export const useSocket = () => useContext(SocketContext)
