"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Reply, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Message } from "@/types"
import { UserAvatar } from "@/components/shared/UserAvatar"
import { MessageStatusIcon } from "@/components/shared/MessageStatusIcon"
import { FileAttachmentCard } from "./FileAttachmentCard"
import { ImagePreview } from "./ImagePreview"
import { VideoPlayer } from "./VideoPlayer"
import { AudioPlayer } from "./AudioPlayer"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { format } from "date-fns"

const COLLAPSED_CHAR_LIMIT = 400

interface MessageBubbleProps {
  message: Message
  isSelf: boolean
  isGrouped: boolean
  onReply?: (message: Message) => void
  onScrollToMessage?: (messageId: string) => void
  isHighlighted?: boolean
}

export function MessageBubble({
  message,
  isSelf,
  isGrouped,
  onReply,
  onScrollToMessage,
  isHighlighted,
}: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false)
  const timestamp = format(new Date(message.createdAt), "HH:mm")
  const isLong = (message.content?.length ?? 0) > COLLAPSED_CHAR_LIMIT

  const renderTextContent = (content: string | null) => {
    if (!content) return null

    let text = content
    if (isLong && !expanded) {
      text = content.slice(0, COLLAPSED_CHAR_LIMIT) + "..."
    }

    return <MarkdownRenderer content={text} isSelf={isSelf} />
  }

  const renderMessageContent = () => {
    switch (message.type) {
      case "IMAGE":
        return message.file ? (
          <ImagePreview file={message.file} />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {renderTextContent(message.content)}
          </div>
        )

      case "VIDEO":
        return message.file ? (
          <VideoPlayer file={message.file} isSelf={isSelf} />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {renderTextContent(message.content)}
          </div>
        )

      case "FILE":
        return message.file ? (
          <FileAttachmentCard file={message.file} isSelf={isSelf} />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {renderTextContent(message.content)}
          </div>
        )

      case "AUDIO":
        return message.file ? (
          <AudioPlayer
            s3Key={message.file.s3Key}
            messageId={message.id}
            duration={(message.metadata as { duration?: number } | null)?.duration ?? 0}
            initialTranscription={
              (message.metadata as { transcription?: string } | null)?.transcription ?? null
            }
            isSelf={isSelf}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {renderTextContent(message.content)}
          </div>
        )

      case "TEXT":
      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {renderTextContent(message.content)}
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group flex w-full rounded-2xl transition-colors duration-500",
        isSelf ? "justify-end" : "justify-start",
        isGrouped ? "mb-0.5" : "mb-0.5 mt-3",
        isHighlighted && "bg-brand/8",
      )}
    >
      <div
        className={cn(
          "flex max-w-[80%] sm:max-w-[65%] gap-2 items-end",
          isSelf ? "flex-row-reverse" : "flex-row",
        )}
      >
        {/* Avatar */}
        {!isSelf && (
          <div className="w-7 shrink-0">
            {!isGrouped && (
              <UserAvatar
                name={message.senderName || "User"}
                src={message.senderImage ?? undefined}
                size="sm"
                className="size-7"
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-0.5 min-w-0">
          {/* Sender name */}
          {!isSelf && !isGrouped && (
            <span className="text-[10px] font-semibold text-text-low ml-1 tracking-wide uppercase">
              {message.senderName}
            </span>
          )}

          {/* Bubble */}
          <div className="relative group/bubble">
            <div
              className={cn(
                "relative px-3.5 py-2.5 text-[13.5px] leading-relaxed",
                isSelf
                  ? "bg-gradient-to-br from-brand to-brand-hover text-white rounded-2xl rounded-br-lg shadow-md shadow-brand/10"
                  : "bg-bg-surface text-text-high rounded-2xl rounded-tl-lg border border-border-subtle surface-glow",
                isGrouped && isSelf && "rounded-tr-2xl",
                isGrouped && !isSelf && "rounded-tl-lg",
              )}
            >
              {/* Reply preview */}
              {message.replyTo && (
                <button
                  type="button"
                  onClick={() => message.replyTo?.id && onScrollToMessage?.(message.replyTo.id)}
                  className={cn(
                    "mb-2 rounded-lg px-2.5 py-1.5 border-l-2 text-xs text-left w-full transition-colors cursor-pointer",
                    isSelf
                      ? "bg-white/10 border-white/40 text-white/80 hover:bg-white/15"
                      : "bg-bg-muted border-brand/60 text-text-medium hover:bg-bg-elevated",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold text-[10px] block",
                      isSelf ? "text-white/90" : "text-brand",
                    )}
                  >
                    {message.replyTo.senderName}
                  </span>
                  <span className="line-clamp-1">{message.replyTo.content || "Attachment"}</span>
                </button>
              )}

              {renderMessageContent()}

              {/* Read more/less */}
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold mt-1.5 transition-colors",
                    isSelf ? "text-white/80 hover:text-white" : "text-brand hover:text-brand-hover",
                  )}
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              )}

              {/* Timestamp + status */}
              <div className="flex items-center gap-1.5 mt-1.5 select-none justify-end">
                <span
                  className={cn(
                    "text-[10px] tabular-nums",
                    isSelf ? "text-white/50" : "text-text-low",
                  )}
                >
                  {timestamp}
                </span>
                {isSelf && (
                  <MessageStatusIcon
                    status={
                      message.status.toLowerCase() as "sending" | "sent" | "delivered" | "read"
                    }
                    variant={isSelf ? "light" : "default"}
                  />
                )}
              </div>
            </div>

            {/* Reply action */}
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 size-7 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-all opacity-0 group-hover/bubble:opacity-100 shadow-md",
                  isSelf ? "-left-9" : "-right-9",
                )}
              >
                <Reply className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
