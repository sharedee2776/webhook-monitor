import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import fs from "fs";
import path from "path";
import { authenticateApiKey } from "../lib/auth";

const EMAILS_PATH = path.join(process.cwd(), "data", "alertEmails.json");

function readEmails(): Record<string, string> {
  if (!fs.existsSync(EMAILS_PATH)) return {};
  return JSON.parse(fs.readFileSync(EMAILS_PATH, "utf-8"));
}

function writeEmails(data: Record<string, string>) {
  fs.writeFileSync(EMAILS_PATH, JSON.stringify(data, null, 2));
}

app.http("alertEmailConfig", {
  route: "alert/email-config",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    const auth = await authenticateApiKey(apiKey || undefined, req, "alert/email-config");
    if (!auth) {
      return { status: 401, body: "Invalid or missing API key" };
    }
    const emails = readEmails();
    const tenantKey = auth.tenantId;

    if (req.method === "GET") {
      return { status: 200, jsonBody: { email: emails[tenantKey] || null } };
    }

    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { email?: string };
      const email = body.email;
      if (!email || typeof email !== "string") {
        return { status: 400, jsonBody: { error: "Missing or invalid email" } };
      }
      emails[tenantKey] = email;
      writeEmails(emails);
      return { status: 200, jsonBody: { email } };
    }

    return { status: 405, body: "Method not allowed" };
  }
});
