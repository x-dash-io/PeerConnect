"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Send, Smile, Loader2, X, Reply, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  useEffect(() => {
    if (replyTo) richInputRef.current?.focus()
  }, [replyTo])

  return (
    <div className="shrink-0 border-t border-border-subtle glass-heavy">
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
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-subtle bg-brand-subtle/30">
              <Reply className="size-4 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-brand">{replyTo.senderName}</span>
                <p className="text-xs text-text-medium truncate">
                  {replyTo.content || "Attachment"}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="size-6 rounded-full flex items-center justify-center text-text-low hover:text-text-high hover:bg-bg-muted transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 p-3 md:p-4">
        <FileUploadButton onFileSelect={handleFileSelect} disabled={isUploading || isPending} />

        <div className="relative flex-1">
          {isPreview && content.trim() ? (
            <div
              className="w-full bg-bg-deep rounded-xl px-4 py-2.5 text-sm text-text-high border border-brand/40 overflow-y-auto scrollbar-hide leading-relaxed pr-[4.5rem]"
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
              className="pr-[4.5rem]"
            />
          )}
          <div className="absolute right-1.5 bottom-0 flex items-center" style={{ height: 44 }}>
            {content.trim() && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsPreview((prev) => !prev)}
                className="text-text-low hover:text-text-medium rounded-lg"
                title="Toggle preview (Cmd+Shift+P)"
              >
                {isPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            )}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setIsEmojiOpen((prev) => !prev)}
                className="text-text-low hover:text-text-medium rounded-lg"
              >
                <Smile className="size-4" />
              </Button>
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
          <Button
            onClick={handleSend}
            disabled={isPending}
            size="icon"
            className="mb-0.5 bg-brand hover:bg-brand-hover text-white rounded-xl shadow-lg glow-brand-sm transition-all active:scale-95 shrink-0"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        ) : (
          <AudioRecordButton onSend={handleAudioSend} disabled={isUploading || isPending} />
        )}
      </div>
    </div>
  )
}
