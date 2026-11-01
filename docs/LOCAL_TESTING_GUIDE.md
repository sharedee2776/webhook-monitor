# Local Testing Guide - Security Enhancements

## Prerequisites

1. **Azure Functions Core Tools** installed
   ```bash
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   ```

2. **Azure Storage Emulator (Azurite)** or real Azure Storage connection
   ```bash
   npm install -g azurite
   ```

3. **Node.js 20.x** installed

---

## Step 1: Setup Local Environment

### 1.1 Check local.settings.json

Make sure you have `local.settings.json` with Azure Storage connection:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "WEBSITE_NODE_DEFAULT_VERSION": "~20"
  }
}
```

**OR** use your real Azure Storage connection string:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=...",
    "FUNCTIONS_WORKER_RUNTIME": "node"
  }
}
```

### 1.2 Start Azurite (if using local emulator)

```bash
# Terminal 1: Start Azurite
azurite --silent --location ./azurite --debug ./azurite/debug.log
```

### 1.3 Build the project

```bash
npm run build
```

---

## Step 2: Start Azure Functions Locally

```bash
# Terminal 2: Start Functions
npm start
# or
func start
```

You should see output like:
```
Functions:
  ingestWebhook: [POST] http://localhost:7071/api/ingest
  dashboardEvents: [GET] http://localhost:7071/api/dashboardEvents
  healthCheck: [GET] http://localhost:7071/api/health
  ...
```

---

## Step 3: Test Security Features

### Test 1: Health Check (No Auth Required)

```bash
curl http://localhost:7071/api/health
```

**Expected**: `{"status":"healthy","message":"API is working",...}`

---

### Test 2: API Key Authentication (Success)

First, you need a valid API key. Check your Azure Table Storage `ApiKeys` table or create a test key.

```bash
# Replace YOUR_API_KEY with a valid key from your ApiKeys table
curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "test.event",
    "payload": {"test": "data"}
  }'
```

**Expected**: `401 Unauthorized` (because request signing is now required)

---

### Test 3: Request Signing (Required for Write Operations)

Request signing is now **required** for POST requests. Here's how to test:

#### 3.1 Create a test script

Create `test-signing.js`:

```javascript
const crypto = require('crypto');

const apiKey = 'YOUR_API_KEY'; // Replace with your API key
const body = JSON.stringify({
  eventType: "test.event",
  payload: { test: "data" }
});
const timestamp = Date.now().toString();

// Generate signature: HMAC-SHA256(body + timestamp + apiKey)
const signature = crypto
  .createHmac('sha256', apiKey)
  .update(body + timestamp + apiKey)
  .digest('hex');

console.log('Signature:', signature);
console.log('Timestamp:', timestamp);
console.log('\ncurl command:');
console.log(`curl -X POST http://localhost:7071/api/ingest \\`);
console.log(`  -H "x-api-key: ${apiKey}" \\`);
console.log(`  -H "x-signature: ${signature}" \\`);
console.log(`  -H "x-timestamp: ${timestamp}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '${body}'`);
```

Run it:
```bash
node test-signing.js
```

Copy the curl command and run it.

**Expected**: `200 OK` with `{"ok":true}`

---

### Test 4: Request Signing Failure (Missing Signature)

```bash
curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test.event", "payload": {"test": "data"}}'
```

**Expected**: `401 Unauthorized` with message "Request signature required for write operations"

**Check Security Audit Log**: Should see `request_unsigned` event logged.

---

### Test 5: Request Signing Failure (Invalid Signature)

```bash
curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-signature: invalid_signature" \
  -H "x-timestamp: 1234567890" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test.event", "payload": {"test": "data"}}'
```

**Expected**: `401 Unauthorized` with message "Invalid request signature"

---

### Test 6: Request Signing Failure (Expired Timestamp)

```bash
# Use timestamp from 10 minutes ago
OLD_TIMESTAMP=$(($(date +%s) - 600))000

curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "x-signature: some_signature" \
  -H "x-timestamp: $OLD_TIMESTAMP" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "test.event", "payload": {"test": "data"}}'
```

**Expected**: `401 Unauthorized` with message "Request timestamp expired or invalid"

---

### Test 7: API Key Expiration (If Key Has expiresAt)

To test expiration, you need to:
1. Add an `expiresAt` field to an API key in Azure Table Storage
2. Set it to a past date
3. Try to use that key

```bash
# This will fail if the key has expired
curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: EXPIRED_API_KEY" \
  ...
```

**Expected**: `401 Unauthorized` (logged as `auth_expired`)

---

### Test 8: Security Audit Logging

After running tests, check the SecurityAuditLog table in Azure Storage:

```bash
# Using Azure CLI
az storage table query \
  --table-name SecurityAuditLog \
  --account-name webhookmonitorstore \
  --connection-string "YOUR_CONNECTION_STRING" \
  --query "[*].{Event:eventType, IP:ipAddress, Endpoint:endpoint, Time:timestamp}" \
  -o table
