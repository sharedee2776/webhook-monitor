"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardEvents = dashboardEvents;
const functions_1 = require("@azure/functions");
const auth_1 = require("../lib/auth");
const eventStore_1 = require("../shared/eventStore");
const retention_1 = require("../config/retention");
async function dashboardEvents(request, context) {
    // 🔐 API key auth
    const apiKey = request.headers.get("x-api-key") ?? request.headers.get("X-API-Key");
    if (!apiKey) {
        return { status: 401, body: "Invalid or missing API key" };
    }
    const keyInfo = (0, auth_1.validateApiKey)(apiKey);
    if (!keyInfo) {
        return { status: 401, body: "Invalid or missing API key" };
    }
    const plan = keyInfo.plan ?? "free";
    const retentionMs = retention_1.RETENTION_BY_PLAN[plan] ?? retention_1.RETENTION_BY_PLAN.free;
    const cutoff = Date.now() - retentionMs;
    const tenantId = keyInfo.tenantId;
    const events = (0, eventStore_1.getEventsForTenant)(tenantId);
    // Filter events by retention
    const filteredEvents = events.filter((e) => {
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
functions_1.app.http("dashboardEvents", {
    methods: ["GET"],
    authLevel: "anonymous",
    handler: dashboardEvents
});
//# sourceMappingURL=dashboardEvents.js.map