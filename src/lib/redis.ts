import { Redis } from "@upstash/redis"

const isUpstashConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// In-memory store for local development without Redis
interface MemoryEntry {
  value: string
  expiresAt: number | null
}

const memoryStore = new Map<string, MemoryEntry>()

function cleanExpired(): void {
  const now = Date.now()
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt !== null && now > entry.expiresAt) {
      memoryStore.delete(key)
    }
  }
}

// Upstash Redis for serverless-compatible operations
// (presence tracking, rate limiting, caching)
export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : // Mock redis client for local development
    ({
      set: async (key: string, value: string, opts?: { ex?: number }) => {
        cleanExpired()
        const expiresAt = opts?.ex ? Date.now() + opts.ex * 1000 : null
        memoryStore.set(key, {
          value: typeof value === "string" ? value : JSON.stringify(value),
          expiresAt,
        })
        return "OK"
      },
      get: async (key: string) => {
        cleanExpired()
        const entry = memoryStore.get(key)
        if (!entry) return null
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
          memoryStore.delete(key)
          return null
        }
        try {
          return JSON.parse(entry.value)
        } catch {
          return entry.value
        }
      },
      del: async (key: string) => (memoryStore.delete(key) ? 1 : 0),
    } as unknown as Redis)

if (!isUpstashConfigured) {
  console.warn(
    "[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Redis functionality is disabled.",
  )
}

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
