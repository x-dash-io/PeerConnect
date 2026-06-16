"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Reply, ChevronDown, ChevronUp, Pencil, Trash2, X, Check, Plus } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { Message } from "@/types"
import { MessageStatusIcon } from "@/components/shared/MessageStatusIcon"
import { useChatPreferences } from "@/providers/ChatPreferencesProvider"
import { BUBBLE_THEMES } from "@/types"
import { FileAttachmentCard } from "./FileAttachmentCard"
import { ImagePreview } from "./ImagePreview"
import { VideoPlayer } from "./VideoPlayer"
import { AudioPlayer } from "./AudioPlayer"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { format } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const timestamp = format(new Date(message.createdAt), "HH:mm")
  const isLong = (message.content?.length ?? 0) > COLLAPSED_CHAR_LIMIT
  const isDeleted = message.isDeleted === "true"
  const effectivelyGrouped = isGrouped && !isDeleted
  const messageStatus = (message.status?.toLowerCase() ?? "sent") as
    | "sending"
    | "sent"
    | "delivered"
    | "read"
  const { bubbleTheme } = useChatPreferences()

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

  if (isDeleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex w-full justify-center mb-1"
      >
        <div className="flex items-center gap-2 max-w-[240px] w-full px-2 select-none">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          <span className="text-[10px] text-neutral-400 italic whitespace-nowrap">
            Message deleted
          </span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </motion.div>
    )
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
        effectivelyGrouped ? "mb-1" : "mb-4",
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
        {!isSelf && !effectivelyGrouped && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {getInitials(message.senderName || "U")}
          </div>
        )}
        {!isSelf && effectivelyGrouped && <div className="size-8 shrink-0" />}

        <div className="flex flex-col min-w-0 max-w-full">
          {/* Sender name — received only, first in group */}
          {!isSelf && !effectivelyGrouped && (
            <span className="text-[10px] font-medium text-neutral-400 mb-1.5 ml-1.5">
              {message.senderName}
            </span>
          )}

          <div className="relative group/bubble">
            {/* Bubble */}
            <div
              className={cn(
                "px-5 py-3 msg-text break-words transition-all",
                isSelf
                  ? (BUBBLE_THEMES[bubbleTheme]?.outgoing ?? BUBBLE_THEMES.indigo.outgoing) +
                      " rounded-3xl rounded-br-md"
                  : (BUBBLE_THEMES[bubbleTheme]?.incoming ?? BUBBLE_THEMES.indigo.incoming) +
                      " rounded-3xl rounded-tl-md",
                effectivelyGrouped && isSelf && "rounded-br-md rounded-tr-md",
                !effectivelyGrouped && isSelf && "rounded-br-md",
                effectivelyGrouped && !isSelf && "rounded-tl-md rounded-bl-md",
                !effectivelyGrouped && !isSelf && "rounded-tl-md",
              )}
            >
              {/* Reply preview */}
              {message.replyTo && (
                <button
                  type="button"
                  onClick={() => message.replyTo?.id && onScrollToMessage?.(message.replyTo.id)}
                  className={cn(
                    "mb-3 rounded-xl px-3 py-2.5 border-l-2.5 text-xs text-left w-full transition-colors cursor-pointer",
                    isSelf
                      ? "bg-white/15 border-white/50 text-white/85 hover:bg-white/20"
                      : "bg-neutral-100/60 dark:bg-neutral-700/70 border-indigo-400/70 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700",
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold text-[10px] block mb-0.5",
                      isSelf ? "text-white/95" : "text-indigo-600 dark:text-indigo-400",
                    )}
                  >
                    {message.replyTo.senderName}
                  </span>
                  <span className="line-clamp-1 text-opacity-80">
                    {message.replyTo.content || "Attachment"}
                  </span>
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
                      aria-label="Cancel edit"
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
                      aria-label="Save edit"
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
                      aria-label={expanded ? "Show less" : "Read more"}
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-semibold mt-2 transition-colors",
                        isSelf
                          ? "text-white/70 hover:text-white"
                          : "text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400",
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

                  {/* Timestamp + status — inside bubble */}
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1.5 mt-2.5 pt-1.5",
                      isSelf && "border-t border-white/10",
                      !isSelf && "border-t border-neutral-200/50 dark:border-neutral-700/30",
                    )}
                  >
                    {isSelf && <MessageStatusIcon status={messageStatus} variant="inline" />}
                    <span
                      className={cn(
                        "text-[10px] tabular-nums leading-none whitespace-nowrap font-medium",
                        isSelf ? "text-white/65" : "text-neutral-400 dark:text-neutral-500",
                      )}
                    >
                      {timestamp}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Action trigger — appears on hover */}
            {!isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Message actions"
                  className={cn(
                    "absolute top-1 max-sm:opacity-100 sm:opacity-0 sm:group-hover/bubble:opacity-100",
                    "transition-opacity size-7 rounded-full flex items-center",
                    "justify-center bg-neutral-100 dark:bg-neutral-700",
                    "text-neutral-500 hover:text-neutral-800 shadow-sm",
                    isSelf ? "-left-2" : "-right-2",
                  )}
                >
                  <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isSelf ? "start" : "end"} className="w-44 rounded-xl">
                  {onReply && (
                    <DropdownMenuItem className="gap-2 text-sm" onClick={() => onReply(message)}>
                      <Reply className="size-4" /> Reply
                    </DropdownMenuItem>
                  )}
                  {isSelf && onEdit && (
                    <DropdownMenuItem
                      className="gap-2 text-sm"
                      onClick={() => {
                        setEditContent(message.content || "")
                        setIsEditing(true)
                      }}
                    >
                      <Pencil className="size-4" /> Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {isSelf && onDelete && (
                    <DropdownMenuItem
                      className="gap-2 text-sm text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {groupReactions(message.reactions).map(({ emoji, count, hasMine }) => (
                <button
                  key={emoji}
                  aria-label={`React with ${emoji}`}
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

          {(!message.reactions || message.reactions.length === 0) && (
            <div className="flex mt-1">
              <QuickReactionPicker messageId={message.id} onReact={onReact} />
            </div>
          )}

          {/* Edited label — outside bubble */}
          {message.editedAt && (
            <span className="text-[10px] text-neutral-400 italic mt-0.5">Edited</span>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete message?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-neutral-500">
              This message will be permanently deleted and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl h-9 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(message.id)
                setShowDeleteConfirm(false)
              }}
              className="rounded-xl h-9 text-sm bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <div className="relative inline-flex">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Add reaction"
        className="inline-flex items-center justify-center size-6 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-all text-xs"
      >
        <Plus className="size-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 flex gap-0.5 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-md z-20 whitespace-nowrap">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              aria-label={`React with ${emoji}`}
              onClick={() => {
                onReact(messageId, emoji)
                setOpen(false)
              }}
              className="size-7 flex items-center justify-center rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
