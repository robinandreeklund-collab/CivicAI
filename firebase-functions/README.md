# Firebase Cloud Functions

This directory contains reference implementations for Firebase Cloud Functions that handle the Firebase Integration - Step 2 (Enhanced).

## ⚠️ IMPORTANT: Blaze Plan Required

**Firebase Functions requires the Blaze (pay-as-you-go) billing plan.**

- **Cost:** Generous free tier - typically $0-5/month for this project
  - 2 million invocations/month free
  - 400,000 GB-seconds free
  - 200,000 CPU-seconds free
- **Upgrade:** [Firebase Console](https://console.firebase.google.com/) → Your Project → Upgrade (bottom left)
- **Alternative:** Run backend locally or on your own server if you don't want to upgrade

**Without Blaze plan, you'll get this error:**
```
Error: Your project must be on the Blaze (pay-as-you-go) plan to complete this command.
```

See [Troubleshooting](#troubleshooting) section below for details.

## Quick Links

- **Full Deployment Guide:** See [FIREBASE_STEP2_DEPLOYMENT_GUIDE.md](../docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md) for complete step-by-step instructions
- **Environment Variables:** See [ENVIRONMENT_VARIABLES.md](../docs/deployment/ENVIRONMENT_VARIABLES.md) for quick reference
- **Schema Reference:** See `firebase-schema.yaml` for complete collection schemas

---

## Overview

The trigger function `onQuestionCreate` automatically processes questions when they are created in the `ai_interactions` collection in Firestore.

**Step 2 Enhancements:**
- Extended timeout: 540 seconds (9 minutes)
- Increased memory: 2GB
- Enhanced status logging
- Direct Firebase data persistence via backend
- `onStatusUpdate` monitor function

## Status Flow

```
received → processing → responses_saved → pipeline_complete → completed → ledger_verified
```

## Quick Deployment

### Prerequisites

1. **Firebase Blaze Plan** (see warning above)
2. **Firebase CLI installed:** `npm install -g firebase-tools`
3. **Logged in to Firebase:** `firebase login`

### 1. Copy Template Files

```bash
# From project root
mkdir -p functions
cp firebase-functions/index.js functions/index.js
cp firebase-functions/package.json functions/package.json
```

### 2. Install Dependencies

```bash
cd functions
npm install
```

**IMPORTANT:** The `package.json` uses compatible versions:
- `firebase-admin@^12.5.0` (compatible with firebase-functions v5)
- `firebase-functions@^5.1.1`
- `axios@^1.7.0`

**Common Error:** If you see peer dependency conflict with `firebase-admin@^13.x`, you're using the wrong version. Use the provided template or downgrade to `^12.5.0`.

### 3. Configure Backend URL

```bash
# For local testing
firebase functions:config:set backend.url="http://localhost:3001"

# For production
firebase functions:config:set backend.url="https://your-backend-url.com"
```

### 4. Deploy

```bash
# From project root
firebase deploy --only functions
```

## Package.json Template

A ready-to-use `package.json` is included in this directory with the correct dependency versions:

```json
{
  "dependencies": {
    "firebase-admin": "^12.5.0",
    "firebase-functions": "^5.1.1",
    "axios": "^1.7.0"
  }
}
```

## Functions

### onQuestionCreate (Firestore Trigger)

**Trigger:** onCreate on `ai_interactions/{docId}`

**Timeout:** 540 seconds (9 minutes)
**Memory:** 2GB

**Flow:**
1. Update status to `processing` with status_log
2. Call ML pipeline at `/api/query` with `firebaseDocId`
3. Backend automatically saves:
   - Raw AI responses
   - Processed pipeline data
   - Quality metrics
   - Ledger blocks
4. Status transitions: `processing` → `completed` → `ledger_verified`

**Backend handles all data persistence**, so the function just needs to trigger the pipeline.

### onStatusUpdate (Firestore Trigger)

**Trigger:** onUpdate on `ai_interactions/{docId}`

Monitors status changes for logging and analytics. Useful for debugging and tracking pipeline progress.

## Troubleshooting

### Blaze plan required for deployment

**Error:**
```
Error: Your project must be on the Blaze (pay-as-you-go) plan to complete this command.
Required API cloudbuild.googleapis.com can't be enabled until the upgrade is complete.
```

**Solution:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Upgrade" in the left menu (bottom)
4. Select **Blaze Plan**
5. Add billing information
6. Click "Purchase"

**Cost information:**
- Free tier: 2M invocations/month, 400,000 GB-seconds, 200,000 CPU-seconds
- Typical cost for this project: **$0-5/month**
- Set budget alerts in [Google Cloud Console](https://console.cloud.google.com/)

**After upgrading:**
```bash
firebase deploy --only functions
```

### npm install fails with peer dependency error

**Error:**
```
npm error peer firebase-admin@"^11.10.0 || ^12.0.0" from firebase-functions@5.1.1
npm error Found: firebase-admin@13.6.0
```

**Solution:**
Use the provided `package.json` template which has `firebase-admin@^12.5.0`, not `^13.x`.

```bash
# Copy the template
cp firebase-functions/package.json functions/package.json
cd functions
npm install
```

### Function timeout

**Error:**
```
Function execution took 60000 ms, finished with status: 'timeout'
```

**Solution:**
The functions are already configured with 540s timeout. Make sure you're deploying the code from `firebase-functions/index.js` which has:

```javascript
exports.onQuestionCreate = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .firestore
  .document('ai_interactions/{docId}')
  .onCreate(async (snap, context) => {
    // ...
  });
```

### Cannot reach backend

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
1. Check backend URL config:
   ```bash
   firebase functions:config:get
   ```
2. Make sure backend is accessible from Firebase Functions
3. For local testing, backend must be publicly accessible or use ngrok

## Testing

Test locally with Firebase Emulator:

```bash
firebase emulators:start --only functions,firestore
```

**Note:** Local emulator may have different timeout limits. Test with deployed functions for accurate behavior.

## Environment Variables

Set via Firebase CLI:

```bash
# Backend URL (required)
firebase functions:config:set backend.url="https://your-backend-url.com"

# View all config
firebase functions:config:get
```

## Logs

View logs in Firebase Console:
- Functions > Logs
- Or via CLI: `firebase functions:log`

## Notes

- Functions have 540s timeout (9 minutes) for ML pipeline processing
- 2GB memory allocation for handling large responses
- Errors automatically logged to Firestore `errors` array
- Status updates tracked in `pipeline_metadata.status_log`
- Backend handles all data persistence (Step 2 enhancement)

## Complete Documentation

For complete setup instructions, see:
- [Firebase Step 2 Deployment Guide](../docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md)
- [Environment Variables Guide](../docs/deployment/ENVIRONMENT_VARIABLES.md)
- [Firebase Step 2 Integration Docs](../docs/api/FIREBASE_STEP2_INTEGRATION.md)
