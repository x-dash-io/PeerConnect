"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useMessages } from "@/hooks/useMessages"
import { useSocket } from "@/providers/SocketProvider"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { MessageComposer } from "./MessageComposer"
import { useQueryClient } from "@tanstack/react-query"
import { Message, MessageStatus, UserProfile, ReplyPreview } from "@/types"

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  initialParticipants: UserProfile[]
  lastReadAt: string | null
}

const TYPING_FAILSAFE_MS = 5000

export function ChatWindow({
  conversationId,
  currentUserId,
  initialParticipants,
  lastReadAt,
}: ChatWindowProps) {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const [isRecipientTyping, setIsRecipientTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null)
  const typingFailsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversationId)

  // Memoize flat messages list inverted for chronological order in the list
  const allMessages = useMemo(() => {
    if (!data) return []
    return data.pages.flatMap((page: { messages: Message[] }) => page.messages).reverse()
  }, [data])

  // Join/Leave room, listen for real-time messages and typing events
  useEffect(() => {
    if (!socket) return

    socket.emit("conversation:join", conversationId)
    // Clear unread badge in sidebar after server marks messages READ
    queryClient.invalidateQueries({ queryKey: ["conversations"] })

    const handleNewMessage = (message: Message) => {
      if (message.conversationId !== conversationId) return

      // Skip own messages — already handled by optimistic update + invalidation
      if (message.senderId === currentUserId) return

      // Clear typing indicator
      setIsRecipientTyping(false)
      if (typingFailsafeRef.current) clearTimeout(typingFailsafeRef.current)

      if (document.hasFocus()) {
        socket.emit("message:status", {
          messageId: message.id,
          status: "READ" as MessageStatus,
          conversationId,
        })
      } else {
        socket.emit("message:received:ack", {
          messageId: message.id,
          conversationId,
        })
      }

      // Update React Query cache immediately for real-time update
      queryClient.setQueryData(
        ["messages", conversationId],
        (
          old:
            | { pages: { messages: Message[]; nextCursor: string | null }[]; pageParams: unknown[] }
            | undefined,
        ) => {
          if (!old) return old

          // Add newest message to the first page (top of the history list in DB, bottom in UI)
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0 ? { ...page, messages: [message, ...page.messages] } : page,
            ),
          }
        },
      )
    }

    const handleTypingStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return
      setIsRecipientTyping(true)

      // Failsafe: hide indicator after 5s even if stop event is missed
      if (typingFailsafeRef.current) clearTimeout(typingFailsafeRef.current)
      typingFailsafeRef.current = setTimeout(() => setIsRecipientTyping(false), TYPING_FAILSAFE_MS)
    }

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId || data.userId === currentUserId) return
      setIsRecipientTyping(false)
      if (typingFailsafeRef.current) clearTimeout(typingFailsafeRef.current)
    }

    // Message status update (our sent message got delivered/read)
    const handleMessageStatus = ({
      messageId,
      status,
    }: {
      messageId: string
      status: MessageStatus
    }) => {
      queryClient.setQueryData(
        ["messages", conversationId],
        (
          old:
            | {
                pages: { messages: Message[]; nextCursor: string | null }[]
                pageParams: unknown[]
              }
            | undefined,
        ) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) => (m.id === messageId ? { ...m, status } : m)),
            })),
          }
        },
      )
    }

    socket.on("message:received", handleNewMessage)
    socket.on("typing:start", handleTypingStart)
    socket.on("typing:stop", handleTypingStop)
    socket.on("message:status", handleMessageStatus)

    return () => {
      socket.off("message:received", handleNewMessage)
      socket.off("typing:start", handleTypingStart)
      socket.off("typing:stop", handleTypingStop)
      socket.off("message:status", handleMessageStatus)
      socket.emit("conversation:leave", conversationId)
      if (typingFailsafeRef.current) clearTimeout(typingFailsafeRef.current)
    }
  }, [socket, conversationId, currentUserId, queryClient])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        conversationId={conversationId}
        participants={initialParticipants}
        currentUserId={currentUserId}
      />

      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={allMessages}
          currentUserId={currentUserId}
          lastReadAt={lastReadAt}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          isRecipientTyping={isRecipientTyping}
          onReply={(msg) =>
            setReplyTo({ id: msg.id, content: msg.content, senderName: msg.senderName ?? null })
          }
        />
      </div>

      <MessageComposer
        conversationId={conversationId}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
