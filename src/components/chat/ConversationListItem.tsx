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
        "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors",
        isActive
          ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-2 border-indigo-500"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
      )}
    >
      {/* Avatar with presence */}
      <div className="relative shrink-0">
        <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-sm font-medium text-indigo-700 dark:text-indigo-300">
          {getInitials(otherParticipant?.name || "U")}
        </div>
        <PresenceDot status={presenceStatus} />
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {otherParticipant?.name || otherParticipant?.email}
          </span>
          <span className="shrink-0 text-[10px] text-neutral-400 tabular-nums ml-auto">
            {lastMessage
              ? formatTimestamp(lastMessage.createdAt)
              : formatTimestamp(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="truncate text-xs text-neutral-400 max-w-[140px]">
            {lastMessage?.content || "No messages yet"}
          </p>

          {unreadCount > 0 && (
            <div className="flex shrink-0 min-w-[18px] items-center justify-center rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
