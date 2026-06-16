"use client"

import { useMemo, useState } from "react"
import { useMessages, useEditMessage, useDeleteMessage } from "@/hooks/useMessages"
import { useToggleReaction } from "@/hooks/useMessageReactions"
import { ChatHeader } from "./ChatHeader"
import { MessageList } from "./MessageList"
import { MessageComposer } from "./MessageComposer"
import { Message, UserProfile, ReplyPreview } from "@/types"
import { useConversationRoom } from "@/hooks/useConversationRoom"
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages"
import { useTypingReceiver } from "@/hooks/useTypingReceiver"

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  initialParticipants: UserProfile[]
  lastReadAt: string | null
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialParticipants,
  lastReadAt,
}: ChatWindowProps) {
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversationId)
  const { mutate: editMessage } = useEditMessage(conversationId)
  const { mutate: deleteMessage } = useDeleteMessage(conversationId)
  const { mutate: toggleReaction } = useToggleReaction(conversationId)

  // Extracted socket hooks
  useConversationRoom(conversationId)
  useRealtimeMessages(conversationId, currentUserId)
  const isRecipientTyping = useTypingReceiver(conversationId, currentUserId)

  // Memoize flat messages list inverted for chronological order in the list
  const allMessages = useMemo(() => {
    if (!data) return []
    return data.pages.flatMap((page: { messages: Message[] }) => page.messages).reverse()
  }, [data])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChatHeader
        conversationId={conversationId}
        participants={initialParticipants}
        currentUserId={currentUserId}
      />

      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={allMessages}
          currentUserId={currentUserId}
          lastReadAt={lastReadAt}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isLoading}
          isRecipientTyping={isRecipientTyping}
          onReply={(msg) =>
            setReplyTo({ id: msg.id, content: msg.content, senderName: msg.senderName ?? null })
          }
          onEditMessage={(messageId, content) => editMessage({ messageId, content })}
          onDeleteMessage={(messageId) => deleteMessage(messageId)}
          onReact={(messageId, emoji) => toggleReaction({ messageId, emoji })}
        />
      </div>

      <MessageComposer
        conversationId={conversationId}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  )
}
