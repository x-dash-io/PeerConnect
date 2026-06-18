"use client"

import { useSession } from "next-auth/react"
import { formatDistanceToNow } from "date-fns"
import { cn, getInitials } from "@/lib/utils"
import { Conversation } from "@/types"
import { PresenceDot } from "@/components/shared/PresenceDot"
import { usePresence } from "@/hooks/usePresence"
import { MessageStatusIcon } from "@/components/shared/MessageStatusIcon"
import { File, Image as ImageIcon, Video, Mic } from "lucide-react"

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

  const renderMessagePreview = () => {
    if (!lastMessage) return "No messages yet"

    let icon = null
    let text = lastMessage.content || ""
    const isFilePrefix = text.startsWith("Sent a file: ")

    if (
      lastMessage.type === "IMAGE" ||
      (!lastMessage.file && lastMessage.type === "TEXT" && text.match(/\.(png|jpe?g|gif|webp)$/i))
    ) {
      icon = <ImageIcon className="size-3.5 text-text-low shrink-0 inline" />
      if (isFilePrefix) text = text.substring("Sent a file: ".length)
      else if (!lastMessage.content) text = "Photo"
    } else if (lastMessage.type === "VIDEO") {
      icon = <Video className="size-3.5 text-text-low shrink-0 inline" />
      if (isFilePrefix) text = text.substring("Sent a file: ".length)
      else if (!lastMessage.content) text = "Video"
    } else if (lastMessage.type === "AUDIO") {
      icon = <Mic className="size-3.5 text-text-low shrink-0 inline" />
      text = "Voice message"
    } else if (lastMessage.type === "FILE" || isFilePrefix) {
      icon = <File className="size-3.5 text-text-low shrink-0 inline" />
      if (isFilePrefix) text = text.substring("Sent a file: ".length)
      else if (!lastMessage.content) text = "Document"
    }

    return (
      <span className="flex items-center gap-1.5 min-w-0 truncate">
        {icon}
        <span className="truncate">{text}</span>
      </span>
    )
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
          <span
            className={cn(
              "truncate text-sm transition-colors duration-200",
              unreadCount > 0 ? "font-semibold text-text-high" : "font-medium text-text-high",
            )}
          >
            {otherParticipant?.name || otherParticipant?.email}
          </span>
          <span
            className={cn(
              "shrink-0 text-[10px] tabular-nums ml-auto transition-colors duration-200",
              unreadCount > 0 ? "text-brand font-semibold" : "text-text-low",
            )}
          >
            {lastMessage
              ? formatTimestamp(lastMessage.createdAt)
              : formatTimestamp(conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div
            className={cn(
              "flex flex-1 items-center gap-1.5 text-xs min-w-0 transition-colors duration-200",
              unreadCount > 0
                ? "font-medium text-text-high"
                : "text-text-low group-hover:text-text-medium",
            )}
          >
            {lastMessage && lastMessage.senderId === currentUserId && (
              <span className="shrink-0 inline-flex items-center">
                <MessageStatusIcon
                  status={
                    (lastMessage.status?.toLowerCase() ?? "sent") as
                      | "sending"
                      | "sent"
                      | "delivered"
                      | "read"
                  }
                />
              </span>
            )}
            {renderMessagePreview()}
          </div>

          {unreadCount > 0 && (
            <div className="flex shrink-0 min-w-[18px] h-[18px] items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              {unreadCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
