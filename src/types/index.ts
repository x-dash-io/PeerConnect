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
  createdAt: string
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
  "message:status": (data: { messageId: string; status: MessageStatus }) => void
  "typing:start": (data: { conversationId: string; userId: string }) => void
  "typing:stop": (data: { conversationId: string; userId: string }) => void
  "presence:update": (data: { userId: string; status: PresenceStatus }) => void
}
