
require('dotenv').config();
const { TableClient } = require("@azure/data-tables");

const connectionString =
  "DefaultEndpointsProtocol=http;" +
  "AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFeqI4h0VYc0Qb1mQ9ZcJp9QzE7L8nPZKk2YkX0+E1P5m4X9GqVQv5r1G8l8=;" +
  "TableEndpoint=http://127.0.0.1:11004/devstoreaccount1;";

const fs = require('fs');
const path = require('path');

const apiKeysPath = path.join(__dirname, 'devApiKeys.json');

function seedApiKey() {
  let apiKeys = {};
  if (fs.existsSync(apiKeysPath)) {
    apiKeys = JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'));
  }

  const apiKey = 'sk_test_123456';
  apiKeys[apiKey] = {
    tenantId: 'tenant_demo',
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
  console.log('✅ API key inserted into devApiKeys.json');
}

try {
  seedApiKey();
} catch (err) {
  console.error('❌ Failed to seed API key:', err);
}
