"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlan = setPlan;
const functions_1 = require("@azure/functions");
const plans_1 = require("../plans/plans");
async function setPlan(req) {
    const adminKey = req.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_KEY) {
        return { status: 401, jsonBody: { error: "Unauthorized" } };
    }
    const body = await req.json();
    const { tenantId, plan } = body;
    if (!tenantId || !plans_1.PLANS[plan]) {
        return { status: 400, jsonBody: { error: "Invalid input" } };
    }
    try {
        const result = await Promise.resolve().then(() => __importStar(require("../services/billingService"))).then(m => m.applyPlanChange({
            tenantId,
            newPlan: plan,
            reason: "admin"
        }));
        return {
            status: 200,
            jsonBody: { ok: true, tenantId, plan, result },
        };
    }
    catch (err) {
        return {
            status: 500,
            jsonBody: { error: err.message || "Plan change failed" },
        };
    }
}
functions_1.app.http("setPlanAdmin", {
    route: "setPlanAdmin",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: setPlan,
});
//# sourceMappingURL=adminSetPlan.js.map