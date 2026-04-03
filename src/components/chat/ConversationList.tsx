"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search, MessageSquarePlus, AlertCircle, RotateCcw } from "lucide-react"
import { useConversations } from "@/hooks/useConversations"
import { ConversationListItem } from "./ConversationListItem"
import { NewConversationButton } from "./NewConversationButton"
import { SkeletonConversationItem } from "./ChatSkeletons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Conversation } from "@/types"
import { useSession } from "next-auth/react"
import { useSocket } from "@/providers/SocketProvider"
import { useQueryClient } from "@tanstack/react-query"

export function ConversationList() {
  const { data: conversations, isLoading, isError, refetch } = useConversations()
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const socket = useSocket()
  const queryClient = useQueryClient()
  const activeId = pathname.startsWith("/dashboard/") ? pathname.split("/")[2] : null
  const [search, setSearch] = useState("")

  // Refresh sidebar when a new message arrives in any conversation
  useEffect(() => {
    if (!socket) return

    const handleConversationUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    }

    socket.on("conversation:updated", handleConversationUpdated)
    return () => {
      socket.off("conversation:updated", handleConversationUpdated)
    }
  }, [socket, queryClient])

  const filteredConversations = conversations?.filter((conv: Conversation) => {
    if (!search.trim()) return true
    return conv.participants.some(
      (p) => p.id !== session?.user?.id && p.name?.toLowerCase().includes(search.toLowerCase()),
    )
  })

  const handleSelect = (id: string) => {
    router.push(`/dashboard/${id}`)
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-text-high">Messages</h2>
        <NewConversationButton />
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-low" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-bg-deep border-border-main pl-8 text-sm text-text-high placeholder:text-text-low focus-visible:border-brand focus-visible:ring-brand/25"
          />
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div>
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonConversationItem key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
            <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-text-medium mb-1">
              Failed to load conversations
            </p>
            <p className="text-xs text-text-low mb-4">Check your connection and try again</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 text-text-medium"
            >
              <RotateCcw className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : search.trim() && filteredConversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
            <p className="text-sm text-text-medium">No results for &ldquo;{search.trim()}&rdquo;</p>
          </div>
        ) : filteredConversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
            <div className="size-12 rounded-full bg-bg-muted flex items-center justify-center mb-4">
              <MessageSquarePlus className="size-6 text-text-low" />
            </div>
            <p className="text-sm font-medium text-text-medium mb-1">No messages yet</p>
            <p className="text-xs text-text-low mb-4">Start a conversation to begin messaging</p>
            <NewConversationButton variant="cta" />
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredConversations?.map((conv: Conversation) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={activeId === conv.id}
                onClick={() => handleSelect(conv.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
