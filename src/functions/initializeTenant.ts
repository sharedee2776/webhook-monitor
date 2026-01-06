import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createTenant } from "../shared/tenantStore";
import { TableClient } from "@azure/data-tables";
import crypto from "crypto";

const apiKeysTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "ApiKeys"
);

/**
 * Generate a secure random API key
 */
function generateApiKey(): string {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Initialize tenant - creates tenant record and generates API key
 * This endpoint is called when a user first signs up
 */
app.http("initializeTenant", {
  route: "tenant/initialize",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = (await req.json().catch(() => ({}))) as { tenantId?: string; plan?: string };
      const tenantId = body.tenantId;
      
      if (!tenantId) {
        return { status: 400, jsonBody: { error: "Missing tenantId" } };
      }

      const plan = (body.plan as "free" | "pro" | "team") || "free";

      // Create tenant
      const tenant = await createTenant(tenantId, plan);
      context.log(`Tenant created: ${tenantId} with plan: ${plan}`);

      // Generate API key
      const apiKey = generateApiKey();
      const entity = {
        partitionKey: "tenant",
        rowKey: apiKey,
        tenantId: tenantId,
        plan: plan,
        active: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await apiKeysTable.createEntity(entity);
        context.log(`API key created for tenant: ${tenantId}`);
      } catch (error: any) {
        // If table doesn't exist, create it
        if (error.statusCode === 404 || error.message?.includes("does not exist")) {
          try {
            await apiKeysTable.createTable();
            await apiKeysTable.createEntity(entity);
            context.log(`ApiKeys table created and API key added for tenant: ${tenantId}`);
          } catch (createError: any) {
            context.error(`Failed to create ApiKeys table: ${createError.message}`);
            return {
              status: 500,
              jsonBody: { error: "Failed to create API key", details: createError.message }
            };
          }
        } else {
          throw error;
        }
      }

      return {
        status: 200,
        jsonBody: {
          tenantId: tenant.tenantId,
          plan: tenant.plan,
          apiKey: apiKey, // Return API key to frontend (only time it's exposed)
          message: "Tenant initialized successfully"
        }
      };
    } catch (error: any) {
      context.error("Error initializing tenant:", error);
      return {
        status: 500,
        jsonBody: { error: "Failed to initialize tenant", details: error.message }
      };
    }
  }
});
