import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Message, MessageType } from "@/types"
import { MESSAGE_PAGE_SIZE } from "@/lib/constants"
import { toast } from "sonner"

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const url = new URL(
        `/api/conversations/${conversationId}/messages`,
        typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
      )
      if (pageParam) url.searchParams.set("cursor", pageParam)
      url.searchParams.set("limit", String(MESSAGE_PAGE_SIZE))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error("Failed to fetch messages")
      const data = await res.json()
      return data as { messages: Message[]; nextCursor: string | null }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  })
}

type PageData = {
  pages: { messages: Message[]; nextCursor: string | null }[]
  pageParams: unknown[]
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      content,
      replyToId,
      fileId,
      type = "TEXT",
      metadata,
    }: {
      content: string
      replyToId?: string
      fileId?: string
      type?: Message["type"]
      metadata?: Record<string, unknown>
    }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, replyToId, fileId, type, metadata }),
      })
      if (!res.ok) throw new Error("Failed to send message")
      return res.json() as Promise<Message>
    },
    onMutate: async ({ content, type = "TEXT", metadata }) => {
      await qc.cancelQueries({ queryKey: ["messages", conversationId] })

      const previous = qc.getQueryData(["messages", conversationId])
      const tempId = `optimistic-${Date.now()}`

      const optimisticMessage: Message = {
        id: tempId,
        conversationId,
        senderId: "__self__",
        content,
        type,
        metadata,
        status: "SENDING",
        createdAt: new Date().toISOString(),
      }

      qc.setQueryData(["messages", conversationId], (old: PageData | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? { ...page, messages: [optimisticMessage, ...page.messages] } : page,
          ),
        }
      })

      return { previous, tempId }
    },
    onSuccess: (realMessage, _vars, context) => {
      if (!context?.tempId) return
      // Swap optimistic message with real one in-place (no full refetch)
      // Attach _tempId so the React key stays stable across the swap
      qc.setQueryData(["messages", conversationId], (old: PageData | undefined) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? {
                  ...page,
                  messages: page.messages.map((m) =>
                    m.id === context.tempId ? { ...realMessage, _tempId: context.tempId } : m,
                  ),
                }
              : page,
          ),
        }
      })
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        qc.setQueryData(["messages", conversationId], context.previous)
      }
      toast.error("Failed to send message. Please try again.")
    },
  })
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to edit message")
      return res.json() as Promise<Message>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] })
    },
    onError: () => {
      toast.error("Failed to edit message")
    },
  })
}

export function useDeleteMessage(conversationId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete message")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] })
    },
    onError: () => {
      toast.error("Failed to delete message")
    },
  })
}
