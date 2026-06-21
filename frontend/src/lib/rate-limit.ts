import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;

function getLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(600, "1 m"),
      analytics: true,
      prefix: "repopulse:ingest",
    });
  }

  return limiter;
}

export async function checkIngestionRateLimit(identifier: string) {
  const rateLimiter = getLimiter();
  if (!rateLimiter) return { success: true, limit: 600, remaining: 600, reset: 0 };
  return rateLimiter.limit(identifier);
}
