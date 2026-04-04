import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { campaigns } from "@/lib/schema"
import { eq, desc } from "drizzle-orm"
import { redirect } from "next/navigation"
import { CampaignsDashboard } from "./CampaignsDashboard"

export default async function CampaignsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.senderId, session.user.id))
    .orderBy(desc(campaigns.createdAt))

  return <CampaignsDashboard initialCampaigns={userCampaigns} />
}
