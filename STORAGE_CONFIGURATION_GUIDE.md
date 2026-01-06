# Storage Configuration Guide

## 📊 Database/Storage Overview

Your project uses **Azure Storage Account** (`webhookmonitorstore`) with the following services:

### 1. **Azure Table Storage** (Primary Database)
- **Purpose**: Structured data storage
- **Tables Used**:
  - `ApiKeys` - API key authentication
  - `Tenants` - Tenant information and plans
  - `SecurityAuditLog` - Security event logs
  - `MonitoredUrls` - Uptime monitoring URLs
  - `UptimeChecks` - Uptime check results
  - `AlertState` - Alert deduplication state

### 2. **Azure Blob Storage** (Event Storage)
- **Purpose**: Webhook event data (JSON files)
- **Container**: `events`
- **File Format**: `${tenantId}-${timestamp}.json`

---

## ✅ Is This Good Enough for Production?

### **YES, with proper configuration:**

✅ **Strengths:**
- Azure Storage is enterprise-grade and highly reliable
- Built-in redundancy (LRS/ZRS/GRS options)
- Scalable to handle millions of requests
- Cost-effective for this use case
- Strong security with connection string authentication
- Automatic encryption at rest

⚠️ **Considerations:**
- Connection string grants full access (use Azure AD authentication for enhanced security)
- No built-in backup/versioning (enable Azure Storage backup)
- Consider enabling soft delete for blob storage

**Verdict**: ✅ **Production-ready** for most use cases. For enterprise customers, consider adding:
- Azure AD authentication
- Storage account firewall rules
- Backup/versioning policies

---

## 🔧 Azure Storage Connection Configuration

### Current Setup

**Storage Account Name**: `webhookmonitorstore`  
**Connection String Variable**: `AzureWebJobsStorage`

### Required Configuration

#### 1. **Azure Functions App Settings**

You **MUST** set `AzureWebJobsStorage` in your Azure Functions App Settings:

1. Go to Azure Portal → Your Functions App
2. Navigate to **Configuration** → **Application settings**
3. Add/Verify this setting:
   - **Name**: `AzureWebJobsStorage`
   - **Value**: `DefaultEndpointsProtocol=https;AccountName=webhookmonitorstore;AccountKey=YOUR_ACCOUNT_KEY;EndpointSuffix=core.windows.net`

**⚠️ Important**: The connection string in `local.settings.json` is for **local development only**.  
Production uses the **Azure Functions App Settings**.

#### 2. **Verify Connection String**

You can verify the connection string is set correctly:

```bash
# Check Azure Functions App Settings (via Azure CLI)
az functionapp config appsettings list \
  --name webhook-monitor-func \
  --resource-group YOUR_RESOURCE_GROUP \
  --query "[?name=='AzureWebJobsStorage'].value" -o tsv
```

Or check in Azure Portal:
- Functions App → Configuration → Application settings → Look for `AzureWebJobsStorage`

---

## 🔑 API Key Management

### ❌ **You do NOT need to set API keys in environment variables**

API keys are stored in **Azure Table Storage**, not in environment variables.

### ✅ **How to Create API Keys**

#### Option 1: Using the Production Script (Recommended)

```bash
# Set your Azure connection string
export AzureWebJobsStorage="DefaultEndpointsProtocol=https;AccountName=webhookmonitorstore;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net"

# Create an API key for a tenant
node scripts/seedApiKeyProduction.js tenant_123 pro

# Or with a custom API key
node scripts/seedApiKeyProduction.js tenant_456 free sk_custom_key_here
```

#### Option 2: Using Azure Portal

1. Go to Azure Portal → Storage Account → `webhookmonitorstore`
2. Navigate to **Tables** → `ApiKeys`
3. Click **Add entity**
4. Fill in:
   - **PartitionKey**: `tenant`
   - **RowKey**: Your API key (e.g., `sk_abc123...`)
   - **tenantId**: Your tenant ID
   - **plan**: `free`, `pro`, or `team`
   - **active**: `true`
   - **createdAt**: Current ISO timestamp

#### Option 3: Using Azure CLI

