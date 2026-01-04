"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const tenantStore_1 = require("../shared/tenantStore");
functions_1.app.http("tenantPlan", {
    route: "tenant/plan",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: async (req) => {
        const url = new URL(req.url);
        const tenantId = url.searchParams.get("tenantId");
        if (!tenantId) {
            return { status: 400, jsonBody: { error: "Missing tenantId" } };
        }
        const tenant = (0, tenantStore_1.getTenant)(tenantId);
        if (!tenant) {
            return { status: 404, jsonBody: { error: "Tenant not found" } };
        }
        return { status: 200, jsonBody: { plan: tenant.plan } };
    }
});
//# sourceMappingURL=tenantPlan.js.map