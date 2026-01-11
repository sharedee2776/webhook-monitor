
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateApiKey } from "../lib/auth";
import { createHash, randomUUID } from "crypto";
import { saveEvent } from "../shared/eventStore";
import { forwardEventToEndpoints } from "../shared/eventForwarder";
import { trackUsage, getUsage } from "../shared/usageTracker";
import { assertWithinLimit } from "../shared/enforceLimit";
import { PLANS } from "../plans/plans";
import { getTenant } from "../shared/tenantStore";
import { checkRateLimit } from "../lib/rateLimiter";
import { verifyRequestSignature } from "../lib/requestSigning";
import { logSecurityEvent, getClientIp } from "../shared/securityAudit";
import { findEndpointByUrl } from "../shared/webhookEndpointsStore";
import fs from "fs";
import path from "path";

// ✅ Define expected API key entity shape
interface ApiKeyEntity {
  tenantId: string;
  active: boolean | string;
}

/**
 * Enhanced ingestWebhook function with:
 * - Verbose Azure logging
 * - Endpoint routing logic
 * - Proper DB error handling
 * - Better payload validation
 */
export async function ingestWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // ⚠️ CRITICAL: Log immediately to verify function is being called
  context.log("[INGEST] ========== FUNCTION CALLED ==========", {
    method: request.method,
    url: request.url,
    timestamp: new Date().toISOString(),
    functionName: "ingestWebhook"
  });
  
  const startTime = Date.now();
  let tenantId: string | undefined;
  let eventId: string | undefined;
  
  try {
    // 🔍 LOG: New request received
    context.log("[INGEST] New webhook request received", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });

    // Get raw body first (needed for signature verification)
    const rawBody = await request.text();
    context.log("[INGEST] Raw body received", { bodyLength: rawBody.length });
    
    // --- API Key Validation (CRITICAL: Must be first check) ---
    const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
    if (!apiKey) {
      context.log("[INGEST] ❌ Missing API key");
      // Don't await security log - return immediately
      logSecurityEvent({
        eventType: "auth_failure",
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
        endpoint: "/api/ingestWebhook",
        method: "POST",
        errorMessage: "Missing API key",
      }).catch(() => {}); // Fire and forget
      return { 
        status: 401, 
        jsonBody: { error: "Invalid or missing API key" }
      };
    }

    context.log("[INGEST] API key provided, validating...");
    
    // Use new authenticateApiKey with request context for audit logging
    const keyInfo = await authenticateApiKey(apiKey, request, "/api/ingestWebhook");
    if (!keyInfo) {
      context.log("[INGEST] ❌ Invalid API key");
      return { 
        status: 401, 
        jsonBody: { error: "Invalid or missing API key" }
      };
    }
    
    tenantId = keyInfo.tenantId;
    (context as any).tenantId = tenantId;
    
    // Clean tenant ID (remove any invalid characters like semicolons, trim, lowercase)
    let cleanTenantId = tenantId.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
    if (cleanTenantId !== tenantId) {
      context.log("[INGEST] ⚠️ Tenant ID cleaned", { 
        original: tenantId, 
        cleaned: cleanTenantId 
      });
      tenantId = cleanTenantId;
    }
    
    context.log("[INGEST] ✅ API key validated", { tenantId, plan: keyInfo.plan });

    // --- Signature Verification (REQUIRED for write operations) ---
    context.log("[INGEST] Verifying request signature...");
    const signatureResult = await verifyRequestSignature(request, apiKey, rawBody, "/api/ingestWebhook");
    if (!signatureResult.valid) {
      context.log("[INGEST] ❌ Invalid signature", { error: signatureResult.error });
      return { status: 401, jsonBody: { error: signatureResult.error || "Invalid request signature" } };
    }
    context.log("[INGEST] ✅ Signature verified");

    // --- Parse and Validate Body ---
    context.log("[INGEST] Parsing JSON body...");
    let body: any;
    try {
      body = JSON.parse(rawBody);
      context.log("[INGEST] ✅ JSON parsed successfully", { 
        hasEventType: !!body.eventType,
        hasPayload: !!body.payload 
      });
    } catch (parseError: any) {
      context.log("[INGEST] ❌ JSON parse error", { error: parseError.message });
      return { status: 400, jsonBody: { error: "Invalid JSON body" } };
    }
    
    if (!body || typeof body !== "object") {
      context.log("[INGEST] ❌ Body is not an object");
      return { status: 400, jsonBody: { error: "Invalid JSON body" } };
    }
    
    // Extract and validate event type (with default)
    const eventType = body.eventType || body.type || "webhook.received";
    if (typeof eventType !== "string" || !/^[\w.:-]+$/.test(eventType)) {
      context.log("[INGEST] ❌ Invalid eventType", { eventType });
      return { status: 400, jsonBody: { error: "eventType is required and must be a string matching pattern /^[\\w.:-]+$/" } };
    }
    
    // Extract payload (with default empty object)
    let payload = body.payload || body.data || body;
    if (Array.isArray(payload)) {
      context.log("[INGEST] ⚠️ Payload is array, wrapping in object");
      payload = { data: payload };
    }
    if (typeof payload !== "object" || payload === null) {
      context.log("[INGEST] ⚠️ Payload is not object, using empty object");
      payload = {};
    }
    
    // Enforce payload size limit (e.g., 10KB)
    const rawPayload = JSON.stringify(body);
    const maxBytes = 10 * 1024; // 10KB
    if (rawPayload.length > maxBytes) {
      context.log("[INGEST] ❌ Payload too large", { size: rawPayload.length, max: maxBytes });
      return { status: 413, jsonBody: { error: "Payload too large (max 10KB)" } };
    }

    // --- Tenant and Rate Limiting Checks (before saving) ---
    context.log("[INGEST] Checking tenant and rate limits...");
    const tenant = await getTenant(tenantId);
    if (!tenant) {
      context.log("[INGEST] ❌ Tenant not found", { tenantId });
      return {
        status: 404,
        jsonBody: { error: "Tenant not found" }
      };
    }
    
    const plan = PLANS[tenant.plan ?? "free"];
    const now = Date.now();
    
    // Subscription state checks
    if (tenant.subscriptionState && tenant.subscriptionState !== "active" && tenant.subscriptionState !== "grace") {
      context.log("[INGEST] ❌ Subscription not active", { state: tenant.subscriptionState });
      return {
        status: 402,
        jsonBody: {
          error: `Subscription is ${tenant.subscriptionState}`,
          plan: plan.name,
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
        },
      };
    }
    
    if (tenant.subscriptionState === "grace" && tenant.gracePeriodEndsAt) {
      if (now > Date.parse(tenant.gracePeriodEndsAt)) {
        context.log("[INGEST] ❌ Grace period ended");
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
    
    if (tenant.subscriptionExpiresAt && now > Date.parse(tenant.subscriptionExpiresAt)) {
      context.log("[INGEST] ❌ Subscription expired");
      return {
        status: 402,
        jsonBody: {
          error: "Subscription expired",
          plan: plan.name,
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
        },
      };
    }
    
    // Rate limiting
    const rate = checkRateLimit(apiKey, plan.name);
    if (!rate.allowed) {
      context.log("[INGEST] ❌ Rate limit exceeded", { 
        limit: rate.limit, 
        retryAfter: rate.retryAfter 
      });
      await logSecurityEvent({
        eventType: "rate_limit_exceeded",
        tenantId: tenantId,
        apiKey,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
        endpoint: "/api/ingestWebhook",
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
    
    if (tenant.usage >= plan.monthlyLimit) {
      context.log("[INGEST] ❌ Usage limit exceeded", { 
        usage: tenant.usage, 
        limit: plan.monthlyLimit 
      });
      return {
        status: 402,
        jsonBody: {
          error: "Usage limit exceeded",
          plan: plan.name,
          upgradeUrl: "https://webhookmonitor.shop/upgrade",
        },
      };
    }
    
    context.log("[INGEST] ✅ Tenant and rate limits passed");

    // --- Endpoint Routing Logic ---
    context.log("[INGEST] Attempting to route event to endpoint...");
    let matchedEndpoint = null;
    let endpointId: string | undefined;
    let endpointUrl: string | undefined;
    
    // Try to match endpoint by URL (from referer or origin header)
    const referer = request.headers.get("referer") || request.headers.get("referrer");
    const origin = request.headers.get("origin");
    const requestUrl = request.url;
    
    if (referer || origin || requestUrl) {
      const urlToMatch = referer || origin || requestUrl;
      context.log("[INGEST] Matching endpoint by URL", { urlToMatch });
      matchedEndpoint = await findEndpointByUrl(tenantId, urlToMatch);
      if (matchedEndpoint) {
        endpointId = matchedEndpoint.rowKey;
        endpointUrl = matchedEndpoint.url;
        context.log("[INGEST] ✅ Endpoint matched", { 
          endpointId, 
          endpointName: matchedEndpoint.name 
        });
      } else {
        context.log("[INGEST] ⚠️ No endpoint matched, event will be stored without endpoint link");
      }
    }

    // --- Idempotency / Replay Protection ---
    // Use eventId from request body if provided, else generate a hash as fallback
    eventId = body.eventId;
    if (!eventId || typeof eventId !== "string") {
      const timestamp = body.receivedAt || new Date().toISOString();
      eventId = createHash("sha256").update(
        tenantId + eventType + timestamp + JSON.stringify(payload)
      ).digest("hex");
      context.log("[INGEST] Generated eventId", { eventId });
    }

    // Check for duplicate event (in local file - for dev only)
    const eventsFile = path.join(process.cwd(), "data/devEvents.json");
    let isDuplicate = false;
    try {
      if (fs.existsSync(eventsFile)) {
        const events = JSON.parse(fs.readFileSync(eventsFile, "utf-8"));
        isDuplicate = events.some((e: any) => e.eventId === eventId);
      }
    } catch {}
    
    if (isDuplicate) {
      context.log("[INGEST] ⚠️ Duplicate event detected (dev mode)", { eventId });
      return { status: 409, jsonBody: { error: "Duplicate event" } };
    }

    // --- Build event object ---
    const timestamp = typeof body.receivedAt === "string" ? body.receivedAt : new Date().toISOString();
    const event = {
      eventId,
      tenantId,
      eventType,
      source: body.source ?? "custom",
      receivedAt: timestamp,
      payload,
      endpointId,
      endpointUrl,
    };

    context.log("[INGEST] Event object built", {
      eventId,
      tenantId,
      eventType,
      endpointId,
      payloadSize: JSON.stringify(payload).length,
    });

    // Collect headers for storage (excluding sensitive ones)
    const headersToStore: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['x-api-key', 'authorization', 'cookie'].includes(lowerKey)) {
        headersToStore[key] = value;
      }
    });

    // --- Persist event to database ---
    context.log("[INGEST] Saving event to database...", {
      eventId,
      tenantId,
      eventType,
      endpointId,
      payloadSize: JSON.stringify(payload).length,
    });
    
    let eventSaved = false;
    try {
      await saveEvent(event, apiKey, headersToStore);
      eventSaved = true;
      context.log("[INGEST] ✅ Event saved to database successfully", { 
        eventId,
        tenantId,
        eventType,
        endpointId: endpointId || 'none',
      });
    } catch (dbError: any) {
      eventSaved = false;
      context.error("[INGEST] ❌ Failed to save event to database", {
        eventId,
        error: dbError.message,
        stack: dbError.stack,
        tenantId,
        eventType,
        endpointId,
        errorCode: dbError.statusCode || dbError.code,
        errorName: dbError.name,
      });
      
      // Log to security audit
      await logSecurityEvent({
        eventType: "suspicious_activity",
        tenantId,
        apiKey,
        ipAddress: getClientIp(request),
        endpoint: "/api/ingestWebhook",
        method: "POST",
        errorMessage: `Failed to save event: ${dbError.message}`,
        metadata: { 
          errorType: "db_error",
          eventId,
          eventType,
        },
      }).catch((auditError) => {
        context.error("[INGEST] Failed to log security event", { error: auditError });
      });
      
      // Return 500 if database save fails (critical error)
      return {
        status: 500,
        jsonBody: {
          error: "Failed to save event",
          eventId,
          message: process.env.NODE_ENV === "development" ? dbError.message : "Internal server error",
        },
      };
    }
    
    // Track usage
    trackUsage(tenantId);
    context.log("[INGEST] Usage tracked", { tenantId });

    // --- Forward event to user's webhook endpoints (async, don't block response) ---
    context.log("[INGEST] Forwarding event to endpoints (async)...");
    forwardEventToEndpoints(tenantId, eventId, event).catch((err: any) => {
      context.error("[INGEST] Failed to forward event", { eventId, error: err.message });
    });

    // --- Response Headers and Logging ---
    const used = tenant.usage;
    const remaining = Math.max(plan.monthlyLimit - used, 0);
    const usageRatio = used / plan.monthlyLimit;
    const warningHeaders: Record<string, string> = {};
    const WARNING_THRESHOLD = 0.8;
    if (usageRatio >= WARNING_THRESHOLD) {
      warningHeaders["X-Usage-Warning"] = "You are approaching your monthly usage limit";
    }
    
    const duration = Date.now() - startTime;
    
    // Attach headers to success response
    context.log("[INGEST] ✅ Request completed successfully", {
      eventId,
      tenantId,
      endpointId: endpointId || 'none',
      eventType,
      duration: `${duration}ms`,
      saved: eventSaved,
    });
    
    // Ensure response is always returned
    const response = {
      status: 200 as const,
      headers: {
        "Content-Type": "application/json",
        "X-Usage-Limit": plan.monthlyLimit.toString(),
        "X-Usage-Used": used.toString(),
        "X-Usage-Remaining": remaining.toString(),
        ...warningHeaders,
        "x-rate-limit-plan": plan.name,
        "x-rate-limit-remaining": String(rate.remaining ?? 0),
        "X-Event-ID": eventId,
      },
      jsonBody: { 
        ok: true,
        eventId,
        endpointId: endpointId || null,
        saved: eventSaved,
      }
    };
    
    context.log("[INGEST] ✅ Returning response", { status: 200, eventId });
    return response;
  } catch (err: any) {
    // Generic error response
    context.error("[INGEST] ❌ Unhandled error", {
      error: err.message,
      stack: err.stack,
      tenantId,
      eventId,
    });
    
    // Log to security audit
    if (tenantId) {
      await logSecurityEvent({
        eventType: "suspicious_activity",
        tenantId,
        ipAddress: getClientIp(request),
        endpoint: "/api/ingestWebhook",
        method: "POST",
        errorMessage: `Unhandled error: ${err.message}`,
        metadata: { errorType: "server_error" },
      }).catch(() => {}); // Don't fail if audit logging fails
    }
    
    return { 
      status: 500, 
      jsonBody: { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      } 
    };
  }
}

// Register the function
app.http("ingestWebhook", {
  route: "ingestWebhook", // Explicitly set route to match function.json
  methods: ["POST"],
  authLevel: "anonymous",
  handler: ingestWebhook
});

// Log registration (this runs at module load time)
console.log("[INGEST] Function registered: ingestWebhook at route /api/ingestWebhook");