```bash
az storage entity insert \
  --table-name ApiKeys \
  --account-name webhookmonitorstore \
  --connection-string "YOUR_CONNECTION_STRING" \
  --entity PartitionKey=tenant RowKey=sk_your_api_key tenantId=tenant_123 plan=pro active=true
```

### 📋 API Key Table Schema

**Table**: `ApiKeys`  
**Partition Key**: `"tenant"`  
**Row Key**: API key value (e.g., `sk_abc123...`)

**Required Fields**:
- `tenantId` (string) - Tenant identifier
- `plan` (string) - `free`, `pro`, or `team`
- `active` (boolean) - `true` or `false`

**Optional Fields**:
- `expiresAt` (string) - ISO date string when key expires
- `lastRotatedAt` (string) - ISO date string of last rotation
- `createdAt` (string) - ISO date string of creation

---

## ✅ Pre-Deployment Checklist

### Storage Configuration

- [ ] Verify `AzureWebJobsStorage` is set in Azure Functions App Settings
- [ ] Verify storage account `webhookmonitorstore` exists and is accessible
- [ ] Create required tables in Azure Table Storage:
  - [ ] `ApiKeys`
  - [ ] `Tenants`
  - [ ] `SecurityAuditLog`
  - [ ] `MonitoredUrls` (if using uptime checks)
  - [ ] `UptimeChecks` (if using uptime checks)
  - [ ] `AlertState` (if using uptime checks)
- [ ] Create `events` container in Azure Blob Storage
- [ ] Create at least one API key for testing

### API Key Setup

- [ ] Create API keys for all active tenants
- [ ] Store API keys securely (password manager/vault)
- [ ] Document which tenant each key belongs to
- [ ] Set expiration dates if desired

### Security

- [ ] Verify connection string is NOT in code (only in App Settings)
- [ ] Enable storage account firewall if needed
- [ ] Consider enabling Azure AD authentication
- [ ] Enable soft delete for blob storage

---

## 🧪 Testing Storage Connection

### Test 1: Verify Connection String

```bash
# Test locally (uses local.settings.json)
node -e "
const { TableClient } = require('@azure/data-tables');
const client = TableClient.fromConnectionString(
  process.env.AzureWebJobsStorage,
  'ApiKeys'
);
client.listEntities().next().then(() => {
  console.log('✅ Connection successful!');
}).catch(err => {
  console.error('❌ Connection failed:', err.message);
});
"
```

### Test 2: List API Keys

```bash
# Using Azure CLI
az storage table query \
  --table-name ApiKeys \
  --account-name webhookmonitorstore \
  --connection-string "YOUR_CONNECTION_STRING" \
  --query "[].{Key:rowKey, Tenant:tenantId, Plan:plan, Active:active}" \
  -o table
```

### Test 3: Create Test API Key

```bash
# Use the production script
export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
node scripts/seedApiKeyProduction.js test_tenant free
```

---

## 📝 Notes

1. **Local Development**: Uses `local.settings.json` for connection string
2. **Production**: Uses Azure Functions App Settings (`AzureWebJobsStorage`)
3. **API Keys**: Never stored in environment variables, only in Azure Table Storage
4. **Security**: Connection string grants full access - keep it secure!
5. **Backup**: Consider enabling Azure Storage backup for production data

---

## 🚨 Troubleshooting

### Error: "The ApiKeys table does not exist"

**Solution**: Create the table in Azure Portal:
1. Storage Account → Tables → Add table → Name: `ApiKeys`

### Error: "Connection string not found"

**Solution**: 
- For local: Check `local.settings.json` has `AzureWebJobsStorage`
- For production: Set in Azure Functions App Settings

### Error: "Authentication failed"

**Solution**: Verify the connection string is correct and the storage account exists.

---

## 📚 Related Documentation

- [STORAGE_ARCHITECTURE.md](./STORAGE_ARCHITECTURE.md) - Detailed storage architecture
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) - Full deployment checklist
- [QUICK_WINS_IMPLEMENTATION.md](./QUICK_WINS_IMPLEMENTATION.md) - Security features
