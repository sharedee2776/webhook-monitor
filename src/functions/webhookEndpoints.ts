import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateApiKey } from "../lib/auth";
import { 
  saveWebhookEndpoint, 
  getTenantEndpoints, 
  getEndpoint, 
  deleteEndpoint,
  updateEndpointStatus 
} from "../shared/webhookEndpointsStore";

/**
 * GET /api/webhook/endpoints
 * List all webhook endpoints for the authenticated tenant
 */
app.http("webhookEndpointsGet", {
  route: "webhook/endpoints",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      if (!apiKey) {
        return { 
          status: 401, 
          jsonBody: { error: "Missing API key" } 
        };
      }

      const auth = await authenticateApiKey(apiKey, req, "/api/webhook/endpoints");
      if (!auth) {
        return { 
          status: 401, 
          jsonBody: { error: "Invalid API key" } 
        };
      }

      const tenantId = auth.tenantId;
      const endpoints = await getTenantEndpoints(tenantId);

      // Get events to find last delivery time for each endpoint
      const { getEventsForTenantFromTable } = await import("../shared/eventTableStore");
      let events: any[] = [];
      try {
        events = await getEventsForTenantFromTable(tenantId, 100);
      } catch (err) {
        context.log("Failed to fetch events for last delivery time", { error: err });
      }

      // Format for frontend with last delivery time
      const formattedEndpoints = endpoints.map(ep => {
        // Find most recent event for this endpoint
        const endpointEvents = events.filter(e => e.endpointId === ep.rowKey);
        const lastEvent = endpointEvents.length > 0 
          ? endpointEvents.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )[0]
          : null;
        
        return {
          id: ep.rowKey,
          name: ep.name,
          url: ep.url,
          active: ep.active,
          createdAt: ep.createdAt,
          lastDeliveryTime: lastEvent ? lastEvent.timestamp : null,
          lastDeliveryStatus: lastEvent ? lastEvent.status : null,
        };
      });

      return { 
        status: 200, 
        jsonBody: { endpoints: formattedEndpoints } 
      };
    } catch (error: any) {
      context.error("Error fetching endpoints:", error);
      return {
        status: 500,
        jsonBody: { error: "Internal server error. Please try again later." },
      };
    }
  },
});

/**
 * POST /api/webhook/endpoints
 * Create a new webhook endpoint for the authenticated tenant
 */
app.http("webhookEndpointsPost", {
  route: "webhook/endpoints",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      if (!apiKey) {
        return { 
          status: 401, 
          jsonBody: { error: "Missing API key" } 
        };
      }

      const auth = await authenticateApiKey(apiKey, req, "/api/webhook/endpoints");
      if (!auth) {
        return { 
          status: 401, 
          jsonBody: { error: "Invalid API key" } 
        };
      }

      const body = await req.json().catch(() => ({})) as { 
        name?: string; 
        url?: string; 
        active?: boolean;
        id?: string;
      };

      const { name, url, active } = body;

      // Validate required fields
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return { 
          status: 400, 
          jsonBody: { error: "Name is required and must be a non-empty string" } 
        };
      }

      if (!url || typeof url !== "string" || url.trim().length === 0) {
        return { 
          status: 400, 
          jsonBody: { error: "URL is required and must be a non-empty string" } 
        };
      }

      const tenantId = auth.tenantId;

      try {
        const savedEndpoint = await saveWebhookEndpoint(tenantId, {
          id: body.id,
          name: name.trim(),
          url: url.trim(),
          active: active !== undefined ? active : true,
        });

        return {
          status: 201,
          jsonBody: {
            endpoint: {
              id: savedEndpoint.rowKey,
              name: savedEndpoint.name,
              url: savedEndpoint.url,
              active: savedEndpoint.active,
              createdAt: savedEndpoint.createdAt,
            },
          },
        };
      } catch (saveError: any) {
        context.error("Error saving endpoint:", saveError);
        // Check if it's a validation error
        if (saveError.message && (
          saveError.message.includes("Invalid URL") ||
          saveError.message.includes("already exists") ||
          saveError.message.includes("required")
        )) {
          return {
            status: 400,
            jsonBody: { error: saveError.message },
          };
        }
        throw saveError;
      }
    } catch (error: any) {
      context.error("Error creating endpoint:", error);
      return {
        status: 500,
        jsonBody: { error: "Internal server error. Please try again later." },
      };
    }
  },
});

