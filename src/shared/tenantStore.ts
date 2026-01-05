import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "devTenants.json");

export type SubscriptionState = "active" | "past_due" | "canceled" | "grace" | "trial";

export interface Tenant {
  tenantId: string;
  plan: "free" | "pro" | "team";
  usage: number;
  stripeCustomerId?: string;
  subscriptionState?: SubscriptionState;
  subscriptionExpiresAt?: string; // ISO date
  gracePeriodEndsAt?: string; // ISO date
}


function readStore(): Record<string, Tenant> {
  if (!fs.existsSync(STORE_PATH)) return {};
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}


function writeStore(data: Record<string, Tenant>) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function getTenant(tenantId: string): Tenant | null {
  const store = readStore();
  return store[tenantId] ?? null;
}


export function setTenantPlan(tenantId: string, plan: Tenant["plan"], opts?: {
  subscriptionState?: SubscriptionState;
  subscriptionExpiresAt?: string;
  gracePeriodEndsAt?: string;
}) {
  const store = readStore();
  const existing: Partial<Tenant> = store[tenantId] || {};
  store[tenantId] = {
    tenantId,
    plan,
    usage: existing.usage ?? 0,
    stripeCustomerId: existing.stripeCustomerId,
    subscriptionState: opts?.subscriptionState ?? existing.subscriptionState ?? "active",
    subscriptionExpiresAt: opts?.subscriptionExpiresAt ?? existing.subscriptionExpiresAt,
    gracePeriodEndsAt: opts?.gracePeriodEndsAt ?? existing.gracePeriodEndsAt,
  };
  writeStore(store);
}

export function setTenantStripeCustomerId(tenantId: string, stripeCustomerId: string) {
  const store = readStore();
  const existing: Partial<Tenant> = store[tenantId] || {};
  store[tenantId] = {
    tenantId,
    plan: existing.plan ?? "free",
    usage: existing.usage ?? 0,
    stripeCustomerId,
  };
  writeStore(store);
}
