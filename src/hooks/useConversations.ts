import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations?limit=50")
      if (!res.ok) throw new Error("Failed to fetch conversations")
      const data = await res.json()
      return data.conversations || data
    },
    // Re-fetch every 30s so relative timestamps ("2 min ago") stay fresh
    // and read/unread counts update even if socket events are missed
    refetchInterval: 30_000,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (recipientId: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId }),
      })
      if (!res.ok) throw new Error("Failed to create conversation")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  })
}
