import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { setTenantPlan } from "../shared/tenantStore";
import { PLANS } from "../plans/plans";

export async function setPlan(
  req: HttpRequest
): Promise<HttpResponseInit> {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  const body: any = await req.json();
  const { tenantId, plan } = body;

  if (!tenantId || !PLANS[plan as keyof typeof PLANS]) {
    return { status: 400, jsonBody: { error: "Invalid input" } };
  }

  try {
    const result = await import("../services/billingService").then(m => m.applyPlanChange({
      tenantId,
      newPlan: plan as any,
      reason: "admin"
    }));
    return {
      status: 200,
      jsonBody: { ok: true, tenantId, plan, result },
    };
  } catch (err: any) {
    return {
      status: 500,
      jsonBody: { error: err.message || "Plan change failed" },
    };
  }
}

app.http("setPlanAdmin", {
  route: "setPlanAdmin",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: setPlan,
});
