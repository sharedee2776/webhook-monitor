import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getTenant } from "../shared/tenantStore";

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
    const tenant = getTenant(tenantId);
    if (!tenant) {
      return { status: 404, jsonBody: { error: "Tenant not found" } };
    }
    return { status: 200, jsonBody: { plan: tenant.plan } };
  }
});
