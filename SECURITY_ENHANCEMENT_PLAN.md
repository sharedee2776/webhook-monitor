# Security Enhancement Plan

## Current Security Posture

### ✅ What's Already Good:
- API key authentication on all endpoints
- Rate limiting (in-memory, per plan)
- Payload size limits (10KB)
- Idempotency/replay protection
- Optional signature verification
- Usage limits enforced per plan
- Subscription state validation

### ⚠️ Security Gaps Identified:
1. All endpoints use `authLevel: "anonymous"` (no Azure Functions auth)
2. API keys never expire or rotate
3. No role-based access control (RBAC)
4. Rate limiting is in-memory (lost on restart)
5. No IP whitelisting/restrictions
6. No audit logging for security events
7. Connection strings grant full storage access
8. Admin key is simple header check (no MFA/rotation)
9. No API key scoping (read-only vs write permissions)
10. No request signing enforcement
11. Client-side API keys in localStorage (XSS risk)

---

## Priority 1: Critical Security Enhancements (Implement First)

### 1.1 **API Key Expiration & Rotation**
**Why**: Keys that never expire are a major security risk if compromised.

**Implementation**:
- Add `expiresAt` and `lastRotatedAt` fields to ApiKeys table
- Implement automatic expiration check in `authenticateApiKey()`
- Add API endpoint for key rotation
- Enforce minimum rotation period (e.g., 90 days)

**Files to Modify**:
- `src/lib/auth.ts` - Add expiration check
- `src/shared/validateApiKey.ts` - Add expiration validation
- Create `src/functions/rotateApiKey.ts` - New endpoint

**Impact**: High - Prevents long-term key compromise

---

### 1.2 **Persistent Rate Limiting**
**Why**: In-memory rate limiting is lost on function restart, allowing abuse.

**Implementation**:
- Store rate limit counters in Azure Table Storage
- Use distributed locking for concurrent requests
- Implement sliding window algorithm
- Add per-IP rate limiting in addition to per-key

**Files to Modify**:
- `src/lib/rateLimiter.ts` - Use Azure Tables instead of Map
- Create `RateLimits` table in Azure Storage

**Impact**: High - Prevents abuse and DoS attacks

---

### 1.3 **Audit Logging for Security Events**
**Why**: No visibility into security events (failed auth, suspicious activity).

**Implementation**:
- Create `SecurityAuditLog` table
- Log all authentication attempts (success/failure)
- Log API key usage, rotations, revocations
- Log admin actions
- Add IP address, user agent, timestamp
- Alert on suspicious patterns (brute force, etc.)

**Files to Create**:
- `src/shared/securityAudit.ts` - Audit logging utility
- `src/functions/getSecurityAudit.ts` - Admin endpoint to view logs

**Impact**: High - Enables security monitoring and incident response

---

### 1.4 **API Key Scoping & Permissions**
**Why**: All API keys have full access - no granular permissions.

**Implementation**:
- Add `permissions` field to ApiKeys table (array of strings)
- Define permission scopes: `events:read`, `events:write`, `admin:read`, `admin:write`
- Check permissions in each endpoint handler
- Create read-only keys for dashboard access

**Files to Modify**:
- `src/lib/auth.ts` - Add permission checking
- All endpoint handlers - Add permission checks
- `src/functions/createApiKey.ts` - New endpoint with permission selection

**Impact**: High - Principle of least privilege

---

## Priority 2: Important Security Enhancements

### 2.1 **IP Whitelisting (Optional)**
**Why**: Allow clients to restrict API access to known IPs.

**Implementation**:
- Add `allowedIPs` field to ApiKeys table (array of CIDR blocks)
- Validate IP in `authenticateApiKey()`
- Add admin endpoint to manage IP whitelists
- Support CIDR notation (e.g., `192.168.1.0/24`)

**Files to Modify**:
- `src/lib/auth.ts` - Add IP validation
- `src/functions/manageApiKey.ts` - Add IP management

**Impact**: Medium - Defense in depth, but may be too restrictive for some clients

---

### 2.2 **Enhanced Admin Authentication**
**Why**: Simple header check is vulnerable to key leakage.

**Implementation**:
- Use Azure AD authentication for admin endpoints
- Or implement JWT tokens with expiration
- Add MFA requirement for admin actions
- Separate admin API keys with special prefix
- Log all admin actions with user identity

**Files to Modify**:
- `src/functions/adminSetPlan.ts` - Enhanced auth
- Create `src/lib/adminAuth.ts` - Admin authentication utility

**Impact**: Medium - Protects admin functions

---

### 2.3 **Request Signing Enforcement**
**Why**: Optional signature verification means many requests are unsigned.

**Implementation**:
- Make signature verification mandatory for write operations
- Use HMAC-SHA256 with API key as secret
- Add `x-timestamp` header to prevent replay attacks
- Validate timestamp (reject requests >5 minutes old)
- Document signing algorithm for clients

**Files to Modify**:
- `src/functions/ingestWebhook.ts` - Enforce signing
- Create `src/lib/requestSigning.ts` - Signing utilities

**Impact**: Medium - Prevents request tampering and replay

---

### 2.4 **Azure Storage Access Control**
**Why**: Connection string grants full access to all storage.

