import fs from "fs";
import path from "path";

// Try to resolve devApiKeys.json relative to project root, regardless of build output location
let keysPath;
if (fs.existsSync(path.resolve(__dirname, '../../scripts/devApiKeys.json'))) {
  keysPath = path.resolve(__dirname, '../../scripts/devApiKeys.json');
} else if (fs.existsSync(path.resolve(__dirname, '../scripts/devApiKeys.json'))) {
  keysPath = path.resolve(__dirname, '../scripts/devApiKeys.json');
} else {
  keysPath = path.resolve(process.cwd(), 'scripts/devApiKeys.json');
}

export function validateApiKey(apiKey) {
  if (!apiKey) return null;
  if (!fs.existsSync(keysPath)) return null;

  const keys = JSON.parse(fs.readFileSync(keysPath, "utf8"));
  return keys[apiKey] || null;
}
