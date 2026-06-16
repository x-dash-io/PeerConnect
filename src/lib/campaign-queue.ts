import { Queue } from "bullmq"
import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL?.replace(/^["']|["']$/g, "")

let connection: IORedis | null = null
let _queue: Queue | null = null

export function getCampaignQueue(): Queue | null {
  if (redisUrl && !connection) {
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  if (connection && !_queue) {
    _queue = new Queue("campaign-delivery", {
      connection: connection as unknown as import("ioredis").Redis,
    })
  }
  return _queue
}

export async function closeCampaignQueue(): Promise<void> {
  await _queue?.close()
  await connection?.quit()
  _queue = null
  connection = null
}
