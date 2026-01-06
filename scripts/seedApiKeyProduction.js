/**
 * Production Script: Seed API Keys to Azure Table Storage
 * 
 * This script creates API keys in Azure Table Storage for production use.
 * Run this after deploying to Azure to create initial API keys for your tenants.
 * 
 * Usage:
 *   node scripts/seedApiKeyProduction.js <tenantId> <plan> [apiKey]
 * 
 * Example:
 *   node scripts/seedApiKeyProduction.js tenant_123 pro
 *   node scripts/seedApiKeyProduction.js tenant_456 free sk_custom_key_here
 */

require('dotenv').config();
const { TableClient } = require("@azure/data-tables");
const crypto = require('crypto');

// Get connection string from environment
const connectionString = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ Error: AzureWebJobsStorage or AZURE_STORAGE_CONNECTION_STRING environment variable not set');
  console.error('   Set it in Azure Functions App Settings or in your .env file');
  process.exit(1);
}

const apiKeysTable = TableClient.fromConnectionString(connectionString, "ApiKeys");

/**
 * Generate a secure random API key
 */
function generateApiKey() {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Create an API key in Azure Table Storage
 */
async function createApiKey(tenantId, plan = 'free', customApiKey = null) {
  const apiKey = customApiKey || generateApiKey();
  
  // Validate plan
  const validPlans = ['free', 'pro', 'team'];
  if (!validPlans.includes(plan)) {
    console.error(`❌ Invalid plan: ${plan}. Must be one of: ${validPlans.join(', ')}`);
    process.exit(1);
  }

  try {
    // Check if API key already exists
    try {
      await apiKeysTable.getEntity("tenant", apiKey);
      console.error(`❌ API key already exists: ${apiKey.substring(0, 20)}...`);
      process.exit(1);
    } catch (error) {
      // Entity doesn't exist, which is what we want
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    // Create the entity
    const entity = {
      partitionKey: "tenant",
      rowKey: apiKey,
      tenantId: tenantId,
      plan: plan,
      active: true,
      createdAt: new Date().toISOString(),
      // Optional: Set expiration (e.g., 1 year from now)
      // expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    await apiKeysTable.createEntity(entity);

    console.log('✅ API key created successfully!');
    console.log('');
    console.log('📋 API Key Details:');
    console.log(`   API Key: ${apiKey}`);
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Plan: ${plan}`);
    console.log(`   Status: Active`);
    console.log('');
    console.log('⚠️  IMPORTANT: Save this API key securely. It cannot be retrieved later!');
    console.log('   Store it in a password manager or secure vault.');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('   - This key grants full access to the tenant\'s data');
    console.log('   - Never commit API keys to version control');
    console.log('   - Rotate keys regularly (recommended: every 90 days)');
    
    return apiKey;
  } catch (error) {
    console.error('❌ Failed to create API key:', error.message);
    if (error.statusCode === 409) {
      console.error('   The API key already exists in the table.');
    } else if (error.statusCode === 404) {
      console.error('   The ApiKeys table does not exist. Create it in Azure Portal first.');
    }
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node scripts/seedApiKeyProduction.js <tenantId> <plan> [customApiKey]');
  console.error('');
  console.error('Arguments:');
  console.error('  tenantId     - The tenant ID to associate with this API key');
  console.error('  plan         - Plan type: free, pro, or team');
  console.error('  customApiKey - (Optional) Custom API key. If not provided, a random key will be generated');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/seedApiKeyProduction.js tenant_123 pro');
  console.error('  node scripts/seedApiKeyProduction.js tenant_456 free sk_custom_key_here');
  process.exit(1);
}

const [tenantId, plan, customApiKey] = args;

createApiKey(tenantId, plan, customApiKey)
  .then(() => {
    console.log('');
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
