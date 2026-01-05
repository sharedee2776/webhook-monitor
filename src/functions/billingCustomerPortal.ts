import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Stripe from "stripe";
import { getTenant } from "../shared/tenantStore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

app.http("billingCustomerPortal", {
  methods: ["POST"],
  route: "billing/customer-portal",
  authLevel: "anonymous", // Change to 'function' or implement auth as needed
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    interface PortalBody {
      tenantId: string;
    }
    const body = (await req.json().catch(() => null)) as Partial<PortalBody> | null;
    const tenantId = body?.tenantId;
    if (!tenantId) {
      return { status: 400, jsonBody: { error: "tenantId required" } };
    }

    const tenant = getTenant(tenantId);
    if (!tenant || !tenant.stripeCustomerId) {
      return { status: 404, jsonBody: { error: "Tenant or Stripe customer not found" } };
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: process.env.PUBLIC_APP_URL || "https://webhookmonitor.shop/account",
      });
      return { status: 200, jsonBody: { url: session.url } };
    } catch (err: any) {
      context.log("Error creating Stripe customer portal session:", err.message);
      return { status: 500, jsonBody: { error: "Failed to create portal session" } };
    }
  },
});
