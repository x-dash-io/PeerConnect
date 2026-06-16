"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useSocket } from "@/providers/SocketProvider"
import { TYPING_TIMEOUT_MS } from "@/lib/constants"

const TYPING_FAILSAFE_MS = TYPING_TIMEOUT_MS + 1000

export function useTypingReceiver(conversationId: string, currentUserId: string) {
  const socket = useSocket()
  const [isTyping, setIsTyping] = useState(false)
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTyping = useCallback(() => {
    setIsTyping(false)
    if (failsafeRef.current) {
      clearTimeout(failsafeRef.current)
      failsafeRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!socket) return clearTyping

    const handleStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return
      setIsTyping(true)
      if (failsafeRef.current) clearTimeout(failsafeRef.current)
      failsafeRef.current = setTimeout(clearTyping, TYPING_FAILSAFE_MS)
    }

    const handleStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return
      clearTyping()
    }

    socket.on("typing:start", handleStart)
    socket.on("typing:stop", handleStop)

    return () => {
      socket.off("typing:start", handleStart)
      socket.off("typing:stop", handleStop)
      clearTyping()
    }
  }, [socket, conversationId, currentUserId, clearTyping])

  return isTyping
}
