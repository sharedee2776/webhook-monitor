
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Stripe from "stripe";
import { STRIPE_PRICE_TO_PLAN } from "../billing/stripePlans";
import { applyPlan } from "../billing/applyPlan";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover"
});

app.http("stripeWebhook", {
  methods: ["POST"],
  route: "billing/stripe-webhook",
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      context.log("Missing Stripe signature");
      return { status: 400 };
    }

    const rawBody = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      context.log("Webhook signature verification failed:", err.message);
      return { status: 400 };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const tenantId = session.metadata?.tenantId;
      if (!tenantId) {
        context.log("Missing tenantId in metadata");
        return { status: 400 };
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 1 }
      );

      const priceId = lineItems.data[0]?.price?.id;
      if (!priceId) {
        context.log("Missing price ID");
        return { status: 400 };
      }

      const plan = STRIPE_PRICE_TO_PLAN[priceId];
      if (!plan) {
        context.log("Unknown price ID:", priceId);
        return { status: 400 };
      }

      await applyPlan(tenantId, plan, "stripe");

      context.log(`Plan ${plan} applied to ${tenantId}`);
    }

    return {
      status: 200,
      jsonBody: { received: true }
    };
  }
});
