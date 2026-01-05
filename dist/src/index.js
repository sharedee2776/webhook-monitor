"use strict";
/**
 * Azure Functions Application Entry Point
 *
 * This file serves as the entry point for the Azure Functions runtime.
 * It imports all function modules, which causes their app.http(), app.timer(),
 * etc. calls to execute and register the functions with the runtime.
 *
 * Azure Functions v4 Node.js programming model requires this pattern.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import all HTTP trigger functions
require("./functions/healthCheck");
require("./functions/billingCreateCheckout");
require("./functions/billingCustomerPortal");
require("./functions/billingApplyPlan");
require("./functions/stripeWebhook");
require("./functions/ingestWebhook");
require("./functions/dashboardEvents");
require("./functions/alertWebhook");
require("./functions/alertEmailConfig");
require("./functions/tenantPlan");
require("./functions/adminSetPlan");
require("./functions/webhookEndpoints");
require("./functions/discordWebhook");
// Import timer trigger functions
require("./functions/uptimeCheck");
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
//# sourceMappingURL=index.js.map