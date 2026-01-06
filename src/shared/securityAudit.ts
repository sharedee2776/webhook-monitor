import { TableClient } from "@azure/data-tables";

const auditLogTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "SecurityAuditLog"
);

export interface SecurityAuditEvent {
  eventType: 
    | "auth_success"
    | "auth_failure"
    | "auth_expired"
    | "rate_limit_exceeded"
    | "permission_denied"
    | "api_key_rotated"
    | "api_key_revoked"
    | "admin_action"
    | "suspicious_activity"
    | "request_signed"
    | "request_unsigned";
  
  tenantId?: string;
  apiKey?: string; // Partial key (first 8 chars) for logging
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Log a security event to Azure Table Storage
 */
export async function logSecurityEvent(event: Omit<SecurityAuditEvent, "timestamp">): Promise<void> {
  try {
    const auditEvent: SecurityAuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      // Only log partial API key for security
      apiKey: event.apiKey ? `${event.apiKey.substring(0, 8)}...` : undefined,
    };

    // Use timestamp as row key for chronological ordering
    const rowKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const partitionKey = event.tenantId || "system";

    await auditLogTable.createEntity({
      partitionKey,
      rowKey,
      eventType: auditEvent.eventType,
      tenantId: auditEvent.tenantId,
      apiKey: auditEvent.apiKey,
      ipAddress: auditEvent.ipAddress,
      userAgent: auditEvent.userAgent,
      endpoint: auditEvent.endpoint,
      method: auditEvent.method,
      statusCode: auditEvent.statusCode,
      errorMessage: auditEvent.errorMessage,
      metadata: auditEvent.metadata ? JSON.stringify(auditEvent.metadata) : undefined,
      timestamp: auditEvent.timestamp,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Failed to log security event:", error);
  }
}

/**
 * Extract IP address from request
 */
export function getClientIp(req: any): string {
  // Check various headers for IP (considering proxies/load balancers)
  const forwarded = req.headers?.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = req.headers?.get("x-real-ip");
  if (realIp) return realIp;

  // Fallback to connection remote address if available
  return req.headers?.get("cf-connecting-ip") || "unknown";
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: any): string | undefined {
  const ua = req.headers?.get("user-agent");
  return ua || undefined;
}
