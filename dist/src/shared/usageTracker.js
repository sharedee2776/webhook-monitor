"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackUsage = trackUsage;
exports.getUsage = getUsage;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const FILE = path_1.default.join(process.cwd(), "data/devUsage.json");
function read() {
    if (!fs_1.default.existsSync(FILE)) {
        fs_1.default.writeFileSync(FILE, JSON.stringify({}));
    }
    return JSON.parse(fs_1.default.readFileSync(FILE, "utf-8"));
}
function trackUsage(tenantId) {
    const usage = read();
    usage[tenantId] = (usage[tenantId] ?? 0) + 1;
    fs_1.default.writeFileSync(FILE, JSON.stringify(usage, null, 2));
}
function getUsage(tenantId) {
    return read()[tenantId] ?? 0;
}
//# sourceMappingURL=usageTracker.js.map