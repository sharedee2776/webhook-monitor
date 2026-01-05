import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthCheck(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('Health check endpoint called');
  
  // Note: This endpoint intentionally exposes configuration status (not values)
  // to help diagnose deployment issues. Consider securing in production.
  return {
    status: 200,
    jsonBody: {
      status: "healthy",
      message: "API is working",
      timestamp: new Date().toISOString(),
      environment: {
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        proPriceIdConfigured: !!process.env.PRO_PRICE_ID,
        teamPriceIdConfigured: !!process.env.TEAM_PRICE_ID
      }
    }
  };
}

app.http("healthCheck", {
  route: "health",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: healthCheck,
});
