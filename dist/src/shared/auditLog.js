"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = getAuditLogs;
exports.addAuditLog = addAuditLog;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const AUDIT_LOG_PATH = path_1.default.join(process.cwd(), 'data', 'auditLogs.json');
function getAuditLogs() {
    if (!fs_1.default.existsSync(AUDIT_LOG_PATH))
        return [];
    const raw = fs_1.default.readFileSync(AUDIT_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
}
function addAuditLog(entry) {
    const logs = getAuditLogs();
    const newEntry = { ...entry, id: Date.now().toString() };
    logs.unshift(newEntry);
    fs_1.default.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2));
    return newEntry;
}
//# sourceMappingURL=auditLog.js.map