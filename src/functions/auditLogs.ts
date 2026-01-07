import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { authenticateApiKey } from "../lib/auth";

const auditLogTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "SecurityAuditLog"
);

/**
 * Get audit logs for authenticated tenant
 */
app.http("auditLogs", {
  route: "audit-logs",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Authenticate using API key to get tenant ID
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      const auth = await authenticateApiKey(apiKey || undefined, req, "audit-logs");
      
      if (!auth) {
        return { status: 401, jsonBody: { error: "Invalid or missing API key" } };
      }

      const tenantId = auth.tenantId;
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const offset = parseInt(url.searchParams.get("offset") || "0", 10);

      // Query audit logs for this tenant
      const logs: Array<{
        id: string;
        date: string;
        user: string;
        action: string;
        details: string;
      }> = [];

      try {
        const entities = auditLogTable.listEntities({
          queryOptions: {
            filter: `PartitionKey eq '${tenantId}' or PartitionKey eq 'system'`,
            select: ["PartitionKey", "RowKey", "eventType", "timestamp", "endpoint", "method", "errorMessage", "ipAddress"]
          }
        });

        let count = 0;
        for await (const entity of entities) {
          if (count < offset) {
            count++;
            continue;
          }
          if (logs.length >= limit) break;

          logs.push({
            id: entity.rowKey as string,
            date: new Date(entity.timestamp as string).toLocaleString(),
            user: (entity.PartitionKey as string) || "system",
            action: (entity.eventType as string) || "unknown",
            details: entity.errorMessage 
              ? `${entity.endpoint || "unknown"} - ${entity.errorMessage}`
              : `${entity.endpoint || "unknown"} (${entity.method || "unknown"}) - ${entity.ipAddress || "unknown IP"}`
          });
          count++;
        }
      } catch (error: any) {
        context.error("Error querying audit logs:", error);
        // Return empty array if table doesn't exist yet
        if (error.statusCode === 404 || error.message?.includes("does not exist")) {
          return {
            status: 200,
            jsonBody: { logs: [], total: 0 }
          };
        }
        throw error;
      }

      return {
        status: 200,
        jsonBody: {
          logs: logs.reverse(), // Most recent first
          total: logs.length,
          limit,
          offset
        }
      };
    } catch (error: any) {
      context.error("Error in auditLogs:", error);
      return {
        status: 500,
        jsonBody: { error: "Internal server error", details: error.message }
      };
    }
  }
});
