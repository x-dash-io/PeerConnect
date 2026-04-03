"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Send, Smile, Loader2, X, Reply } from "lucide-react"
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
import { uploadFile } from "@/lib/uploader"
import { toast } from "sonner"

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<File | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

      // Send the message automatically after upload
      sendMessage({
        content: `Sent a file: ${file.name}`,
        fileId: result.fileId,
        type: getMessageType(file.type),
        replyToId: replyTo?.id,
      })

      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("[Upload] Failed:", error)
      toast.error("Fixed upload failed. Please try again.")
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

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px"
  }, [])

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

    // Reset the stop timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_TIMEOUT_MS)
  }, [socket, conversationId, currentUserId, stopTyping])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      stopTyping()
    }
  }, [stopTyping])

  const handleSend = () => {
    const trimmed = content.trim()
    if (!trimmed || isPending) return

    stopTyping()
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    sendMessage({ content: trimmed, replyToId: replyTo?.id })
    setContent("")
    onCancelReply?.()

    // Reset textarea height
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    })
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    adjustHeight()
    if (e.target.value.trim()) {
      startTyping()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Focus the textarea when reply is set
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  return (
    <div className="shrink-0 bg-bg-surface border-t border-border-subtle glass">
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
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle">
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
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            className="w-full resize-none bg-bg-deep rounded-xl px-4 py-2.5 text-sm text-text-high outline-none border border-border-main focus:border-brand transition-colors pr-10 scrollbar-hide leading-relaxed"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute right-1.5 bottom-1.5 text-text-low hover:text-text-medium"
          >
            <Smile className="size-4" />
          </Button>
        </div>

        {content.trim() ? (
          <Button
            onClick={handleSend}
            disabled={isPending}
            size="icon"
            className="mb-0.5 bg-brand hover:bg-brand-hover text-white rounded-xl shadow-lg transition-all active:scale-95 shrink-0"
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