```

**Expected**: See logs for:
- `auth_success` - Successful authentications
- `auth_failure` - Failed authentications
- `request_signed` - Successfully signed requests
- `request_unsigned` - Unsigned write requests
- `rate_limit_exceeded` - Rate limit violations

---

### Test 9: Rate Limiting

Make rapid requests to trigger rate limiting:

```bash
# Make 100 requests quickly
for i in {1..100}; do
  curl -X POST http://localhost:7071/api/ingest \
    -H "x-api-key: YOUR_API_KEY" \
    -H "x-signature: SIGNATURE" \
    -H "x-timestamp: TIMESTAMP" \
    -H "Content-Type: application/json" \
    -d '{"eventType": "test.event", "payload": {"test": "data"}}' &
done
wait
```

**Expected**: After rate limit (60 for free plan), you'll get `429 Too Many Requests`

**Check Security Audit Log**: Should see `rate_limit_exceeded` events.

---

### Test 10: IP Address Logging

All requests should log IP addresses. Check the audit logs:

```bash
# View recent audit logs with IPs
az storage table query \
  --table-name SecurityAuditLog \
  --account-name webhookmonitorstore \
  --connection-string "YOUR_CONNECTION_STRING" \
  --query "[*].{Event:eventType, IP:ipAddress, Time:timestamp}" \
  -o table \
  --num-results 10
```

**Expected**: All events should have IP addresses (or "unknown" if not available)

---

## Step 4: Test Read Operations (No Signing Required)

Read operations like `GET /api/dashboardEvents` don't require signing:

```bash
curl http://localhost:7071/api/dashboardEvents \
  -H "x-api-key: YOUR_API_KEY"
```

**Expected**: `200 OK` with events list (or empty if no events)

**Note**: Still requires API key authentication and logs to audit log.

---

## Step 5: Verify Security Audit Logs

### Check Logs in Azure Portal

1. Go to Azure Portal → Storage Account → Tables
2. Open `SecurityAuditLog` table
3. View recent entries

### Check Logs via Azure CLI

```bash
az storage table query \
  --table-name SecurityAuditLog \
  --account-name webhookmonitorstore \
  --connection-string "$AzureWebJobsStorage" \
  --query "[*].{Type:eventType, Tenant:tenantId, IP:ipAddress, Endpoint:endpoint, Time:timestamp, Error:errorMessage}" \
  -o table \
  --num-results 20
```

---

## Test Checklist

- [ ] ✅ Build succeeds without errors
- [ ] ✅ Functions start locally
- [ ] ✅ Health check works
- [ ] ✅ API key authentication works
- [ ] ✅ Request signing works for valid requests
- [ ] ✅ Request signing rejects unsigned requests
- [ ] ✅ Request signing rejects invalid signatures
- [ ] ✅ Request signing rejects expired timestamps
- [ ] ✅ API key expiration check works (if key has expiresAt)
- [ ] ✅ Security audit logs are created
- [ ] ✅ IP addresses are logged
- [ ] ✅ Rate limiting works and is logged
- [ ] ✅ Read operations work without signing

---

## Troubleshooting

### Functions won't start

1. Check `local.settings.json` exists and has correct format
2. Check Azure Storage connection string is valid
3. Check Node.js version: `node --version` (should be 20.x)
4. Check Functions Core Tools: `func --version`

### "Table not found" errors

The SecurityAuditLog table is created automatically on first use. If you see errors:
1. Check Azure Storage connection is working
2. Check you have permissions to create tables
3. Manually create table if needed:
   ```bash
   az storage table create --name SecurityAuditLog --account-name webhookmonitorstore
   ```

### Request signing always fails

1. Verify you're using the correct API key
2. Check timestamp is current (within 5 minutes)
3. Verify signature algorithm matches (HMAC-SHA256)
4. Check body matches exactly (no extra whitespace)

### No audit logs appearing

1. Check Azure Storage connection string is correct
2. Check table permissions
3. Check function logs for errors:
   ```bash
   func start --verbose
   ```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Commit the changes
2. ✅ Push to GitHub
3. ✅ Monitor deployment in GitHub Actions
4. ✅ Test on staging/production
5. ✅ Update API documentation
6. ✅ Notify clients about signing requirement

---

## Quick Test Script

Save this as `test-all.sh`:

```bash
#!/bin/bash

API_KEY="YOUR_API_KEY"
BASE_URL="http://localhost:7071"

echo "Testing Health Check..."
curl -s "$BASE_URL/api/health" | jq .

echo -e "\nTesting Unsigned Request (should fail)..."
curl -s -X POST "$BASE_URL/api/ingest" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","payload":{}}' | jq .

echo -e "\nTesting with Valid Signature..."
# Generate signature (requires Node.js)
TIMESTAMP=$(node -e "console.log(Date.now())")
BODY='{"eventType":"test","payload":{}}'
SIGNATURE=$(node -e "
  const crypto = require('crypto');
  const apiKey = '$API_KEY';
  const body = '$BODY';
  const timestamp = '$TIMESTAMP';
  console.log(crypto.createHmac('sha256', apiKey).update(body + timestamp + apiKey).digest('hex'));
")

curl -s -X POST "$BASE_URL/api/ingest" \
  -H "x-api-key: $API_KEY" \
  -H "x-signature: $SIGNATURE" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq .

echo -e "\nDone! Check SecurityAuditLog table for audit entries."
```

Make it executable and run:
```bash
chmod +x test-all.sh
./test-all.sh
```
