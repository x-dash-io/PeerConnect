import { redis } from "./redis"

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

const defaults: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
}

const authLimit: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 900, // 15 min
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig = defaults,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - config.windowSeconds
  const redisKey = `ratelimit:${key}`

  try {
    const result = await redis
      .multi()
      .zremrangebyscore(redisKey, 0, windowStart)
      .zcard(redisKey)
      .zadd(redisKey, { score: now, member: `${now}-${Math.random()}` })
      .expire(redisKey, config.windowSeconds)
      .exec()

    const count = (result?.[1] as number | undefined) ?? 0
    const allowed = count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count - 1)
    const oldest = await redis.zrange(redisKey, 0, 0, { withScores: true })
    const resetIn =
      oldest.length >= 2
        ? Math.max(0, config.windowSeconds - (now - Math.floor(oldest[1] as number)))
        : 0

    return { allowed, remaining, resetIn }
  } catch {
    // If Redis fails, allow the request through
    return { allowed: true, remaining: config.maxRequests, resetIn: 0 }
  }
}

export function rateLimitAuth(key: string) {
  return rateLimit(`auth:${key}`, authLimit)
}

const messageLimit: RateLimitConfig = {
  maxRequests: 30,
  windowSeconds: 60,
}

export function rateLimitMessages(key: string) {
  return rateLimit(`msg:${key}`, messageLimit)
}
