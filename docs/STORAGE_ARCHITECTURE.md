# Storage Architecture Overview

## Summary

Your site uses **Azure Storage Account** (`webhookmonitorstore`) with multiple storage services to store different types of data:

1. **Azure Table Storage** - For structured data (API keys, tenant info, uptime checks)
2. **Azure Blob Storage** - For webhook events (JSON files)
3. **Local JSON files** - For development/fallback (not used in production)

---

## Storage Services Breakdown

### 1. **Azure Table Storage** (Primary for Structured Data)

**Storage Account**: `webhookmonitorstore`  
**Connection**: `AzureWebJobsStorage` environment variable

#### Tables Used:

##### **`ApiKeys` Table**
- **Purpose**: Stores API keys and tenant associations
- **Partition Key**: `"tenant"`
- **Row Key**: API key value
- **Data Stored**:
  - API keys (as row keys)
  - Tenant IDs
  - Plan information (free/pro/team)
  - Active status
- **Security**: ✅ Secure - API keys are stored server-side only
- **Location**: `src/lib/auth.ts`, `src/shared/validateApiKey.ts`

##### **`MonitoredUrls` Table**
- **Purpose**: Stores URLs being monitored for uptime checks
- **Data Stored**: Tenant URLs to monitor
- **Location**: `src/functions/uptimeCheck.ts`

##### **`UptimeChecks` Table**
- **Purpose**: Stores uptime check results
- **Data Stored**: Check results, status, response times
- **Location**: `src/functions/uptimeCheck.ts`

##### **`AlertState` Table**
- **Purpose**: Tracks alert states to prevent duplicate notifications
- **Data Stored**: Alert deduplication state
- **Location**: `src/functions/uptimeCheck.ts`

---

### 2. **Azure Blob Storage** (For Event Data)

**Container**: `events`  
**Storage Account**: `webhookmonitorstore`

#### What's Stored:
- **Webhook Events** (JSON files)
- **File Naming**: `${tenantId}-${timestamp}.json`
- **Format**: JSON with event data (eventId, tenantId, eventType, payload, etc.)

#### Security:
- ✅ Events are stored per tenant (tenantId in filename)
- ✅ Access controlled via API key authentication
- ⚠️ **Note**: Blob storage is accessible to anyone with the connection string (stored in Azure Functions app settings)

**Location**: `src/shared/eventStore.ts`

---

### 3. **Local JSON Files** (Development Only)

These are **NOT used in production** but exist for local development:

- `data/devEvents.json` - Local event storage (fallback)
- `devTenants.json` - Local tenant data (fallback)
- `scripts/devApiKeys.json` - Local API keys (fallback)

**⚠️ Important**: These files are for development only. Production uses Azure Storage.

---

## Data Security & Access Control

### ✅ **Secured Data** (Stored in Azure):

1. **API Keys**
   - ✅ Stored in Azure Table Storage
   - ✅ Never exposed to frontend
   - ✅ Validated server-side only
   - ✅ Access controlled via API key authentication

2. **Tenant Information**
   - ✅ Stored in Azure Table Storage
   - ✅ Includes plan, usage, Stripe customer IDs
   - ✅ Access controlled via tenant ID + API key

3. **Webhook Events**
   - ✅ Stored in Azure Blob Storage
   - ✅ Isolated per tenant (tenantId in filename)
   - ✅ Access controlled via API key authentication

4. **Stripe Data**
   - ✅ Stored by Stripe (not in your storage)
   - ✅ Only Stripe customer IDs stored in Azure Tables
   - ✅ Payment data never touches your servers

### ⚠️ **Client-Side Storage** (Browser):

1. **localStorage** (Frontend):
   - `tenantId` - User's tenant ID (derived from Firebase UID)
   - `apiKey` - API key (optional, for API calls)
   - ⚠️ **Note**: This is client-side and can be cleared/modified by users

2. **Firebase Auth** (Frontend):
   - User authentication state
   - User email, UID
   - Managed by Firebase (not your storage)

---

## Storage Account Details

**Account Name**: `webhookmonitorstore`  
**Resource Group**: `webhook-monitor-rg`  
**Location**: `westeurope` (based on resource group)

**Services Enabled**:
- ✅ Blob Storage
- ✅ Table Storage
- ✅ Queue Storage
- ✅ File Storage

**Connection String**: Stored in Azure Functions App Settings as `AzureWebJobsStorage`

---

## Data Flow

### Webhook Event Storage:
```
Incoming Webhook
    ↓
API Key Validation (Azure Table: ApiKeys)
    ↓
Event Processing
    ↓
Save to Azure Blob Storage (events container)
    ↓
Update Usage Tracking (Azure Table: Tenants)
```

### API Key Lookup:
```
Request with x-api-key header
    ↓
Query Azure Table: ApiKeys
    ↓
Validate & Return tenant info
```

---

## Security Considerations

### ✅ **Good Practices**:
1. API keys stored server-side only
2. Events isolated per tenant
3. Connection strings stored in Azure App Settings (not in code)
4. Stripe secrets stored in Azure App Settings
5. Firebase config stored in GitHub Secrets (build-time only)

### ⚠️ **Areas to Review**:
1. **Blob Storage Access**: Anyone with the connection string can access all events
   - **Recommendation**: Use Azure AD authentication or SAS tokens with expiration
   
2. **Table Storage Access**: Same connection string grants full access
   - **Recommendation**: Use managed identities or role-based access

3. **Client-Side API Keys**: API keys stored in localStorage can be accessed by any script
   - **Recommendation**: Use secure HTTP-only cookies or token-based auth

4. **No Encryption at Rest**: Data is stored unencrypted (Azure Storage default encryption applies, but consider additional encryption for sensitive data)

---

## Backup & Recovery

**Current Setup**:
- Azure Storage provides built-in redundancy (LRS/ZRS/GRS based on your configuration)
- No explicit backup strategy visible in code

**Recommendations**:
1. Enable Azure Storage backup/versioning
2. Set up retention policies for events
3. Regular exports of critical data (API keys, tenant info)

---

## Cost Considerations

**Storage Types**:
- **Table Storage**: Very cost-effective for structured data
- **Blob Storage**: Cost-effective for large amounts of event data
- **Both**: Pay per GB stored + transactions

**Optimization Tips**:
1. Set up lifecycle policies to archive old events
2. Use blob tiers (Hot/Cool/Archive) based on access patterns
3. Implement event retention based on plan (already done in code)

---

## Summary

**Your site uses**:
- ✅ **Azure Table Storage** for structured data (API keys, tenants, uptime checks)
- ✅ **Azure Blob Storage** for webhook events
- ✅ **Azure Storage Account**: `webhookmonitorstore`
- ✅ **Secure**: API keys and sensitive data stored server-side
- ⚠️ **Consider**: Enhanced access controls and encryption for production

**Data is secure** because:
- API keys never exposed to frontend
- Events isolated per tenant
- Connection strings stored securely in Azure
- Stripe handles payment data separately
