"use client"

import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { motion } from "framer-motion"
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

  // Find the other participant (for DIRECT conversations)
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
    <motion.div
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      className={cn(
        "group relative flex h-[72px] cursor-pointer items-center gap-3 px-4 transition-colors",
        isActive ? "bg-brand-subtle" : "hover:bg-bg-muted",
      )}
    >
      {/* Active Indicator */}
      {isActive && <div className="absolute left-0 top-0 h-full w-[3px] bg-primary" />}

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
          <span className="truncate font-medium text-text-high">
            {otherParticipant?.name || otherParticipant?.email}
          </span>
          <span className="shrink-0 text-xs text-text-medium">
            {lastMessage
              ? formatTimestamp(lastMessage.createdAt)
              : formatTimestamp(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-text-medium">
            {lastMessage?.content || "No messages yet"}
          </p>

          {unreadCount > 0 && (
            <div className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
