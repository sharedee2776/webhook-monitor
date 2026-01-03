"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestWebhook = ingestWebhook;
const functions_1 = require("@azure/functions");
const auth_1 = require("../lib/auth");
const crypto_1 = require("crypto");
const eventStore_1 = require("../shared/eventStore");
const usageTracker_1 = require("../shared/usageTracker");
const plans_1 = require("../plans/plans");
const tenantStore_1 = require("../shared/tenantStore");
const rateLimiter_1 = require("../lib/rateLimiter");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function ingestWebhook(request, context) {
    try {
        // --- API Key Validation ---
        const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
        if (!apiKey) {
            return { status: 401, body: "Invalid or missing API key" };
        }
        const keyInfo = (0, auth_1.validateApiKey)(apiKey);
        if (!keyInfo) {
            return { status: 401, body: "Invalid or missing API key" };
        }
        context.tenantId = keyInfo.tenantId;
        // --- Signature Verification (optional, for trusted sources) ---
        const signature = request.headers.get("x-signature");
        const secret = process.env.WEBHOOK_SECRET;
        if (secret && signature) {
            const rawBody = await request.text();
            const expectedSig = (0, crypto_1.createHash)("sha256").update(rawBody + secret).digest("hex");
            if (signature !== expectedSig) {
                return { status: 401, body: "Invalid signature" };
            }
        }
        // --- Parse and Validate Body ---
        let body;
        try {
            body = await request.json();
        }
        catch {
            return { status: 400, jsonBody: { error: "Invalid JSON body" } };
        }
        if (!body || typeof body !== "object") {
            return { status: 400, jsonBody: { error: "Invalid JSON body" } };
        }
        if (!body.eventType || typeof body.eventType !== "string" || !/^[\w.:-]+$/.test(body.eventType)) {
            return { status: 400, jsonBody: { error: "eventType is required and must be a string" } };
        }
        if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
            return { status: 400, jsonBody: { error: "payload must be an object" } };
        }
        // Enforce payload size limit (e.g., 10KB)
        const rawPayload = JSON.stringify(body);
        const maxBytes = 10 * 1024; // 10KB
        if (rawPayload.length > maxBytes) {
            return { status: 413, body: "Payload too large (max 10KB)" };
        }
        // --- Idempotency / Replay Protection ---
        // Use eventId from request body if provided, else generate a hash as fallback
        const tenantId = keyInfo.tenantId;
        if (!tenantId) {
            return { status: 500, jsonBody: { error: "Resolved tenantId missing from API key" } };
        }
        let eventId = body.eventId;
        if (!eventId || typeof eventId !== "string") {
            eventId = (0, crypto_1.createHash)("sha256").update(tenantId + body.eventType + (body.receivedAt || "") + JSON.stringify(body.payload)).digest("hex");
        }
        // Check for duplicate event (in local file)
        const eventsFile = path_1.default.join(process.cwd(), "data/devEvents.json");
        let isDuplicate = false;
        try {
            const events = JSON.parse(fs_1.default.readFileSync(eventsFile, "utf-8"));
            isDuplicate = events.some((e) => e.eventId === eventId);
        }
        catch { }
        if (isDuplicate) {
            return { status: 409, jsonBody: { error: "Duplicate event" } };
        }
        // --- Build event object ---
        const event = {
            eventId,
            tenantId,
            eventType: body.eventType,
            source: body.source ?? "custom",
            receivedAt: typeof body.receivedAt === "string" ? body.receivedAt : new Date().toISOString(),
            payload: body.payload
        };
        // --- Persist event (async) ---
        await (0, eventStore_1.saveEvent)(event);
        (0, usageTracker_1.trackUsage)(tenantId);
        // --- Usage and Rate Limiting ---
        const usageCount = (0, usageTracker_1.getUsage)(tenantId);
        const tenant = (0, tenantStore_1.getTenant)(tenantId);
        const plan = plans_1.PLANS[tenant?.plan ?? "free"];
        // --- Subscription state and grace period enforcement ---
        const now = Date.now();
        if (tenant?.subscriptionState && tenant.subscriptionState !== "active" && tenant.subscriptionState !== "grace") {
            return {
                status: 402,
                jsonBody: {
                    error: `Subscription is ${tenant.subscriptionState}`,
                    plan: plan.name,
                    upgradeUrl: "https://example.com/upgrade",
                },
            };
        }
        if (tenant?.subscriptionState === "grace" && tenant.gracePeriodEndsAt) {
            if (now > Date.parse(tenant.gracePeriodEndsAt)) {
                return {
                    status: 402,
                    jsonBody: {
                        error: "Grace period ended",
                        plan: plan.name,
                        upgradeUrl: "https://example.com/upgrade",
                    },
                };
            }
        }
        if (tenant?.subscriptionExpiresAt && now > Date.parse(tenant.subscriptionExpiresAt)) {
            return {
                status: 402,
                jsonBody: {
                    error: "Subscription expired",
                    plan: plan.name,
                    upgradeUrl: "https://example.com/upgrade",
                },
            };
        }
        const rate = (0, rateLimiter_1.checkRateLimit)(apiKey, plan.name);
        if (!rate.allowed) {
            return {
                status: 429,
                jsonBody: {
                    error: "Too many requests",
                    plan: plan.name,
                    retryAfterSeconds: rate.retryAfter,
                },
                headers: {
                    "Retry-After": String(rate.retryAfter),
                },
            };
        }
        if (tenant.usage >= plan.monthlyLimit) {
            return {
                status: 402,
                jsonBody: {
                    error: "Usage limit exceeded",
                    plan: plan.name,
                    upgradeUrl: "https://example.com/upgrade",
                },
            };
        }
        // --- Response Headers and Logging ---
        const used = tenant.usage;
        const remaining = Math.max(plan.monthlyLimit - used, 0);
        const usageRatio = used / plan.monthlyLimit;
        const warningHeaders = {};
        const WARNING_THRESHOLD = 0.8;
        if (usageRatio >= WARNING_THRESHOLD) {
            warningHeaders["X-Usage-Warning"] = "You are approaching your monthly usage limit";
        }
        // Attach headers to success response
        return {
            status: 200,
            headers: {
                "X-Usage-Limit": plan.monthlyLimit.toString(),
                "X-Usage-Used": used.toString(),
                "X-Usage-Remaining": remaining.toString(),
                ...warningHeaders,
                "x-rate-limit-plan": plan.name,
                "x-rate-limit-remaining": String(rate.remaining ?? 0),
            },
            body: JSON.stringify({ ok: true })
        };
    }
    catch (err) {
        // Generic error response
        console.error("[Webhook Error]", err);
        return { status: 500, jsonBody: { error: "Internal server error" } };
    }
}
functions_1.app.http("ingestWebhook", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: ingestWebhook
});
//# sourceMappingURL=ingestWebhook.js.map