import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data/devUsage.json");

function read() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

export function trackUsage(tenantId: string) {
  const usage = read();
  usage[tenantId] = (usage[tenantId] ?? 0) + 1;
  fs.writeFileSync(FILE, JSON.stringify(usage, null, 2));
}

export function getUsage(tenantId: string) {
  return read()[tenantId] ?? 0;
}
