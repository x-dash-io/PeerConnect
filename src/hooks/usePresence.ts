"use client"

import { useSocket } from "@/providers/SocketProvider"
import { useEffect, useState } from "react"
import { PresenceStatus } from "@/types"

export function usePresence(userId: string | undefined) {
  const socket = useSocket()
  const [status, setStatus] = useState<PresenceStatus>("offline")
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    fetch(`/api/presence/${userId}`)
      .then((r) => r.json())
      .then((p: { status: PresenceStatus; lastSeen: string | null } | null) => {
        setStatus(p?.status || "offline")
        setLastSeen(p?.lastSeen || null)
      })
      .catch(() => {
        // Silently fail — will show "offline" default
      })
  }, [userId])

  useEffect(() => {
    if (!socket || !userId) return

    const handler = ({ userId: uid, status: s }: { userId: string; status: PresenceStatus }) => {
      if (uid !== userId) return
      setStatus(s)
      if (s === "offline") {
        setLastSeen(new Date().toISOString())
      }
    }

    socket.on("presence:update", handler)
    return () => {
      socket.off("presence:update", handler)
    }
  }, [socket, userId])

  return { status, lastSeen }
}
