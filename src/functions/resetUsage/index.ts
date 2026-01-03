import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default async function () {
  const filePath = join(process.cwd(), "data", "devApiKeys.json");

  const raw = readFileSync(filePath, "utf-8");
  const apiKeys = JSON.parse(raw);

  const now = new Date();
  const nextMonth = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    1
  ));

  for (const key of Object.keys(apiKeys)) {
    apiKeys[key].usage = 0;
    apiKeys[key].periodStart = now.toISOString();
    apiKeys[key].periodEnd = nextMonth.toISOString();
  }

  writeFileSync(filePath, JSON.stringify(apiKeys, null, 2));

  console.log("✅ Monthly usage reset completed");
}
