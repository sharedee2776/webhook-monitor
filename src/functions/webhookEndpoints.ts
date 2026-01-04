import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import fs from "fs";
import path from "path";

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
      const body = (await req.json().catch(() => ({}))) as { name?: string; url?: string; active?: boolean };
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
      const body = (await req.json().catch(() => ({}))) as { id?: number };
      const id = body.id;
      if (!id) {
        return { status: 400, jsonBody: { error: "Missing id" } };
      }
      endpoints[apiKey] = endpoints[apiKey].filter((ep: any) => ep.id !== id);
      writeEndpoints(endpoints);
      return { status: 200, jsonBody: { endpoints: endpoints[apiKey] } };
    }

    return { status: 405, body: "Method not allowed" };
  }
});
