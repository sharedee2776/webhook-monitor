# Storage & API Key Setup - Quick Answers

## ❓ Do I Need to Set Authenticated API Keys?

### **NO** - You do NOT set API keys in environment variables

API keys are stored in **Azure Table Storage** (`ApiKeys` table), not in environment variables.

### ✅ What You Need to Do:

1. **Create API keys in Azure Table Storage** using one of these methods:
   - Use the production script: `node scripts/seedApiKeyProduction.js <tenantId> <plan>`
   - Create manually in Azure Portal
   - Use Azure CLI

2. **Store the connection string** in Azure Functions App Settings (not in code)

See [STORAGE_CONFIGURATION_GUIDE.md](./STORAGE_CONFIGURATION_GUIDE.md) for detailed instructions.

---

## 📊 Which Database is My Project Using?

### **Azure Storage Account** (`webhookmonitorstore`)

Your project uses **Azure Storage** with two services:

1. **Azure Table Storage** (Primary Database)
   - Stores: API keys, tenant info, security audit logs, uptime data
   - Tables: `ApiKeys`, `Tenants`, `SecurityAuditLog`, `MonitoredUrls`, `UptimeChecks`, `AlertState`

2. **Azure Blob Storage** (Event Storage)
   - Stores: Webhook events (JSON files)
   - Container: `events`

**This is NOT a traditional SQL database** - it's Azure's NoSQL storage service.

---

## ✅ Is It Good Enough for Live Production?

### **YES - Production Ready! ✅**

**Strengths:**
- ✅ Enterprise-grade Azure Storage (99.9%+ uptime SLA)
- ✅ Highly scalable (handles millions of requests)
- ✅ Built-in redundancy and encryption
- ✅ Cost-effective for this use case
- ✅ Strong security with connection string authentication

**Considerations for Enterprise:**
- ⚠️ Connection string grants full access (consider Azure AD auth)
- ⚠️ Enable backup/versioning for production
- ⚠️ Consider storage account firewall rules

**Verdict**: ✅ **Ready for production** for most use cases.

---

## 🔧 AzureWebJobsStorage Configuration Check

### Current Status

✅ **Local Development**: Configured in `local.settings.json`
```
AzureWebJobsStorage: "DefaultEndpointsProtocol=https;AccountName=webhookmonitorstore;AccountKey=..."
```

⚠️ **Production**: Must be set in **Azure Functions App Settings**

### ✅ How to Verify Production Configuration

#### Option 1: Azure Portal
1. Go to Azure Portal → Your Functions App (`webhook-monitor-func`)
2. Navigate to **Configuration** → **Application settings**
3. Look for `AzureWebJobsStorage`
4. Verify it points to `webhookmonitorstore` storage account

#### Option 2: Azure CLI
```bash
az functionapp config appsettings list \
  --name webhook-monitor-func \
  --resource-group YOUR_RESOURCE_GROUP \
  --query "[?name=='AzureWebJobsStorage']" -o table
```

#### Option 3: Test Connection
```bash
# Set connection string
export AzureWebJobsStorage="YOUR_CONNECTION_STRING"

# Test with the production script
node scripts/seedApiKeyProduction.js test_tenant free
```

### ⚠️ If Not Configured:

1. **Get your storage account connection string:**
   ```bash
   az storage account show-connection-string \
     --name webhookmonitorstore \
     --resource-group YOUR_RESOURCE_GROUP \
     --query connectionString -o tsv
   ```

2. **Set in Azure Functions App Settings:**
   - Azure Portal → Functions App → Configuration → Application settings
   - Add/Edit: `AzureWebJobsStorage` = `[connection string from step 1]`

---

## 📋 Quick Setup Checklist

### Before Deployment:

- [ ] Verify `AzureWebJobsStorage` is set in Azure Functions App Settings
- [ ] Verify storage account `webhookmonitorstore` exists
- [ ] Create required tables in Azure Table Storage:
  - [ ] `ApiKeys`
  - [ ] `Tenants`
  - [ ] `SecurityAuditLog`
- [ ] Create `events` container in Azure Blob Storage
- [ ] Create at least one API key for testing:
  ```bash
  export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
  node scripts/seedApiKeyProduction.js test_tenant free
  ```

### After Deployment:

- [ ] Test API key authentication
- [ ] Verify events are being stored in blob storage
- [ ] Check security audit logs are being created
- [ ] Monitor storage account usage

---

## 🚀 Next Steps

1. **Verify Storage Connection**: Check Azure Functions App Settings
2. **Create API Keys**: Use `scripts/seedApiKeyProduction.js`
3. **Test**: Verify API keys work with your endpoints
4. **Deploy**: Push to GitHub to trigger deployment

---

## 📚 Detailed Documentation

- [STORAGE_CONFIGURATION_GUIDE.md](./STORAGE_CONFIGURATION_GUIDE.md) - Complete setup guide
- [STORAGE_ARCHITECTURE.md](./STORAGE_ARCHITECTURE.md) - Architecture details
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) - Full checklist

---

## 🆘 Quick Troubleshooting

**Problem**: "Connection string not found"
- **Solution**: Set `AzureWebJobsStorage` in Azure Functions App Settings

**Problem**: "ApiKeys table does not exist"
- **Solution**: Create table in Azure Portal → Storage Account → Tables

**Problem**: "Authentication failed"
- **Solution**: Verify connection string is correct and storage account exists
