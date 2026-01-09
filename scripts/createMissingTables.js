/**
 * Script to create missing Azure Table Storage tables
 * 
 * This script creates the SecurityAuditLog table which is required for
 * security audit logging functionality.
 * 
 * Usage:
 *   node scripts/createMissingTables.js
 * 
 * Requirements:
 *   - AzureWebJobsStorage or AZURE_STORAGE_CONNECTION_STRING environment variable
 */

require('dotenv').config();
const { TableClient } = require("@azure/data-tables");

const connectionString = process.env.AzureWebJobsStorage || process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.error('❌ Error: AzureWebJobsStorage or AZURE_STORAGE_CONNECTION_STRING environment variable not set');
  console.error('   Set it in Azure Functions App Settings or in your .env file');
  process.exit(1);
}

/**
 * Create a table if it doesn't exist
 */
async function createTableIfNotExists(tableName) {
  const tableClient = TableClient.fromConnectionString(connectionString, tableName);
  
  try {
    // Try to get table properties (this will fail if table doesn't exist)
    await tableClient.getAccessPolicy();
    console.log(`✅ Table "${tableName}" already exists`);
    return false;
  } catch (error) {
    if (error.statusCode === 404) {
      // Table doesn't exist, create it
      try {
        await tableClient.createTable();
        console.log(`✅ Created table "${tableName}"`);
        return true;
      } catch (createError) {
        console.error(`❌ Failed to create table "${tableName}":`, createError.message);
        throw createError;
      }
    } else {
      // Some other error
      console.error(`❌ Error checking table "${tableName}":`, error.message);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking required tables...\n');

  const requiredTables = [
    {
      name: 'SecurityAuditLog',
      description: 'Security audit event logs (CRITICAL - Required for security features)',
      critical: true
    },
    {
      name: 'Events',
      description: 'Webhook events storage (CRITICAL - Required for event tracking and dashboard)',
      critical: true
    },
    {
      name: 'Integrations',
      description: 'User integration connections (OAuth tokens for Slack, Discord, etc.)',
      critical: false
    },
    {
      name: 'WebhookEndpoints',
      description: 'User webhook endpoints for event forwarding (CRITICAL - Required for endpoint management)',
      critical: true
    }
  ];

  let createdCount = 0;
  let errors = [];

  for (const table of requiredTables) {
    try {
      const created = await createTableIfNotExists(table.name);
      if (created) {
        createdCount++;
        console.log(`   Description: ${table.description}`);
      }
    } catch (error) {
      errors.push({ table: table.name, error: error.message });
      if (table.critical) {
        console.error(`   ⚠️  CRITICAL: This table is required for security features!`);
      }
    }
    console.log('');
  }

  // Summary
  console.log('📊 Summary:');
  console.log(`   Tables checked: ${requiredTables.length}`);
  console.log(`   Tables created: ${createdCount}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
    process.exit(1);
  }

  if (createdCount > 0) {
    console.log('\n✅ All required tables are now available!');
  } else {
    console.log('\n✅ All required tables already exist!');
  }
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
