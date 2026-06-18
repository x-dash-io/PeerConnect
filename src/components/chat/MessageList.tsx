"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { MessageBubble } from "./MessageBubble"
import { DateSeparator } from "./DateSeparator"
import { SkeletonMessage } from "./ChatSkeletons"
import { Message } from "@/types"
import { isSameDay } from "date-fns"
import { Loader2, MessageCircle } from "lucide-react"
import { TypingIndicator } from "@/components/shared/TypingIndicator"
import { AnimatePresence, motion } from "framer-motion"
import { useChatPreferences } from "@/providers/ChatPreferencesProvider"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  lastReadAt?: string | null
  hasNextPage?: boolean
  fetchNextPage: () => void
  isFetchingNextPage: boolean
  isLoading: boolean
  isRecipientTyping?: boolean
  onReply?: (message: Message) => void
  onForward?: (message: Message) => void
  onEditMessage?: (messageId: string, content: string) => void
  onDeleteMessage?: (messageId: string, mode: "me" | "everyone") => void
  onReact?: (messageId: string, emoji: string) => void
}

interface RowData {
  type: "message"
  message: Message
  index: number
}

export function MessageList({
  messages,
  currentUserId,
  lastReadAt,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  isRecipientTyping,
  onReply,
  onForward,
  onEditMessage,
  onDeleteMessage,
  onReact,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessageToast, setShowNewMessageToast] = useState(false)
  const initialScrollDone = useRef(false)
  const lastKnownCount = useRef(messages.length)
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const rowData: RowData[] = messages.map((message, index) => ({
    type: "message" as const,
    message,
    index,
  }))

  const virtualizer = useVirtualizer({
    count: rowData.length + (isRecipientTyping ? 1 : 0),
    getScrollElement: () => containerRef.current,
    estimateSize: (index: number) => {
      if (index >= rowData.length) return 40
      const msg = rowData[index].message
      if (msg.isDeleted === true) return 72
      if (msg.type === "IMAGE" || msg.type === "VIDEO") return 220
      if (msg.file) return 150
      if (msg.replyTo) return 120
      if ((msg.content?.length ?? 0) > 400) return 100
      return 72
    },
    overscan: 10,
    measureElement: (element) => element.getBoundingClientRect().height,
  })

  const { fontSize } = useChatPreferences()

  const virtualItems = virtualizer.getVirtualItems()

  // Check if scrolled near bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setIsAtBottom(isNearBottom)
    if (isNearBottom) setShowNewMessageToast(false)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length === 0) return
    if (!initialScrollDone.current) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "auto" })
      initialScrollDone.current = true
      lastKnownCount.current = messages.length
    }
  }, [messages.length, virtualizer])

  // Auto-scroll on new messages when at bottom
  useEffect(() => {
    if (messages.length <= lastKnownCount.current) return
    lastKnownCount.current = messages.length

    if (isAtBottom) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "smooth" })
    } else {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.senderId !== currentUserId) {
        setShowNewMessageToast(true)
      }
    }
  }, [messages, messages.length, isAtBottom, currentUserId, virtualizer])

  // Load more when scrolling past the top
  const fetchNextPageStable = useCallback(() => fetchNextPage(), [fetchNextPage])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || virtualItems.length === 0) return
    const firstItem = virtualItems[0]
    if (firstItem.index < 3) {
      fetchNextPageStable()
    }
  }, [virtualItems, hasNextPage, isFetchingNextPage, fetchNextPageStable])

  // Clean up scroll interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
  }, [])

  // Scroll to specific message by id
  const scrollToMessage = useCallback(
    (messageId: string) => {
      const idx = messages.findIndex((m) => m.id === messageId)
      if (idx >= 0) {
        virtualizer.scrollToIndex(idx, { align: "center", behavior: "smooth" })
        setHighlightedId(messageId)
        setTimeout(() => setHighlightedId(null), 1500)
      } else if (hasNextPage && !isFetchingNextPage) {
        fetchNextPageStable()
        // Clear any previous interval before starting a new one
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current)
        }
        // Will retry once more data loads
        scrollIntervalRef.current = setInterval(() => {
          const newIdx = messagesRef.current.findIndex((m) => m.id === messageId)
          if (newIdx >= 0) {
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current)
              scrollIntervalRef.current = null
            }
            virtualizer.scrollToIndex(newIdx, { align: "center", behavior: "smooth" })
            setHighlightedId(messageId)
            setTimeout(() => setHighlightedId(null), 1500)
          }
          if (!hasNextPage) {
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current)
              scrollIntervalRef.current = null
            }
          }
        }, 200)
        setTimeout(() => {
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current)
            scrollIntervalRef.current = null
          }
        }, 10000)
      }
    },
    [messages, hasNextPage, isFetchingNextPage, fetchNextPageStable, virtualizer],
  )

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full justify-end px-6 py-4 gap-1 bg-bg-surface/70 dark:bg-bg-deep/70">
        <SkeletonMessage isSelf={false} />
        <SkeletonMessage isSelf={false} />
        <SkeletonMessage isSelf={true} />
        <SkeletonMessage isSelf={false} />
        <SkeletonMessage isSelf={true} />
        <SkeletonMessage isSelf={true} />
        <SkeletonMessage isSelf={false} />
        <SkeletonMessage isSelf={true} />
      </div>
    )
  }

  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center bg-bg-surface/60 dark:bg-bg-deep/60">
        <svg
          viewBox="0 0 56 56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-14 mb-5 text-neutral-300 dark:text-neutral-600"
        >
          <path d="M36 16H20c-2.2 0-4 1.8-4 4v10c0 2.2 1.8 4 4 4h2l4 4 4-4h6c2.2 0 4-1.8 4-4V20c0-2.2-1.8-4-4-4z" />
          <path d="M42 24c0-2.2-1.8-4-4-4h-2" />
          <path d="M12 27c0-2.2 1.8-4 4-4h1" />
        </svg>
        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-1">No messages yet</p>
        <p className="text-sm text-neutral-400">Send a message to start the conversation</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-font-size={fontSize}
      className="flex flex-col h-full overflow-y-auto px-6 py-4 scroll-smooth scrollbar-hide bg-bg-surface/70 dark:bg-bg-deep/70"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-4 animate-spin text-text-low" />
        </div>
      )}

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          if (virtualItem.index >= rowData.length) {
            // Typing indicator slot
            return (
              <div
                key="typing"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <AnimatePresence>
                  {isRecipientTyping && (
                    <motion.div
                      key="typing-indicator"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TypingIndicator />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          }

          const data = rowData[virtualItem.index]
          const message = data.message
          const prevMessage = virtualItem.index > 0 ? rowData[virtualItem.index - 1]?.message : null
          const isSelf = message.senderId === currentUserId || message.senderId === "__self__"

          const isGrouped =
            prevMessage !== null &&
            prevMessage.isDeleted === message.isDeleted &&
            prevMessage.senderId === message.senderId &&
            new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <
              5 * 60 * 1000

          const showDateSeparator =
            !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt))

          const showUnreadDivider =
            !isSelf &&
            lastReadAt &&
            new Date(message.createdAt) > new Date(lastReadAt) &&
            (!prevMessage || new Date(prevMessage.createdAt) <= new Date(lastReadAt))

          return (
            <div
              ref={virtualizer.measureElement}
              key={message._tempId || message.id}
              data-index={virtualItem.index}
              data-message-id={message.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {showDateSeparator && <DateSeparator date={message.createdAt} />}
              {showUnreadDivider && (
                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-indigo-500/30" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                    Unread Messages
                  </span>
                  <div className="h-px flex-1 bg-indigo-500/30" />
                </div>
              )}
              <MessageBubble
                message={message}
                isSelf={isSelf}
                isGrouped={isGrouped}
                onReply={onReply}
                onForward={onForward}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReact={onReact}
                onScrollToMessage={scrollToMessage}
                isHighlighted={highlightedId === message.id}
              />
            </div>
          )
        })}
      </div>

      {/* Live region for accessibility */}
      <div aria-live="polite" className="sr-only">
        {showNewMessageToast && "New message received"}
      </div>

      {/* Floating New Message Indicator */}
      <AnimatePresence>
        {showNewMessageToast && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => {
              virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "smooth" })
              setShowNewMessageToast(false)
            }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500 text-white shadow-sm hover:bg-indigo-600 transition-all duration-200 z-50 animate-bounce-once"
          >
            <MessageCircle className="size-4" />
            <span className="text-xs font-bold">New Message</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
