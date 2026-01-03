
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateApiKey } from "../lib/auth";

type AlertPayload = {
  url: string;
  status: "UP" | "DOWN";
  httpStatus?: number;
  timestamp: string;
};

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL!;

export async function alertWebhook(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
  if (!apiKey) {
    return { status: 401, body: "Invalid or missing API key" };
  }
  const keyInfo = validateApiKey(apiKey);
  if (!keyInfo) {
    return { status: 401, body: "Invalid or missing API key" };
  }

  const body = (await req.json()) as AlertPayload;

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

app.http("alertWebhook", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: alertWebhook
});