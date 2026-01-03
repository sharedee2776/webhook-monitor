"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const stripe_1 = __importDefault(require("stripe"));
const stripePlans_1 = require("../billing/stripePlans");
const applyPlan_1 = require("../billing/applyPlan");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover"
});
functions_1.app.http("stripeWebhook", {
    methods: ["POST"],
    route: "billing/stripe-webhook",
    authLevel: "anonymous",
    handler: async (req, context) => {
        const sig = req.headers.get("stripe-signature");
        if (!sig) {
            context.log("Missing Stripe signature");
            return { status: 400 };
        }
        const rawBody = await req.text();
        let event;
        try {
            event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            context.log("Webhook signature verification failed:", err.message);
            return { status: 400 };
        }
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const tenantId = session.metadata?.tenantId;
            if (!tenantId) {
                context.log("Missing tenantId in metadata");
                return { status: 400 };
            }
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
            const priceId = lineItems.data[0]?.price?.id;
            if (!priceId) {
                context.log("Missing price ID");
                return { status: 400 };
            }
            const plan = stripePlans_1.STRIPE_PRICE_TO_PLAN[priceId];
            if (!plan) {
                context.log("Unknown price ID:", priceId);
                return { status: 400 };
            }
            await (0, applyPlan_1.applyPlan)(tenantId, plan, "stripe");
            context.log(`Plan ${plan} applied to ${tenantId}`);
        }
        return {
            status: 200,
            jsonBody: { received: true }
        };
    }
});
//# sourceMappingURL=stripeWebhook.js.map