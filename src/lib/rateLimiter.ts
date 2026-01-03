type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

const PLAN_LIMITS: Record<string, RateLimitConfig> = {
  free: { limit: 60, windowMs: 60_000 },
  pro: { limit: 600, windowMs: 60_000 },
  business: { limit: 3000, windowMs: 60_000 },
};

type Counter = {
  count: number;
  windowStart: number;
};

const counters = new Map<string, Counter>();

export function checkRateLimit(apiKey: string, plan: string) {
  const config = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const now = Date.now();

  const key = `${apiKey}`;
  const entry = counters.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    counters.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil(
      (config.windowMs - (now - entry.windowStart)) / 1000
    );

    return {
      allowed: false,
      retryAfter,
      limit: config.limit,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
  };
}
