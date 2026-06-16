"use client"

import { useEffect } from "react"
import { useSocket } from "@/providers/SocketProvider"
import { useQueryClient } from "@tanstack/react-query"

export function useConversationRoom(conversationId: string) {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    socket.emit("conversation:join", conversationId)
    queryClient.invalidateQueries({ queryKey: ["conversations"] })

    return () => {
      socket.emit("conversation:leave", conversationId)
    }
  }, [socket, conversationId, queryClient])
}
