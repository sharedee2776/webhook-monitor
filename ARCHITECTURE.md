
# Webhook Monitor — Architecture Overview

## High-Level Design

**Frontend:**
- React (Vite, TypeScript) SPA
- Handles all user interaction, dashboards, authentication, and billing UI
- Communicates with backend via REST API
- Hosted on Azure Static Web Apps (recommended)

**Backend:**
- Azure Functions (TypeScript)
- Handles all API endpoints: event ingestion, billing, admin, analytics, and more
- Stripe integration for billing, plan management, and customer portal
- Dual event storage: Azure Blob Storage (production) and local JSON (development)
- Discord webhook integration for system alerts (optional)
- Secure API key and admin key authentication

## Key Components

**Frontend (frontend/):**
- `src/pages/`: Home, Signup, Login, Dashboard, Checkout, PlanDetails, etc.
- `src/components/`: Analytics charts, event lists, notifications, API key management, etc.
- `firebase.ts`: Firebase Auth integration
- `App.tsx`: Main app shell and routing

**Backend (src/functions/):**
- `ingestWebhook.ts`: Main webhook endpoint, deduplication, event storage
- `stripeWebhook.ts`: Handles Stripe webhook events (checkout, subscription, invoice)
- `billingCreateCheckout.ts`: Creates Stripe checkout sessions
- `billingCustomerPortal.ts`: Customer portal for subscription management
- `billingApplyPlan.ts`: Applies plans to tenants
- `adminSetPlan.ts`: Admin plan management
- `dashboardEvents.ts`: Lists stored events
- `alertWebhook.ts`: (Optional) Sends alerts to Discord

**Shared Logic (src/shared/, src/billing/, src/services/, src/lib/):**
- Event storage, usage tracking, plan logic, API key validation, rate limiting, and more

## Data Flow

1. **Event Ingestion:**
   - Client sends event to `/api/ingestWebhook`
   - Backend deduplicates and stores event (Azure Blob Storage or local JSON)
2. **Billing:**
   - User initiates checkout via frontend → `/api/billing/create-checkout`
   - Stripe handles payment, calls `/api/billing/stripe-webhook`
   - Backend updates subscription/plan and enforces limits
3. **Analytics & Dashboard:**
   - Frontend fetches usage, events, and plan info from backend APIs
   - Real-time updates via polling or webhooks (future: SignalR or WebSockets)

## Deployment

- **Frontend:** Deploy to Azure Static Web Apps for global CDN, SSL, and custom domain support
- **Backend:** Deploy Azure Functions (can be integrated with Static Web Apps or as a separate Function App)
- **DNS:** Point your domain (e.g., webhookmonitor.shop) to Azure Static Web Apps
- **Environment:** Update all environment variables and URLs to use your live domain before production

## Security & Best Practices
- All API endpoints require API key authentication
- Admin endpoints require a separate admin key
- Stripe secrets and sensitive keys are never exposed to frontend
- HTTPS enforced via Azure Static Web Apps and Functions

## Extensibility
- Add more integrations (Slack, Zapier, etc.) via new Azure Functions
- Add real-time features (WebSockets, SignalR) for live dashboards
- Modular frontend and backend for easy feature expansion
3. **Dashboard:**
   - Frontend fetches events from `/api/dashboardEvents`

## Security
- All secrets in environment variables (never in code)
- API key required for all sensitive endpoints
- Stripe webhook signature verification

## Extensibility
- Add more event sources, plans, or integrations as needed
- Frontend can be built and deployed independently
