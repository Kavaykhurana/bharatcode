/**
 * Fixed-window in-memory rate limiter. Good enough for a single serverless
 * instance; swap for Upstash/Redis if Haq ever needs global limits.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;

export function rateLimit(key: string, limit = Number(process.env.RATE_LIMIT_PER_MINUTE) || 20): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count++;
  if (bucket.count > limit) return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function clientKey(headers: Headers): string {
  return headers.get("cf-connecting-ip") || headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "anonymous";
}
