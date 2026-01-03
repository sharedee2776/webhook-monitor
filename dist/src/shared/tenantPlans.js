"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenantPlan = getTenantPlan;
function getTenantPlan(tenantId) {
    // TEMP: hardcoded for MVP
    if (tenantId === "tenant_demo") {
        return "free";
    }
    return "free";
}
//# sourceMappingURL=tenantPlans.js.map