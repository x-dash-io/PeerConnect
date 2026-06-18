"use client"

import { useEffect } from "react"
import { useSocket } from "@/providers/SocketProvider"
import { useQueryClient } from "@tanstack/react-query"
import { Conversation } from "@/types"

export function useConversationRoom(conversationId: string) {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    // Optimistically clear the unread count for the active conversation
    queryClient.setQueryData(["conversations"], (old: Conversation[] | undefined) => {
      if (!old) return old
      return old.map((conv) => (conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv))
    })

    socket.emit("conversation:join", conversationId)

    const handleJoined = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })
    }

    const handleFocus = () => {
      socket.emit("conversation:join", conversationId)
    }

    socket.on("conversation:joined", handleJoined)
    window.addEventListener("focus", handleFocus)

    return () => {
      socket.off("conversation:joined", handleJoined)
      window.removeEventListener("focus", handleFocus)
      socket.emit("conversation:leave", conversationId)
    }
  }, [socket, conversationId, queryClient])
}
