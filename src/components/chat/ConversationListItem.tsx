"use client"

import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { cn, getInitials } from "@/lib/utils"
import { Conversation } from "@/types"
import { PresenceDot } from "@/components/shared/PresenceDot"
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
        isActive
          ? "bg-brand-subtle border-l-2 border-brand"
          : "hover:bg-bg-muted hover:transform hover:scale-[1.01]",
      )}
    >
      {/* Avatar with presence */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-medium text-brand shadow-sm">
          {getInitials(otherParticipant?.name || "U")}
        </div>
        <PresenceDot status={presenceStatus} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-text-high">
            {otherParticipant?.name || otherParticipant?.email}
          </span>
          <span className="shrink-0 text-[10px] text-text-low tabular-nums ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {lastMessage
              ? formatTimestamp(lastMessage.createdAt)
              : formatTimestamp(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="truncate text-xs text-text-low max-w-[140px] group-hover:text-text-medium transition-colors duration-200">
            {lastMessage?.content || "No messages yet"}
          </p>

          {unreadCount > 0 && (
            <div className="flex shrink-0 min-w-[18px] items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
