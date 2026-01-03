"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveEvent = saveEvent;
exports.getEventsForTenant = getEventsForTenant;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const storage_blob_1 = require("@azure/storage-blob");
const EVENTS_FILE = path_1.default.join(process.cwd(), "data/devEvents.json");
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "events";
async function saveEvent(event) {
    // Save locally
    const events = JSON.parse(fs_1.default.readFileSync(EVENTS_FILE, "utf-8"));
    events.push(event);
    fs_1.default.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2));
    // Save to Azure Blob Storage if connection string is set
    if (AZURE_STORAGE_CONNECTION_STRING) {
        try {
            const blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
            await containerClient.createIfNotExists();
            // Use event id or timestamp as blob name
            const blobName = `${event.tenantId}-${event.receivedAt || Date.now()}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(JSON.stringify(event, null, 2), Buffer.byteLength(JSON.stringify(event, null, 2)));
        }
        catch (err) {
            // Log error but don't break local save
            console.error("Failed to save event to Azure Blob Storage:", err);
        }
    }
}
function getEventsForTenant(tenantId) {
    const events = JSON.parse(fs_1.default.readFileSync(EVENTS_FILE, "utf-8"));
    return events
        .filter((e) => e.tenantId === tenantId)
        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
        .slice(0, 50);
}
//# sourceMappingURL=eventStore.js.map