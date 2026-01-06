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
import { logSecurityEvent, getClientIp } from "../shared/securityAudit";

const apiKeysTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "ApiKeys"
);

export async function authenticateApiKey(
  apiKey?: string,
  request?: any,
  endpoint?: string
): Promise<{
  tenantId: string;
  plan: string;
} | null> {
  if (!apiKey) {
    if (request) {
      await logSecurityEvent({
        eventType: "auth_failure",
        ipAddress: getClientIp(request),
        userAgent: request.headers?.get("user-agent"),
        endpoint,
        errorMessage: "Missing API key",
      });
    }
    return null;
  }

  try {
    const entity = await apiKeysTable.getEntity("tenant", apiKey);

    if (entity.active !== true) {
      if (request) {
        await logSecurityEvent({
          eventType: "auth_failure",
          tenantId: entity.tenantId as string | undefined,
          apiKey,
          ipAddress: getClientIp(request),
          userAgent: request.headers?.get("user-agent"),
          endpoint,
          errorMessage: "API key is inactive",
        });
      }
      return null;
    }

    // Check if API key has expired
    const expiresAt = entity.expiresAt as string | undefined;
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (expirationDate < new Date()) {
        // Key has expired
        if (request) {
          await logSecurityEvent({
            eventType: "auth_expired",
            tenantId: entity.tenantId as string | undefined,
            apiKey,
            ipAddress: getClientIp(request),
            userAgent: request.headers?.get("user-agent"),
            endpoint,
            errorMessage: "API key has expired",
          });
        }
        return null;
      }
    }

    // Log successful authentication
    if (request) {
      await logSecurityEvent({
        eventType: "auth_success",
        tenantId: entity.tenantId as string,
        apiKey,
        ipAddress: getClientIp(request),
        userAgent: request.headers?.get("user-agent"),
        endpoint,
      });
    }

    return {
      tenantId: entity.tenantId as string,
      plan: (entity.plan as string) ?? "free"
    };
  } catch (error: any) {
    if (request) {
      await logSecurityEvent({
        eventType: "auth_failure",
        apiKey,
        ipAddress: getClientIp(request),
        userAgent: request.headers?.get("user-agent"),
        endpoint,
        errorMessage: error.message || "Authentication error",
      });
    }
    return null;
  }
}