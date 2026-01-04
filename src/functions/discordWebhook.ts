
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// In a real app, store this in a database per user/tenant, not in memory
const discordWebhooks: Record<string, string> = {};

export async function discordIntegration(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  const userId = req.headers.get("x-user-id") || "demo"; // Replace with real auth


  if (req.method === "POST") {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return { status: 400, body: "Invalid JSON body" };
    }
    if (!body || typeof body !== "object" || Array.isArray(body) || !('webhookUrl' in body) || typeof (body as any).webhookUrl !== "string") {
      return { status: 400, body: "Missing or invalid webhookUrl" };
    }
    const webhookUrl = (body as any).webhookUrl;
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

app.http("discordIntegration", {
  route: "discord/integration",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: discordIntegration,
});
