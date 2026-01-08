import { TableClient } from "@azure/data-tables";

const connectionString = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const integrationsTable = connectionString
  ? TableClient.fromConnectionString(connectionString, "Integrations")
  : null;

export type IntegrationType = 'slack' | 'discord' | 'zapier' | 'teams';

export interface IntegrationEntity {
  // Partition Key: tenantId
  // Row Key: integrationType (e.g., 'slack', 'discord')
  partitionKey: string; // tenantId
  rowKey: string; // integrationType
  integrationType: IntegrationType;
  accessToken?: string; // Encrypted OAuth access token
  refreshToken?: string; // Encrypted OAuth refresh token
  webhookUrl?: string; // Webhook URL (for Discord, Zapier)
  channelId?: string; // Channel/workspace ID
  teamId?: string; // Team/workspace ID (for Slack, Teams)
  connectedAt: string; // ISO timestamp
  settings?: string; // JSON stringified settings (notification preferences, etc.)
  active: boolean;
}

/**
 * Save or update integration connection
 */
export async function saveIntegration(integration: IntegrationEntity): Promise<void> {
  if (!integrationsTable) {
    console.warn("Azure Table Storage not configured, integration not saved");
    return;
  }

  try {
    await integrationsTable.upsertEntity(integration, "Replace");
  } catch (error: any) {
    if (error.statusCode === 404 || error.message?.includes("does not exist")) {
      try {
        await integrationsTable.createTable();
        await integrationsTable.upsertEntity(integration, "Replace");
      } catch (createError) {
        console.error("Failed to create Integrations table:", createError);
        throw createError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get integration for a tenant
 */
export async function getIntegration(
  tenantId: string,
  integrationType: IntegrationType
): Promise<IntegrationEntity | null> {
  if (!integrationsTable) {
    return null;
  }

  try {
    const entity = await integrationsTable.getEntity(tenantId, integrationType);
    return {
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      integrationType: (entity.integrationType as IntegrationType) || integrationType,
      accessToken: entity.accessToken as string | undefined,
      refreshToken: entity.refreshToken as string | undefined,
      webhookUrl: entity.webhookUrl as string | undefined,
      channelId: entity.channelId as string | undefined,
      teamId: entity.teamId as string | undefined,
      connectedAt: (entity.connectedAt as string) || new Date().toISOString(),
      settings: entity.settings as string | undefined,
      active: (entity.active as boolean) ?? true,
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all integrations for a tenant
 */
export async function getTenantIntegrations(tenantId: string): Promise<IntegrationEntity[]> {
  if (!integrationsTable) {
    return [];
  }

  try {
    const integrations: IntegrationEntity[] = [];
    const query = integrationsTable.listEntities<IntegrationEntity>({
      queryOptions: {
        filter: `PartitionKey eq '${tenantId}' and active eq true`,
      },
    });

    for await (const entity of query) {
      integrations.push(entity as IntegrationEntity);
    }
    return integrations;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return [];
    }
    console.error("Error querying integrations:", error);
    return [];
  }
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  tenantId: string,
  integrationType: IntegrationType
): Promise<void> {
  if (!integrationsTable) {
    return;
  }

  try {
    const entity = await integrationsTable.getEntity(tenantId, integrationType);
    await integrationsTable.updateEntity({
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      ...entity,
      active: false,
    }, "Replace");
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Already disconnected or never connected
      return;
    }
    throw error;
  }
}
