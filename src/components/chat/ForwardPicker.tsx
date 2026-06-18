"use client"

import { useState } from "react"
import { Search, Check, Loader2, Forward } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn, getInitials } from "@/lib/utils"
import { useConversations } from "@/hooks/useConversations"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import type { Message } from "@/types"

interface ForwardPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: Message | null
}

export function ForwardPicker({ open, onOpenChange, message }: ForwardPickerProps) {
  const { data: conversations, isLoading: loadingConversations } = useConversations()
  const { data: session } = useSession()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  const filtered =
    conversations?.filter((conv: { participants: { id: string; name: string }[] }) => {
      if (!search.trim()) return true
      return conv.participants.some(
        (p) => p.id !== session?.user?.id && p.name?.toLowerCase().includes(search.toLowerCase()),
      )
    }) || []

  const toggleConversation = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleForward = async () => {
    if (!message || selected.size === 0) return
    setSending(true)
    try {
      const res = await fetch("/api/messages/forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          targetConversationIds: Array.from(selected),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to forward")
      }

      toast.success(`Forwarded to ${selected.size} conversation${selected.size > 1 ? "s" : ""}`)
      setSelected(new Set())
      setSearch("")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to forward message")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogTitle className="sr-only">Forward message</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <span className="text-sm font-semibold text-text-high">Forward message</span>
          <button
            onClick={() => onOpenChange(false)}
            className="text-text-low hover:text-text-high transition-colors cursor-pointer"
          >
            <span className="text-xs">Cancel</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-low" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-bg-muted border border-border-subtle text-sm text-text-high placeholder:text-text-low outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="overflow-y-auto max-h-[50vh] px-2 pb-2">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 text-text-low animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-text-low py-8">No conversations found</p>
          ) : (
            filtered.map(
              (conv: {
                id: string
                participants: { id: string; name: string; image?: string | null }[]
              }) => {
                const isSelected = selected.has(conv.id)
                const other = conv.participants.find((p) => p.id !== session?.user?.id)
                return (
                  <button
                    key={conv.id}
                    onClick={() => toggleConversation(conv.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer",
                      isSelected ? "bg-brand/10" : "hover:bg-bg-muted",
                    )}
                  >
                    {/* Avatar */}
                    <div className="size-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-xs font-semibold text-brand">
                      {getInitials(other?.name || "U")}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-high truncate">
                        {other?.name || "Unknown"}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={cn(
                        "size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected ? "bg-brand border-brand" : "border-border-subtle",
                      )}
                    >
                      {isSelected && <Check className="size-3 text-white" />}
                    </div>
                  </button>
                )
              },
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-bg-surface">
          <span className="text-xs text-text-low">
            {selected.size > 0
              ? `${selected.size} conversation${selected.size > 1 ? "s" : ""} selected`
              : "Select conversations"}
          </span>
          <button
            onClick={handleForward}
            disabled={selected.size === 0 || sending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {sending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Forward className="size-3.5" />
            )}
            {sending ? "Forwarding..." : `Forward (${selected.size})`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
