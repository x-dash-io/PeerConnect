import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const userRoleEnum = pgEnum("user_role", ["PEER", "BUSINESS", "FREELANCER"])
export const messageTypeEnum = pgEnum("message_type", ["TEXT", "AUDIO", "FILE", "IMAGE", "VIDEO"])
export const messageStatusEnum = pgEnum("message_status", ["SENDING", "SENT", "DELIVERED", "READ"])
export const uploadStatusEnum = pgEnum("upload_status", [
  "PENDING",
  "UPLOADING",
  "COMPLETE",
  "FAILED",
])
export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
])
export const conversationTypeEnum = pgEnum("conversation_type", ["DIRECT", "CAMPAIGN"])

// Users table (NextAuth compatible)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"), // bcrypt hashed, null for OAuth
  role: userRoleEnum("role").default("PEER").notNull(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// NextAuth tables
export const accounts = pgTable("accounts", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
})

// Conversations
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  type: conversationTypeEnum("type").default("DIRECT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Conversation participants (many-to-many)
export const conversationParticipants = pgTable("conversation_participants", {
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastReadAt: timestamp("last_read_at"),
})

// Messages
export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id),
    content: text("content"), // null for file-only messages
    type: messageTypeEnum("type").default("TEXT").notNull(),
    status: messageStatusEnum("status").default("SENT").notNull(),
    metadata: jsonb("metadata"), // for file references, audio duration, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(table.conversationId),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  }),
)

// Files (attached to messages)
export const files = pgTable("files", {
  id: text("id").primaryKey(),
  messageId: text("message_id").references(() => messages.id, { onDelete: "cascade" }),
  s3Key: text("s3_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadStatus: uploadStatusEnum("upload_status").default("PENDING").notNull(),
  uploadId: text("upload_id"), // S3 multipart upload ID
  thumbnailS3Key: text("thumbnail_s3_key"), // for images/videos
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Bulk message campaigns
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  recipientCount: integer("recipient_count").default(0).notNull(),
  deliveredCount: integer("delivered_count").default(0).notNull(),
  status: campaignStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Campaign individual recipients
export const campaignRecipients = pgTable("campaign_recipients", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  recipientId: text("recipient_id")
    .notNull()
    .references(() => users.id),
  messageId: text("message_id").references(() => messages.id),
  deliveredAt: timestamp("delivered_at"),
  error: text("error"),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  campaignsSent: many(campaigns),
  conversations: many(conversationParticipants),
}))

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}))

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  file: one(files, { fields: [messages.id], references: [files.messageId] }),
}))

export const filesRelations = relations(files, ({ one }) => ({
  message: one(messages, { fields: [files.messageId], references: [messages.id] }),
}))

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  sender: one(users, { fields: [campaigns.senderId], references: [users.id] }),
  recipients: many(campaignRecipients),
}))

export const campaignRecipientsRelations = relations(campaignRecipients, ({ one }) => ({
  campaign: one(campaigns, { fields: [campaignRecipients.campaignId], references: [campaigns.id] }),
  recipient: one(users, { fields: [campaignRecipients.recipientId], references: [users.id] }),
  message: one(messages, { fields: [campaignRecipients.messageId], references: [messages.id] }),
}))
