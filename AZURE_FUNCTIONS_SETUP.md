# Azure Functions Standalone Deployment Setup

## Prerequisites

1. Azure account with active subscription
2. Azure CLI installed (`az` command)

## Step 1: Create Azure Functions App

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name webhook-monitor-rg --location eastus

# Create storage account for Functions
az storage account create \
  --name webhookmonitorstore \
  --resource-group webhook-monitor-rg \
  --location eastus \
  --sku Standard_LRS

# Create Azure Functions App
az functionapp create \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --storage-account webhookmonitorstore \
  --os-type Linux
```

## Step 2: Configure Environment Variables

```bash
# Set Stripe configuration
az functionapp config appsettings set \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg \
  --settings \
    STRIPE_SECRET_KEY="your-stripe-secret-key" \
    STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret" \
    PRO_PRICE_ID="your-pro-price-id" \
    TEAM_PRICE_ID="your-team-price-id"

# Set Azure Storage configuration
az functionapp config appsettings set \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg \
  --settings \
    AZURE_STORAGE_ACCOUNT="your-storage-account" \
    AZURE_STORAGE_KEY="your-storage-key"
```

## Step 3: Get Publish Profile for GitHub Actions

```bash
# Download publish profile
az functionapp deployment list-publishing-profiles \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg \
  --xml
```

Copy the entire XML output.

## Step 4: Add Publish Profile to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
5. Value: Paste the XML from previous step
6. Click "Add secret"

## Step 5: Enable CORS (Optional - if not using host.json CORS)

```bash
az functionapp cors add \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg \
  --allowed-origins \
    https://webhookmonitor.shop \
    https://calm-water-07b742603.2.azurestaticapps.net
```

## Step 6: Deploy Functions

Push your code to GitHub main branch:

```bash
git add .
git commit -m "Add standalone Functions deployment"
git push origin main
```

GitHub Actions will automatically deploy the Functions app.

## Step 7: Verify Deployment

1. **Check GitHub Actions:**
   - Go to: Actions tab in GitHub
   - Look for "Deploy Azure Functions" workflow
   - Should show green checkmark

2. **Test API Endpoint:**
   ```bash
   curl https://webhookmonitor-api.azurewebsites.net/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "message": "API is working"
   }
   ```

3. **Check Azure Portal:**
   - Navigate to: webhookmonitor-api Functions App
   - Click: Functions in left sidebar
   - Should see list of deployed functions

## Step 8: Update Frontend

The frontend is already configured to use the Functions app URL via environment variables. The GitHub Actions workflow will automatically deploy the updated frontend configuration.

## Troubleshooting

### Functions not appearing:

```bash
# Check Functions App logs
az functionapp log tail --name webhookmonitor-api --resource-group webhook-monitor-rg
```

### CORS errors:

Check host.json CORS configuration includes your frontend URL.

### Environment variables not set:

```bash
# List all app settings
az functionapp config appsettings list \
  --name webhookmonitor-api \
  --resource-group webhook-monitor-rg
```

## URLs

- **Functions App:** https://webhookmonitor-api.azurewebsites.net
- **Frontend:** https://webhookmonitor.shop
- **API Health Check:** https://webhookmonitor-api.azurewebsites.net/api/health
