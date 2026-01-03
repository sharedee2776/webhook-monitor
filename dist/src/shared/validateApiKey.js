"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = validateApiKey;
const data_tables_1 = require("@azure/data-tables");
const apiKeysClient = data_tables_1.TableClient.fromConnectionString(process.env.AzureWebJobsStorage, "ApiKeys");
async function validateApiKey(apiKey) {
    if (!apiKey) {
        return null;
    }
    for await (const entity of apiKeysClient.listEntities()) {
        if (entity.apiKey === apiKey) {
            return {
                tenantId: entity.rowKey,
                plan: entity.plan
            };
        }
    }
    return null;
}
//# sourceMappingURL=validateApiKey.js.map