"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Send, Smile, Loader2, X, Reply, Eye, EyeOff, Sparkles } from "lucide-react"
import { useSendMessage } from "@/hooks/useMessages"
import { useSocket } from "@/providers/SocketProvider"
import {
  TYPING_TIMEOUT_MS,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
  SUPPORTED_AUDIO_TYPES,
} from "@/lib/constants"
import { MessageType, ReplyPreview } from "@/types"
import { AnimatePresence, motion } from "framer-motion"
import { FileUploadButton } from "./FileUploadButton"
import { UploadProgress } from "./UploadProgress"
import { AudioRecordButton } from "./AudioRecordButton"
import { RichTextInput, type RichTextInputHandle } from "./RichTextInput"
import { uploadFile } from "@/lib/uploader"
import { toast } from "sonner"
import { MarkdownRenderer } from "./MarkdownRenderer"
import { EmojiPicker } from "./EmojiPicker"
import type { TelegramEmoji } from "@/lib/telegram-emojis"

interface MessageComposerProps {
  conversationId: string
  currentUserId: string
  replyTo?: ReplyPreview | null
  onCancelReply?: () => void
}

export function MessageComposer({
  conversationId,
  currentUserId,
  replyTo,
  onCancelReply,
}: MessageComposerProps) {
  const [content, setContent] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [isPolishing, setIsPolishing] = useState(false)

  const richInputRef = useRef<RichTextInputHandle>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const socket = useSocket()
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId)

  const getMessageType = (mimeType: string): MessageType => {
    if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return "IMAGE"
    if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return "VIDEO"
    if (SUPPORTED_AUDIO_TYPES.includes(mimeType)) return "AUDIO"
    return "FILE"
  }

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setCurrentFile(file)
    try {
      const result = await uploadFile(file, null, (progress) => {
        setUploadProgress(progress.percentage)
      })
      sendMessage({
        content: `Sent a file: ${file.name}`,
        fileId: result.fileId,
        type: getMessageType(file.type),
        replyToId: replyTo?.id,
      })
      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("[Upload] Failed:", error)
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentFile(null)
    }
  }

  const handleCancelUpload = async () => {
    setIsUploading(false)
    setCurrentFile(null)
    setUploadProgress(0)
    toast.info("Upload cancelled")
  }

  const handleAudioSend = (fileId: string, key: string, duration: number) => {
    sendMessage({
      content: `Voice message (${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")})`,
      fileId,
      type: "AUDIO",
      replyToId: replyTo?.id,
      metadata: { duration },
    })
    onCancelReply?.()
  }

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current || !socket) return
    isTypingRef.current = false
    socket.emit("typing:stop", { conversationId, userId: currentUserId })
  }, [socket, conversationId, currentUserId])

  const startTyping = useCallback(() => {
    if (!socket) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("typing:start", { conversationId, userId: currentUserId })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS)
  }, [socket, conversationId, currentUserId, stopTyping])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      stopTyping()
    }
  }, [stopTyping])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    stopTyping()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    sendMessage({ content: trimmed, replyToId: replyTo?.id })
    richInputRef.current?.clear()
    setIsPreview(false)
    onCancelReply?.()
  }, [content, isPending, stopTyping, sendMessage, replyTo, onCancelReply])

  const handleRichInputChange = useCallback(
    (markdown: string) => {
      setContent(markdown)
      if (markdown.trim()) startTyping()
    },
    [startTyping],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === "p" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsPreview((prev) => !prev)
      }
    },
    [handleSend],
  )

  const handleEmojiSelect = useCallback((emoji: TelegramEmoji) => {
    richInputRef.current?.insertEmoji(emoji)
    setIsEmojiOpen(false)
  }, [])

  const handlePolish = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || isPolishing) return

    setIsPolishing(true)
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        toast.error(error || "Failed to polish message")
        return
      }

      const { polished } = await res.json()
      setContent(polished)
      richInputRef.current?.setValue(polished)
    } catch {
      toast.error("Failed to polish message")
    } finally {
      setIsPolishing(false)
    }
  }, [content, isPolishing])

  useEffect(() => {
    if (replyTo) richInputRef.current?.focus()
  }, [replyTo])

  return (
    <div className="shrink-0 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3">
      {/* Upload progress */}
      <AnimatePresence>
        {isUploading && currentFile && (
          <UploadProgress
            filename={currentFile.name}
            sizeBytes={currentFile.size}
            percentage={uploadProgress}
            onCancel={handleCancelUpload}
          />
        )}
      </AnimatePresence>

      {/* Reply banner */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-700 bg-indigo-50/50 dark:bg-indigo-950/30 mb-2">
              <Reply className="size-4 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-indigo-500">{replyTo.senderName}</span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {replyTo.content || "Attachment"}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="size-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 dark:focus-within:border-indigo-500 transition-all">
        <div className="flex items-end gap-2 px-4 py-3">
          <FileUploadButton onFileSelect={handleFileSelect} disabled={isUploading || isPending} />

          <div className="relative flex-1">
            {isPreview && content.trim() ? (
              <div
                className="w-full rounded-xl px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 border border-indigo-300 overflow-y-auto scrollbar-hide leading-relaxed pr-10"
                style={{ minHeight: 44, maxHeight: 120 }}
              >
                <MarkdownRenderer content={content} />
              </div>
            ) : (
              <RichTextInput
                ref={richInputRef}
                onChange={handleRichInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                className="border-0 bg-transparent focus:ring-0 px-3 py-2.5 pr-10"
              />
            )}
            <div className="absolute right-1 bottom-0 flex items-center" style={{ height: 44 }}>
              {content.trim() && !isPolishing && (
                <button
                  onClick={handlePolish}
                  className="size-7 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  title="Polish with AI"
                >
                  <Sparkles className="size-4" />
                </button>
              )}
              {isPolishing && (
                <div className="size-7 flex items-center justify-center">
                  <Loader2 className="size-3.5 animate-spin text-indigo-500" />
                </div>
              )}
              {content.trim() && (
                <button
                  onClick={() => setIsPreview((prev) => !prev)}
                  className="size-7 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  title="Toggle preview (Cmd+Shift+P)"
                >
                  {isPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setIsEmojiOpen((prev) => !prev)}
                  className="size-7 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Smile className="size-5" />
                </button>
                <EmojiPicker
                  key={String(isEmojiOpen)}
                  open={isEmojiOpen}
                  onClose={() => setIsEmojiOpen(false)}
                  onSelect={handleEmojiSelect}
                />
              </div>
            </div>
          </div>

          {content.trim() ? (
            <button
              onClick={handleSend}
              disabled={isPending}
              className="rounded-full p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shrink-0 flex items-center justify-center"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          ) : (
            <AudioRecordButton onSend={handleAudioSend} disabled={isUploading || isPending} />
          )}
        </div>
      </div>
    </div>
  )
}
