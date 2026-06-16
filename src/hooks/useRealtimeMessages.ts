"use client"

import { useEffect, useCallback } from "react"
import { useSocket } from "@/providers/SocketProvider"
import { useQueryClient } from "@tanstack/react-query"
import { Message, MessageReaction, MessageStatus } from "@/types"

interface MessagesPage {
  messages: Message[]
  nextCursor: string | null
}

interface MessagesCache {
  pages: MessagesPage[]
  pageParams: unknown[]
}

function addMessageToCache(
  old: MessagesCache | undefined,
  message: Message,
): MessagesCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page, i) =>
      i === 0 ? { ...page, messages: [message, ...page.messages] } : page,
    ),
  }
}

function updateMessageInCache(
  old: MessagesCache | undefined,
  messageId: string,
  updates: Partial<Message>,
): MessagesCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
    })),
  }
}

function removeMessageFromCache(
  old: MessagesCache | undefined,
  messageId: string,
): MessagesCache | undefined {
  if (!old) return old
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.filter((m) => m.id !== messageId),
    })),
  }
}

export function useRealtimeMessages(conversationId: string, currentUserId: string) {
  const socket = useSocket()
  const queryClient = useQueryClient()

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (message.conversationId !== conversationId) return
      if (message.senderId === currentUserId) return

      if (document.hasFocus()) {
        socket?.emit("message:status", {
          messageId: message.id,
          status: "READ" as MessageStatus,
          conversationId,
        })
      } else {
        socket?.emit("message:received:ack", {
          messageId: message.id,
          conversationId,
        })
      }

      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) =>
        addMessageToCache(old, message),
      )
    },
    [conversationId, currentUserId, socket, queryClient],
  )

  const handleMessageStatus = useCallback(
    ({ messageId, status }: { messageId: string; status: MessageStatus }) => {
      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) =>
        updateMessageInCache(old, messageId, { status }),
      )
    },
    [conversationId, queryClient],
  )

  const handleMessageEdited = useCallback(
    ({ conversationId: cId, message }: { conversationId: string; message: Message }) => {
      if (cId !== conversationId) return
      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) =>
        updateMessageInCache(old, message.id, {
          content: message.content,
          editedAt: message.editedAt,
        }),
      )
    },
    [conversationId, queryClient],
  )

  const handleMessageDeleted = useCallback(
    ({ conversationId: cId, messageId }: { conversationId: string; messageId: string }) => {
      if (cId !== conversationId) return
      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) =>
        updateMessageInCache(old, messageId, { content: null, isDeleted: "true" }),
      )
    },
    [conversationId, queryClient],
  )

  const handleReactionAdded = useCallback(
    ({ conversationId: cId, reaction }: { conversationId: string; reaction: MessageReaction }) => {
      if (cId !== conversationId) return
      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => {
              if (m.id !== reaction.messageId) return m
              const existing = m.reactions || []
              return {
                ...m,
                reactions: [
                  ...existing.filter(
                    (r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji),
                  ),
                  reaction,
                ],
              }
            }),
          })),
        }
      })
    },
    [conversationId, queryClient],
  )

  const handleReactionRemoved = useCallback(
    ({ conversationId: cId, reactionId }: { conversationId: string; reactionId: string }) => {
      if (cId !== conversationId) return
      queryClient.setQueryData(["messages", conversationId], (old: MessagesCache | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) => ({
              ...m,
              reactions: (m.reactions || []).filter((r) => r.id !== reactionId),
            })),
          })),
        }
      })
    },
    [conversationId, queryClient],
  )

  useEffect(() => {
    if (!socket) return

    socket.on("message:received", handleNewMessage)
    socket.on("message:status", handleMessageStatus)
    socket.on("message:edited", handleMessageEdited)
    socket.on("message:deleted", handleMessageDeleted)
    socket.on("message:reaction:added", handleReactionAdded)
    socket.on("message:reaction:removed", handleReactionRemoved)

    return () => {
      socket.off("message:received", handleNewMessage)
      socket.off("message:status", handleMessageStatus)
      socket.off("message:edited", handleMessageEdited)
      socket.off("message:deleted", handleMessageDeleted)
      socket.off("message:reaction:added", handleReactionAdded)
      socket.off("message:reaction:removed", handleReactionRemoved)
    }
  }, [
    socket,
    handleNewMessage,
    handleMessageStatus,
    handleMessageEdited,
    handleMessageDeleted,
    handleReactionAdded,
    handleReactionRemoved,
  ])
}
