export type PlanName = "free" | "pro" | "team";

export const PLANS: Record<PlanName, { maxEvents: number }> = {
  free: {
    maxEvents: 1000
  },
  pro: {
    maxEvents: 100_000
  },
  team: {
    maxEvents: Infinity
  }
};
