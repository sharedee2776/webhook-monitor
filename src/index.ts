/**
 * Azure Functions Application Entry Point
 * 
 * This file serves as the entry point for the Azure Functions runtime.
 * It imports all function modules, which causes their app.http(), app.timer(),
 * etc. calls to execute and register the functions with the runtime.
 * 
 * Azure Functions v4 Node.js programming model requires this pattern.
 */

// Import all HTTP trigger functions
import './functions/healthCheck';
import './functions/billingCreateCheckout';
import './functions/billingCustomerPortal';
import './functions/billingApplyPlan';
import './functions/stripeWebhook';
import './functions/ingestWebhook';
import './functions/dashboardEvents';
import './functions/alertWebhook';
import './functions/alertEmailConfig';
import './functions/tenantPlan';
import './functions/adminSetPlan';
import './functions/webhookEndpoints';
import './functions/discordWebhook';

// Import timer trigger functions
import './functions/uptimeCheck';

// Note: resetUsage function is not imported here as it uses the legacy v3 
// pattern with function.json and is discovered automatically by the runtime.

/**
 * Note: Simply importing these modules is sufficient.
 * Each module contains app.http() or app.timer() calls that register
 * the functions with the Azure Functions runtime.
 * 
 * When Azure starts the application, it executes this index.ts file,
 * which causes all imports to load, which causes all registrations to occur.
 */

console.log('Azure Functions application initialized. All functions registered.');
