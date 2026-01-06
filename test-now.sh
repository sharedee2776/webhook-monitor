#!/bin/bash

# Quick test script for security features
# Usage: ./test-now.sh YOUR_API_KEY

API_KEY="${1:-YOUR_API_KEY_HERE}"
BASE_URL="http://localhost:7071"

if [ "$API_KEY" = "YOUR_API_KEY_HERE" ]; then
  echo "❌ Please provide an API key: ./test-now.sh YOUR_API_KEY"
  exit 1
fi

echo "🧪 Testing Security Features"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q "healthy"; then
  echo "   ✅ Health check passed"
else
  echo "   ❌ Health check failed"
fi
echo ""

# Test 2: Unsigned Request (Should Fail)
echo "2️⃣  Testing Unsigned Request (should fail)..."
UNSIGNED=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ingestWebhook" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test.unsigned","payload":{"test":"data"}}')
HTTP_CODE=$(echo "$UNSIGNED" | tail -1)
if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ Correctly rejected unsigned request (401)"
else
  echo "   ❌ Unexpected response: $HTTP_CODE"
  echo "   Response: $(echo "$UNSIGNED" | head -1)"
fi
echo ""

# Test 3: Generate Signature and Test
echo "3️⃣  Testing Signed Request (should succeed)..."
BODY='{"eventType":"test.signed","payload":{"test":"data"}}'
TIMESTAMP=$(node -e "console.log(Date.now())")
SIGNATURE=$(node -e "
  const crypto = require('crypto');
  const apiKey = '$API_KEY';
  const body = '$BODY';
  const timestamp = '$TIMESTAMP';
  console.log(crypto.createHmac('sha256', apiKey).update(body + timestamp + apiKey).digest('hex'));
")

SIGNED=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/ingestWebhook" \
  -H "x-api-key: $API_KEY" \
  -H "x-signature: $SIGNATURE" \
  -H "x-timestamp: $TIMESTAMP" \
  -H "Content-Type: application/json" \
  -d "$BODY")
HTTP_CODE=$(echo "$SIGNED" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Signed request accepted (200)"
  echo "   Response: $(echo "$SIGNED" | head -1)"
else
  echo "   ❌ Signed request failed: $HTTP_CODE"
  echo "   Response: $(echo "$SIGNED" | head -1)"
fi
echo ""

echo "================================"
echo "✅ Testing complete!"
echo ""
echo "💡 Check SecurityAuditLog table in Azure Storage to see audit logs"
echo "💡 Run: node test-security.js for more comprehensive tests"
