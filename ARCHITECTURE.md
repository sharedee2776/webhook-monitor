# Webhook Monitor — Architecture Overview

## High-Level Design

- **Backend:**
  - Azure Functions (TypeScript)
  - Handles all API endpoints, event ingestion, billing, and admin logic
- **Event Storage:**
  - Dual-write: Azure Blob Storage (production) and local JSON file (dev)
- **Billing:**
  - Stripe integration for subscription management, checkout, and customer portal
  - Plan enforcement and usage tracking
- **Authentication:**
  - API key validation for all endpoints
  - Admin key for privileged actions
- **Alerting:**
  - Optional Discord webhook for system alerts

## Key Components

- **/src/functions/**
  - `ingestWebhook.ts`: Main webhook endpoint, deduplication, event storage
  - `stripeWebhook.ts`: Handles Stripe webhook events (checkout, subscription, invoice)
  - `billingCreateCheckout.ts`: Creates Stripe checkout sessions
  - `billingCustomerPortal.ts`: Customer portal for subscription management
  - `billingApplyPlan.ts`: Applies plans to tenants
  - `adminSetPlan.ts`: Admin plan management
  - `dashboardEvents.ts`: Lists stored events
  - `alertWebhook.ts`: (Optional) Sends alerts to Discord

- **/src/shared/**
  - `eventStore.ts`: Reads/writes events to storage
  - `usageTracker.ts`: Tracks API usage per tenant
  - `tenantPlans.ts`, `plans.ts`: Plan logic and enforcement
  - `validateApiKey.ts`: API key validation

- **/src/billing/**
  - `stripePlans.ts`: Maps Stripe price IDs to internal plans
  - `applyPlan.ts`: Plan application logic

- **/src/services/**
  - `billingService.ts`: Service layer for billing actions

- **/src/lib/**
  - `auth.ts`, `rateLimiter.ts`: Auth and rate limiting helpers

## Planned Frontend (to be built)
- React-based SPA (Single Page Application)
- Pages: Home, Signup, Login, Dashboard, Billing/Subscription
- Connects to backend APIs for authentication, event data, and billing
- Hosted on Azure Static Web Apps or similar

## Data Flow
1. **Event Ingestion:**
   - Client sends event to `/api/ingestWebhook`
   - Backend deduplicates and stores event
2. **Billing:**
   - User initiates checkout via frontend → `/api/billing/create-checkout`
   - Stripe handles payment, calls `/api/billing/stripe-webhook`
   - Backend updates subscription/plan
3. **Dashboard:**
   - Frontend fetches events from `/api/dashboardEvents`

## Security
- All secrets in environment variables (never in code)
- API key required for all sensitive endpoints
- Stripe webhook signature verification

## Extensibility
- Add more event sources, plans, or integrations as needed
- Frontend can be built and deployed independently
