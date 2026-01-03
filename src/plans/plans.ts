export type PlanName = "free" | "pro" | "team";

export interface Plan {
  name: PlanName;
  monthlyLimit: number;
  retentionDays: number;
}

export const PLANS: Record<PlanName, Plan> = {
  free: {
    name: "free",
    monthlyLimit: 1000,
    retentionDays: 1,
  },
  pro: {
    name: "pro",
    monthlyLimit: 10000,
    retentionDays: 30,
  },
  team: {
    name: "team",
    monthlyLimit: 100000,
    retentionDays: 90,
  },
};
