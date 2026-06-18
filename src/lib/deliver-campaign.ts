import { db } from "@/lib/db"
import {
  campaigns,
  campaignRecipients,
  conversations,
  conversationParticipants,
  messages,
  users,
} from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { generateId } from "@/lib/id"
import { getIO } from "@/lib/socket-server"
import type { Message } from "@/types"

interface DeliverInput {
  campaignId: string
  senderId: string
  content: string
  recipientIds: string[]
}

export async function deliverCampaign(input: DeliverInput): Promise<{ deliveredCount: number }> {
  const { campaignId, senderId, content, recipientIds } = input
  let deliveredCount = 0

  for (const recipientId of recipientIds) {
    try {
      // Find or create direct conversation
      const existing = await db.execute<{ id: string }>(sql`
        SELECT c.id FROM conversations c
        INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ${senderId}
        INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ${recipientId}
        WHERE c.type = 'DIRECT'
        LIMIT 1
      `)

      let convId: string
      if (existing.rows.length > 0) {
        convId = existing.rows[0].id
      } else {
        convId = generateId()
        await db.insert(conversations).values({ id: convId, type: "DIRECT" })
        await db.insert(conversationParticipants).values([
          { conversationId: convId, userId: senderId },
          { conversationId: convId, userId: recipientId },
        ])
      }

      // Insert message
      const msgId = generateId()
      await db.insert(messages).values({
        id: msgId,
        conversationId: convId,
        senderId,
        content,
        type: "TEXT",
        status: "SENT",
      })

      // Link recipient
      await db.insert(campaignRecipients).values({
        id: generateId(),
        campaignId,
        recipientId,
        messageId: msgId,
        deliveredAt: new Date(),
      })

      deliveredCount++

      // Notify via Socket.io
      const io = getIO()
      if (io) {
        const [sender] = await db
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, senderId))
          .limit(1)

        const msg: Message = {
          id: msgId,
          conversationId: convId,
          senderId,
          content,
          type: "TEXT",
          status: "SENT",
          createdAt: new Date().toISOString(),
          senderName: sender?.name,
          senderImage: sender?.image,
        }

        io.to(`conversation:${convId}`).emit("message:received", msg)
        io.to(`user:${recipientId}`).emit("conversation:updated", {
          conversationId: convId,
          lastMessage: { id: msgId, content, createdAt: msg.createdAt },
        })
      }
    } catch (err) {
      console.error(`[CampaignDelivery] Failed to deliver to ${recipientId}:`, err)
      await db.insert(campaignRecipients).values({
        id: generateId(),
        campaignId,
        recipientId,
        error: String(err),
      })
    }
  }

  // Update campaign status
  await db
    .update(campaigns)
    .set({
      status: deliveredCount === recipientIds.length ? "COMPLETED" : "FAILED",
      deliveredCount,
    })
    .where(eq(campaigns.id, campaignId))

  return { deliveredCount }
}
