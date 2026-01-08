import { getTenantIntegrations, IntegrationType } from "./integrationsStore";

interface EventNotification {
  eventType: string;
  payload: any;
  receivedAt: string;
  source: string;
}

/**
 * Send notification to Discord
 */
async function notifyDiscord(
  webhookUrl: string,
  event: EventNotification
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: `🔔 Webhook Event: ${event.eventType}`,
            description: `**Source:** ${event.source}\n**Time:** ${new Date(event.receivedAt).toLocaleString()}`,
            fields: [
              {
                name: "Payload",
                value: `\`\`\`json\n${JSON.stringify(event.payload, null, 2)}\n\`\`\``,
              },
            ],
            color: 0x4f46e5, // Primary color
            timestamp: event.receivedAt,
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
    return false;
  }
}

/**
 * Notify all connected integrations for a tenant
 */
export async function notifyIntegrations(
  tenantId: string,
  event: EventNotification
): Promise<void> {
  const integrations = await getTenantIntegrations(tenantId);

  const notificationPromises = integrations.map(async (integration) => {
    if (!integration.active) return;

    let success = false;

    switch (integration.integrationType) {
      case "discord":
        if (integration.webhookUrl) {
          success = await notifyDiscord(integration.webhookUrl, event);
        }
        break;
      // Slack, Zapier, Teams coming soon
    }

    if (!success) {
      console.warn(`Failed to notify ${integration.integrationType} for tenant ${tenantId}`);
    }
  });

  await Promise.allSettled(notificationPromises);
}
