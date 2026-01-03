"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlanChange = applyPlanChange;
const tenantStore_1 = require("../shared/tenantStore");
const PLAN_ORDER = ["free", "pro", "team"];
async function applyPlanChange(params) {
    const { tenantId, newPlan, reason, subscriptionState, subscriptionExpiresAt, gracePeriodEndsAt } = params;
    const tenant = await (0, tenantStore_1.getTenant)(tenantId);
    if (!tenant) {
        throw new Error("Tenant not found");
    }
    const oldPlan = tenant.plan;
    if (oldPlan === newPlan) {
        return {
            ok: true,
            tenantId,
            oldPlan,
            newPlan,
            reason,
            appliedAt: new Date().toISOString(),
        };
    }
    (0, tenantStore_1.setTenantPlan)(tenantId, newPlan, {
        subscriptionState,
        subscriptionExpiresAt,
        gracePeriodEndsAt,
    });
    console.log(`[BILLING] ${tenantId}: ${oldPlan} → ${newPlan} (${reason})`);
    return {
        ok: true,
        tenantId,
        oldPlan,
        newPlan,
        reason,
        appliedAt: new Date().toISOString(),
        subscriptionState,
        subscriptionExpiresAt,
        gracePeriodEndsAt,
    };
}
//# sourceMappingURL=billingService.js.map