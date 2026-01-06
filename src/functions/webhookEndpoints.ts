import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import fs from "fs";
import path from "path";
import { authenticateApiKey } from "../lib/auth";

const ENDPOINTS_PATH = path.join(process.cwd(), "data", "webhookEndpoints.json");

function readEndpoints(): Record<string, any[]> {
  if (!fs.existsSync(ENDPOINTS_PATH)) return {};
  return JSON.parse(fs.readFileSync(ENDPOINTS_PATH, "utf-8"));
}

function writeEndpoints(data: Record<string, any[]>) {
  fs.writeFileSync(ENDPOINTS_PATH, JSON.stringify(data, null, 2));
}

app.http("webhookEndpoints", {
  route: "webhook/endpoints",
  methods: ["GET", "POST", "DELETE"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
    const auth = await authenticateApiKey(apiKey || undefined, req, "webhook/endpoints");
    if (!auth) {
      return { status: 401, body: "Invalid or missing API key" };
    }
    let endpoints = readEndpoints();
    // Use tenantId as identifier instead of raw API key
    const tenantKey = auth.tenantId;
    endpoints[tenantKey] = endpoints[tenantKey] || [];

    if (req.method === "GET") {
      return { status: 200, jsonBody: { endpoints: endpoints[tenantKey] } };
    }

    if (req.method === "POST") {
      const body = (await req.json().catch(() => ({}))) as { name?: string; url?: string; active?: boolean };
      const { name, url, active } = body;
      if (!name || !url) {
        return { status: 400, jsonBody: { error: "Missing name or url" } };
      }
      const newEndpoint = { id: Date.now(), name, url, active: !!active };
      endpoints[tenantKey].push(newEndpoint);
      writeEndpoints(endpoints);
      return { status: 201, jsonBody: { endpoint: newEndpoint } };
    }

    if (req.method === "DELETE") {
      const body = (await req.json().catch(() => ({}))) as { id?: number };
      const id = body.id;
      if (!id) {
        return { status: 400, jsonBody: { error: "Missing id" } };
      }
      endpoints[tenantKey] = endpoints[tenantKey].filter((ep: any) => ep.id !== id);
      writeEndpoints(endpoints);
      return { status: 200, jsonBody: { endpoints: endpoints[tenantKey] } };
    }

    return { status: 405, body: "Method not allowed" };
  }
});
