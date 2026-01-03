import fs from "fs";
import path from "path";


// Always use devApiKeys.json from project root
const keysPath = path.resolve(process.cwd(), 'devApiKeys.json');


export interface ApiKeyData {
  tenantId: string;
  plan?: string;
  usage?: number;
  createdAt?: string;
}

export const validateApiKey = (apiKey: string): ApiKeyData | null => {
  if (!apiKey) return null;
  if (!fs.existsSync(keysPath)) return null;

  const keys = JSON.parse(fs.readFileSync(keysPath, "utf8"));
  console.error("[DEBUG] Loaded API keys:", keys);
  const data = keys[apiKey];
  if (!data) return null;
  // Always return tenantId, plan, usage if present
  console.error(`[DEBUG] API key lookup for ${apiKey}:`, data);
  return {
    tenantId: data.tenantId,
    plan: data.plan,
    usage: data.usage,
    createdAt: data.createdAt
  };
};
import { TableClient } from "@azure/data-tables";

const apiKeysTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "ApiKeys"
);

export async function authenticateApiKey(apiKey?: string): Promise<{
  tenantId: string;
  plan: string;
} | null> {
  if (!apiKey) return null;

  try {
    const entity = await apiKeysTable.getEntity("tenant", apiKey);

    if (entity.active !== true) return null;

    return {
      tenantId: entity.tenantId as string,
      plan: (entity.plan as string) ?? "free"
    };
  } catch {
    return null;
  }
}