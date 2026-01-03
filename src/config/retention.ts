export const RETENTION_BY_PLAN: Record<string, number> = {
  free: 24 * 60 * 60 * 1000,        // 24 hours
  pro: 30 * 24 * 60 * 60 * 1000,    // 30 days
  business: 90 * 24 * 60 * 60 * 1000 // 90 days
};
