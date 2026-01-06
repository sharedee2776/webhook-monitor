# Webhook Monitor — Architecture Overview

## 🏗️ System Architecture

Webhook Monitor is a modern, serverless SaaS platform built on Azure cloud services, designed for scalability, reliability, and security.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │  API Clients │         │
│  │  (Browser)   │  │   (Future)   │  │  (Webhooks)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React SPA)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Azure Static Web Apps (Global CDN, SSL, Custom Domain) │   │
│  │  • React 18 + TypeScript + Vite                         │   │
│  │  • Firebase Authentication                              │   │
│  │  • Real-time Dashboard & Analytics                     │   │
│  │  • Stripe Checkout Integration                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Azure Functions (Serverless API)                  │   │
│  │  • RESTful API Endpoints                                 │   │
│  │  • API Key Authentication                                │   │
│  │  • Request Signing Verification                          │   │
│  │  • Rate Limiting                                         │   │
│  │  • Security Audit Logging                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Storage    │    │   Billing    │    │  Integrations│
│   Layer      │    │   Layer      │    │    Layer     │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ Azure Table  │    │   Stripe     │    │   Discord    │
│ Storage      │    │   API        │    │   Webhooks   │
│              │    │              │    │              │
│ • ApiKeys    │    │ • Checkout   │    │ • Alerts     │
│ • Tenants    │    │ • Webhooks   │    │ • Notifications│
│ • Audit Logs│    │ • Subscriptions│   │              │
│              │    │              │    │              │
│ Azure Blob  │    │              │    │              │
│ Storage      │    │              │    │              │
│              │    │              │    │              │
│ • Events     │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🔄 Data Flow

### 1. Webhook Event Ingestion Flow

```
Client Application
    │
    │ POST /api/ingest
    │ Headers: x-api-key, x-signature, x-timestamp
    │ Body: { eventType, payload }
    ▼
Azure Functions (ingestWebhook)
    │
    ├─► API Key Validation (Azure Table: ApiKeys)
    │   ├─► Check key exists
    │   ├─► Check key is active
    │   ├─► Check key expiration
    │   └─► Log auth attempt (SecurityAuditLog)
    │
    ├─► Request Signature Verification
    │   ├─► Validate HMAC-SHA256 signature
    │   ├─► Validate timestamp (5-min window)
    │   └─► Log signing attempt (SecurityAuditLog)
    │
    ├─► Rate Limiting Check
    │   ├─► Check per-plan limits
    │   └─► Log violations (SecurityAuditLog)
    │
    ├─► Event Processing
    │   ├─► Validate event structure
    │   ├─► Deduplicate (if needed)
    │   └─► Extract tenant ID
    │
    └─► Event Storage
        ├─► Save to Azure Blob Storage (events container)
        └─► Update usage tracking (Azure Table: Tenants)
```

### 2. Dashboard Data Flow

```
Frontend Dashboard
    │
    │ GET /api/dashboardEvents
    │ Headers: x-api-key
    ▼
Azure Functions (dashboardEvents)
    │
    ├─► API Key Authentication
    │   └─► Log auth attempt (SecurityAuditLog)
    │
    ├─► Query Azure Blob Storage
    │   └─► Filter by tenant ID
    │
    └─► Return Events
        └─► Frontend displays in dashboard
```

### 3. Billing Flow

```
User Initiates Checkout
    │
    │ POST /api/billing/create-checkout
    │ Headers: Firebase Auth Token
    ▼
Azure Functions (billingCreateCheckout)
    │
    ├─► Validate Firebase Auth
    ├─► Create Stripe Checkout Session
    └─► Return Checkout URL
        │
        ▼
User Completes Payment (Stripe)
    │
    │ Webhook: checkout.session.completed
    ▼
Azure Functions (stripeWebhook)
    │
    ├─► Verify Stripe Signature
    ├─► Extract tenant ID & plan
    └─► Apply Plan (billingApplyPlan)
        │
        └─► Update Azure Table: Tenants
```

---

## 🗄️ Storage Architecture

### Azure Table Storage

**Purpose**: Structured data storage with fast lookups

