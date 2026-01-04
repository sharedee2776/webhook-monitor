"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const auditLog_1 = require("../shared/auditLog");
async function handler(req, res) {
    if (req.method === 'GET') {
        // Return all audit logs
        const logs = (0, auditLog_1.getAuditLogs)();
        res.status(200).json(logs);
    }
    else if (req.method === 'POST') {
        // Add a new audit log entry
        const { action, user, date, details } = req.body;
        if (!action || !user || !date || !details) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const entry = (0, auditLog_1.addAuditLog)({ action, user, date, details });
        res.status(201).json(entry);
    }
    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
//# sourceMappingURL=audit-logs.js.map