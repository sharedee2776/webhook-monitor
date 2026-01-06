import { setTenantPlan, createTenant } from "../shared/tenantStore";

const allowedPlans = ["free", "pro", "team"] as const;
type AllowedPlan = typeof allowedPlans[number];

export async function applyPlan(
  tenantId: string,
  plan: string,
  reason: "admin" | "billing" | "stripe",
  opts?: {
    subscriptionState?: "active" | "past_due" | "canceled" | "grace" | "trial";
    subscriptionExpiresAt?: string;
    gracePeriodEndsAt?: string;
    stripeCustomerId?: string;
  }
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

  // Create tenant if it doesn't exist
  await createTenant(tenantId, normalizedPlan);
  
  // Update tenant plan
  await setTenantPlan(tenantId, normalizedPlan, {
    subscriptionState: opts?.subscriptionState ?? "active",
    subscriptionExpiresAt: opts?.subscriptionExpiresAt,
    gracePeriodEndsAt: opts?.gracePeriodEndsAt,
    stripeCustomerId: opts?.stripeCustomerId,
  });
}
