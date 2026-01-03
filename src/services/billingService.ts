import { getTenant, setTenantPlan } from "../shared/tenantStore";

export type Plan = "free" | "pro" | "team";

const PLAN_ORDER: Plan[] = ["free", "pro", "team"];

export async function applyPlanChange(params: {
  tenantId: string;
  newPlan: Plan;
  reason: "admin" | "billing" | "migration";
  subscriptionState?: "active" | "past_due" | "canceled" | "grace" | "trial";
  subscriptionExpiresAt?: string;
  gracePeriodEndsAt?: string;
}) {
  const { tenantId, newPlan, reason, subscriptionState, subscriptionExpiresAt, gracePeriodEndsAt } = params;
  const tenant = await getTenant(tenantId);
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
  setTenantPlan(tenantId, newPlan, {
    subscriptionState,
    subscriptionExpiresAt,
    gracePeriodEndsAt,
  });
  console.log(
    `[BILLING] ${tenantId}: ${oldPlan} → ${newPlan} (${reason})`
  );
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
