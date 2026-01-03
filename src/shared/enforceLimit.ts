import { getUsage } from "./usageTracker";
import { getTenantPlan } from "./tenantPlans";
import { PLANS } from "./plans";

export function assertWithinLimit(tenantId: string) {
  const usage = getUsage(tenantId);
  const plan = getTenantPlan(tenantId);
  const limit = PLANS[plan].maxEvents;

  if (usage >= limit) {
    throw new Error("USAGE_LIMIT_EXCEEDED");
  }
}
