"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlan = setPlan;
const functions_1 = require("@azure/functions");
const tenantStore_1 = require("../shared/tenantStore");
const plans_1 = require("../plans/plans");
async function setPlan(req) {
    const adminKey = req.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_KEY) {
        return { status: 401, jsonBody: { error: "Unauthorized" } };
    }
    const body = await req.json();
    const { tenantId, plan } = body;
    if (!tenantId || !plans_1.PLANS[plan]) {
        return { status: 400, jsonBody: { error: "Invalid input" } };
    }
    (0, tenantStore_1.setTenantPlan)(tenantId, plan);
    return {
        status: 200,
        jsonBody: { ok: true, tenantId, plan },
    };
}
functions_1.app.http("adminSetPlan", {
    route: "admin/setPlan",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: setPlan,
});
//# sourceMappingURL=setPlan.js.map