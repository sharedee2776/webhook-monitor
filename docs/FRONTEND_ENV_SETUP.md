# Frontend Environment Variables Setup

## Problem
After deployment, the frontend shows:
- ❌ Firebase configuration missing - authentication disabled
- ❌ Wrong API URL (trying `webhookmonitor-api` instead of `webhook-monitor-func`)
- ❌ Health check failed

## Solution

### Step 1: Add Required GitHub Secrets

Go to: https://github.com/sharedee2776/webhook-monitor/settings/secrets/actions

Add the following secrets:

#### 1. API Base URL (Optional but recommended)
- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://webhook-monitor-func.azurewebsites.net`
- **Note**: This is already set as default in code, but setting it explicitly is better

#### 2. Firebase Configuration (Required for authentication)

You need to get these from your Firebase Console: https://console.firebase.google.com/

- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: Your Firebase API Key (starts with `AIza...`)

- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: `your-project-id.firebaseapp.com`

- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: Your Firebase Project ID

- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: `your-project-id.appspot.com`

- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: Your Firebase Messaging Sender ID (numeric)

- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: Your Firebase App ID (starts with `1:`)

- **Name**: `VITE_FIREBASE_MEASUREMENT_ID`
- **Value**: Your Firebase Measurement ID (for Analytics, optional but recommended)

### Step 2: How to Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you don't have one)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. If you don't have a web app, click "Add app" → Web (</> icon)
7. Copy the configuration values from the `firebaseConfig` object

Example Firebase config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};
```

### Step 3: Verify Secrets Are Set

After adding all secrets, the GitHub Actions workflow will automatically:
1. Use these environment variables during the build
2. Embed them into the frontend bundle
3. Deploy the updated frontend

### Step 4: Trigger a New Deployment

After adding the secrets, either:
- Push any change to trigger the workflow, OR
- Go to Actions → "Azure Static Web Apps CI/CD" → "Run workflow"

### Step 5: Verify After Deployment

1. **Check Firebase**: Open browser console, should see:
   - ✅ `Firebase initialized successfully` (instead of warning)

2. **Check API**: Open browser console, should see:
   - Health check succeeds
   - No `ERR_NAME_NOT_RESOLVED` errors
   - API calls go to `webhook-monitor-func.azurewebsites.net`

3. **Test Authentication**:
   - Try signing in with Google/Firebase
   - Should work without errors

4. **Test Stripe Checkout**:
   - Try creating a checkout session
   - Should connect to the correct Functions app

## Current Status

✅ **Fixed**: API URL default changed from `webhookmonitor-api` to `webhook-monitor-func`
✅ **Fixed**: Added `VITE_API_BASE_URL` to workflow environment variables
⏳ **Action Required**: Add Firebase secrets to GitHub

## Troubleshooting

### Still seeing Firebase warnings?
- Double-check all Firebase secrets are set in GitHub
- Verify the values match your Firebase Console exactly
- Check for typos or extra spaces

### Still seeing wrong API URL?
- The default is now correct, but you can explicitly set `VITE_API_BASE_URL` secret
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### Authentication still not working?
- Check Firebase Console → Authentication → Sign-in method
- Ensure Google/GitHub sign-in providers are enabled
- Check browser console for specific error messages
