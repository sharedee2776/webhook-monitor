import { TableClient } from "@azure/data-tables";
import { randomUUID } from "crypto";

const connectionString = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const endpointsTable = connectionString
  ? TableClient.fromConnectionString(connectionString, "WebhookEndpoints")
  : null;

export interface WebhookEndpointEntity {
  // Partition Key: tenantId
  // Row Key: endpointId (UUID)
  partitionKey: string; // tenantId
  rowKey: string; // endpointId
  name: string;
  url: string;
  active: boolean;
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
}

/**
 * Validate endpoint URL format
 */
function validateEndpointUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: "URL must use http:// or https://" };
    }
    if (!urlObj.hostname) {
      return { valid: false, error: "URL must have a valid hostname" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Create or update webhook endpoint in Azure Table Storage
 */
export async function saveWebhookEndpoint(
  tenantId: string,
  endpoint: {
    id?: string;
    name: string;
    url: string;
    active?: boolean;
  }
): Promise<WebhookEndpointEntity> {
  if (!endpointsTable) {
    throw new Error("Azure Table Storage not configured. Please set AzureWebJobsStorage.");
  }

  // Validate URL
  const validation = validateEndpointUrl(endpoint.url);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid endpoint URL");
  }

  // Validate name
  if (!endpoint.name || endpoint.name.trim().length === 0) {
    throw new Error("Endpoint name is required");
  }

  const endpointId = endpoint.id || randomUUID();
  const now = new Date().toISOString();

  // Check for duplicates (same URL for same tenant)
  try {
    const existingEndpoints = await getTenantEndpoints(tenantId);
      const duplicate = existingEndpoints.find(
        (ep) => ep.url.trim() === endpoint.url.trim() && ep.rowKey !== endpointId
      );
    if (duplicate) {
      throw new Error("An endpoint with this URL already exists");
    }
  } catch (err: any) {
    if (err.message && err.message.includes("already exists")) {
      throw err;
    }
    // If error is not about duplicates, continue (might be table not existing)
  }

  const entity: WebhookEndpointEntity = {
    partitionKey: tenantId,
    rowKey: endpointId,
    name: endpoint.name.trim(),
    url: endpoint.url.trim(),
    active: endpoint.active !== undefined ? endpoint.active : true,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Check if endpoint exists (for update)
    try {
      const existing = await endpointsTable.getEntity(tenantId, endpointId);
      entity.createdAt = (existing.createdAt as string) || now;
      await endpointsTable.updateEntity(entity, "Replace");
    } catch (getError: any) {
      if (getError.statusCode === 404) {
        // New endpoint
        await endpointsTable.createEntity(entity);
      } else {
        throw getError;
      }
    }
    return entity;
  } catch (error: any) {
    // If table doesn't exist, create it
    if (error.statusCode === 404 || error.message?.includes("does not exist")) {
      try {
        await endpointsTable.createTable();
        await endpointsTable.createEntity(entity);
        return entity;
      } catch (createError) {
        console.error("Failed to create WebhookEndpoints table:", createError);
        throw new Error("Failed to create webhook endpoint. Please contact support.");
      }
    }
    throw error;
  }
}

/**
 * Get all webhook endpoints for a tenant from Azure Table Storage
 */
export async function getTenantEndpoints(tenantId: string): Promise<WebhookEndpointEntity[]> {
  if (!endpointsTable) {
    console.warn("Azure Table Storage not configured, returning empty endpoints");
    return [];
  }

  try {
    const endpoints: WebhookEndpointEntity[] = [];
    const query = endpointsTable.listEntities<WebhookEndpointEntity>({
      queryOptions: {
        filter: `PartitionKey eq '${tenantId}'`,
      },
    });

    for await (const entity of query) {
      endpoints.push({
        partitionKey: entity.partitionKey as string,
        rowKey: entity.rowKey as string,
        name: entity.name as string,
        url: entity.url as string,
        active: (entity.active as boolean) ?? true,
        createdAt: (entity.createdAt as string) || new Date().toISOString(),
        updatedAt: entity.updatedAt as string | undefined,
      });
    }

    // Sort by createdAt descending (newest first)
    return endpoints.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Table doesn't exist yet
      return [];
    }
    console.error("Error querying endpoints from table:", error);
    return [];
  }
}

/**
 * Get a single endpoint by ID
 */
export async function getEndpoint(
  tenantId: string,
  endpointId: string
): Promise<WebhookEndpointEntity | null> {
  if (!endpointsTable) {
    return null;
  }

  try {
    const entity = await endpointsTable.getEntity(tenantId, endpointId);
    return {
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      name: entity.name as string,
      url: entity.url as string,
      active: (entity.active as boolean) ?? true,
      createdAt: (entity.createdAt as string) || new Date().toISOString(),
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
 * Delete a webhook endpoint
 */
export async function deleteEndpoint(tenantId: string, endpointId: string): Promise<void> {
  if (!endpointsTable) {
    throw new Error("Azure Table Storage not configured");
  }

  try {
    await endpointsTable.deleteEntity(tenantId, endpointId);
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Endpoint doesn't exist, that's okay
      return;
    }
    throw error;
  }
}

/**
 * Update endpoint active status
 */
export async function updateEndpointStatus(
  tenantId: string,
  endpointId: string,
  active: boolean
): Promise<void> {
  if (!endpointsTable) {
    throw new Error("Azure Table Storage not configured");
  }

  try {
    const entity = await endpointsTable.getEntity(tenantId, endpointId);
    const updatedEntity: any = {
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      ...entity,
      active,
      updatedAt: new Date().toISOString(),
    };
    await endpointsTable.updateEntity(updatedEntity, "Replace");
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw new Error("Endpoint not found");
    }
    throw error;
  }
}

/**
 * Find endpoint by URL match (for routing incoming webhooks)
 * This tries to match the request URL or referer header to an endpoint
 */
export async function findEndpointByUrl(
  tenantId: string,
  urlToMatch: string
): Promise<WebhookEndpointEntity | null> {
  if (!endpointsTable || !urlToMatch) {
    return null;
  }

  try {
    const endpoints = await getTenantEndpoints(tenantId);
    
    // Try exact match first
    let matched = endpoints.find(ep => 
      ep.active && ep.url.trim() === urlToMatch.trim()
    );
    
    if (matched) {
      return matched;
    }
    
    // Try URL hostname/path match (for cases where query params differ)
    try {
      const matchUrl = new URL(urlToMatch);
      matched = endpoints.find(ep => {
        if (!ep.active) return false;
        try {
          const epUrl = new URL(ep.url);
          return epUrl.hostname === matchUrl.hostname && 
                 epUrl.pathname === matchUrl.pathname;
        } catch {
          return false;
        }
      });
    } catch {
      // URL parsing failed, skip hostname matching
    }
    
    return matched || null;
  } catch (error: any) {
    console.error("Error finding endpoint by URL:", error);
    return null;
  }
}