**Implementation**:
- Use Azure Managed Identity instead of connection strings
- Implement SAS tokens with expiration for specific operations
- Use Azure RBAC to restrict Functions app permissions
- Separate storage accounts for different data types
- Enable storage account firewall rules

**Files to Modify**:
- Update all TableClient/BlobClient initialization
- Use `DefaultAzureCredential` instead of connection strings
- Configure Azure RBAC roles

**Impact**: Medium - Reduces blast radius if credentials leak

---

## Priority 3: Nice-to-Have Enhancements

### 3.1 **CORS Restrictions**
**Why**: Current CORS allows all configured origins.

**Implementation**:
- Per-tenant CORS configuration
- Validate Origin header against tenant's allowed origins
- Store allowed origins in tenant configuration
- Reject requests from unauthorized origins

**Files to Modify**:
- `functions/host.json` - Update CORS config
- Add origin validation in endpoint handlers

**Impact**: Low - Defense in depth, but CORS is client-side

---

### 3.2 **API Key Usage Analytics**
**Why**: No visibility into which keys are being used and how.

**Implementation**:
- Track API key usage per endpoint
- Store usage stats in Azure Tables
- Add dashboard to view key usage
- Alert on unusual usage patterns

**Files to Create**:
- `src/shared/apiKeyUsage.ts` - Usage tracking
- `src/functions/apiKeyAnalytics.ts` - Analytics endpoint

**Impact**: Low - Operational visibility

---

### 3.3 **Client Certificate Authentication (Optional)**
**Why**: Additional layer for high-security clients.

**Implementation**:
- Support mutual TLS (mTLS)
- Store client certificates in Azure Key Vault
- Validate certificates on API requests
- Optional feature for enterprise clients

**Impact**: Low - Complex, only needed for high-security use cases

---

## Implementation Roadmap

### Phase 1 (Week 1-2): Critical Security
1. ✅ API Key Expiration & Rotation
2. ✅ Persistent Rate Limiting
3. ✅ Security Audit Logging
4. ✅ API Key Scoping

### Phase 2 (Week 3-4): Important Enhancements
5. ✅ IP Whitelisting
6. ✅ Enhanced Admin Auth
7. ✅ Request Signing Enforcement
8. ✅ Azure Storage Access Control

### Phase 3 (Week 5+): Nice-to-Have
9. ✅ CORS Restrictions
10. ✅ Usage Analytics
11. ✅ Client Certificates (if needed)

---

## Security Best Practices to Follow

### 1. **Defense in Depth**
- Multiple layers of security (API key + IP + signing + rate limiting)
- Don't rely on single security control

### 2. **Principle of Least Privilege**
- API keys should only have permissions they need
- Separate read-only and write keys
- Admin keys separate from regular keys

### 3. **Security by Default**
- New API keys should be read-only by default
- Require explicit permission grants for write access
- Expire keys by default (e.g., 90 days)

### 4. **Monitoring & Alerting**
- Log all security events
- Alert on suspicious patterns
- Regular security audits

### 5. **Regular Key Rotation**
- Enforce minimum rotation period
- Automate rotation reminders
- Support key rotation without downtime

---

## Compliance Considerations

### GDPR/Privacy:
- ✅ Data isolation per tenant (already done)
- ⚠️ Add data retention policies
- ⚠️ Add data export/deletion capabilities

### SOC 2:
- ⚠️ Need comprehensive audit logging
- ⚠️ Need access controls and RBAC
- ⚠️ Need security monitoring

### PCI DSS (if handling payments):
- ✅ Stripe handles payment data (good)
- ⚠️ Ensure no payment data in logs
- ⚠️ Encrypt sensitive data at rest

---

## Quick Wins (Can Implement Today)

1. **Add API Key Expiration Check** (30 minutes)
   - Add `expiresAt` field check in `authenticateApiKey()`

2. **Add Security Audit Logging** (1 hour)
   - Create SecurityAuditLog table
   - Log failed auth attempts

3. **Add IP Address Logging** (15 minutes)
   - Log IP in audit logs
   - Add IP to request context

4. **Enforce Request Signing for Writes** (1 hour)
   - Make signature required for POST/PUT/DELETE

5. **Add Rate Limit Headers** (15 minutes)
   - Already done, but ensure all endpoints return them

---

## Testing Security Enhancements

### Security Testing Checklist:
- [ ] Test expired API keys are rejected
- [ ] Test rate limiting works across function restarts
- [ ] Test permission scoping (read-only keys can't write)
- [ ] Test IP whitelisting blocks unauthorized IPs
- [ ] Test request signing rejects tampered requests
- [ ] Test audit logs capture all security events
- [ ] Test admin auth requires proper credentials
- [ ] Test key rotation doesn't break existing integrations

---

## Cost Considerations

**Additional Azure Resources**:
- Azure Table Storage: ~$0.036 per GB/month (minimal cost)
- Azure Key Vault: ~$0.03 per 10,000 operations (if used)
- Azure Monitor Logs: ~$2.30 per GB ingested (for audit logs)

**Estimated Monthly Cost**: $5-20 for small-medium scale

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize** based on client requirements
3. **Start with Phase 1** (Critical Security)
4. **Implement incrementally** - don't break existing functionality
5. **Test thoroughly** before deploying
6. **Document** all security features for clients

Would you like me to start implementing any of these enhancements?
