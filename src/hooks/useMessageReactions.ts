import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Message, MessageReaction } from "@/types"
import { optimisticUpdate, rollbackUpdate } from "@/lib/query-optimistic"

interface MessagesPage {
  messages: Message[]
  nextCursor: string | null
}

interface MessagesCache {
  pages: MessagesPage[]
  pageParams: unknown[]
}

export function useToggleReaction(conversationId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages/${messageId}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        },
      )
      if (!res.ok) throw new Error("Failed to toggle reaction")
      return res.json() as Promise<{
        action: "added" | "removed"
        reaction?: MessageReaction
        reactionId?: string
      }>
    },
    onMutate: async ({ messageId, emoji }) => {
      const previous = await optimisticUpdate<MessagesCache>(
        qc,
        ["messages", conversationId],
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((msg) => {
                if (msg.id !== messageId) return msg
                const existing = msg.reactions || []
                const mine = existing.find((r) => r.userId === "__self__" && r.emoji === emoji)
                if (mine) {
                  return {
                    ...msg,
                    reactions: existing.filter((r) => r.id !== mine.id),
                  }
                }
                const optimistic: MessageReaction = {
                  id: `optimistic-${Date.now()}`,
                  messageId,
                  userId: "__self__",
                  emoji,
                  createdAt: new Date().toISOString(),
                }
                return {
                  ...msg,
                  reactions: [...existing, optimistic],
                }
              }),
            })),
          }
        },
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      rollbackUpdate(qc, ["messages", conversationId], context?.previous)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] })
    },
  })
}
