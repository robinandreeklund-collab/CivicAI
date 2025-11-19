# Firebase Functions Configuration

This directory contains the deployed Firebase Cloud Functions for CivicAI.

## ⚠️ IMPORTANT: Migration to Environment Variables

**Firebase is deprecating `functions.config()` API in March 2026.**

**New Method (Recommended):** Use `.env` file  
**Old Method (Deprecated):** Use `firebase functions:config:set`

See [Migration Guide](../docs/deployment/FIREBASE_FUNCTIONS_MIGRATION.md) for full details.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend URL

Firebase Functions need a **publicly accessible** backend URL to call the ML pipeline API.

**CRITICAL:** Deployed functions running in Google Cloud CANNOT access `localhost` or `127.0.0.1`.

#### Method 1: Use .env file (Recommended - New Standard)

Create `functions/.env`:

```bash
# For production
BACKEND_URL=https://your-public-backend-url.com

# For testing with ngrok
BACKEND_URL=https://abc123.ngrok.io

# For local development (only with emulator)
BACKEND_URL=http://localhost:3001
```

#### Method 2: Use .runtimeconfig.json (Alternative)

Create `functions/.runtimeconfig.json`:

```json
{
  "backend": {
    "url": "https://your-public-backend-url.com"
  }
}
```

#### Method 3: Use Firebase CLI config (Deprecated)

```bash
firebase functions:config:set backend.url="https://your-backend-url.com"
```

**Deprecation Notice:** This method will stop working in March 2026. Please migrate to `.env` file.

**Note:** All three methods work during migration period. `.env` has highest priority.

### 3. Deploy

```bash
# From project root (NOT from functions/)
cd /path/to/CivicAI
firebase deploy --only functions
```

**Important:** Deploy from project root where `firebase.json` exists, not from `functions/` directory.

## Testing Locally

Use Firebase Emulator to test functions locally (can access localhost backend):

```bash
# Make sure .runtimeconfig.json or firebase config has localhost URL
firebase emulators:start --only functions,firestore
```

## Troubleshooting

### ECONNREFUSED 127.0.0.1:3001

**Problem:** Functions cannot connect to backend at localhost.

**Cause:** Deployed functions run in Google Cloud and cannot access localhost.

**Solutions:**

1. **For Production:** Deploy backend to public server
   ```bash
   # After deploying backend to e.g., Heroku, Railway, Google Cloud Run
   firebase functions:config:set backend.url="https://your-backend-url.com"
   firebase deploy --only functions
   ```

2. **For Testing:** Use ngrok to expose local backend
   ```bash
   # Terminal 1: Start backend
   cd backend && npm start
   
   # Terminal 2: Expose via ngrok
   ngrok http 3001
   # Copy the https URL from ngrok output
   
   # Terminal 3: Configure and deploy
   firebase functions:config:set backend.url="https://your-ngrok-url.ngrok.io"
   firebase deploy --only functions
   ```

3. **For Local Development:** Use Firebase Emulator
   ```bash
   # Functions run locally, can access localhost
   firebase emulators:start --only functions,firestore
   ```

### Functions deployment skipped

**Problem:** Deployment says "No changes detected" and skips deployment.

**Cause:** Firebase skips deployment if source files haven't changed, even if config changed.

**Solution:** Force redeploy by modifying source file
```bash
cd functions
# Add a comment or space to index.js
echo " " >> index.js
cd ..
firebase deploy --only functions
```

Or delete and redeploy:
```bash
firebase functions:delete onQuestionCreate --region us-central1
firebase functions:delete onStatusUpdate --region us-central1
firebase deploy --only functions
```

## Configuration Check

The functions will now FAIL FAST with a clear error message if backend URL is set to localhost when deployed.

Check Firebase Functions logs:
```bash
firebase functions:log --only onQuestionCreate
```

You should see:
```
Using backend URL: https://your-public-url.com
```

NOT:
```
Using backend URL: http://localhost:3001
```

## Documentation

See full documentation:
- [Firebase Step 2 Deployment Guide](../docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md)
- [Firebase Functions Config Fix](../docs/deployment/FIREBASE_FUNCTIONS_CONFIG_FIX.md)
- [Environment Variables Guide](../docs/deployment/ENVIRONMENT_VARIABLES.md)
