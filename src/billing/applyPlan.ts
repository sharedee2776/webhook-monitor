import { setTenantPlan } from "../shared/tenantStore";

const allowedPlans = ["free", "pro", "team"] as const;
type AllowedPlan = typeof allowedPlans[number];

export async function applyPlan(
  tenantId: string,
  plan: string,
  reason: "admin" | "billing" | "stripe"
) {
  // Only allow valid plans
  let normalizedPlan: AllowedPlan;
  if (plan === "enterprise") {
    normalizedPlan = "team";
  } else if (allowedPlans.includes(plan as AllowedPlan)) {
    normalizedPlan = plan as AllowedPlan;
  } else {
    throw new Error(`Invalid plan: ${plan}`);
  }

  setTenantPlan(tenantId, normalizedPlan);
}
