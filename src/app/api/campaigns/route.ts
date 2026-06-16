import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { campaigns } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { csrfGuard } from "@/lib/csrf"
import { sanitizeMessage } from "@/lib/sanitize"
import { generateId } from "@/lib/id"
import { getCampaignQueue } from "@/lib/campaign-queue"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.senderId, session.user.id))
    .orderBy(sql`${campaigns.createdAt} DESC`)

  return NextResponse.json(userCampaigns)
}

export async function POST(req: NextRequest) {
  const guard = csrfGuard(req)
  if (guard) return guard

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { content, recipientIds } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 })
  }

  if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
    return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 })
  }

  if (recipientIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Cannot send campaign to yourself" }, { status: 400 })
  }

  const sanitized = sanitizeMessage(content)
  const campaignId = generateId()

  // Create campaign record
  await db.insert(campaigns).values({
    id: campaignId,
    senderId: session.user.id,
    content: sanitized,
    recipientCount: recipientIds.length,
    status: "PENDING",
  })

  // Enqueue delivery job
  const queue = getCampaignQueue()
  if (queue) {
    await queue.add("deliver", {
      campaignId,
      senderId: session.user.id,
      content: sanitized,
      recipientIds,
    })
  } else {
    // Fallback: deliver synchronously if Redis is not available
    const { deliverCampaign } = await import("@/lib/deliver-campaign")
    await deliverCampaign({
      campaignId,
      senderId: session.user.id,
      content: sanitized,
      recipientIds,
    })
  }

  return NextResponse.json({
    id: campaignId,
    recipientCount: recipientIds.length,
    status: "PENDING",
  })
}
