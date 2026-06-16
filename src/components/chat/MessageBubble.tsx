"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Reply, ChevronDown, ChevronUp, Pencil, Trash2, X, Check, Plus } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { Message } from "@/types"
import { MessageStatusIcon } from "@/components/shared/MessageStatusIcon"
import { FileAttachmentCard } from "./FileAttachmentCard"
import { ImagePreview } from "./ImagePreview"
import { VideoPlayer } from "./VideoPlayer"
import { AudioPlayer } from "./AudioPlayer"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { format } from "date-fns"

const COLLAPSED_CHAR_LIMIT = 400
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

interface MessageBubbleProps {
  message: Message
  isSelf: boolean
  isGrouped: boolean
  onReply?: (message: Message) => void
  onEdit?: (messageId: string, content: string) => void
  onDelete?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  onScrollToMessage?: (messageId: string) => void
  isHighlighted?: boolean
}

export function MessageBubble({
  message,
  isSelf,
  isGrouped,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onScrollToMessage,
  isHighlighted,
}: MessageBubbleProps) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content || "")
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const timestamp = format(new Date(message.createdAt), "HH:mm")
  const isLong = (message.content?.length ?? 0) > COLLAPSED_CHAR_LIMIT
  const isDeleted = message.isDeleted === "true"
  const messageStatus = message.status.toLowerCase() as "sending" | "sent" | "delivered" | "read"

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length,
      )
    }
  }, [isEditing])

  const handleSaveEdit = () => {
    const trimmed = editContent.trim()
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content || "")
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  const renderTextContent = (content: string | null) => {
    if (!content) return null

    let text = content
    if (isLong && !expanded) {
      text = content.slice(0, COLLAPSED_CHAR_LIMIT) + "..."
    }

    return <MarkdownRenderer content={text} isSelf={isSelf} />
  }

  const renderMessageContent = () => {
    if (isDeleted) {
      return <div className="italic text-neutral-400 text-xs">Message deleted</div>
    }

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
        "group flex w-full",
        isSelf ? "justify-end" : "justify-start",
        isGrouped ? "mb-1" : "mb-4",
        isHighlighted && "bg-indigo-500/5 rounded-lg -mx-2 px-2",
      )}
    >
      <div
        className={cn(
          "flex max-w-[65%] gap-3",
          isSelf ? "flex-row-reverse" : "flex-row",
          isSelf ? "items-end" : "items-start",
        )}
      >
        {/* Avatar — received only, first in group */}
        {!isSelf && !isGrouped && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {getInitials(message.senderName || "U")}
          </div>
        )}
        {!isSelf && isGrouped && <div className="size-8 shrink-0" />}

        <div className="flex flex-col min-w-0 max-w-full">
          {/* Sender name — received only, first in group */}
          {!isSelf && !isGrouped && (
            <span className="text-[10px] font-medium text-neutral-400 mb-0.5 ml-1">
              {message.senderName}
            </span>
          )}

          <div className="relative group/bubble">
            {/* Bubble */}
            <div
              className={cn(
                "px-4 py-2.5 text-sm/relaxed break-words",
                isSelf
                  ? "bg-indigo-500 dark:bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                  : "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl rounded-tl-sm border border-neutral-200 dark:border-neutral-700",
                isGrouped && isSelf && "rounded-br-sm rounded-tr-sm",
                !isGrouped && isSelf && "rounded-br-sm",
                isGrouped && !isSelf && "rounded-tl-sm rounded-bl-sm",
                !isGrouped && !isSelf && "rounded-tl-sm",
                isDeleted && "opacity-60",
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
                      : "bg-neutral-100 dark:bg-neutral-700 border-indigo-400 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600",
                  )}
                >
                  <span
                    className={cn(
                      "font-medium text-[10px] block",
                      isSelf ? "text-white/90" : "text-indigo-500",
                    )}
                  >
                    {message.replyTo.senderName}
                  </span>
                  <span className="line-clamp-1">{message.replyTo.content || "Attachment"}</span>
                </button>
              )}

              {isEditing ? (
                <div>
                  <textarea
                    ref={editInputRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "w-full bg-transparent resize-none outline-none text-sm/relaxed",
                      isSelf
                        ? "text-white placeholder-white/50"
                        : "text-neutral-900 dark:text-neutral-100",
                    )}
                    rows={2}
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className={cn(
                        "size-6 rounded flex items-center justify-center transition-colors",
                        isSelf
                          ? "hover:bg-white/20 text-white/70"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400",
                      )}
                    >
                      <X className="size-3.5" />
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className={cn(
                        "size-6 rounded flex items-center justify-center transition-colors",
                        isSelf
                          ? "hover:bg-white/20 text-white"
                          : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-500",
                      )}
                    >
                      <Check className="size-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {renderMessageContent()}

                  {/* Read more/less */}
                  {isLong && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className={cn(
                        "flex items-center gap-0.5 text-[11px] font-medium mt-1.5 transition-colors",
                        isSelf
                          ? "text-white/80 hover:text-white"
                          : "text-indigo-500 hover:text-indigo-600",
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
                </>
              )}
            </div>

            {/* Action buttons — on hover only */}
            {!isEditing && !isDeleted && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity",
                  isSelf ? "-left-14" : "-right-14",
                )}
              >
                {onReply && (
                  <button
                    onClick={() => onReply(message)}
                    className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <Reply className="size-3.5" />
                  </button>
                )}
                {isSelf && onEdit && (
                  <button
                    onClick={() => {
                      setEditContent(message.content || "")
                      setIsEditing(true)
                    }}
                    className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center transition-colors"
                  >
                    <Pencil className="size-3" />
                  </button>
                )}
                {isSelf && onDelete && (
                  <button
                    onClick={() => onDelete(message.id)}
                    className="size-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {!isDeleted && message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {groupReactions(message.reactions).map(({ emoji, count, hasMine }) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message.id, emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-all",
                    hasMine
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                      : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:bg-white hover:border-neutral-300",
                  )}
                >
                  <span>{emoji}</span>
                  <span className="tabular-nums">{count}</span>
                </button>
              ))}
              <QuickReactionPicker messageId={message.id} onReact={onReact} />
            </div>
          )}

          {!isDeleted && (!message.reactions || message.reactions.length === 0) && (
            <div className="flex mt-1">
              <QuickReactionPicker messageId={message.id} onReact={onReact} />
            </div>
          )}

          {/* Edited label — outside bubble */}
          {message.editedAt && !isDeleted && (
            <span className="text-[10px] text-neutral-400 italic mt-0.5">Edited</span>
          )}

          {/* Timestamp + status — below bubble */}
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5",
              isSelf ? "justify-end" : "justify-start",
            )}
          >
            {isSelf && !isDeleted && <MessageStatusIcon status={messageStatus} variant="default" />}
            <span className="text-[10px] text-neutral-400 tabular-nums">{timestamp}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function groupReactions(reactions: Message["reactions"]) {
  if (!reactions) return []
  const grouped = new Map<string, { emoji: string; count: number; hasMine: boolean }>()
  for (const r of reactions) {
    const existing = grouped.get(r.emoji) || { emoji: r.emoji, count: 0, hasMine: false }
    existing.count++
    grouped.set(r.emoji, existing)
  }
  return Array.from(grouped.values())
}

function QuickReactionPicker({
  messageId,
  onReact,
}: {
  messageId: string
  onReact?: (messageId: string, emoji: string) => void
}) {
  const [open, setOpen] = useState(false)

  if (!onReact) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center size-5 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-all text-xs"
      >
        <Plus className="size-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-0.5 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm z-10">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(messageId, emoji)
                setOpen(false)
              }}
              className="size-6 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
