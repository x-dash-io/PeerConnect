import { Redis } from "@upstash/redis"

// Upstash Redis for serverless-compatible operations
// (presence tracking, rate limiting, caching)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Presence helpers
export const presenceKeys = {
  user: (userId: string) => `presence:${userId}`,
}

export async function setUserOnline(userId: string): Promise<void> {
  await redis.set(
    presenceKeys.user(userId),
    {
      status: "online",
      lastSeen: new Date().toISOString(),
    },
    { ex: 300 },
  ) // 5 min TTL — refreshed by heartbeat
}

export async function setUserOffline(userId: string): Promise<void> {
  await redis.set(
    presenceKeys.user(userId),
    {
      status: "offline",
      lastSeen: new Date().toISOString(),
    },
    { ex: 86400 },
  ) // 24h TTL
}

export async function getUserPresence(userId: string) {
  return redis.get<{ status: "online" | "offline"; lastSeen: string }>(presenceKeys.user(userId))
}

export async function getBulkPresence(userIds: string[]) {
  if (userIds.length === 0) return {}
  const keys = userIds.map(presenceKeys.user)
  const values = await Promise.all(
    keys.map((k) => redis.get<{ status: string; lastSeen: string }>(k)),
  )
  return Object.fromEntries(userIds.map((id, i) => [id, values[i]]))
}
