# GitHub Secrets Checklist

## Required Secrets for Frontend Deployment

Add these secrets at: https://github.com/sharedee2776/webhook-monitor/settings/secrets/actions

Click "New repository secret" for each one.

---

### 1. Firebase API Key
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: Your Firebase API Key (starts with `AIza...`)
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 2. Firebase Auth Domain
- **Name**: `VITE_FIREBASE_AUTH_DOMAIN`
- **Value**: `your-project-id.firebaseapp.com`
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 3. Firebase Project ID
- **Name**: `VITE_FIREBASE_PROJECT_ID`
- **Value**: Your Firebase Project ID
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 4. Firebase Storage Bucket
- **Name**: `VITE_FIREBASE_STORAGE_BUCKET`
- **Value**: `your-project-id.appspot.com`
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 5. Firebase Messaging Sender ID
- **Name**: `VITE_FIREBASE_MESSAGING_SENDER_ID`
- **Value**: Your Firebase Messaging Sender ID (numeric)
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 6. Firebase App ID
- **Name**: `VITE_FIREBASE_APP_ID`
- **Value**: Your Firebase App ID (starts with `1:`)
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ✅ Yes

### 7. Firebase Measurement ID
- **Name**: `VITE_FIREBASE_MEASUREMENT_ID`
- **Value**: Your Firebase Measurement ID (starts with `G-`)
- **Where to find**: Firebase Console → Project Settings → General → Your apps → Web app config
- **Required**: ⚠️ Optional but recommended (for Analytics)

---

### 8. API Base URL (Optional)
- **Name**: `VITE_API_BASE_URL`
- **Value**: `https://webhook-monitor-func.azurewebsites.net`
- **Note**: This is already set as default in code, but setting it explicitly is better
- **Required**: ⚠️ Optional (has default value)

---

## How to Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if needed)
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Scroll down to **"Your apps"** section
6. If you don't have a web app:
   - Click **"Add app"** → Select **Web** icon (`</>`)
   - Register your app
7. Copy values from the `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",                    // → VITE_FIREBASE_API_KEY
  authDomain: "project-id.firebaseapp.com", // → VITE_FIREBASE_AUTH_DOMAIN
  projectId: "project-id",                  // → VITE_FIREBASE_PROJECT_ID
  storageBucket: "project-id.appspot.com",  // → VITE_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",          // → VITE_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abcdef",         // → VITE_FIREBASE_APP_ID
  measurementId: "G-XXXXXXXXXX"            // → VITE_FIREBASE_MEASUREMENT_ID
};
```

---

## Quick Reference: All Secret Names

Copy-paste this list to check off as you add them:

- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- [ ] `VITE_API_BASE_URL` (optional)

---

## Already Configured (Don't Add These)

These are already set in Azure Functions App Settings, **NOT** in GitHub:

- ✅ `STRIPE_SECRET_KEY` (in Azure)
- ✅ `STRIPE_WEBHOOK_SECRET` (in Azure)
- ✅ `PRO_PRICE_ID` (in Azure)
- ✅ `TEAM_PRICE_ID` (in Azure)
- ✅ `AZURE_CREDENTIALS` (service principal - already added)

---

## After Adding Secrets

Once you've added all the Firebase secrets:

1. ✅ Verify all 7 Firebase secrets are added
2. ✅ Let me know when done
3. ✅ I'll push the frontend fixes
4. ✅ The next deployment will include Firebase configuration

---

## Troubleshooting

**Can't find Firebase config?**
- Make sure you've created a web app in Firebase Console
- Check that you're in the correct Firebase project
- The config appears in Project Settings → General → Your apps

**Secret name typo?**
- Secret names are case-sensitive
- Must start with `VITE_` for Vite to pick them up
- Double-check spelling before saving
