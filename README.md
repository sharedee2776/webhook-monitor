# Webhook Monitor

> A multi-tenant SaaS for monitoring, analyzing and managing webhook events, with dashboards, alerting, usage-based plans and signed ingestion.

**Who it's for:** developers and small teams who depend on webhooks from services such as Stripe or GitHub and need to see what arrived, what failed and when an endpoint goes quiet.

**Status:** personal project, currently offline because its Azure credits ran out. It still runs locally, and the deploy workflows are manual-only until it's hosted again. See [ROADMAP.md](./ROADMAP.md) for the work ahead. There is no automated test suite yet; `test-now.sh` and `test-security.js` are manual smoke tests against a running instance.

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-0062AD?logo=azure-functions)](https://azure.microsoft.com/services/functions/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Enabled-635BFF?logo=stripe)](https://stripe.com/)

## 🚀 Features

### Core Functionality
- **Webhook Event Ingestion** - Secure, scalable webhook event processing with deduplication
- **Real-Time Analytics** - Comprehensive dashboards with event filtering, search, and visualization
- **Multi-Tenant Architecture** - Isolated tenant data with secure API key authentication
- **Subscription Billing** - Stripe-powered subscription management with plan enforcement
- **Uptime Monitoring** - Automated uptime checks with alerting capabilities

### Security Features ✨
- **API Key Management** - Secure API key storage with expiration and rotation support
- **Request Signing** - HMAC-SHA256 request signing for write operations (prevents tampering and replay attacks)
- **Security Audit Logging** - Comprehensive audit trail of all authentication attempts and security events
- **IP Address Tracking** - Client IP logging for security monitoring and threat detection
- **Rate Limiting** - Per-plan rate limiting to prevent abuse
- **Usage Limits** - Plan-based usage enforcement (free/pro/team tiers)

### Frontend Features
- **Modern Dashboard** - Responsive React dashboard with real-time updates
- **Firebase Authentication** - Secure user authentication with Google Sign-In
- **Event Management** - Search, filter, and analyze webhook events
- **API Key Management** - Generate, view, and manage API keys
- **Billing Portal** - Stripe customer portal integration for subscription management
- **Alert Configuration** - Email and webhook alert setup

### Backend Features
- **Azure Functions** - Serverless, scalable API endpoints
- **Azure Storage** - Table Storage for structured data, Blob Storage for events
- **Stripe Integration** - Complete billing workflow (checkout, subscriptions, webhooks)
- **Discord Integration** - Optional Discord webhook alerts
- **Health Monitoring** - System health checks and diagnostics

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Security](#security)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Firebase Authentication
- Azure Static Web Apps (hosting)

**Backend:**
- Azure Functions (Node.js/TypeScript)
- Azure Table Storage (structured data)
- Azure Blob Storage (event data)
- Stripe API (billing)

**Infrastructure:**
- Azure Functions (serverless compute)
- Azure Storage Account (data persistence)
- Azure Static Web Apps (frontend hosting)
- GitHub Actions (CI/CD)

For detailed architecture documentation, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## 🔒 Security

### Authentication & Authorization
- **API Key Authentication** - All protected endpoints require valid API keys
- **API Key Expiration** - Keys can be set to expire automatically
- **Request Signing** - Write operations require HMAC-SHA256 signatures
- **Timestamp Validation** - Prevents replay attacks (5-minute window)
- **IP Address Logging** - All requests log client IP addresses

### Security Audit Logging
All security events are logged to Azure Table Storage (`SecurityAuditLog`):
- Authentication successes and failures
- API key expiration events
- Request signing attempts
- Rate limit violations
- Suspicious activity patterns

### Data Security
- **Tenant Isolation** - Data is isolated per tenant using tenant IDs
- **Encryption at Rest** - Azure Storage provides automatic encryption
- **HTTPS Only** - All communications encrypted in transit
- **Secret Management** - All secrets stored in Azure App Settings (never in code)

For detailed security documentation, see [SECURITY_ENHANCEMENT_PLAN.md](./docs/SECURITY_ENHANCEMENT_PLAN.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Azure Functions Core Tools (`func`)
- Azure account with Storage Account and Functions App
- Stripe account (for billing features)
- Firebase project (for authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sharedee2776/webhook-monitor.git
   cd webhook-monitor
   ```

2. **Install dependencies:**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Configure environment variables:**
   
   **Backend (`local.settings.json`):**
   ```json
   {
     "Values": {
       "AzureWebJobsStorage": "YOUR_AZURE_STORAGE_CONNECTION_STRING",
       "STRIPE_SECRET_KEY": "sk_test_...",
       "STRIPE_WEBHOOK_SECRET": "whsec_...",
       "PRO_PRICE_ID": "price_...",
       "TEAM_PRICE_ID": "price_...",
       "PUBLIC_APP_URL": "http://localhost:5173"
     }
   }
   ```
   
   **Frontend (`.env`):**
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_API_BASE_URL=http://localhost:7071
   ```

4. **Create required Azure Storage tables:**
   ```bash
   # Using the provided script
   export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
   node scripts/createMissingTables.js
   ```

5. **Create an API key:**
   ```bash
   export AzureWebJobsStorage="YOUR_CONNECTION_STRING"
   node scripts/seedApiKeyProduction.js tenant_123 free
   ```

6. **Build and run:**
   ```bash
   # Build backend
   npm run build
   
   # Start backend (in one terminal)
   func start
   
   # Start frontend (in another terminal)
   cd frontend
   npm run dev
   ```

7. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:7071

---

## 📡 API Reference

### Authentication

All protected endpoints require an API key in the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://api.example.com/api/endpoint
```

### Write Operations (Request Signing Required)

For POST requests to `/api/ingest`, you must include request signing:

```javascript
const timestamp = Date.now().toString();
const body = JSON.stringify(eventData);
const signature = crypto
  .createHmac('sha256', apiKey)
  .update(body + timestamp + apiKey)
  .digest('hex');

fetch('/api/ingest', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'x-signature': signature,
    'x-timestamp': timestamp,
    'Content-Type': 'application/json'
  },
  body: body
});
```

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Health check endpoint |
| `/api/ingest` | POST | API Key + Signature | Ingest webhook event |
| `/api/dashboardEvents` | GET | API Key | List events for dashboard |
| `/api/webhook/endpoints` | GET/POST/DELETE | API Key | Manage webhook endpoints |
| `/api/alert/email-config` | GET/POST | API Key | Configure alert emails |
| `/api/billing/create-checkout` | POST | Firebase Auth | Create Stripe checkout |
| `/api/billing/customer-portal` | POST | Firebase Auth | Access customer portal |
| `/api/tenant/plan` | GET | Query Param | Get tenant plan info |

For complete API documentation, see [docs/](./docs/).

---

## 🗄️ Storage Architecture

### Azure Table Storage

**Tables:**
- `ApiKeys` - API key authentication and tenant mapping
- `Tenants` - Tenant information and subscription plans
- `SecurityAuditLog` - Security event audit trail
- `MonitoredUrls` - Uptime monitoring URLs
- `UptimeChecks` - Uptime check results
- `AlertState` - Alert deduplication state

### Azure Blob Storage

**Containers:**
- `events` - Webhook event data (JSON files)

For detailed storage documentation, see [STORAGE_ARCHITECTURE.md](./docs/STORAGE_ARCHITECTURE.md).

---

## 🚢 Deployment

### Prerequisites
- Azure account with Functions App and Storage Account
- GitHub repository with Actions enabled
- Stripe account configured
- Firebase project configured

### Deployment Steps

1. **Configure Azure Resources:**
   - Create Azure Functions App
   - Create Azure Storage Account
   - Create Azure Static Web App

2. **Set Azure App Settings:**
   - `AzureWebJobsStorage` - Storage connection string
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
   - `PRO_PRICE_ID` - Stripe Pro plan price ID
   - `TEAM_PRICE_ID` - Stripe Team plan price ID

3. **Set GitHub Secrets (for frontend):**
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `VITE_API_BASE_URL`
   - `AZURE_CREDENTIALS` (for deployment)

4. **Create Required Tables:**
   ```bash
   node scripts/createMissingTables.js
   ```

5. **Deploy:**
   ```bash
   git push origin main
   ```
   This triggers GitHub Actions to deploy both frontend and backend.

For detailed deployment instructions, see:
- [FRONTEND_ENV_SETUP.md](./docs/FRONTEND_ENV_SETUP.md)

---

## 🧪 Testing

### Local Testing

1. **Start the backend:**
   ```bash
   npm run build
   func start
   ```

2. **Run automated tests:**
   ```bash
   export TEST_API_KEY="your_api_key"
   node test-security.js
   ```

3. **Manual testing:**
   See [LOCAL_TESTING_GUIDE.md](./docs/LOCAL_TESTING_GUIDE.md) for comprehensive testing instructions.

### Test Scripts

- `test-security.js` - Automated security feature tests
- `scripts/createMissingTables.js` - Create required Azure tables
- `scripts/seedApiKeyProduction.js` - Create API keys

For testing documentation, see:
- [LOCAL_TESTING_GUIDE.md](./docs/LOCAL_TESTING_GUIDE.md)

---

## 📁 Project Structure

```
webhook-monitor/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── config/          # Configuration
│   │   ├── utils/           # Utility functions
│   │   └── firebase.ts      # Firebase setup
│   └── package.json
├── src/                      # Backend source code
│   ├── functions/           # Azure Functions endpoints
│   │   ├── ingestWebhook.ts      # Main webhook ingestion
│   │   ├── dashboardEvents.ts    # Event listing
│   │   ├── billingCreateCheckout.ts
│   │   ├── stripeWebhook.ts
│   │   └── ...
│   ├── lib/                 # Libraries
│   │   ├── auth.ts          # API key authentication
│   │   ├── requestSigning.ts # Request signature verification
│   │   └── rateLimiter.ts  # Rate limiting
│   ├── shared/              # Shared utilities
│   │   ├── eventStore.ts    # Event storage
│   │   ├── securityAudit.ts # Security audit logging
│   │   └── tenantStore.ts  # Tenant management
│   └── billing/             # Billing logic
│       └── stripePlans.ts   # Plan definitions
├── scripts/                 # Utility scripts
│   ├── createMissingTables.js
│   └── seedApiKeyProduction.js
├── docs/                     # Documentation
├── .github/workflows/        # GitHub Actions workflows
└── package.json
```

---

## 🔧 Development

### Building

```bash
# Backend
npm run build

# Frontend
cd frontend
npm run build
```

### Environment Variables

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a complete list of required environment variables.

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (recommended)

---

## 📚 Documentation

### Setup & Configuration
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture overview
- [STORAGE_ARCHITECTURE.md](./docs/STORAGE_ARCHITECTURE.md) - Storage design
- [STORAGE_CONFIGURATION_GUIDE.md](./docs/STORAGE_CONFIGURATION_GUIDE.md) - Storage setup
- [AZURE_FUNCTIONS_SETUP.md](./docs/AZURE_FUNCTIONS_SETUP.md) - Azure setup

### Security
- [SECURITY_ENHANCEMENT_PLAN.md](./docs/SECURITY_ENHANCEMENT_PLAN.md) - Security roadmap

### Deployment
- [FRONTEND_ENV_SETUP.md](./docs/FRONTEND_ENV_SETUP.md) - Frontend setup

### Testing
- [LOCAL_TESTING_GUIDE.md](./docs/LOCAL_TESTING_GUIDE.md) - Comprehensive testing guide

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Azure Functions](https://azure.microsoft.com/services/functions/)
- Frontend powered by [React](https://reactjs.org/) and [Vite](https://vitejs.dev/)
- Billing powered by [Stripe](https://stripe.com/)
- Authentication powered by [Firebase](https://firebase.google.com/)

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Made with ❤️ for reliable webhook monitoring**
