import { TableClient } from "@azure/data-tables";
import { EventEntity, IngestedEvent } from "./eventSchema";
import { randomUUID } from "crypto";

const connectionString = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const eventsTable = connectionString 
  ? TableClient.fromConnectionString(connectionString, "Events")
  : null;

/**
 * Save event to Azure Table Storage
 */
export async function saveEventToTable(
  event: IngestedEvent,
  apiKey: string,
  headers: Record<string, string>,
  status: 'pending' | 'success' | 'failed' | 'partial' = 'pending',
  endpointId?: string,
  endpointUrl?: string
): Promise<string> {
  if (!eventsTable) {
    const errorMsg = "Azure Table Storage not configured, event not saved to table";
    console.error("[EVENT_TABLE] ❌", errorMsg, {
      connectionString: !!process.env.AzureWebJobsStorage,
      tenantId: event.tenantId
    });
    return randomUUID();
  }

  const eventId = (event as any).eventId || randomUUID();
  const timestamp = event.receivedAt || new Date().toISOString();

  console.log("[EVENT_TABLE] Saving event to table...", {
    eventId,
    tenantId: event.tenantId,
    eventType: event.eventType,
    endpointId: endpointId || event.endpointId || 'none',
    tableName: "Events"
  });

  const entity: EventEntity = {
    partitionKey: event.tenantId,
    rowKey: eventId,
    api_key: apiKey,
    timestamp,
    payload: JSON.stringify(event.payload),
    headers: JSON.stringify(headers),
    status,
    eventType: event.eventType,
    source: event.source || 'custom',
    retry_count: 0,
    endpointId: endpointId || event.endpointId,
    endpointUrl: endpointUrl || event.endpointUrl,
  };

  try {
    await eventsTable.createEntity(entity);
    console.log("[EVENT_TABLE] ✅ Event saved successfully", {
      eventId,
      tenantId: event.tenantId,
      eventType: event.eventType,
      tableName: "Events"
    });
    return eventId;
  } catch (error: any) {
    // If table doesn't exist, try to create it
    if (error.statusCode === 404 || error.message?.includes("does not exist")) {
      try {
        console.log("[EVENT_TABLE] Table doesn't exist, creating...", { tableName: "Events" });
        await eventsTable.createTable();
        await eventsTable.createEntity(entity);
        console.log("[EVENT_TABLE] ✅ Table created and event saved", {
          eventId,
          tenantId: event.tenantId
        });
        return eventId;
      } catch (createError: any) {
        console.error("[EVENT_TABLE] ❌ Failed to create Events table:", {
          error: createError.message,
          statusCode: createError.statusCode,
          code: createError.code
        });
        throw createError;
      }
    }
    console.error("[EVENT_TABLE] ❌ Failed to save event:", {
      error: error.message,
      statusCode: error.statusCode,
      code: error.code,
      eventId,
      tenantId: event.tenantId
    });
    throw error;
  }
}

/**
 * Update event status in Azure Table Storage
 */
export async function updateEventStatus(
  tenantId: string,
  eventId: string,
  updates: {
    status?: 'pending' | 'success' | 'failed' | 'partial';
    forwarded_to?: string[];
    response_code?: number;
    retry_count?: number;
    error_message?: string;
  }
): Promise<void> {
  if (!eventsTable) {
    console.warn("Azure Table Storage not configured, cannot update event");
    return;
  }

  try {
    const entity = await eventsTable.getEntity(tenantId, eventId);
    
    const updatedEntity: any = {
      partitionKey: entity.partitionKey as string,
      rowKey: entity.rowKey as string,
      ...entity,
      ...updates,
      forwarded_to: updates.forwarded_to ? JSON.stringify(updates.forwarded_to) : (entity.forwarded_to as string | undefined),
    };

    await eventsTable.updateEntity(updatedEntity, "Replace");
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.warn(`Event ${eventId} not found for update`);
      return;
    }
    throw error;
  }
}

/**
 * Get events for a tenant from Azure Table Storage
 */
export async function getEventsForTenantFromTable(
  tenantId: string,
  limit: number = 50
): Promise<EventEntity[]> {
  if (!eventsTable) {
    console.warn("Azure Table Storage not configured, returning empty events");
    return [];
  }

  try {
    console.log("[EVENT_TABLE] Querying events for tenant...", {
      tenantId,
      limit,
      tableName: "Events"
    });
    
    const entities: EventEntity[] = [];
    const filter = `PartitionKey eq '${tenantId}'`;
    console.log("[EVENT_TABLE] Using filter:", { filter });
    
    const query = eventsTable.listEntities<EventEntity>({
      queryOptions: {
        filter,
      },
    });

    for await (const entity of query) {
      entities.push(entity);
      if (entities.length >= limit) break;
    }

    console.log("[EVENT_TABLE] ✅ Query completed", {
      tenantId,
      found: entities.length,
      limit
    });

    // Sort by timestamp descending (newest first)
    return entities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Table doesn't exist yet
      console.warn("[EVENT_TABLE] ⚠️ Table doesn't exist yet", {
        tenantId,
        tableName: "Events"
      });
      return [];
    }
    console.error("[EVENT_TABLE] ❌ Error querying events from table:", {
      error: error.message,
      statusCode: error.statusCode,
      code: error.code,
      tenantId
    });
    return [];
  }
}
