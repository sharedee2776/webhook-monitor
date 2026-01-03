"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertWebhook = alertWebhook;
const functions_1 = require("@azure/functions");
const auth_1 = require("../lib/auth");
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
async function alertWebhook(req, context) {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    if (!apiKey) {
        return { status: 401, body: "Invalid or missing API key" };
    }
    const keyInfo = (0, auth_1.validateApiKey)(apiKey);
    if (!keyInfo) {
        return { status: 401, body: "Invalid or missing API key" };
    }
    const body = (await req.json());
    context.log(`[ALERT] ${body.url} is ${body.status}`);
    if (DISCORD_WEBHOOK_URL) {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: `🚨 **Uptime Alert**\nURL: ${body.url}\nStatus: ${body.status}\nHTTP Status: ${body.httpStatus ?? "N/A"}\nTime: ${body.timestamp}`
            })
        });
    }
    return { status: 200 };
}
functions_1.app.http("alertWebhook", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: alertWebhook
});
//# sourceMappingURL=alertWebhook.js.map