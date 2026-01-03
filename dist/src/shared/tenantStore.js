"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTenant = getTenant;
exports.setTenantPlan = setTenantPlan;
exports.setTenantStripeCustomerId = setTenantStripeCustomerId;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const STORE_PATH = path_1.default.join(process.cwd(), "devTenants.json");
function readStore() {
    if (!fs_1.default.existsSync(STORE_PATH))
        return {};
    return JSON.parse(fs_1.default.readFileSync(STORE_PATH, "utf-8"));
}
function writeStore(data) {
    fs_1.default.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}
function getTenant(tenantId) {
    const store = readStore();
    return store[tenantId] ?? null;
}
function setTenantPlan(tenantId, plan, opts) {
    const store = readStore();
    const existing = store[tenantId] || {};
    store[tenantId] = {
        tenantId,
        plan,
        usage: existing.usage ?? 0,
        stripeCustomerId: existing.stripeCustomerId,
        subscriptionState: opts?.subscriptionState ?? existing.subscriptionState ?? "active",
        subscriptionExpiresAt: opts?.subscriptionExpiresAt ?? existing.subscriptionExpiresAt,
        gracePeriodEndsAt: opts?.gracePeriodEndsAt ?? existing.gracePeriodEndsAt,
    };
    writeStore(store);
}
function setTenantStripeCustomerId(tenantId, stripeCustomerId) {
    const store = readStore();
    const existing = store[tenantId] || {};
    store[tenantId] = {
        tenantId,
        plan: existing.plan ?? "free",
        usage: existing.usage ?? 0,
        stripeCustomerId,
    };
    writeStore(store);
}
//# sourceMappingURL=tenantStore.js.map