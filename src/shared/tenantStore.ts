import { TableClient } from "@azure/data-tables";

const tenantsTable = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage!,
  "Tenants"
);

export type SubscriptionState = "active" | "past_due" | "canceled" | "grace" | "trial";

export interface Tenant {
  tenantId: string;
  plan: "free" | "pro" | "team";
  usage: number;
  stripeCustomerId?: string;
  subscriptionState?: SubscriptionState;
  subscriptionExpiresAt?: string; // ISO date
  gracePeriodEndsAt?: string; // ISO date
  createdAt?: string; // ISO date
  updatedAt?: string; // ISO date
}

/**
 * Get tenant from Azure Table Storage
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  try {
    const entity = await tenantsTable.getEntity(tenantId, tenantId);
    return {
      tenantId: entity.tenantId as string,
      plan: (entity.plan as Tenant["plan"]) ?? "free",
      usage: (entity.usage as number) ?? 0,
      stripeCustomerId: entity.stripeCustomerId as string | undefined,
      subscriptionState: entity.subscriptionState as SubscriptionState | undefined,
      subscriptionExpiresAt: entity.subscriptionExpiresAt as string | undefined,
      gracePeriodEndsAt: entity.gracePeriodEndsAt as string | undefined,
      createdAt: entity.createdAt as string | undefined,
      updatedAt: entity.updatedAt as string | undefined,
    };
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update tenant in Azure Table Storage
 */
export async function setTenantPlan(
  tenantId: string,
  plan: Tenant["plan"],
  opts?: {
    subscriptionState?: SubscriptionState;
    subscriptionExpiresAt?: string;
    gracePeriodEndsAt?: string;
    stripeCustomerId?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  
  try {
    // Try to get existing tenant
    const existing = await getTenant(tenantId);
    
    const entity = {
      partitionKey: tenantId,
      rowKey: tenantId,
      tenantId: tenantId,
      plan: plan,
      usage: existing?.usage ?? 0,
      stripeCustomerId: opts?.stripeCustomerId ?? existing?.stripeCustomerId,
      subscriptionState: opts?.subscriptionState ?? existing?.subscriptionState ?? "active",
      subscriptionExpiresAt: opts?.subscriptionExpiresAt ?? existing?.subscriptionExpiresAt,
      gracePeriodEndsAt: opts?.gracePeriodEndsAt ?? existing?.gracePeriodEndsAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await tenantsTable.upsertEntity(entity, "Replace");
  } catch (error: any) {
    // If table doesn't exist, create it first
    if (error.statusCode === 404 || error.message?.includes("does not exist")) {
      try {
        await tenantsTable.createTable();
        // Retry upsert
        await setTenantPlan(tenantId, plan, opts);
        return;
      } catch (createError) {
        throw new Error(`Failed to create Tenants table: ${createError}`);
      }
    }
    throw error;
  }
}

/**
 * Create a new tenant (used for auto-creation on signup)
 */
export async function createTenant(tenantId: string, plan: Tenant["plan"] = "free"): Promise<Tenant> {
  const existing = await getTenant(tenantId);
  if (existing) {
    return existing;
  }

  await setTenantPlan(tenantId, plan, { subscriptionState: "active" });
  return (await getTenant(tenantId))!;
}

/**
 * Set Stripe customer ID for tenant
 */
export async function setTenantStripeCustomerId(
  tenantId: string,
  stripeCustomerId: string
): Promise<void> {
  const existing = await getTenant(tenantId);
  await setTenantPlan(
    tenantId,
    existing?.plan ?? "free",
    { stripeCustomerId }
  );
}

/**
 * Increment usage for tenant
 */
export async function incrementTenantUsage(tenantId: string, amount: number = 1): Promise<void> {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }
  
  await setTenantPlan(tenantId, tenant.plan, {
    subscriptionState: tenant.subscriptionState,
    subscriptionExpiresAt: tenant.subscriptionExpiresAt,
    gracePeriodEndsAt: tenant.gracePeriodEndsAt,
    stripeCustomerId: tenant.stripeCustomerId,
  });
  
  // Update usage separately (Azure Tables doesn't support atomic increments easily)
  const entity = {
    partitionKey: tenantId,
    rowKey: tenantId,
    tenantId: tenantId,
    plan: tenant.plan,
    usage: (tenant.usage ?? 0) + amount,
    stripeCustomerId: tenant.stripeCustomerId,
    subscriptionState: tenant.subscriptionState,
    subscriptionExpiresAt: tenant.subscriptionExpiresAt,
    gracePeriodEndsAt: tenant.gracePeriodEndsAt,
    createdAt: tenant.createdAt,
    updatedAt: new Date().toISOString(),
  };
  
  await tenantsTable.updateEntity(entity, "Replace");
}
