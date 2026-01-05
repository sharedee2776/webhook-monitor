"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uptimeCheck = uptimeCheck;
const functions_1 = require("@azure/functions");
const data_tables_1 = require("@azure/data-tables");
const crypto_1 = require("crypto");
/**
 * Table clients
 */
const monitoredUrlsClient = data_tables_1.TableClient.fromConnectionString(process.env.AzureWebJobsStorage, "MonitoredUrls");
const uptimeChecksClient = data_tables_1.TableClient.fromConnectionString(process.env.AzureWebJobsStorage, "UptimeChecks");
const alertStateClient = data_tables_1.TableClient.fromConnectionString(process.env.AzureWebJobsStorage, "AlertState");
/**
 * ALERT WEBHOOK URL
 */
const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL ||
    "https://webhookmonitor.shop/api/alertWebhook";
/**
 * Create safe RowKey (Azure Table compatible)
 */
function createStateKey(tenantId, url) {
    return (0, crypto_1.createHash)("sha256")
        .update(`${tenantId}:${url}`)
        .digest("hex");
}
async function uptimeCheck(myTimer, context) {
    context.log("Starting uptime check with alert deduplication...");
    const urls = monitoredUrlsClient.listEntities();
    for await (const entity of urls) {
        const tenantId = entity.partitionKey;
        const url = entity.url;
        const stateKey = createStateKey(tenantId, url);
        let previousStatus = "UP";
        // 🔍 Load previous alert state (safe lookup)
        try {
            const state = await alertStateClient.getEntity(tenantId, stateKey);
            previousStatus = state.status;
        }
        catch (err) {
            if (err.statusCode !== 404) {
                throw err;
            }
        }
        const startTime = Date.now();
        let status = "UP";
        let httpStatus = 0;
        try {
            const response = await fetch(url);
            httpStatus = response.status;
            if (!response.ok)
                status = "DOWN";
        }
        catch {
            status = "DOWN";
        }
        const responseTimeMs = Date.now() - startTime;
        // 📊 Store uptime check result
        await uptimeChecksClient.createEntity({
            partitionKey: tenantId,
            rowKey: (0, crypto_1.randomUUID)(),
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
functions_1.app.timer("uptimeCheck", {
    schedule: "0 */5 * * * *",
    handler: uptimeCheck
});
//# sourceMappingURL=uptimeCheck.js.map