/**
 * DELETE /api/webhook/endpoints
 * Delete a webhook endpoint by ID
 */
app.http("webhookEndpointsDelete", {
  route: "webhook/endpoints",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      if (!apiKey) {
        return { 
          status: 401, 
          jsonBody: { error: "Missing API key" } 
        };
      }

      const auth = await authenticateApiKey(apiKey, req, "/api/webhook/endpoints");
      if (!auth) {
        return { 
          status: 401, 
          jsonBody: { error: "Invalid API key" } 
        };
      }

      const body = await req.json().catch(() => ({})) as { id?: string | number };
      const endpointId = body.id;

      if (!endpointId) {
        return { 
          status: 400, 
          jsonBody: { error: "Missing endpoint id" } 
        };
      }

      const tenantId = auth.tenantId;
      const endpointIdStr = String(endpointId);

      // Verify endpoint belongs to tenant
      const endpoint = await getEndpoint(tenantId, endpointIdStr);
      if (!endpoint) {
        return {
          status: 404,
          jsonBody: { error: "Endpoint not found" },
        };
      }

      await deleteEndpoint(tenantId, endpointIdStr);

      // Return remaining endpoints
      const remainingEndpoints = await getTenantEndpoints(tenantId);
      const formattedEndpoints = remainingEndpoints.map(ep => ({
        id: ep.rowKey,
        name: ep.name,
        url: ep.url,
        active: ep.active,
        createdAt: ep.createdAt,
      }));

      return {
        status: 200,
        jsonBody: { endpoints: formattedEndpoints },
      };
    } catch (error: any) {
      context.error("Error deleting endpoint:", error);
      if (error.message && error.message.includes("not found")) {
        return {
          status: 404,
          jsonBody: { error: error.message },
        };
      }
      return {
        status: 500,
        jsonBody: { error: "Internal server error. Please try again later." },
      };
    }
  },
});

/**
 * PATCH /api/webhook/endpoints/{id}
 * Update endpoint (toggle active status or update name/url)
 */
app.http("webhookEndpointsPatch", {
  route: "webhook/endpoints/{id}",
  methods: ["PATCH"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const apiKey = req.headers.get("x-api-key") ?? req.headers.get("X-API-Key");
      if (!apiKey) {
        return { 
          status: 401, 
          jsonBody: { error: "Missing API key" } 
        };
      }

      const auth = await authenticateApiKey(apiKey, req, "/api/webhook/endpoints");
      if (!auth) {
        return { 
          status: 401, 
          jsonBody: { error: "Invalid API key" } 
        };
      }

      const endpointId = (req.params as any)["id"] as string | undefined;
      if (!endpointId) {
        return {
          status: 400,
          jsonBody: { error: "Missing endpoint id in URL" },
        };
      }

      const tenantId = auth.tenantId;
      const body = await req.json().catch(() => ({})) as {
        active?: boolean;
        name?: string;
        url?: string;
      };

      // Verify endpoint belongs to tenant
      const existing = await getEndpoint(tenantId, endpointId);
      if (!existing) {
        return {
          status: 404,
          jsonBody: { error: "Endpoint not found" },
        };
      }

      // Update active status
      if (body.active !== undefined) {
        await updateEndpointStatus(tenantId, endpointId, body.active);
      }

      // Update name or url if provided
      if (body.name !== undefined || body.url !== undefined) {
        await saveWebhookEndpoint(tenantId, {
          id: endpointId,
          name: body.name !== undefined ? body.name : existing.name,
          url: body.url !== undefined ? body.url : existing.url,
          active: body.active !== undefined ? body.active : existing.active,
        });
      }

      // Return updated endpoint
      const updated = await getEndpoint(tenantId, endpointId);
      return {
        status: 200,
        jsonBody: {
          endpoint: updated ? {
            id: updated.rowKey,
            name: updated.name,
            url: updated.url,
            active: updated.active,
            createdAt: updated.createdAt,
          } : null,
        },
      };
    } catch (error: any) {
      context.error("Error updating endpoint:", error);
      if (error.message && error.message.includes("not found")) {
        return {
          status: 404,
          jsonBody: { error: error.message },
        };
      }
      if (error.message && (
        error.message.includes("Invalid URL") ||
        error.message.includes("already exists")
      )) {
        return {
          status: 400,
          jsonBody: { error: error.message },
        };
      }
      return {
        status: 500,
        jsonBody: { error: "Internal server error. Please try again later." },
      };
    }
  },
});
