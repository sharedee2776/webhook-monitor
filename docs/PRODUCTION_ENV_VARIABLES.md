# Production Environment Variables

This document lists all required environment variables for production deployment.

## Azure Functions App Settings

These should be configured in Azure Portal → Your Function App → Configuration → Application Settings

### Required Variables

#### 1. **AzureWebJobsStorage** (REQUIRED)
- **Description**: Azure Storage Account connection string
- **Format**: `DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net`
- **Used for**: 
  - Azure Table Storage (API keys, tenants, events, endpoints)
  - Azure Blob Storage (event backups)
- **Example**: `DefaultEndpointsProtocol=https;AccountName=webhookmonitorstore;AccountKey=...;EndpointSuffix=core.windows.net`

#### 2. **STRIPE_SECRET_KEY** (REQUIRED for billing)
- **Description**: Stripe secret key for payment processing
- **Format**: `sk_live_...` (production) or `sk_test_...` (testing)
- **Used for**: Creating checkout sessions, managing subscriptions
- **Security**: Keep secret, never commit to git

#### 3. **STRIPE_WEBHOOK_SECRET** (REQUIRED for billing)
- **Description**: Stripe webhook signing secret
- **Format**: `whsec_...`
- **Used for**: Verifying Stripe webhook signatures
- **Security**: Keep secret, never commit to git

#### 4. **PRO_PRICE_ID** (REQUIRED for billing)
- **Description**: Stripe Price ID for Pro plan
- **Format**: `price_...`
- **Used for**: Creating checkout sessions for Pro plan

#### 5. **TEAM_PRICE_ID** (REQUIRED for billing)
- **Description**: Stripe Price ID for Team plan
- **Format**: `price_...`
- **Used for**: Creating checkout sessions for Team plan

#### 6. **PUBLIC_APP_URL** (REQUIRED)
- **Description**: Public URL of your frontend application
- **Format**: `https://your-domain.com`
- **Used for**: Redirect URLs, CORS, webhook callbacks
- **Example**: `https://webhookmonitor.shop`

### Optional Variables

#### 7. **NODE_ENV**
- **Description**: Environment mode
- **Values**: `production` | `development`
- **Default**: `production`
- **Used for**: Error message verbosity, feature flags

#### 8. **AZURE_FUNCTION_KEY** (Optional)
- **Description**: Azure Functions master key (if using function-level auth)
- **Format**: Random string
- **Used for**: Function authentication (if enabled)

#### 9. **JWT_SECRET** or **SIGNING_KEY** (Optional)
- **Description**: Secret key for JWT signing (if using JWT auth)
- **Format**: Random secure string
- **Used for**: Token signing/verification
- **Security**: Keep secret, use strong random value

#### 10. **APP_URL** (Optional, same as PUBLIC_APP_URL)
- **Description**: Application base URL
- **Format**: `https://your-domain.com`
- **Used for**: Internal redirects, email links

### Frontend Environment Variables

These should be configured in your frontend hosting (Vercel, Netlify, etc.) or build process:

#### 1. **VITE_API_BASE_URL** (REQUIRED)
- **Description**: Base URL of Azure Functions backend
- **Format**: `https://your-function-app.azurewebsites.net`
- **Example**: `https://webhook-monitor-func.azurewebsites.net`

#### 2. **VITE_FIREBASE_API_KEY** (REQUIRED)
- **Description**: Firebase API key for authentication
- **Format**: Firebase project API key

#### 3. **VITE_FIREBASE_AUTH_DOMAIN** (REQUIRED)
- **Description**: Firebase authentication domain
- **Format**: `your-project.firebaseapp.com`

#### 4. **VITE_FIREBASE_PROJECT_ID** (REQUIRED)
- **Description**: Firebase project ID
- **Format**: Your Firebase project ID

## Verification Checklist

Before deploying to production, verify:

- [ ] `AzureWebJobsStorage` is set and points to correct storage account
- [ ] `STRIPE_SECRET_KEY` is set (use `sk_live_...` for production)
- [ ] `STRIPE_WEBHOOK_SECRET` is set
- [ ] `PRO_PRICE_ID` and `TEAM_PRICE_ID` are set
- [ ] `PUBLIC_APP_URL` matches your frontend domain
- [ ] Frontend `VITE_API_BASE_URL` points to your Functions App
- [ ] Firebase credentials are configured in frontend
- [ ] All secrets are stored securely (never in code/git)

## Testing Environment Variables

To test locally, create `local.settings.json` (backend) and `.env` (frontend):

**Backend (`local.settings.json`):**
```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "STRIPE_SECRET_KEY": "sk_test_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "PRO_PRICE_ID": "price_...",
    "TEAM_PRICE_ID": "price_...",
    "PUBLIC_APP_URL": "http://localhost:5173",
    "NODE_ENV": "development"
  }
}
```

**Frontend (`.env`):**
```env
VITE_API_BASE_URL=http://localhost:7071
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## Security Notes

1. **Never commit secrets to git** - Use Azure Key Vault or secure environment variable storage
2. **Rotate keys regularly** - Especially after team member changes
3. **Use separate keys for dev/staging/production**
4. **Enable Azure Storage firewall** - Restrict access to known IPs if possible
5. **Monitor access logs** - Watch for unauthorized access attempts

## Troubleshooting

### "Azure Table Storage not configured"
- Check `AzureWebJobsStorage` is set correctly
- Verify connection string format
- Ensure storage account exists and is accessible

### "Invalid API key"
- API keys are stored in Azure Table Storage (`ApiKeys` table)
- Verify table exists: `node scripts/createMissingTables.js`
- Check API key format matches what's in the table

### "Stripe webhook verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL in Stripe matches your Functions App
- Ensure webhook events are enabled in Stripe

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings in Azure Functions
- Ensure Functions App is running and accessible
