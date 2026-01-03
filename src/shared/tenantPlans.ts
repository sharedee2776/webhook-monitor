import { PlanName } from "./plans";

export function getTenantPlan(tenantId: string): PlanName {
  // TEMP: hardcoded for MVP
  if (tenantId === "tenant_demo") {
    return "free";
  }

  return "free";
}
