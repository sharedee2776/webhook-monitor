/**
 * API Configuration
 * 
 * Points to the standalone Azure Functions backend.
 * In production, this is a separate Azure Functions App.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://webhook-monitor-func.azurewebsites.net';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    health: `${API_BASE_URL}/api/health`,
    createCheckout: `${API_BASE_URL}/api/billing/create-checkout`,
    stripeWebhook: `${API_BASE_URL}/api/billing/stripe-webhook`,
    dashboardEvents: `${API_BASE_URL}/api/dashboardEvents`,
    ingestWebhook: `${API_BASE_URL}/api/ingest`,
    alertWebhook: `${API_BASE_URL}/api/alert/webhook`,
    alertEmailConfig: `${API_BASE_URL}/api/alert/email-config`,
    tenantPlan: `${API_BASE_URL}/api/tenant/plan`,
    initializeTenant: `${API_BASE_URL}/api/tenant/initialize`,
    listApiKeys: `${API_BASE_URL}/api/api-keys/list`,
    auditLogs: `${API_BASE_URL}/api/audit-logs`,
    webhookEndpoints: `${API_BASE_URL}/api/webhook/endpoints`,
    discordIntegration: `${API_BASE_URL}/api/discord/integration`,
    integrations: `${API_BASE_URL}/api/integrations`,
  }
};

export default apiConfig;
