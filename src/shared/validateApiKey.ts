import { TableClient } from "@azure/data-tables";

const apiKeysClient = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "ApiKeys"
);

export async function validateApiKey(apiKey?: string) {
  if (!apiKey) {
    return null;
  }

  for await (const entity of apiKeysClient.listEntities()) {
    if (entity.apiKey === apiKey) {
      return {
        tenantId: entity.rowKey as string,
        plan: entity.plan as string
      };
    }
  }

  return null;
}