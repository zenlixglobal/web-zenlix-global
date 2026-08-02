import "server-only";

type Bucket = { count: number; resetAt: number };

/**
 * In-memory fixed-window limiter.
 *
 * Good enough to stop casual form spam on a single long-lived server. On
 * serverless each instance keeps its own counters, so if you scale out or
 * expect real abuse, swap the store for Upstash Redis — the call signature
 * below is deliberately the same shape.
 */
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneExpired(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Keeps the map from growing without bound on a long-running server. */
function pruneExpired(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Best-effort client IP. `x-forwarded-for` is set by Vercel and most proxies;
 * it is spoofable when the app is exposed directly, so treat this as a spam
 * control, not a security boundary.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
