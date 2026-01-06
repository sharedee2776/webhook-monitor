
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateApiKey } from "../lib/auth";
import { createHash, randomUUID } from "crypto";
import { saveEvent } from "../shared/eventStore";
import { trackUsage, getUsage } from "../shared/usageTracker";
import { assertWithinLimit } from "../shared/enforceLimit";
import { PLANS } from "../plans/plans";
import { getTenant } from "../shared/tenantStore";
import { checkRateLimit } from "../lib/rateLimiter";
import { verifyRequestSignature } from "../lib/requestSigning";
import { logSecurityEvent, getClientIp } from "../shared/securityAudit";
import fs from "fs";
import path from "path";

// ✅ Define expected API key entity shape
interface ApiKeyEntity {
  tenantId: string;
  active: boolean | string;
}


export async function ingestWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Get raw body first (needed for signature verification)
    const rawBody = await request.text();
    
    // --- API Key Validation ---
    const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
    if (!apiKey) {
      await logSecurityEvent({
        eventType: "auth_failure",
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
        endpoint: "/api/ingest",
        method: "POST",
        errorMessage: "Missing API key",
      });
      return { status: 401, body: "Invalid or missing API key" };
    }

    // Use new authenticateApiKey with request context for audit logging
    const keyInfo = await authenticateApiKey(apiKey, request, "/api/ingest");
    if (!keyInfo) {
      return { status: 401, body: "Invalid or missing API key" };
    }
    (context as any).tenantId = keyInfo.tenantId;

    // --- Signature Verification (REQUIRED for write operations) ---
    const signatureResult = await verifyRequestSignature(request, apiKey, rawBody, "/api/ingest");
    if (!signatureResult.valid) {
      return { status: 401, body: signatureResult.error || "Invalid request signature" };
    }

    // --- Parse and Validate Body ---
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
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
      eventId = createHash("sha256").update(
        tenantId + body.eventType + (body.receivedAt || "") + JSON.stringify(body.payload)
      ).digest("hex");
    }

    // Check for duplicate event (in local file)
    const eventsFile = path.join(process.cwd(), "data/devEvents.json");
    let isDuplicate = false;
    try {
      const events = JSON.parse(fs.readFileSync(eventsFile, "utf-8"));
      isDuplicate = events.some((e: any) => e.eventId === eventId);
    } catch {}
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
    await saveEvent(event);
    trackUsage(tenantId);

    // --- Usage and Rate Limiting ---
    const usageCount = getUsage(tenantId);
    const tenant = getTenant(tenantId);
    const plan = PLANS[tenant?.plan ?? "free"];
    // --- Subscription state and grace period enforcement ---
    const now = Date.now();
    if (tenant?.subscriptionState && tenant.subscriptionState !== "active" && tenant.subscriptionState !== "grace") {
      return {
        status: 402,
        jsonBody: {
          error: `Subscription is ${tenant.subscriptionState}`,
          plan: plan.name,
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
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
            upgradeUrl: "https://webhookmonitor.shop/upgrade",
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
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
        },
      };
    }
    const rate = checkRateLimit(apiKey, plan.name);
    if (!rate.allowed) {
      await logSecurityEvent({
        eventType: "rate_limit_exceeded",
        tenantId: keyInfo.tenantId,
        apiKey,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
        endpoint: "/api/ingest",
        method: "POST",
        statusCode: 429,
        metadata: {
          plan: plan.name,
          retryAfter: rate.retryAfter,
          limit: rate.limit,
        },
      });
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
    if (tenant!.usage >= plan.monthlyLimit) {
      return {
        status: 402,
        jsonBody: {
          error: "Usage limit exceeded",
          plan: plan.name,
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
        },
      };
    }

    // --- Response Headers and Logging ---
    const used = tenant!.usage;
    const remaining = Math.max(plan.monthlyLimit - used, 0);
    const usageRatio = used / plan.monthlyLimit;
    const warningHeaders: Record<string, string> = {};
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
  } catch (err: any) {
    // Generic error response
    console.error("[Webhook Error]", err);
    return { status: 500, jsonBody: { error: "Internal server error" } };
  }
}

app.http("ingestWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: ingestWebhook
});
