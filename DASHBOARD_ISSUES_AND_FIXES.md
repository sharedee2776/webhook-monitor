# Dashboard Issues Analysis & Fixes

## 🔍 Issues Identified

### 1. **UptimeRobot Status: Error**
**Problem**: Component uses hardcoded placeholder API key `'PASTE_YOUR_UPTIMEROBOT_API_KEY_HERE'`
**Solution**: Make it optional or remove if not configured

### 2. **"Could not load plan details"**
**Problem**: 
- Tenant ID "twjs" (Firebase UID) doesn't exist in tenant store
- `tenantPlan` endpoint reads from local `devTenants.json` file (not Azure Table Storage)
- No tenant record is created when user signs up

**Solution**: 
- Create tenant automatically on first signup (default "free" plan)
- Store tenants in Azure Table Storage (not local JSON)
- Update `tenantPlan` endpoint to read from Azure Table Storage

### 3. **"No API keys found"**
**Problem**: 
- Component only checks `localStorage` for API keys
- API keys are stored server-side in Azure Table Storage
- No API endpoint to fetch user's API keys

**Solution**: 
- Create API endpoint to list API keys for a tenant
- Update component to fetch from API
- Or show clear instructions on how to get API keys

### 4. **Error 401/404 on Events and Audit Logs**
**Problem**: 
- Endpoints require API key authentication
- User doesn't have an API key yet
- No API key = no access to data

**Solution**: 
- Auto-generate API key when tenant is created
- Or provide clear instructions on how to get an API key

### 5. **Tenant ID Assignment**
**Current**: Uses Firebase UID as tenant ID (automatic)
**Issue**: Tenant record not created in system
**Solution**: Auto-create tenant record on first signup

---

## ✅ Fixes Needed

1. **Update Tenant Store** - Use Azure Table Storage instead of local JSON
2. **Auto-create Tenants** - Create tenant on first signup/checkout
3. **Auto-generate API Keys** - Generate API key when tenant is created
4. **Create API Key Endpoint** - Endpoint to list API keys for a tenant
5. **Fix UptimeRobot Component** - Make it optional or remove
6. **Update Dashboard** - Better error messages and instructions

---

## 🚀 Implementation Plan

### Phase 1: Tenant Management (Azure Table Storage)
- Create `Tenants` table in Azure Table Storage
- Update `tenantStore.ts` to use Azure Table Storage
- Create tenant on first signup (default "free" plan)

### Phase 2: API Key Management
- Create endpoint to list API keys for tenant
- Auto-generate API key when tenant is created
- Update frontend to fetch API keys from API

### Phase 3: Dashboard Improvements
- Fix UptimeRobot component (make optional)
- Better error messages
- Clear instructions for getting API keys

---

## 📝 Current Workflow Issues

**Current Flow:**
1. User signs up with Firebase → Gets Firebase UID
2. Dashboard uses Firebase UID as tenant ID
3. Tries to fetch plan → Fails (no tenant record)
4. Tries to fetch events → Fails (no API key)
5. Tries to fetch API keys → Shows "not found" (only checks localStorage)

**Should Be:**
1. User signs up with Firebase → Gets Firebase UID
2. **Auto-create tenant record** (default "free" plan) in Azure Table Storage
3. **Auto-generate API key** for tenant
4. Dashboard fetches plan → Success (tenant exists)
5. Dashboard fetches API keys → Success (API key exists)
6. User can use API key to fetch events

---

## 🎯 Quick Fixes (Immediate)

1. **Hide UptimeRobot if not configured**
2. **Show better error messages** with instructions
3. **Add "Get API Key" button** that links to support/instructions
4. **Create tenant manually** for testing (using script)

---

## 📋 Long-term Fixes (Proper Implementation)

1. **Migrate tenant store to Azure Table Storage**
2. **Auto-create tenants on signup**
3. **Auto-generate API keys**
4. **Create API key management endpoints**
5. **Update frontend to use new endpoints**
