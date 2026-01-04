"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discordIntegration = discordIntegration;
const functions_1 = require("@azure/functions");
// In a real app, store this in a database per user/tenant, not in memory
const discordWebhooks = {};
async function discordIntegration(req, context) {
    const userId = req.headers.get("x-user-id") || "demo"; // Replace with real auth
    if (req.method === "POST") {
        let body;
        try {
            body = await req.json();
        }
        catch {
            return { status: 400, body: "Invalid JSON body" };
        }
        if (!body || typeof body !== "object" || Array.isArray(body) || !('webhookUrl' in body) || typeof body.webhookUrl !== "string") {
            return { status: 400, body: "Missing or invalid webhookUrl" };
        }
        const webhookUrl = body.webhookUrl;
        // Save webhook URL (replace with DB in production)
        discordWebhooks[userId] = webhookUrl;
        return { status: 200, body: "Webhook URL saved" };
    }
    if (req.method === "GET") {
        const url = discordWebhooks[userId];
        return { status: 200, jsonBody: { webhookUrl: url || null } };
    }
    return { status: 405, body: "Method not allowed" };
}
functions_1.app.http("discordIntegration", {
    route: "discord/integration",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: discordIntegration,
});
//# sourceMappingURL=discordWebhook.js.map