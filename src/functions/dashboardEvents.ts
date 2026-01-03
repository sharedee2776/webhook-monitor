import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateApiKey } from "../lib/auth";


import { getUsage } from "../shared/usageTracker";
import { getEventsForTenant } from "../shared/eventStore";
import { RETENTION_BY_PLAN } from "../config/retention";

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


  // 🔐 API key auth
  const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
  if (!apiKey) {
    return { status: 401, body: "Invalid or missing API key" };
  }
  const keyInfo = validateApiKey(apiKey);
  if (!keyInfo) {
    return { status: 401, body: "Invalid or missing API key" };
  }


  const plan = (keyInfo as any).plan ?? "free";
  const retentionMs = RETENTION_BY_PLAN[plan] ?? RETENTION_BY_PLAN.free;
  const cutoff = Date.now() - retentionMs;

  const tenantId = keyInfo.tenantId;
  const events = getEventsForTenant(tenantId);

  // Filter events by retention
  const filteredEvents = events.filter((e: any) => {
    return new Date(e.receivedAt).getTime() >= cutoff;
  });

  return {
    status: 200,
    jsonBody: {
      items: filteredEvents,
      nextCursor: null
    }
  };
}

app.http("dashboardEvents", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: dashboardEvents
});
