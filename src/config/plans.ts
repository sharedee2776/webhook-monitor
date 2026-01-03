export type Plan = "free" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<Plan, number | "unlimited"> = {
  free: 10,
  pro: 10_000,
  enterprise: "unlimited",
};
