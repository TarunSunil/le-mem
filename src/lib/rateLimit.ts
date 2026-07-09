import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REQUEST_LIMIT = 30;
const WINDOW_MS = 60_000;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    limiter = null;
    return limiter;
  }

  try {
    const redis = Redis.fromEnv();
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(REQUEST_LIMIT, `${WINDOW_MS} ms`),
      analytics: true,
    });
  } catch (error) {
    console.warn("Rate limiter unavailable, falling back open:", error);
    limiter = null;
  }

  return limiter;
}

export async function checkRateLimit(key: string): Promise<boolean> {
  const current = getLimiter();
  if (!current) {
    return true;
  }

  try {
    const result = await current.limit(key);
    return result.success;
  } catch (error) {
    console.warn("Rate limiter error, falling back open:", error);
    return true;
  }
}
