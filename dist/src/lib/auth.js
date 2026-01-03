"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = void 0;
exports.authenticateApiKey = authenticateApiKey;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Always use devApiKeys.json from project root
const keysPath = path_1.default.resolve(process.cwd(), 'devApiKeys.json');
const validateApiKey = (apiKey) => {
    if (!apiKey)
        return null;
    if (!fs_1.default.existsSync(keysPath))
        return null;
    const keys = JSON.parse(fs_1.default.readFileSync(keysPath, "utf8"));
    console.error("[DEBUG] Loaded API keys:", keys);
    const data = keys[apiKey];
    if (!data)
        return null;
    // Always return tenantId, plan, usage if present
    console.error(`[DEBUG] API key lookup for ${apiKey}:`, data);
    return {
        tenantId: data.tenantId,
        plan: data.plan,
        usage: data.usage,
        createdAt: data.createdAt
    };
};
exports.validateApiKey = validateApiKey;
const data_tables_1 = require("@azure/data-tables");
const apiKeysTable = data_tables_1.TableClient.fromConnectionString(process.env.AzureWebJobsStorage, "ApiKeys");
async function authenticateApiKey(apiKey) {
    if (!apiKey)
        return null;
    try {
        const entity = await apiKeysTable.getEntity("tenant", apiKey);
        if (entity.active !== true)
            return null;
        return {
            tenantId: entity.tenantId,
            plan: entity.plan ?? "free"
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=auth.js.map