
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { applyPlanChange } from "../services/billingService";

const BILLING_SECRET = process.env.BILLING_SECRET || "billing_secret_123";

export async function billingApplyPlan(
  req: HttpRequest
): Promise<HttpResponseInit> {
  const secret = req.headers.get("x-billing-secret");
  if (secret !== BILLING_SECRET) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  const body: any = await req.json();
  const { tenantId, plan } = body;

  if (!tenantId || !plan) {
    return { status: 400, jsonBody: { error: "Missing tenantId or plan" } };
  }

  try {
    const result = await applyPlanChange({
      tenantId,
      newPlan: plan,
      reason: "billing",
    });
    return { status: 200, jsonBody: result };
  } catch (err: any) {
    return { status: 400, jsonBody: { error: err.message } };
  }
}

app.http("billingApplyPlan", {
  route: "billing/apply-plan",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: billingApplyPlan,
});
