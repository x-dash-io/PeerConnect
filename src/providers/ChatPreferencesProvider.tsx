"use client"

import { createContext, useContext, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { ChatPreferences, FontSize, BubbleTheme } from "@/types"

interface ChatPreferencesContextValue {
  preferences: ChatPreferences
  fontSize: FontSize
  bubbleTheme: BubbleTheme
  wallpaper: string | null
  updatePreferences: (updates: Partial<ChatPreferences>) => Promise<void>
  isLoading: boolean
}

const defaultPreferences: ChatPreferences = {
  fontSize: "medium",
  bubbleTheme: "indigo",
  wallpaper: null,
}

const ChatPreferencesContext = createContext<ChatPreferencesContextValue | null>(null)

export function ChatPreferencesProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<ChatPreferences>({
    queryKey: ["chat-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/preferences")
      if (!res.ok) throw new Error("Failed to fetch preferences")
      return res.json()
    },
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: async (updates: Partial<ChatPreferences>) => {
      const res = await fetch("/api/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update preferences")
      return res.json()
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["chat-preferences"], result)
    },
  })

  const preferences = data ?? defaultPreferences

  const updatePreferences = useCallback(
    async (updates: Partial<ChatPreferences>) => {
      await mutation.mutateAsync(updates)
    },
    [mutation],
  )

  return (
    <ChatPreferencesContext.Provider
      value={{
        preferences,
        fontSize: preferences.fontSize,
        bubbleTheme: preferences.bubbleTheme,
        wallpaper: preferences.wallpaper,
        updatePreferences,
        isLoading,
      }}
    >
      {children}
    </ChatPreferencesContext.Provider>
  )
}

export function useChatPreferences() {
  const ctx = useContext(ChatPreferencesContext)
  if (!ctx) {
    return {
      preferences: defaultPreferences,
      fontSize: "medium" as FontSize,
      bubbleTheme: "indigo" as BubbleTheme,
      wallpaper: null as string | null,
      updatePreferences: async () => {},
      isLoading: false,
    }
  }
  return ctx
}
