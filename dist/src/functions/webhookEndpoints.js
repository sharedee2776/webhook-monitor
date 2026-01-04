"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ENDPOINTS_PATH = path_1.default.join(process.cwd(), "data", "webhookEndpoints.json");
function readEndpoints() {
    if (!fs_1.default.existsSync(ENDPOINTS_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(ENDPOINTS_PATH, "utf-8"));
}
function writeEndpoints(data) {
    fs_1.default.writeFileSync(ENDPOINTS_PATH, JSON.stringify(data, null, 2));
}
functions_1.app.http("webhookEndpoints", {
    route: "webhook/endpoints",
    methods: ["GET", "POST", "DELETE"],
    authLevel: "anonymous",
    handler: async (req, context) => {
        // Use API key as identifier
        const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
        if (!apiKey) {
            return { status: 401, body: "Invalid or missing API key" };
        }
        let endpoints = readEndpoints();
        endpoints[apiKey] = endpoints[apiKey] || [];
        if (req.method === "GET") {
            return { status: 200, jsonBody: { endpoints: endpoints[apiKey] } };
        }
        if (req.method === "POST") {
            const body = (await req.json().catch(() => ({})));
            const { name, url, active } = body;
            if (!name || !url) {
                return { status: 400, jsonBody: { error: "Missing name or url" } };
            }
            const newEndpoint = { id: Date.now(), name, url, active: !!active };
            endpoints[apiKey].push(newEndpoint);
            writeEndpoints(endpoints);
            return { status: 201, jsonBody: { endpoint: newEndpoint } };
        }
        if (req.method === "DELETE") {
            const body = (await req.json().catch(() => ({})));
            const id = body.id;
            if (!id) {
                return { status: 400, jsonBody: { error: "Missing id" } };
            }
            endpoints[apiKey] = endpoints[apiKey].filter((ep) => ep.id !== id);
            writeEndpoints(endpoints);
            return { status: 200, jsonBody: { endpoints: endpoints[apiKey] } };
        }
        return { status: 405, body: "Method not allowed" };
    }
});
//# sourceMappingURL=webhookEndpoints.js.map