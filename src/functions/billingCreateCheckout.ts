import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const PRICE_MAP: Record<string, string> = {
  pro: process.env.PRO_PRICE_ID!,
  team: process.env.TEAM_PRICE_ID!,
};

export async function billingCreateCheckout(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  interface CheckoutBody {
    tenantId: string;
    plan: string;
  }

  const body = (await req.json().catch(() => null)) as Partial<CheckoutBody> | null;

  if (!body?.tenantId || !body?.plan) {
    return { status: 400, jsonBody: { error: "tenantId and plan required" } };
  }

  const priceId = PRICE_MAP[body.plan];
  if (!priceId) {
    return { status: 400, jsonBody: { error: "Unknown plan" } };
  }

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

  return {
    status: 200,
    jsonBody: { checkoutUrl: session.url },
  };
}

app.http("billingCreateCheckout", {
  route: "billing/create-checkout",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: billingCreateCheckout,
});
