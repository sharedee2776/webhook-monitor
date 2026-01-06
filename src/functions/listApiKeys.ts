import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { authenticateApiKey } from "../lib/auth";

const apiKeysTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "ApiKeys"
);

/**
 * List API keys for a tenant
 * Requires API key authentication (to get tenant ID)
 */
app.http("listApiKeys", {
  route: "api-keys/list",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Authenticate using API key to get tenant ID
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      const auth = await authenticateApiKey(apiKey || undefined, req, "api-keys/list");
      
      if (!auth) {
        return { status: 401, jsonBody: { error: "Invalid or missing API key" } };
      }

      const tenantId = auth.tenantId;

      // Query all API keys for this tenant
      const keys: Array<{
        key: string;
        active: boolean;
        createdAt?: string;
        expiresAt?: string;
      }> = [];

      try {
        const entities = apiKeysTable.listEntities({
          queryOptions: {
            filter: `tenantId eq '${tenantId}'`
          }
        });

        for await (const entity of entities) {
          keys.push({
            key: entity.rowKey as string,
            active: entity.active === true,
            createdAt: entity.createdAt as string | undefined,
            expiresAt: entity.expiresAt as string | undefined,
          });
        }
      } catch (error: any) {
        context.error("Error listing API keys:", error);
        return {
          status: 500,
          jsonBody: { error: "Failed to list API keys", details: error.message }
        };
      }

      return {
        status: 200,
        jsonBody: {
          tenantId,
          keys: keys.map(k => ({
            // Only show partial key for security (first 8 chars + last 4 chars)
            key: k.key.substring(0, 8) + "..." + k.key.slice(-4),
            fullKey: k.key, // Include full key (user is authenticated)
            active: k.active,
            createdAt: k.createdAt,
            expiresAt: k.expiresAt,
          }))
        }
      };
    } catch (error: any) {
      context.error("Error in listApiKeys:", error);
      return {
        status: 500,
        jsonBody: { error: "Internal server error", details: error.message }
      };
    }
  }
});
