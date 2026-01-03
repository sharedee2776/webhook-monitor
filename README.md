# Webhook Monitor

A robust webhook monitoring and analytics platform with subscription billing, usage tracking, and Stripe integration. Built with Azure Functions and TypeScript.

## Features
- Webhook event ingestion and deduplication
- Dual event storage: Azure Blob Storage and local JSON
- Subscription management with Stripe billing
- Usage tracking and plan enforcement
- Admin endpoints for plan management
- Discord alert integration (optional)
- Secure API key authentication

## Project Structure
```
├── src/
│   ├── functions/         # Azure Functions endpoints (webhooks, billing, admin, etc.)
│   ├── shared/            # Shared logic (event store, usage, plans, etc.)
│   ├── billing/           # Stripe plan mapping and billing logic
│   ├── config/            # Plan and retention configs
│   ├── services/          # Service layer (e.g., billingService)
│   ├── lib/               # Auth and rate limiting helpers
│   └── index.ts           # Entry point
├── data/                  # Local event storage (devEvents.json)
├── scripts/               # Seed and utility scripts
├── docs/                  # Documentation (event model, etc.)
├── package.json           # Project dependencies and scripts
├── local.settings.json    # Local environment variables (not committed)
```

## Setup & Development
1. **Clone the repo:**
   ```
   git clone https://github.com/yourusername/webhook-monitor.git
   cd webhook-monitor
   ```
2. **Install dependencies:**
   ```
   npm install
   ```
3. **Configure environment:**
   - Copy `local.settings.json.example` to `local.settings.json` and fill in secrets (see below).
4. **Run locally:**
   ```
   npm run build
   func start
   ```

## Environment Variables (local.settings.json)
- `STRIPE_SECRET_KEY` (your Stripe secret key)
- `STRIPE_WEBHOOK_SECRET` (your Stripe webhook secret)
- `PRO_PRICE_ID`, `TEAM_PRICE_ID` (Stripe price IDs)
- `PUBLIC_APP_URL` (frontend URL or ngrok URL for local)
- `DISCORD_WEBHOOK_URL` (optional, for alerts)
- `API_KEY_SEED`, `ADMIN_KEY` (for API authentication)
- `AzureWebJobsStorage`, `AZURE_STORAGE_CONNECTION_STRING` (Azure Storage)

## API Endpoints
- `POST /api/ingestWebhook` — Ingest webhook events
- `POST /api/billing/create-checkout` — Create Stripe checkout session
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
