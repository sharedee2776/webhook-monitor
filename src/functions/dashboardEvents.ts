import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateApiKey } from "../lib/auth";
import { getUsage } from "../shared/usageTracker";
import { getEventsForTenant } from "../shared/eventStore";
import { RETENTION_BY_PLAN } from "../config/retention";
import { getEventsForTenantFromTable } from "../shared/eventTableStore";
import { getTenantEndpoints } from "../shared/webhookEndpointsStore";

type EventEntity = {
  id: string;
  tenantId: string;
  apiKey: string;
  payload: any;
  timestamp: string;
  source: string;
};

export async function dashboardEvents(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    context.log("[DASHBOARD_EVENTS] Request received");

    // 🔐 API key auth
    const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
    if (!apiKey) {
      context.log("[DASHBOARD_EVENTS] ❌ Missing API key");
      return { status: 401, body: "Invalid or missing API key" };
    }
    
    // Use new authenticateApiKey with request context for audit logging
    const keyInfo = await authenticateApiKey(apiKey, request, "/api/dashboardEvents");
    if (!keyInfo) {
      context.log("[DASHBOARD_EVENTS] ❌ Invalid API key");
      return { status: 401, body: "Invalid or missing API key" };
    }

    const tenantId = keyInfo.tenantId;
    const plan = keyInfo.plan ?? "free";
    const retentionMs = RETENTION_BY_PLAN[plan] ?? RETENTION_BY_PLAN.free;
    const cutoff = Date.now() - retentionMs;

    context.log("[DASHBOARD_EVENTS] Fetching events", { tenantId, plan });

    // Get events from table storage (primary source)
    let events: any[] = [];
    try {
      context.log("[DASHBOARD_EVENTS] Querying table storage...", {
        tenantId,
        hasConnectionString: !!process.env.AzureWebJobsStorage,
        tableName: "Events"
      });
      
      const tableEvents = await getEventsForTenantFromTable(tenantId, 100); // Get more events for filtering
      
      context.log("[DASHBOARD_EVENTS] Raw table events received", {
        count: tableEvents.length,
        tenantId,
        sampleEventIds: tableEvents.slice(0, 3).map(e => e.rowKey)
      });
      
      events = tableEvents.map(e => ({
        eventId: e.rowKey,
        id: e.rowKey,
        tenantId: e.partitionKey,
        eventType: e.eventType,
        source: e.source || 'custom',
        receivedAt: e.timestamp,
        timestamp: e.timestamp,
        payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload,
        status: e.status || 'pending',
        endpointId: e.endpointId,
        endpointUrl: e.endpointUrl,
        forwarded_to: e.forwarded_to ? (typeof e.forwarded_to === 'string' ? JSON.parse(e.forwarded_to) : e.forwarded_to) : undefined,
        response_code: e.response_code,
        retry_count: e.retry_count || 0,
        error_message: e.error_message,
      }));
      
      context.log("[DASHBOARD_EVENTS] ✅ Fetched events from table", { 
        count: events.length,
        tenantId,
        eventTypes: [...new Set(events.map(e => e.eventType))]
      });
    } catch (tableError: any) {
      context.error("[DASHBOARD_EVENTS] ❌ Failed to fetch from table, falling back", { 
        error: tableError.message,
        stack: tableError.stack,
        statusCode: tableError.statusCode,
        code: tableError.code,
        tenantId
      });
      // Fallback to eventStore
      try {
        events = await getEventsForTenant(tenantId);
        context.log("[DASHBOARD_EVENTS] Fallback to eventStore returned", { count: events.length });
      } catch (fallbackError: any) {
        context.error("[DASHBOARD_EVENTS] ❌ Fallback also failed", { error: fallbackError.message });
        events = [];
      }
    }

    // Filter events by retention
    const filteredEvents = events.filter((e: any) => {
      const eventTime = new Date(e.receivedAt || e.timestamp).getTime();
      return eventTime >= cutoff;
    });

    // Sort by timestamp descending (newest first)
    filteredEvents.sort((a: any, b: any) => {
      const timeA = new Date(a.receivedAt || a.timestamp).getTime();
      const timeB = new Date(b.receivedAt || b.timestamp).getTime();
      return timeB - timeA;
    });

    // Limit to 50 most recent
    const limitedEvents = filteredEvents.slice(0, 50);

    // Get endpoints to enrich event data
    let endpoints: any[] = [];
    try {
      endpoints = await getTenantEndpoints(tenantId);
      context.log("[DASHBOARD_EVENTS] ✅ Fetched endpoints", { count: endpoints.length });
    } catch (endpointError: any) {
      context.error("[DASHBOARD_EVENTS] Failed to fetch endpoints", { error: endpointError.message });
    }

    // Enrich events with endpoint names
    const enrichedEvents = limitedEvents.map(event => {
      if (event.endpointId) {
        const endpoint = endpoints.find(ep => ep.rowKey === event.endpointId);
        if (endpoint) {
          return {
            ...event,
            endpointName: endpoint.name,
            endpointUrl: endpoint.url,
          };
        }
      }
      return event;
    });

    context.log("[DASHBOARD_EVENTS] ✅ Returning events", { 
      total: events.length, 
      filtered: filteredEvents.length,
      returned: enrichedEvents.length 
    });

    return {
      status: 200,
      jsonBody: {
        items: enrichedEvents,
        total: filteredEvents.length,
        nextCursor: null
      }
    };
  } catch (error: any) {
    context.error("[DASHBOARD_EVENTS] ❌ Error", { error: error.message, stack: error.stack });
    return {
      status: 500,
      jsonBody: { error: "Internal server error" }
    };
  }
}

app.http("dashboardEvents", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: dashboardEvents
});
