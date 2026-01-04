import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  date: string;
  details: string;
}

const AUDIT_LOG_PATH = path.join(process.cwd(), 'data', 'auditLogs.json');

export function getAuditLogs(): AuditLogEntry[] {
  if (!fs.existsSync(AUDIT_LOG_PATH)) return [];
  const raw = fs.readFileSync(AUDIT_LOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id'>) {
  const logs = getAuditLogs();
  const newEntry = { ...entry, id: Date.now().toString() };
  logs.unshift(newEntry);
  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2));
  return newEntry;
}
