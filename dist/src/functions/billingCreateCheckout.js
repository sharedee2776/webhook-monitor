"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingCreateCheckout = billingCreateCheckout;
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: "2025-12-15.clover",
});
const PRICE_MAP = {
    pro: process.env.PRO_PRICE_ID || '',
    team: process.env.TEAM_PRICE_ID || '',
};
async function billingCreateCheckout(req, context) {
    context.log('billingCreateCheckout called');
    // Log environment variable status (without exposing values)
    context.log('Environment check:', {
        stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
        proPriceIdPresent: !!process.env.PRO_PRICE_ID,
        teamPriceIdPresent: !!process.env.TEAM_PRICE_ID
    });
    const body = (await req.json().catch(() => null));
    if (!body?.tenantId || !body?.plan) {
        context.log('Missing required fields:', { tenantId: !!body?.tenantId, plan: !!body?.plan });
        return { status: 400, jsonBody: { error: "tenantId and plan required" } };
    }
    const priceId = PRICE_MAP[body.plan];
    if (!priceId) {
        context.log('Unknown plan:', body.plan);
        return { status: 400, jsonBody: { error: "Unknown plan" } };
    }
    if (!process.env.STRIPE_SECRET_KEY) {
        context.error('STRIPE_SECRET_KEY not configured');
        return { status: 500, jsonBody: { error: "Stripe not configured on server" } };
    }
    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: "https://webhookmonitor.shop/success",
            cancel_url: "https://webhookmonitor.shop/cancel",
            metadata: {
                tenantId: body.tenantId,
                plan: body.plan,
            },
        });
        context.log('Checkout session created:', session.id);
        return {
            status: 200,
            jsonBody: { checkoutUrl: session.url },
        };
    }
    catch (error) {
        context.error('Stripe error:', error.message);
        return {
            status: 500,
            jsonBody: { error: "Failed to create checkout session", details: error.message }
        };
    }
}
functions_1.app.http("billingCreateCheckout", {
    route: "billing/create-checkout",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: billingCreateCheckout,
});
//# sourceMappingURL=billingCreateCheckout.js.map