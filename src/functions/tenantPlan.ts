import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getTenant, createTenant } from "../shared/tenantStore";

app.http("tenantPlan", {
  route: "tenant/plan",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get("tenantId");
    if (!tenantId) {
      return { status: 400, jsonBody: { error: "Missing tenantId" } };
    }
    
    let tenant = await getTenant(tenantId);
    
    // Auto-create tenant if it doesn't exist (first time user)
    if (!tenant) {
      try {
        tenant = await createTenant(tenantId, "free");
      } catch (error: any) {
        return { 
          status: 500, 
          jsonBody: { error: "Failed to create tenant", details: error.message } 
        };
      }
    }
    
    return { 
      status: 200, 
      jsonBody: { 
        plan: tenant.plan,
        usage: tenant.usage ?? 0,
        subscriptionState: tenant.subscriptionState ?? "active"
      } 
    };
  }
});
