"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertWithinLimit = assertWithinLimit;
const usageTracker_1 = require("./usageTracker");
const tenantPlans_1 = require("./tenantPlans");
const plans_1 = require("./plans");
function assertWithinLimit(tenantId) {
    const usage = (0, usageTracker_1.getUsage)(tenantId);
    const plan = (0, tenantPlans_1.getTenantPlan)(tenantId);
    const limit = plans_1.PLANS[plan].maxEvents;
    if (usage >= limit) {
        throw new Error("USAGE_LIMIT_EXCEEDED");
    }
}
//# sourceMappingURL=enforceLimit.js.map