
import fs from "fs";
import path from "path";
import { IngestedEvent } from "./eventSchema";
import { BlobServiceClient } from "@azure/storage-blob";

const EVENTS_FILE = path.join(process.cwd(), "data/devEvents.json");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "events";

export async function saveEvent(event: IngestedEvent) {
  // Save locally
  const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
  events.push(event);
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));

  // Save to Azure Blob Storage if connection string is set
  if (AZURE_STORAGE_CONNECTION_STRING) {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      await containerClient.createIfNotExists();
      // Use event id or timestamp as blob name
      const blobName = `${event.tenantId}-${event.receivedAt || Date.now()}.json`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(JSON.stringify(event, null, 2), Buffer.byteLength(JSON.stringify(event, null, 2)));
    } catch (err) {
      // Log error but don't break local save
      console.error("Failed to save event to Azure Blob Storage:", err);
    }
  }
}

export function getEventsForTenant(tenantId: string) {
  const events = JSON.parse(fs.readFileSync(EVENTS_FILE, "utf-8"));
  return events
    .filter((e: IngestedEvent) => e.tenantId === tenantId)
    .sort((a: IngestedEvent, b: IngestedEvent) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, 50);
}
