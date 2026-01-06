# Quick Start - Local Testing

## Step 1: Build the Project

```bash
npm run build
```

**Expected**: Should complete without errors ✅

---

## Step 2: Start Azure Functions

```bash
npm start
# or
func start
```

**Expected Output**:
```
Functions:
  ingestWebhook: [POST] http://localhost:7071/api/ingest
  dashboardEvents: [GET] http://localhost:7071/api/dashboardEvents
  healthCheck: [GET] http://localhost:7071/api/health
  ...
```

**Keep this terminal running!**

---

## Step 3: Get a Test API Key

You need a valid API key from your Azure Table Storage. Get one:

```bash
# Option 1: Query Azure Storage
az storage table query \
  --table-name ApiKeys \
  --account-name webhookmonitorstore \
  --connection-string "YOUR_CONNECTION_STRING" \
  --query "[0].rowKey" -o tsv

# Option 2: Use an existing key you know
# Option 3: Create a test key in Azure Portal
```

**Save the API key** - you'll need it for testing.

---

## Step 4: Run Automated Tests

Use the test script:

```bash
# Set your API key
export TEST_API_KEY="your_actual_api_key_here"

# Run tests
node test-security.js
```

**Or** test manually with curl (see below).

---

## Step 5: Manual Testing

### Test 1: Health Check
```bash
curl http://localhost:7071/api/health
```

### Test 2: Unsigned Request (Should Fail)
```bash
curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test","payload":{}}'
```

**Expected**: `401 Unauthorized` - "Request signature required"

### Test 3: Signed Request (Should Work)

Generate signature first:

```bash
# Save this as generate-signature.sh
API_KEY="YOUR_API_KEY"
BODY='{"eventType":"test","payload":{}}'
TIMESTAMP=$(node -e "console.log(Date.now())")
SIGNATURE=$(node -e "
  const crypto = require('crypto');
  console.log(
    crypto.createHmac('sha256', '$API_KEY')
      .update('$BODY' + '$TIMESTAMP' + '$API_KEY')
      .digest('hex')
  );
")

echo "Timestamp: $TIMESTAMP"
echo "Signature: $SIGNATURE"

curl -X POST http://localhost:7071/api/ingest \
  -H "x-api-key: $API_KEY" \
  -H "x-signature: $SIGNATURE" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```

**Expected**: `200 OK` with `{"ok":true}`

---

## Step 6: Check Security Audit Logs

After running tests, check the audit logs:

```bash
az storage table query \
  --table-name SecurityAuditLog \
  --account-name webhookmonitorstore \
  --connection-string "$(grep AzureWebJobsStorage local.settings.json | cut -d'"' -f4)" \
  --query "[*].{Event:eventType, IP:ipAddress, Endpoint:endpoint, Time:timestamp}" \
  -o table \
  --num-results 10
```

**Expected**: See logs for:
- `auth_success` - Successful authentications
- `auth_failure` - Failed authentications  
- `request_signed` - Signed requests
- `request_unsigned` - Unsigned requests

---

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Functions won't start
- Check `local.settings.json` exists
- Check Azure Storage connection string is valid
- Check Node.js version: `node --version` (should be 20.x)

### "Table not found" errors
- SecurityAuditLog table is created automatically on first use
- Check Azure Storage connection is working
- Check you have permissions

### Request signing fails
- Verify API key is correct
- Check timestamp is current (within 5 minutes)
- Verify signature algorithm matches exactly

---

## What to Look For

✅ **Success Indicators:**
- Build completes without errors
- Functions start and show endpoints
- Health check returns 200
- Unsigned requests are rejected (401)
- Signed requests are accepted (200)
- Audit logs are created in Azure Storage

❌ **Failure Indicators:**
- Build errors
- Functions won't start
- All requests return 500 errors
- No audit logs appearing
- TypeScript compilation errors

---

## Next Steps After Successful Testing

1. ✅ All tests pass
2. ✅ Audit logs are working
3. ✅ Request signing works
4. ✅ Ready to commit and deploy!
