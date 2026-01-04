"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const EMAILS_PATH = path_1.default.join(process.cwd(), "data", "alertEmails.json");
function readEmails() {
    if (!fs_1.default.existsSync(EMAILS_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(EMAILS_PATH, "utf-8"));
}
function writeEmails(data) {
    fs_1.default.writeFileSync(EMAILS_PATH, JSON.stringify(data, null, 2));
}
functions_1.app.http("alertEmailConfig", {
    route: "alert/email-config",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: async (req, context) => {
        // Use API key as identifier
        const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
        if (!apiKey) {
            return { status: 401, body: "Invalid or missing API key" };
        }
        const emails = readEmails();
        if (req.method === "GET") {
            return { status: 200, jsonBody: { email: emails[apiKey] || null } };
        }
        if (req.method === "POST") {
            const body = (await req.json().catch(() => ({})));
            const email = body.email;
            if (!email || typeof email !== "string") {
                return { status: 400, jsonBody: { error: "Missing or invalid email" } };
            }
            emails[apiKey] = email;
            writeEmails(emails);
            return { status: 200, jsonBody: { email } };
        }
        return { status: 405, body: "Method not allowed" };
    }
});
//# sourceMappingURL=alertEmailConfig.js.map