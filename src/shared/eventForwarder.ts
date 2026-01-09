import { updateEventStatus } from "./eventTableStore";
import { notifyIntegrations } from "./integrationNotifier";
import { getTenantEndpoints } from "./webhookEndpointsStore";

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

/**
 * Forward event to a single endpoint with retry logic
 */
async function forwardToEndpoint(
  endpoint: WebhookEndpoint,
  event: any,
  maxRetries: number = 3
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WebhookMonitor/1.0",
          "X-Webhook-Event-Type": event.eventType,
          "X-Webhook-Source": "webhook-monitor",
        },
        body: JSON.stringify({
          eventType: event.eventType,
          payload: event.payload,
          receivedAt: event.receivedAt,
          source: event.source,
        }),
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000),
      });

      lastStatusCode = response.status;

      if (response.ok) {
        return { success: true, statusCode: response.status };
      } else {
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return { success: false, statusCode: response.status, error: lastError };
        }
      }
    } catch (error: any) {
      lastError = error.message || "Network error";
      // Don't retry on timeout or abort
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        return { success: false, error: lastError };
      }
    }

    // Exponential backoff: wait 1s, 2s, 4s
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, statusCode: lastStatusCode, error: lastError };
}

/**
 * Forward event to all active endpoints for a tenant
 */
export async function forwardEventToEndpoints(
  tenantId: string,
  eventId: string,
  event: any
): Promise<void> {
  // Get active endpoints from Azure Table Storage
  const endpointEntities = await getTenantEndpoints(tenantId);
  const endpoints: WebhookEndpoint[] = endpointEntities
    .filter(ep => ep.active)
    .map(ep => ({
      id: ep.rowKey,
      name: ep.name,
      url: ep.url,
      active: ep.active,
    }));

  if (endpoints.length === 0) {
    // No endpoints to forward to, mark as success
    await updateEventStatus(tenantId, eventId, {
      status: 'success',
      forwarded_to: [],
    });
    return;
  }

  const results: Array<{ url: string; success: boolean; statusCode?: number }> = [];
  let successCount = 0;
  let failedCount = 0;

  // Forward to all endpoints in parallel
  const forwardPromises = endpoints.map(async (endpoint) => {
    const result = await forwardToEndpoint(endpoint, event);
    results.push({
      url: endpoint.url,
      success: result.success,
      statusCode: result.statusCode,
    });

    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  });

  await Promise.allSettled(forwardPromises);

  // Update event status based on results
  const forwardedUrls = results.map(r => r.url);
  const lastStatusCode: number | undefined = results.find(r => r.statusCode !== undefined)?.statusCode;
  const hasErrors = results.some(r => !r.success);

  let status: 'pending' | 'success' | 'failed' | 'partial' = 'success';
  if (failedCount === endpoints.length) {
    status = 'failed';
  } else if (failedCount > 0) {
    status = 'partial';
  }

  await updateEventStatus(tenantId, eventId, {
    status,
    forwarded_to: forwardedUrls,
    response_code: lastStatusCode,
    retry_count: 1, // We'll track retries per endpoint in the future
  });

  // Also notify connected integrations (Discord, etc.)
  notifyIntegrations(tenantId, {
    eventType: event.eventType,
    payload: event.payload,
    receivedAt: event.receivedAt,
    source: event.source,
  }).catch((err: any) => {
    console.error(`Failed to notify integrations for event ${eventId}:`, err);
  });
}