**Tables:**

1. **`ApiKeys`**
   - **Partition Key**: `"tenant"`
   - **Row Key**: API key value
   - **Fields**: `tenantId`, `plan`, `active`, `expiresAt`, `createdAt`
   - **Usage**: API key authentication and validation

2. **`Tenants`**
   - **Partition Key**: Tenant ID
   - **Row Key**: Tenant ID
   - **Fields**: `plan`, `usage`, `stripeCustomerId`, `subscriptionState`
   - **Usage**: Tenant information and subscription management

3. **`SecurityAuditLog`**
   - **Partition Key**: `tenantId` or `"system"`
   - **Row Key**: Timestamp-based unique ID
   - **Fields**: `eventType`, `apiKey` (partial), `ipAddress`, `userAgent`, `endpoint`, `method`, `errorMessage`
   - **Usage**: Security event audit trail

4. **`MonitoredUrls`**
   - **Purpose**: URLs to monitor for uptime
   - **Usage**: Uptime monitoring configuration

5. **`UptimeChecks`**
   - **Purpose**: Uptime check results
   - **Usage**: Historical uptime data

6. **`AlertState`**
   - **Purpose**: Alert deduplication state
   - **Usage**: Prevent duplicate alert notifications

### Azure Blob Storage

**Purpose**: Event data storage (large JSON files)

**Container**: `events`

**File Naming**: `${tenantId}-${timestamp}.json`

**Structure**:
```json
{
  "eventId": "unique-id",
  "tenantId": "tenant_123",
  "eventType": "webhook.event",
  "payload": { ... },
  "timestamp": "2025-01-15T10:30:00Z",
  "metadata": { ... }
}
```

---

## 🔒 Security Architecture

### Authentication Layers

1. **API Key Authentication**
   - All protected endpoints require `x-api-key` header
   - Keys validated against Azure Table Storage
   - Expiration checking enabled
   - Inactive keys rejected

2. **Request Signing** (Write Operations)
   - HMAC-SHA256 signature required for POST requests
   - Timestamp validation (5-minute window)
   - Prevents tampering and replay attacks
   - Signature: `HMAC-SHA256(body + timestamp + apiKey)`

3. **Firebase Authentication** (Frontend)
   - User authentication for dashboard access
   - Google Sign-In support
   - Tenant ID derived from Firebase UID

### Security Audit Logging

All security events are logged to `SecurityAuditLog` table:

- **Event Types**:
  - `auth_success` - Successful authentication
  - `auth_failure` - Failed authentication
  - `auth_expired` - Expired API key attempt
  - `request_signed` - Valid signed request
  - `request_unsigned` - Missing/invalid signature
  - `rate_limit_exceeded` - Rate limit violation

- **Logged Data**:
  - IP address (extracted from headers)
  - User agent
  - Endpoint and HTTP method
  - Error messages (if any)
  - Timestamp

### Data Isolation

- **Tenant Isolation**: All data is isolated by tenant ID
- **API Key Scoping**: Each API key is associated with a single tenant
- **Storage Isolation**: Events stored per tenant in blob storage

---

## 🔌 API Endpoints

### Public Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Health check |

### Protected Endpoints (API Key Required)

| Endpoint | Method | Signing | Description |
|----------|--------|---------|-------------|
| `/api/ingest` | POST | ✅ Required | Ingest webhook event |
| `/api/dashboardEvents` | GET | ❌ | List events for dashboard |
| `/api/webhook/endpoints` | GET/POST/DELETE | ❌ | Manage webhook endpoints |
| `/api/alert/email-config` | GET/POST | ❌ | Configure alert emails |
| `/api/alert/webhook` | POST | ❌ | Send alert webhook |

### Frontend Endpoints (Firebase Auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/create-checkout` | POST | Create Stripe checkout |
| `/api/billing/customer-portal` | POST | Access customer portal |
| `/api/tenant/plan` | GET | Get tenant plan |

### System Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/billing/stripe-webhook` | POST | Stripe Signature | Stripe webhook handler |

---

## 🚀 Deployment Architecture

### Frontend Deployment

