# Production Environment Variables Checklist

This document lists all environment variables required for production deployment.

## ✅ Required Variables (MUST be set in Azure Functions App Settings)

### 1. **AzureWebJobsStorage** (REQUIRED)
- **Purpose**: Azure Storage connection string for Tables and Blobs
- **Format**: `DefaultEndpointsProtocol=https;AccountName=webhookmonitorstore;AccountKey=...;EndpointSuffix=core.windows.net`
- **Where to set**: Azure Functions App → Configuration → Application settings
- **How to get**: 
  ```bash
  az storage account show-connection-string \
    --name webhookmonitorstore \
    --resource-group YOUR_RESOURCE_GROUP \
    --query connectionString -o tsv
  ```
- **⚠️ Critical**: Without this, the app cannot save events or access API keys

### 2. **AZURE_STORAGE_CONNECTION_STRING** (Optional - fallback)
- **Purpose**: Alternative name for AzureWebJobsStorage (used as fallback)
- **Format**: Same as AzureWebJobsStorage
- **Note**: Can be same value as AzureWebJobsStorage

### 3. **STRIPE_SECRET_KEY** (Required if billing enabled)
- **Purpose**: Stripe API secret key for payment processing
- **Format**: `sk_live_...` (production) or `sk_test_...` (testing)
- **Where to get**: Stripe Dashboard → Developers → API keys

### 4. **STRIPE_WEBHOOK_SECRET** (Required if billing enabled)
- **Purpose**: Stripe webhook signing secret for webhook verification
- **Format**: `whsec_...`
- **Where to get**: Stripe Dashboard → Developers → Webhooks → Signing secret

### 5. **PRO_PRICE_ID** (Required if billing enabled)
- **Purpose**: Stripe Price ID for Pro plan
- **Format**: `price_...`
- **Where to get**: Stripe Dashboard → Products → Pro plan → Pricing

### 6. **TEAM_PRICE_ID** (Required if billing enabled)
- **Purpose**: Stripe Price ID for Team plan
- **Format**: `price_...`
- **Where to get**: Stripe Dashboard → Products → Team plan → Pricing

### 7. **PUBLIC_APP_URL** (Recommended)
- **Purpose**: Public URL of your application (for redirects, webhooks)
- **Format**: `https://webhookmonitor.shop` or your domain
- **Used in**: Checkout redirects, webhook callbacks

### 8. **STRIPE_MODE** (Optional)
- **Purpose**: Stripe mode (live/test)
- **Format**: `live` or `test`
- **Default**: `live` if not set

### 9. **BILLING_ENABLED** (Optional)
- **Purpose**: Enable/disable billing features
- **Format**: `true` or `false`
- **Default**: `false` if not set

## 🔧 Optional Variables

### 10. **DISCORD_WEBHOOK_URL** (Optional)
- **Purpose**: Discord webhook URL for notifications
- **Format**: `https://discord.com/api/webhooks/...`
- **Used in**: Alert notifications, integrations

### 11. **ADMIN_KEY** (Optional - for admin functions)
- **Purpose**: Admin secret key for admin-only endpoints
- **Format**: Any secure string
- **⚠️ Security**: Use strong random string, never commit to git

### 12. **NODE_ENV** (Optional)
- **Purpose**: Node.js environment
- **Format**: `production` or `development`
- **Default**: `production` in Azure Functions

## 📋 Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] `AzureWebJobsStorage` is set in Azure Functions App Settings
- [ ] Storage account `webhookmonitorstore` exists and is accessible
- [ ] All Stripe variables are set (if billing enabled)
- [ ] `PUBLIC_APP_URL` matches your actual domain
- [ ] Required Azure Tables exist:
  - [ ] `ApiKeys`
  - [ ] `Tenants`
  - [ ] `Events`
  - [ ] `WebhookEndpoints`
  - [ ] `SecurityAuditLog`
- [ ] `events` container exists in Azure Blob Storage
- [ ] At least one API key is created for testing
- [ ] CORS is configured (if needed)

## 🚨 Common Issues

### Issue: Events not saving
**Solution**: Verify `AzureWebJobsStorage` is set correctly and storage account is accessible.

### Issue: API key authentication fails
**Solution**: 
1. Verify `AzureWebJobsStorage` is set
2. Check that `ApiKeys` table exists
3. Verify API key exists in table

### Issue: Stripe webhooks not working
**Solution**: 
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
2. Check webhook endpoint URL in Stripe dashboard matches your function URL
3. Verify `STRIPE_SECRET_KEY` is correct

## 📝 Setting Variables in Azure

### Via Azure Portal:
1. Go to Azure Portal → Your Functions App
2. Navigate to **Configuration** → **Application settings**
3. Click **+ New application setting**
4. Enter name and value
5. Click **Save**

### Via Azure CLI:
```bash
az functionapp config appsettings set \
  --name YOUR_FUNCTION_APP \
  --resource-group YOUR_RESOURCE_GROUP \
  --settings \
    AzureWebJobsStorage="YOUR_CONNECTION_STRING" \
    STRIPE_SECRET_KEY="sk_live_..." \
    STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 🔒 Security Notes

1. **Never commit** `local.settings.json` to git (it's in `.gitignore`)
2. **Never commit** production connection strings or secrets
3. Use **Azure Key Vault** for sensitive values in production (recommended)
4. Rotate secrets regularly
5. Use different Stripe keys for test/production

## ✅ Verification Script

After deployment, test that all required variables are accessible:

```bash
# Test Azure Storage connection
export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
node scripts/createMissingTables.js

# Test API key creation
node scripts/seedApiKeyProduction.js test_tenant free

# Test event ingestion (use your API key)
curl -X POST https://YOUR_FUNCTION_APP.azurewebsites.net/api/ingestWebhook \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"test.event","payload":{"test":true}}'
```
