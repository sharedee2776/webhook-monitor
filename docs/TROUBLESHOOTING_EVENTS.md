# Troubleshooting: Events Not Showing on Dashboard

## Problem
Events are being received (visible in Azure Logs/Live Metrics) but dashboard shows 0 events.

## Root Cause Analysis

### Possible Issues:
1. **Events table doesn't exist** - Table needs to be created first
2. **Tenant ID mismatch** - Events saved with different tenant ID than queried
3. **Table name case sensitivity** - Azure Table Storage is case-sensitive
4. **Save failing silently** - Errors not being logged properly
5. **Connection string issue** - AzureWebJobsStorage not configured correctly

## Diagnostic Steps

### 1. Verify Table Exists
Run the table creation script:
```bash
export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
node scripts/createMissingTables.js
```

Expected output should show:
```
✅ Table "Events" already exists
```
OR
```
✅ Created table "Events"
```

### 2. Check Azure Logs
Look for these log entries in Azure Portal → Function App → Logs:

**When event is received:**
```
[INGEST] Saving event to database...
[EVENT_STORE] Saving to table storage...
[EVENT_TABLE] Saving event to table...
[EVENT_TABLE] ✅ Event saved successfully
[INGEST] ✅ Event saved to database successfully
```

**When dashboard queries:**
```
[DASHBOARD_EVENTS] Querying table storage...
[EVENT_TABLE] Querying events for tenant...
[EVENT_TABLE] ✅ Query completed { found: X }
[DASHBOARD_EVENTS] ✅ Fetched events from table { count: X }
```

### 3. Verify Tenant ID Consistency
Check that the same tenant ID is used for:
- Saving events (from API key validation)
- Querying events (from API key validation)

Both should come from `authenticateApiKey()` which reads from the `ApiKeys` table.

### 4. Test Direct Table Query
You can verify events are in the table by checking Azure Portal:
1. Go to Storage Account → Tables
2. Find "Events" table
3. Check if rows exist with your tenant ID as PartitionKey

### 5. Check Connection String
Verify `AzureWebJobsStorage` is set correctly in:
- Azure Portal → Function App → Configuration → Application Settings
- Should be format: `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...`

## Common Fixes

### Fix 1: Create Events Table
If table doesn't exist:
```bash
node scripts/createMissingTables.js
```

### Fix 2: Verify Tenant ID
Check that your API key's tenant ID matches:
1. Get your API key from dashboard
2. Check Azure Table Storage → `ApiKeys` table
3. Find row with your API key as RowKey
4. Note the `tenantId` value
5. Verify this matches what's being queried

### Fix 3: Check Table Name Case
Azure Table Storage is case-sensitive. Ensure:
- Table name is exactly `Events` (capital E)
- Code uses `"Events"` consistently

### Fix 4: Enable Detailed Logging
The enhanced logging will now show:
- When events are saved
- When queries are made
- Any errors that occur
- Tenant IDs being used

Check Azure Logs for these entries to trace the flow.

## Verification Test

After applying fixes, test by:

1. **Send a test webhook:**
```bash
curl -X POST https://your-function-app.azurewebsites.net/api/ingestWebhook \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test.event", "payload": {"test": true}}'
```

2. **Check logs for:**
   - `[INGEST] ✅ Event saved to database successfully`
   - `[EVENT_TABLE] ✅ Event saved successfully`

3. **Query dashboard:**
   - Refresh dashboard
   - Should see 1 event
   - Check logs for: `[DASHBOARD_EVENTS] ✅ Fetched events from table { count: 1 }`

## Still Not Working?

If events still don't show:

1. **Check Azure Storage Account:**
   - Verify storage account exists
   - Check connection string is valid
   - Verify firewall rules allow access

2. **Check Function App Settings:**
   - `AzureWebJobsStorage` is set
   - No typos in variable name
   - Value is correct connection string

3. **Check Table Permissions:**
   - Storage account allows table operations
   - Connection string has proper permissions

4. **Review Logs:**
   - Look for any error messages
   - Check for warnings about missing connection string
   - Verify tenant ID in all log entries matches

## Enhanced Logging

The code now includes detailed logging at every step:
- Event save attempts
- Table creation attempts
- Query operations
- Error details with status codes

All logs are prefixed with `[EVENT_TABLE]`, `[EVENT_STORE]`, `[INGEST]`, or `[DASHBOARD_EVENTS]` for easy filtering.
