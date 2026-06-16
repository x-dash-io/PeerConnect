import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageReaction } from "@/types"

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] })
    },
  })
}
