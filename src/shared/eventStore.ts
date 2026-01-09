
import fs from "fs";
import path from "path";
import { IngestedEvent } from "./eventSchema";
import { BlobServiceClient } from "@azure/storage-blob";
import { saveEventToTable, getEventsForTenantFromTable } from "./eventTableStore";

const EVENTS_FILE = path.join(process.cwd(), "data/devEvents.json");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "events";

/**
 * Save event to multiple storage backends
 */
export async function saveEvent(
  event: IngestedEvent,
  apiKey?: string,
  headers?: Record<string, string>
) {
  // Save locally (for development)
  try {
    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
    events.push(event);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
  } catch (err) {
    // File might not exist, that's okay
  }

  // Save to Azure Table Storage (primary storage for production)
  if (apiKey && headers) {
    try {
      console.log("[EVENT_STORE] Saving to table storage...", {
        eventId: (event as any).eventId,
        tenantId: event.tenantId,
        hasApiKey: !!apiKey,
        hasHeaders: !!headers
      });
      await saveEventToTable(
        event, 
        apiKey, 
        headers, 
        'pending',
        event.endpointId,
        event.endpointUrl
      );
      console.log("[EVENT_STORE] ✅ Saved to table storage successfully");
    } catch (err: any) {
      console.error("[EVENT_STORE] ❌ Failed to save event to Azure Table Storage:", {
        error: err.message,
        statusCode: err.statusCode,
        code: err.code,
        eventId: (event as any).eventId,
        tenantId: event.tenantId
      });
      throw err; // Re-throw to allow caller to handle
    }
  } else {
    console.warn("[EVENT_STORE] ⚠️ Skipping table storage save - missing apiKey or headers", {
      hasApiKey: !!apiKey,
      hasHeaders: !!headers,
      eventId: (event as any).eventId,
      tenantId: event.tenantId
    });
  }

  // Save to Azure Blob Storage (backup/archive)
  if (AZURE_STORAGE_CONNECTION_STRING) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      await containerClient.createIfNotExists();
      const blobName = `${event.tenantId}-${event.receivedAt || Date.now()}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(JSON.stringify(event, null, 2), Buffer.byteLength(JSON.stringify(event, null, 2)));
    } catch (err) {
      console.error("Failed to save event to Azure Blob Storage:", err);
    }
  }
}

/**
 * Get events for tenant - tries Table Storage first, falls back to local file
 */
export async function getEventsForTenant(tenantId: string): Promise<IngestedEvent[]> {
  // Try Azure Table Storage first (production)
  try {
    const tableEvents = await getEventsForTenantFromTable(tenantId, 50);
    if (tableEvents.length > 0) {
      return tableEvents.map(e => ({
        eventId: e.rowKey,
        tenantId: e.partitionKey,
        eventType: e.eventType,
        source: e.source,
        receivedAt: e.timestamp,
        payload: JSON.parse(e.payload),
        // Include forwarding status for dashboard
        status: e.status,
        forwarded_to: e.forwarded_to ? JSON.parse(e.forwarded_to) : undefined,
        response_code: e.response_code,
        retry_count: e.retry_count,
      })) as any[];
    }
  } catch (err) {
    console.warn("Failed to get events from table, falling back to local file:", err);
  }

  // Fallback to local file (development)
  try {
    const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
    return events
      .filter((e: IngestedEvent) => e.tenantId === tenantId)
      .sort((a: IngestedEvent, b: IngestedEvent) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(0, 50);
  } catch {
    return [];
  }
}
