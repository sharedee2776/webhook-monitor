"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
const PLAN_LIMITS = {
    free: { limit: 60, windowMs: 60000 },
    pro: { limit: 600, windowMs: 60000 },
    business: { limit: 3000, windowMs: 60000 },
};
const counters = new Map();
function checkRateLimit(apiKey, plan) {
    const config = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const now = Date.now();
    const key = `${apiKey}`;
    const entry = counters.get(key);
    if (!entry || now - entry.windowStart > config.windowMs) {
        counters.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: config.limit - 1 };
    }
    if (entry.count >= config.limit) {
        const retryAfter = Math.ceil((config.windowMs - (now - entry.windowStart)) / 1000);
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
//# sourceMappingURL=rateLimiter.js.map