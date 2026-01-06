import { createHash } from "crypto";
import { logSecurityEvent, getClientIp } from "../shared/securityAudit";

/**
 * Verify request signature for write operations
 * Uses HMAC-SHA256 with API key as secret
 */
export async function verifyRequestSignature(
  request: any,
  apiKey: string,
  rawBody: string,
  endpoint: string
): Promise<{ valid: boolean; error?: string }> {
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");

  // For write operations, signature is required
  if (!signature) {
    await logSecurityEvent({
      eventType: "request_unsigned",
      apiKey,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.get("user-agent"),
      endpoint,
      method: request.method,
      errorMessage: "Missing request signature",
    });
    return { valid: false, error: "Request signature required for write operations" };
  }

  // Timestamp is required to prevent replay attacks
  if (!timestamp) {
    await logSecurityEvent({
      eventType: "request_unsigned",
      apiKey,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.get("user-agent"),
      endpoint,
      method: request.method,
      errorMessage: "Missing timestamp header",
    });
    return { valid: false, error: "Timestamp header (x-timestamp) required" };
  }

  // Check timestamp is not too old (5 minutes max)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  if (isNaN(requestTime) || Math.abs(now - requestTime) > maxAge) {
    await logSecurityEvent({
      eventType: "request_unsigned",
      apiKey,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.get("user-agent"),
      endpoint,
      method: request.method,
      errorMessage: "Request timestamp expired or invalid",
    });
    return { valid: false, error: "Request timestamp expired or invalid" };
  }

  // Verify signature using API key as secret
  const expectedSignature = createHash("sha256")
    .update(`${rawBody}${timestamp}${apiKey}`)
    .digest("hex");

  if (signature !== expectedSignature) {
    await logSecurityEvent({
      eventType: "request_unsigned",
      apiKey,
      ipAddress: getClientIp(request),
      userAgent: request.headers?.get("user-agent"),
      endpoint,
      method: request.method,
      errorMessage: "Invalid request signature",
    });
    return { valid: false, error: "Invalid request signature" };
  }

  // Log successful signature verification
  await logSecurityEvent({
    eventType: "request_signed",
    apiKey,
    ipAddress: getClientIp(request),
    userAgent: request.headers?.get("user-agent"),
    endpoint,
    method: request.method,
  });

  return { valid: true };
}

/**
 * Generate signature for client-side use
 * Clients should use this algorithm to sign their requests
 */
export function generateRequestSignature(
  body: string,
  timestamp: string,
  apiKey: string
): string {
  return createHash("sha256")
    .update(`${body}${timestamp}${apiKey}`)
    .digest("hex");
}
