"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fs_1 = require("fs");
const path_1 = require("path");
async function default_1() {
    const filePath = (0, path_1.join)(process.cwd(), "data", "devApiKeys.json");
    const raw = (0, fs_1.readFileSync)(filePath, "utf-8");
    const apiKeys = JSON.parse(raw);
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    for (const key of Object.keys(apiKeys)) {
        apiKeys[key].usage = 0;
        apiKeys[key].periodStart = now.toISOString();
        apiKeys[key].periodEnd = nextMonth.toISOString();
    }
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(apiKeys, null, 2));
    console.log("✅ Monthly usage reset completed");
}
//# sourceMappingURL=index.js.map