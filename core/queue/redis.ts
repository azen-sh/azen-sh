const redisUrl = process.env.REDIS_URL
if (!redisUrl) throw new Error("REDIS_URL is required")

const parsed = new URL(redisUrl)

export const redisConnection = {
  host: parsed.hostname,
  port: Number(parsed.port) || 6379,
  maxRetriesPerRequest: null,
}
