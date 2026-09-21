export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

interface Bucket {
  count: number;
  startedAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimitConfigFromEnv(env: Record<string, string | undefined>): RateLimitConfig {
  const windowMs = Number(env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(env.RATE_LIMIT_MAX ?? 20);
  return {
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 60_000,
    max: Number.isFinite(max) && max > 0 ? Math.floor(max) : 20,
  };
}

function prune(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt >= windowMs) buckets.delete(key);
  }
}

export function checkRateLimitKey(key: string, config: RateLimitConfig, now = Date.now()): RateLimitResult {
  prune(now, config.windowMs);
  const bucket = buckets.get(key);
  const elapsed = bucket ? now - bucket.startedAt : config.windowMs;

  if (!bucket || elapsed >= config.windowMs) {
    const next: Bucket = { count: 1, startedAt: now };
    buckets.set(key, next);
    return {
      allowed: true,
      limit: config.max,
      remaining: Math.max(0, config.max - 1),
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((config.windowMs - elapsed) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    limit: config.max,
    remaining: Math.max(0, config.max - bucket.count),
    resetInSeconds: Math.max(1, Math.ceil((config.windowMs - elapsed) / 1000)),
  };
}

export function rateLimitKeyFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "local";
  return `generate:${ip}`;
}

export function clearRateLimitForTests() {
  buckets.clear();
}
