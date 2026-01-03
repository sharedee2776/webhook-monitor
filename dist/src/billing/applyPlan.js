"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlan = applyPlan;
const tenantStore_1 = require("../shared/tenantStore");
const allowedPlans = ["free", "pro", "team"];
async function applyPlan(tenantId, plan, reason) {
    // Only allow valid plans
    let normalizedPlan;
    if (plan === "enterprise") {
        normalizedPlan = "team";
    }
    else if (allowedPlans.includes(plan)) {
        normalizedPlan = plan;
    }
    else {
        throw new Error(`Invalid plan: ${plan}`);
    }
    (0, tenantStore_1.setTenantPlan)(tenantId, normalizedPlan);
}
//# sourceMappingURL=applyPlan.js.map