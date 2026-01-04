
# Webhook Monitor

Webhook Monitor is a full-stack SaaS platform for monitoring, analyzing, and managing webhook events with real-time analytics, robust billing, and user-friendly dashboards. Built with React (Vite, TypeScript) for the frontend and Azure Functions (TypeScript) for the backend, it is designed for reliability, scalability, and ease of use.

## Features

### Frontend (React + Vite)
- Modern, responsive dashboard for event analytics and management
- User authentication (Firebase Auth)
- Plan management, subscription upgrades/downgrades
- Usage analytics, event search, and filtering
- API key management and webhook endpoint configuration
- Real-time notifications and alert center
- Stripe-powered checkout and billing portal
- Documentation, support, and onboarding flows

### Backend (Azure Functions + TypeScript)
- Secure REST API for all frontend features
- Webhook event ingestion, deduplication, and storage
- Dual event storage: Azure Blob Storage (prod) and local JSON (dev)
- Stripe integration for subscription billing and plan enforcement
- Usage tracking, plan limits, and admin endpoints
- Discord webhook integration for system alerts (optional)
- Secure API key and admin key authentication

## Project Structure

```
├── frontend/               # React app (Vite, TypeScript)
│   ├── src/                # Frontend source code
│   └── ...
├── src/
│   ├── functions/          # Azure Functions endpoints (webhooks, billing, admin, etc.)
│   ├── shared/             # Shared logic (event store, usage, plans, etc.)
│   ├── billing/            # Stripe plan mapping and billing logic
│   ├── config/             # Plan and retention configs
│   ├── services/           # Service layer (e.g., billingService)
│   ├── lib/                # Auth and rate limiting helpers
│   └── index.ts            # Entry point
├── data/                   # Local event storage (devEvents.json)
├── scripts/                # Seed and utility scripts
├── docs/                   # Documentation (event model, etc.)
├── package.json            # Project dependencies and scripts
├── local.settings.json     # Local environment variables (not committed)
```

## Setup & Development

1. **Clone the repo:**
   ```sh
   git clone https://github.com/yourusername/webhook-monitor.git
   cd webhook-monitor
   ```
2. **Install dependencies:**
   ```sh
   npm install
   cd frontend && npm install && cd ..
   ```
3. **Configure environment:**
   - Copy `local.settings.json.example` to `local.settings.json` and fill in secrets (see below).
   - For frontend, create a `.env` if needed for Firebase or other secrets.
4. **Run locally:**
   ```sh
   npm run build
   func start
   cd frontend && npm run dev
   ```

## Environment Variables (local.settings.json)
- `STRIPE_SECRET_KEY` (your Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` (your Stripe webhook secret)
- `PRO_PRICE_ID`, `TEAM_PRICE_ID` (Stripe price IDs)
- `PUBLIC_APP_URL` (frontend URL or ngrok URL for local; update to your live domain for production)
- `DISCORD_WEBHOOK_URL` (optional, for alerts)
- `API_KEY_SEED`, `ADMIN_KEY` (for API authentication)
- `AzureWebJobsStorage`, `AZURE_STORAGE_CONNECTION_STRING` (Azure Storage)

## API Endpoints (Backend)
- `POST /api/ingestWebhook` — Ingest webhook events
- `POST /api/billing/create-checkout` — Create Stripe checkout session
- `POST /api/billing/customer-portal` — Stripe customer portal
- `POST /api/billing/apply-plan` — Apply plan to tenant
- `GET /api/tenant/plan` — Get current plan for tenant
- `POST /api/alertWebhook` — Send alert to Discord (optional)
- `GET/POST/DELETE /api/webhook/endpoints` — Manage webhook endpoints

## Deployment

See ARCHITECTURE.md and deployment guides for Azure Static Web Apps. Update `PUBLIC_APP_URL` and all webhook/redirect URLs to your live domain before going live.

## License

MIT. See LICENSE file.
- `POST /api/billing/customer-portal` — Stripe customer portal
- `POST /api/billing/apply-plan` — Apply plan to tenant
- `POST /api/setPlanAdmin` — Admin: set plan
- `POST /api/billing/stripe-webhook` — Stripe webhook endpoint
- `GET /api/dashboardEvents` — List events

## Deployment
- Deploy backend to Azure Functions (or compatible serverless platform)
- Set all environment variables in your cloud provider’s environment settings
- (Frontend: to be added)

## Contributing
Pull requests welcome! Please open issues for bugs or feature requests.

## License
MIT
