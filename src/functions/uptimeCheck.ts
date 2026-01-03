import { app, InvocationContext, Timer } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { randomUUID, createHash } from "crypto";

/**
 * Table clients
 */
const monitoredUrlsClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "MonitoredUrls"
);

const uptimeChecksClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "UptimeChecks"
);

const alertStateClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "AlertState"
);

/**
 * ALERT WEBHOOK URL
 */
const ALERT_WEBHOOK_URL =
  process.env.ALERT_WEBHOOK_URL ||
  "http://localhost:7071/api/alertWebhook";

/**
 * Create safe RowKey (Azure Table compatible)
 */
function createStateKey(tenantId: string, url: string): string {
  return createHash("sha256")
    .update(`${tenantId}:${url}`)
    .digest("hex");
}

export async function uptimeCheck(
  myTimer: Timer,
  context: InvocationContext
): Promise<void> {
  context.log("Starting uptime check with alert deduplication...");

  const urls = monitoredUrlsClient.listEntities();

  for await (const entity of urls) {
    const tenantId = entity.partitionKey as string;
    const url = entity.url as string;
    const stateKey = createStateKey(tenantId, url);

    let previousStatus: "UP" | "DOWN" = "UP";

    // 🔍 Load previous alert state (safe lookup)
    try {
      const state = await alertStateClient.getEntity(
        tenantId,
        stateKey
      );
      previousStatus = state.status as "UP" | "DOWN";
    } catch (err: any) {
      if (err.statusCode !== 404) {
        throw err;
      }
    }

    const startTime = Date.now();
    let status: "UP" | "DOWN" = "UP";
    let httpStatus = 0;

    try {
      const response = await fetch(url);
      httpStatus = response.status;
      if (!response.ok) status = "DOWN";
    } catch {
      status = "DOWN";
    }

    const responseTimeMs = Date.now() - startTime;

    // 📊 Store uptime check result
    await uptimeChecksClient.createEntity({
      partitionKey: tenantId,
      rowKey: randomUUID(),
      url,
      status,
      httpStatus,
      responseTimeMs,
      checkedAt: new Date().toISOString()
    });

    // 🔔 Alert only on UP → DOWN
    if (previousStatus === "UP" && status === "DOWN") {
      await fetch(ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          url,
          status,
          httpStatus,
          responseTimeMs,
          timestamp: new Date().toISOString()
        })
      });

      context.log(`[ALERT] ${url} is DOWN`);
    }

    // 🟢 Recovery log
    if (previousStatus === "DOWN" && status === "UP") {
      context.log(`[RECOVERY] ${url} is UP`);
    }

    // 💾 Update alert state (hashed RowKey)
    await alertStateClient.upsertEntity({
      partitionKey: tenantId,
      rowKey: stateKey,
      url,
      status,
      updatedAt: new Date().toISOString()
    });
  }
}

app.timer("uptimeCheck", {
  schedule: "0 */5 * * * *",
  handler: uptimeCheck
});
