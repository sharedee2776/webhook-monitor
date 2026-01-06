# GitHub Actions Deployment Fix Guide

## Problem
Getting `Unauthorized (CODE: 401)` error when deploying Azure Functions using publish profile.

## Solution 1: Use Service Principal Authentication (Recommended)

This is more secure and reliable than publish profiles.

### Step 1: Create Azure Service Principal

Run these commands in Azure CLI:

```bash
# Login to Azure
az login

# Set your subscription (replace with your subscription ID)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create service principal with Contributor role
az ad sp create-for-rbac --name "github-actions-webhook-monitor" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/webhook-monitor-rg \
  --sdk-auth
```

**Important:** Replace `YOUR_SUBSCRIPTION_ID` with your actual Azure subscription ID. You can find it with:
```bash
az account show --query id -o tsv
```

The command will output JSON like this:
```json
{
  "clientId": "xxxx-xxxx-xxxx-xxxx",
  "clientSecret": "xxxx-xxxx-xxxx-xxxx",
  "subscriptionId": "xxxx-xxxx-xxxx-xxxx",
  "tenantId": "xxxx-xxxx-xxxx-xxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### Step 2: Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `AZURE_CREDENTIALS`
5. Value: Paste the **entire JSON output** from Step 1
6. Click **"Add secret"**

### Step 3: Verify Workflow

The workflow file has been updated to use Azure Login. It should now work without the 401 error.

---

## Solution 2: Fix Publish Profile (Alternative)

If you prefer to use publish profile, follow these steps:

### Step 1: Regenerate Publish Profile

```bash
# Get fresh publish profile
az functionapp deployment list-publishing-profiles \
  --name webhook-monitor-func \
  --resource-group webhook-monitor-rg \
  --xml > publish-profile.xml
```

### Step 2: Check Azure Functions Authentication Settings

The 401 error might be caused by authentication/authorization being enabled on your Functions app:

```bash
# Check if authentication is enabled
az functionapp auth show \
  --name webhook-monitor-func \
  --resource-group webhook-monitor-rg

# If authentication is enabled, you may need to disable it for deployment
# OR configure it to allow deployment credentials
```

### Step 3: Update GitHub Secret

1. Copy the entire XML content from `publish-profile.xml`
2. Go to GitHub: **Settings** → **Secrets and variables** → **Actions**
3. Find `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
4. Click **"Update"**
5. Paste the new XML content
6. Click **"Update secret"**

### Step 4: Verify Publish Profile Format

The publish profile should be valid XML. Common issues:
- Missing XML declaration: `<?xml version="1.0" encoding="utf-8"?>`
- Incomplete XML (cut off)
- Extra whitespace or formatting issues

---

## Troubleshooting

### Still getting 401 error with Service Principal?

1. **Verify service principal has correct permissions:**
   ```bash
   az role assignment list \
     --assignee <clientId-from-json> \
     --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/webhook-monitor-rg
   ```

2. **Check if Functions app name is correct:**
   - Verify `AZURE_FUNCTIONAPP_NAME` in workflow matches your actual Functions app name
   - Current value: `webhook-monitor-func`

3. **Verify resource group exists:**
   ```bash
   az group show --name webhook-monitor-rg
   ```

### Still getting 401 error with Publish Profile?

1. **Check if Functions app has authentication enabled:**
   - Go to Azure Portal → Your Functions App → Authentication
   - If enabled, either disable it or configure deployment credentials

2. **Verify publish profile is not expired:**
   - Publish profiles can expire. Regenerate it using the command in Solution 2.

3. **Check secret name matches:**
   - Workflow uses: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - GitHub secret must be exactly: `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

4. **Try downloading publish profile from Azure Portal:**
   - Go to Azure Portal → Your Functions App → Get publish profile
   - Download and copy the XML content to GitHub secret

---

## Recommended Approach

**Use Solution 1 (Service Principal)** because:
- ✅ More secure (scoped permissions)
- ✅ More reliable (doesn't expire)
- ✅ Better for CI/CD pipelines
- ✅ Easier to manage multiple deployments

The workflow has been updated to use this approach. You just need to:
1. Create the service principal (Step 1 above)
2. Add the `AZURE_CREDENTIALS` secret (Step 2 above)
3. Push the updated workflow file

---

## Next Steps

After setting up either solution:

1. **Commit and push the updated workflow:**
   ```bash
   git add .github/workflows/azure-functions-deploy.yml
   git commit -m "Fix Azure Functions deployment authentication"
   git push origin main
   ```

2. **Monitor the deployment:**
   - Go to GitHub → Actions tab
   - Watch the "Deploy Azure Functions" workflow
   - Should complete without 401 errors

3. **Verify deployment:**
   ```bash
   curl https://webhook-monitor-func.azurewebsites.net/api/health
   ```
