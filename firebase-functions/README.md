# Firebase Cloud Functions

This directory contains reference implementations for Firebase Cloud Functions that handle the Firebase Integration - Step 1.

## Quick Links

- **Automated Setup:** Run `./scripts/firebase-init-collections.sh` to create all collections
- **Schema Reference:** See `firebase-schema.yaml` for complete collection schemas
- **Manual Guide:** See `docs/guides/FIREBASE_SETUP.md` for step-by-step instructions

---

## Overview

The trigger function `onQuestionCreate` automatically processes questions when they are created in the `ai_interactions` collection in Firestore.

## Status Flow

```
received → processing → completed → ledger_verified
```

## Deployment

### Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Functions (from project root):
   ```bash
   firebase init functions
   ```

### Deploy Functions

```bash
firebase deploy --only functions
```

### Environment Variables

Set the backend URL for the functions:

```bash
firebase functions:config:set backend.url="https://your-backend-url.com"
```

## Functions

### onQuestionCreate (Firestore Trigger)

**Trigger:** onCreate on `ai_interactions/{docId}`

**Flow:**
1. Update status to `processing`
2. Call ML pipeline at `/api/query`
3. Update document with analysis results
4. Set status to `completed`
5. Create ledger block
6. Set status to `ledger_verified`

### processQuestion (HTTP Endpoint)

**URL:** `https://your-region-your-project.cloudfunctions.net/processQuestion`

**Method:** POST

**Body:**
```json
{
  "docId": "document-id"
}
```

Manually trigger processing for a specific question.

### processPendingQuestions (Scheduled)

**Schedule:** Every 5 minutes

Checks for questions stuck in `received` status and triggers processing.

## Testing

Test locally with Firebase Emulator:

```bash
firebase emulators:start --only functions,firestore
```

## Notes

- Functions have a 2-minute timeout for ML pipeline processing
- Errors automatically retry with exponential backoff
- All logs are available in Firebase Console under Functions > Logs
