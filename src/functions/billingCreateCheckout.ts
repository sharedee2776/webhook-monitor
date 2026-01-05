import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Stripe from "stripe";

// Lazy initialization to avoid errors when env vars are missing at load time
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
  });
}

function getPriceId(plan: string): string {
  const PRICE_MAP: Record<string, string> = {
    pro: process.env.PRO_PRICE_ID || '',
    team: process.env.TEAM_PRICE_ID || '',
  };
  return PRICE_MAP[plan] || '';
}

export async function billingCreateCheckout(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  
  context.log('billingCreateCheckout called');
  
  // Log environment variable status (without exposing values)
  context.log('Environment check:', {
    stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
    proPriceIdPresent: !!process.env.PRO_PRICE_ID,
    teamPriceIdPresent: !!process.env.TEAM_PRICE_ID
  });

  interface CheckoutBody {
    tenantId: string;
    plan: string;
  }

  const body = (await req.json().catch(() => null)) as Partial<CheckoutBody> | null;

  if (!body?.tenantId || !body?.plan) {
    context.log('Missing required fields:', { tenantId: !!body?.tenantId, plan: !!body?.plan });
    return { status: 400, jsonBody: { error: "tenantId and plan required" } };
  }

  const priceId = getPriceId(body.plan);
  if (!priceId) {
    context.log('Unknown plan:', body.plan);
    return { status: 400, jsonBody: { error: "Unknown plan" } };
  }
  
  // Check environment variables before attempting to use Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    context.error('STRIPE_SECRET_KEY not configured');
    return { status: 500, jsonBody: { error: "Stripe not configured on server" } };
  }

  try {
    const stripe = getStripe();
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
  } catch (error: any) {
    context.error('Stripe error:', error.message);
    return {
      status: 500,
      jsonBody: { error: "Failed to create checkout session", details: error.message }
    };
  }
}

app.http("billingCreateCheckout", {
  route: "billing/create-checkout",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: billingCreateCheckout,
});