**Platform**: Azure Static Web Apps

**Features**:
- Global CDN distribution
- Automatic SSL certificates
- Custom domain support
- GitHub Actions integration

**Build Process**:
1. GitHub Actions triggered on push to `main`
2. Build React app with Vite
3. Deploy to Azure Static Web Apps
4. Environment variables injected from GitHub Secrets

### Backend Deployment

**Platform**: Azure Functions

**Features**:
- Serverless compute (pay per execution)
- Automatic scaling
- Integrated with Azure Storage
- GitHub Actions deployment

**Deployment Process**:
1. GitHub Actions triggered on push to `main`
2. Build TypeScript code
3. Deploy to Azure Functions App
4. Environment variables from Azure App Settings

### Infrastructure Components

- **Azure Functions App**: Serverless API backend
- **Azure Storage Account**: Data persistence
- **Azure Static Web Apps**: Frontend hosting
- **GitHub Actions**: CI/CD pipeline
- **Stripe**: Payment processing
- **Firebase**: Authentication

---

## 📊 Monitoring & Observability

### Health Checks

- **Endpoint**: `/api/health`
- **Returns**: System status, configuration state
- **Usage**: Load balancer health checks, monitoring

### Audit Logging

- **Table**: `SecurityAuditLog`
- **Events**: All authentication and security events
- **Retention**: Configurable (recommended: 90 days)

### Metrics (Future)

- Request count per endpoint
- Response times
- Error rates
- Usage per tenant
- Rate limit violations

---

## 🔄 Integration Points

### Stripe Integration

- **Checkout**: Create payment sessions
- **Webhooks**: Handle subscription events
- **Customer Portal**: Subscription management
- **Plans**: Free, Pro, Team tiers

### Firebase Integration

- **Authentication**: User sign-in/sign-up
- **Tenant Mapping**: Firebase UID → Tenant ID

### Discord Integration (Optional)

- **Webhooks**: System alerts
- **Notifications**: Uptime alerts, system events

---

## 🛠️ Development Architecture

### Local Development

- **Backend**: Azure Functions Core Tools (`func start`)
- **Frontend**: Vite dev server (`npm run dev`)
- **Storage**: Azurite (local Azure Storage emulator)
- **Environment**: `local.settings.json` for backend, `.env` for frontend

### Testing

- **Unit Tests**: (Future implementation)
- **Integration Tests**: Manual testing scripts
- **Security Tests**: Automated test suite (`test-security.js`)

---

## 📈 Scalability Considerations

### Current Architecture

- **Serverless**: Automatic scaling based on demand
- **Storage**: Azure Storage scales automatically
- **CDN**: Global distribution for frontend

### Future Enhancements

- **Caching**: Redis for frequently accessed data
- **Queue**: Azure Service Bus for async processing
- **Database**: Consider Azure Cosmos DB for complex queries
- **Real-time**: SignalR for live dashboard updates

---

## 🔐 Security Best Practices

### Implemented

- ✅ API key authentication
- ✅ Request signing for write operations
- ✅ Security audit logging
- ✅ IP address tracking
- ✅ Rate limiting
- ✅ Tenant data isolation
- ✅ HTTPS enforcement
- ✅ Secret management (Azure App Settings)

### Recommended Enhancements

- [ ] IP whitelisting
- [ ] API key rotation automation
- [ ] Role-based access control (RBAC)
- [ ] DDoS protection
- [ ] WAF (Web Application Firewall)

---

## 📚 Related Documentation

- [STORAGE_ARCHITECTURE.md](./STORAGE_ARCHITECTURE.md) - Detailed storage design
- [SECURITY_ENHANCEMENT_PLAN.md](./SECURITY_ENHANCEMENT_PLAN.md) - Security roadmap
- [PRE_DEPLOYMENT_CHECKLIST.md](./PRE_DEPLOYMENT_CHECKLIST.md) - Deployment guide
- [STORAGE_CONFIGURATION_GUIDE.md](./STORAGE_CONFIGURATION_GUIDE.md) - Storage setup

---

**Last Updated**: January 2025  
**Version**: 2.0
