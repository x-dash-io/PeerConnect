"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { MessageBubble } from "./MessageBubble"
import { DateSeparator } from "./DateSeparator"
import { SkeletonMessage } from "./ChatSkeletons"
import { Message } from "@/types"
import { isSameDay } from "date-fns"
import { Loader2, MessageSquarePlus } from "lucide-react"
import { TypingIndicator } from "@/components/shared/TypingIndicator"
import { AnimatePresence, motion } from "framer-motion"

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
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const pendingScrollRef = useRef<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessageToast, setShowNewMessageToast] = useState(false)
  const lastKnownMessageCount = useRef(messages.length)
  const initialScrollDone = useRef(false)

  // Track scroll position to know if we are at the bottom
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    setIsAtBottom(isNearBottom)

    if (isNearBottom) {
      setShowNewMessageToast(false)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Auto-scroll to bottom on initial load and when new messages arrive while at bottom
  useEffect(() => {
    if (messages.length === 0) return

    if (!initialScrollDone.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" })
      initialScrollDone.current = true
      lastKnownMessageCount.current = messages.length
      return
    }

    if (messages.length > lastKnownMessageCount.current) {
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      } else {
        // Show indicator if new messages arrive from others while user is scrolled up
        const lastMsg = messages[messages.length - 1]
        if (lastMsg?.senderId !== currentUserId) {
          setTimeout(() => setShowNewMessageToast(true), 0)
        }
      }
      lastKnownMessageCount.current = messages.length
    }
  }, [messages, isAtBottom, currentUserId])

  // Scroll to a specific message by id, with highlight flash
  const scrollToMessage = useCallback(
    (messageId: string) => {
      const container = containerRef.current
      if (!container) return

      const el = container.querySelector(`[data-message-id="${messageId}"]`)
      if (el) {
        pendingScrollRef.current = null
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightedId(messageId)
        setTimeout(() => setHighlightedId(null), 1500)
      } else if (hasNextPage && !isFetchingNextPage) {
        // Message not in DOM yet — load more pages and retry
        pendingScrollRef.current = messageId
        fetchNextPage()
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  // When new pages load, retry scrolling to pending message
  useEffect(() => {
    const pending = pendingScrollRef.current
    if (!pending || isFetchingNextPage) return

    // Small delay to let DOM render new messages
    const timer = setTimeout(() => {
      const container = containerRef.current
      if (!container) return
      const el = container.querySelector(`[data-message-id="${pending}"]`)
      if (el) {
        pendingScrollRef.current = null
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightedId(pending)
        setTimeout(() => setHighlightedId(null), 1500)
      } else if (hasNextPage) {
        fetchNextPage()
      } else {
        // All pages loaded and message not found — give up
        pendingScrollRef.current = null
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [messages.length, isFetchingNextPage, hasNextPage, fetchNextPage])

  // IntersectionObserver to auto-load older messages when scrolling to top
  const fetchNextPageStable = useCallback(() => {
    fetchNextPage()
  }, [fetchNextPage])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const sentinel = topSentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchNextPageStable()
        }
      },
      { root: containerRef.current, rootMargin: "200px 0px 0px 0px" },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPageStable])

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full justify-end px-4 md:px-6 py-6 gap-1 bg-bg-deep">
        {/* Alternating self/other skeletons to mimic a real chat */}
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
      <div className="flex h-full flex-col items-center justify-center bg-bg-deep px-4 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-bg-muted">
          <MessageSquarePlus className="size-6 text-text-low" />
        </div>
        <p className="text-sm font-medium text-text-medium mb-1">No messages yet</p>
        <p className="text-xs text-text-low">Send a message to start the conversation</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full overflow-y-auto px-4 md:px-6 py-6 scroll-smooth scrollbar-hide bg-bg-deep"
    >
      {/* Sentinel for auto-loading older messages */}
      <div ref={topSentinelRef} className="h-1 w-full shrink-0" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-4 animate-spin text-text-low" />
        </div>
      )}

      {messages.map((message, index) => {
        const prevMessage = messages[index - 1]
        const isSelf = message.senderId === currentUserId || message.senderId === "__self__"

        // Grouping: same sender AND less than 5 mins apart
        const isGrouped =
          prevMessage?.senderId === message.senderId &&
          new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <
            5 * 60 * 1000

        // Date separator: different day from previous message
        const showDateSeparator =
          !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt))

        // Unread divider: first message after lastReadAt, only for OTHER users
        const showUnreadDivider =
          !isSelf &&
          lastReadAt &&
          new Date(message.createdAt) > new Date(lastReadAt) &&
          (!prevMessage || new Date(prevMessage.createdAt) <= new Date(lastReadAt))

        return (
          <div
            key={(message as Message & { _tempId?: string })._tempId || message.id}
            data-message-id={message.id}
          >
            {showDateSeparator && <DateSeparator date={message.createdAt} />}
            {showUnreadDivider && (
              <div className="flex items-center gap-4 my-6">
                <div className="h-px flex-1 bg-brand/30" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
                  Unread Messages
                </span>
                <div className="h-px flex-1 bg-brand/30" />
              </div>
            )}
            <MessageBubble
              message={message}
              isSelf={isSelf}
              isGrouped={isGrouped}
              onReply={onReply}
              onScrollToMessage={scrollToMessage}
              isHighlighted={highlightedId === message.id}
            />
          </div>
        )
      })}

      <AnimatePresence>
        {isRecipientTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="ml-10 mt-2"
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-4 w-full shrink-0" />

      {/* Floating New Message Indicator */}
      <AnimatePresence>
        {showNewMessageToast && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors z-50 animate-bounce"
          >
            <MessageSquarePlus className="size-4" />
            <span className="text-xs font-bold">New Message</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
