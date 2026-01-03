"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingApplyPlan = billingApplyPlan;
const functions_1 = require("@azure/functions");
const billingService_1 = require("../services/billingService");
const BILLING_SECRET = process.env.BILLING_SECRET || "billing_secret_123";
async function billingApplyPlan(req) {
    const secret = req.headers.get("x-billing-secret");
    if (secret !== BILLING_SECRET) {
        return { status: 401, jsonBody: { error: "Unauthorized" } };
    }
    const body = await req.json();
    const { tenantId, plan } = body;
    if (!tenantId || !plan) {
        return { status: 400, jsonBody: { error: "Missing tenantId or plan" } };
    }
    try {
        const result = await (0, billingService_1.applyPlanChange)({
            tenantId,
            newPlan: plan,
            reason: "billing",
        });
        return { status: 200, jsonBody: result };
    }
    catch (err) {
        return { status: 400, jsonBody: { error: err.message } };
    }
}
functions_1.app.http("billingApplyPlan", {
    route: "billing/apply-plan",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: billingApplyPlan,
});
//# sourceMappingURL=billingApplyPlan.js.map