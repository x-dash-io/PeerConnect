export type FontSize = "small" | "medium" | "large"
export type BubbleTheme = "indigo" | "emerald" | "violet" | "rose" | "amber" | "sky"

export interface ChatPreferences {
  fontSize: FontSize
  bubbleTheme: BubbleTheme
  wallpaper: string | null
}

export const BUBBLE_THEMES: Record<
  BubbleTheme,
  { name: string; outgoing: string; incoming: string }
> = {
  indigo: {
    name: "Indigo",
    outgoing:
      "bg-indigo-500 dark:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
  emerald: {
    name: "Emerald",
    outgoing:
      "bg-emerald-500 dark:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 dark:shadow-emerald-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
  violet: {
    name: "Violet",
    outgoing:
      "bg-violet-500 dark:bg-violet-600 text-white shadow-md shadow-violet-500/20 dark:shadow-violet-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
  rose: {
    name: "Rose",
    outgoing:
      "bg-rose-500 dark:bg-rose-600 text-white shadow-md shadow-rose-500/20 dark:shadow-rose-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
  amber: {
    name: "Amber",
    outgoing:
      "bg-amber-500 dark:bg-amber-600 text-white shadow-md shadow-amber-500/20 dark:shadow-amber-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
  sky: {
    name: "Sky",
    outgoing:
      "bg-sky-500 dark:bg-sky-600 text-white shadow-md shadow-sky-500/20 dark:shadow-sky-900/30",
    incoming:
      "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/60 shadow-sm",
  },
}

export type UserRole = "PEER" | "BUSINESS" | "FREELANCER"
export type MessageType = "TEXT" | "AUDIO" | "FILE" | "IMAGE" | "VIDEO"
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ"
export type PresenceStatus = "online" | "away" | "offline"

export interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  bio: string | null
  presence?: PresenceStatus
}

export interface ReplyPreview {
  id: string
  content: string | null
  senderName: string | null
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender?: UserProfile
  senderName?: string | null
  senderImage?: string | null
  content: string | null
  type: MessageType
  status: MessageStatus
  replyToId?: string | null
  replyTo?: ReplyPreview | null
  file?: FileAttachment
  metadata?: Record<string, unknown> | null
  editedAt?: string | null
  isDeleted?: string
  reactions?: MessageReaction[]
  createdAt: string
  _tempId?: string
}

export interface FileAttachment {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  s3Key: string
  thumbnailS3Key?: string
}

export interface Conversation {
  id: string
  type: "DIRECT" | "CAMPAIGN"
  participants: UserProfile[]
  lastMessage?: Message
  unreadCount?: number
  createdAt: string
}

export interface SocketEvents {
  "user:join": (userId: string) => void
  "conversation:join": (conversationId: string) => void
  "conversation:leave": (conversationId: string) => void
  "message:send": (data: { conversationId: string; content: string; type: MessageType }) => void
  "message:received": (message: Message) => void
  "message:edited": (data: { conversationId: string; message: Message }) => void
  "message:deleted": (data: { conversationId: string; messageId: string }) => void
  "message:reaction:added": (data: { conversationId: string; reaction: MessageReaction }) => void
  "message:reaction:removed": (data: { conversationId: string; reactionId: string }) => void
  "message:status": (data: { messageId: string; status: MessageStatus }) => void
  "typing:start": (data: { conversationId: string; userId: string }) => void
  "typing:stop": (data: { conversationId: string; userId: string }) => void
  "presence:update": (data: { userId: string; status: PresenceStatus }) => void
}
