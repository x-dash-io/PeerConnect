"use client"

import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Conversation } from "@/types"
import { AvatarWithPresence } from "@/components/shared/AvatarWithPresence"
import { usePresence } from "@/hooks/usePresence"

interface ConversationListItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const { data: session } = useSession()
  const currentUserId = session?.user?.id

  const otherParticipant =
    conversation.participants.find((p) => p.id !== currentUserId) || conversation.participants[0]
  const { status: presenceStatus } = usePresence(otherParticipant?.id)

  const lastMessage = conversation.lastMessage
  const unreadCount = conversation.unreadCount || 0

  const formatTimestamp = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true }).replace("about ", "")
    } catch {
      return ""
    }
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200",
        isActive ? "bg-brand-subtle shadow-sm" : "hover:bg-bg-muted/70",
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full bg-brand" />
      )}

      {/* Avatar */}
      <AvatarWithPresence
        name={otherParticipant?.name || "User"}
        src={otherParticipant?.image || undefined}
        status={presenceStatus}
        size="md"
        className="shrink-0"
      />

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              unreadCount > 0 ? "text-text-high" : "text-text-high",
            )}
          >
            {otherParticipant?.name || otherParticipant?.email}
          </span>
          <span className="shrink-0 text-[11px] text-text-low tabular-nums">
            {lastMessage
              ? formatTimestamp(lastMessage.createdAt)
              : formatTimestamp(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              "truncate text-[13px]",
              unreadCount > 0 ? "text-text-high font-medium" : "text-text-medium",
            )}
          >
            {lastMessage?.content || "No messages yet"}
          </p>

          {unreadCount > 0 && (
            <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
