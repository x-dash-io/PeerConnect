import { Worker } from "bullmq"
import IORedis from "ioredis"
import { deliverCampaign } from "@/lib/deliver-campaign"

interface CampaignJob {
  campaignId: string
  senderId: string
  content: string
  recipientIds: string[]
}

let _worker: Worker | null = null

export function startCampaignWorker(redisUrl: string): void {
  if (_worker) return

  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })

  _worker = new Worker<CampaignJob>(
    "campaign-delivery",
    async (job) => {
      const result = await deliverCampaign(job.data)
      return result
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { connection: connection as any, concurrency: 5 },
  )

  _worker.on("error", (err) => {
    console.error("[CampaignWorker] Error:", err)
  })

  _worker.on("completed", (job) => {
    console.log(`[CampaignWorker] Job ${job.id} completed:`, job.returnvalue)
  })

  _worker.on("failed", (job, err) => {
    console.error(`[CampaignWorker] Job ${job?.id} failed:`, err)
  })

  console.log("[CampaignWorker] Started")
}

export async function stopCampaignWorker(): Promise<void> {
  await _worker?.close()
  _worker = null
}
