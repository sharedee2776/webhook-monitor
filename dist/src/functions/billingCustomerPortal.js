"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
const tenantStore_1 = require("../shared/tenantStore");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
});
functions_1.app.http("billingCustomerPortal", {
    methods: ["POST"],
    route: "billing/customer-portal",
    authLevel: "anonymous", // Change to 'function' or implement auth as needed
    handler: async (req, context) => {
        const body = (await req.json().catch(() => null));
        const tenantId = body?.tenantId;
        if (!tenantId) {
            return { status: 400, jsonBody: { error: "tenantId required" } };
        }
        const tenant = (0, tenantStore_1.getTenant)(tenantId);
        if (!tenant || !tenant.stripeCustomerId) {
            return { status: 404, jsonBody: { error: "Tenant or Stripe customer not found" } };
        }
        try {
            const session = await stripe.billingPortal.sessions.create({
                customer: tenant.stripeCustomerId,
                return_url: process.env.PUBLIC_APP_URL || "https://webhookmonitor.shop/account",
            });
            return { status: 200, jsonBody: { url: session.url } };
        }
        catch (err) {
            context.log("Error creating Stripe customer portal session:", err.message);
            return { status: 500, jsonBody: { error: "Failed to create portal session" } };
        }
    },
});
//# sourceMappingURL=billingCustomerPortal.js.map