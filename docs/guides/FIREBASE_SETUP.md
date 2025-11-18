# 🔥 Firebase Setup Guide

Complete guide for setting up Firebase with CivicAI/OneSeek.AI.

## Overview

Firebase provides:
- **Firestore Database** - NoSQL cloud database for storing interactions, models, ledger, and change events
- **Authentication** - User sign-up, login, and session management
- **Hosting** - Optional static site hosting
- **Cloud Functions** - Optional serverless backend functions

## Prerequisites

- Node.js 18+ installed
- Firebase account ([Create one](https://firebase.google.com/))
- Firebase CLI installed globally: `npm install -g firebase-tools`

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `civicai-prod`)
4. **Disable** Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select your region (choose closest to your users)
5. Click **"Enable"**

---

## Step 3: Set Up Authentication (Optional)

1. In Firebase Console, go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** sign-in method
4. Click **"Save"**

---

## Step 4: Register Web App

1. In Firebase Console, go to **Project settings** (gear icon)
2. Scroll to **"Your apps"**
3. Click the **Web icon** (</>)
4. Enter app nickname (e.g., `civicai-web`)
5. **Check** "Also set up Firebase Hosting" (optional)
6. Click **"Register app"**
7. **Copy the configuration object** - you'll need this later

Example config:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "civicai-prod.firebaseapp.com",
  projectId: "civicai-prod",
  storageBucket: "civicai-prod.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
}
```

---

## Step 5: Generate Service Account Key (Backend)

1. In Firebase Console, go to **Project settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the confirmation dialog
4. Save the downloaded JSON file as `server/serviceAccountKey.json`

**⚠️ IMPORTANT:**
- This file contains sensitive credentials
- Never commit it to version control
- It's already in `.gitignore`
- Keep it secure and private

---

## Step 6: Configure Environment Variables

### Frontend Configuration

Create or update `frontend/.env`:

```env
# Firebase Web SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=civicai-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=civicai-prod
VITE_FIREBASE_STORAGE_BUCKET=civicai-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Use the values from Step 4.

### Backend Configuration

Create or update `backend/.env`:

**Option 1: Using Service Account File (Development)**
```env
# Firebase Admin SDK - Service Account Path
FIREBASE_SERVICE_ACCOUNT_PATH=../server/serviceAccountKey.json
```

**Option 2: Using Environment Variables (Production)**
```env
# Firebase Admin SDK - Environment Variables
FIREBASE_PROJECT_ID=civicai-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@civicai-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"
```

To get these values, open `server/serviceAccountKey.json`:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

---

## Step 7: Initialize Firestore Collections

The following collections will be created automatically on first use:

### ai_interactions
Stores user queries and AI responses.

**Manual creation (optional):**
1. Go to Firestore Database
2. Click **"Start collection"**
3. Collection ID: `ai_interactions`
4. Add a document (will be replaced by real data)

Repeat for:
- `model_versions`
- `ledger_blocks`
- `change_events`
- `users`
- `audit_logs`

---

## Step 8: Set Up Security Rules

### Development Rules (Test Mode)

In Firestore, go to **Rules** tab and use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING:** These rules allow anyone to read/write. Use only in development!

### Production Rules (Secure)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ai_interactions - users can read their own, admins can read all
    match /ai_interactions/{interactionId} {
      allow read: if request.auth != null && 
                   (resource.data.userId == request.auth.uid || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update, delete: if false; // Immutable after creation
    }
    
    // model_versions - read-only for all users
    match /model_versions/{versionId} {
      allow read: if true;
      allow write: if false; // Only backend can write
    }
    
    // ledger_blocks - read-only for all, immutable
    match /ledger_blocks/{blockId} {
      allow read: if true;
      allow write: if false; // Only backend can write, blocks are immutable
    }
    
    // change_events - authenticated users can read
    match /change_events/{eventId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
    
    // users - users can read/update their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }
    
    // audit_logs - read-only for admins
    match /audit_logs/{logId} {
      allow read: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only backend can write
    }
  }
}
```

---

## Step 9: Set Up Indexes

Some queries require composite indexes. Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "ai_interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ai_interactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "question.hash", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ledger_blocks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "blockNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "change_events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "modelId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

---

## Step 10: Test the Connection

### Test Frontend Connection

```javascript
// In frontend console or test file
import { firebaseDb } from '../config/firebase.web.js';
import { collection, getDocs } from 'firebase/firestore';

const testConnection = async () => {
  try {
    const snapshot = await getDocs(collection(firebaseDb, 'ai_interactions'));
    console.log('✓ Connected to Firestore!');
    console.log('Documents:', snapshot.size);
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
};

testConnection();
```

### Test Backend Connection

```javascript
// In backend test file
const { getFirestore } = require('../config/firebase.admin.js');

const testConnection = async () => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('ai_interactions').limit(1).get();
    console.log('✓ Connected to Firestore!');
  } catch (error) {
    console.error('✗ Connection failed:', error);
  }
};

testConnection();
```

---

## Using the Automated Script

We provide a setup script for convenience:

```bash
./scripts/firebase-bootstrap.sh
```

This script will:
1. Check Firebase CLI installation
2. Authenticate with Firebase
3. Select project
4. Download service account key
5. Update environment files

---

## Troubleshooting

### "Permission denied" errors

**Problem:** Firestore security rules are too restrictive.

**Solution:** 
- Check rules in Firebase Console
- Ensure user is authenticated if required
- Verify document ownership in rules

### "Service account not found"

**Problem:** Service account key path is incorrect.

**Solution:**
- Verify path in `backend/.env`
- Ensure file exists at `server/serviceAccountKey.json`
- Check file permissions

### "Invalid API key"

**Problem:** Frontend Firebase config is incorrect.

**Solution:**
- Verify values in `frontend/.env`
- Check that variables start with `VITE_`
- Restart Vite dev server after changing env vars

### "Network error" or "Failed to fetch"

**Problem:** Firebase project not accessible or wrong project ID.

**Solution:**
- Check project ID in Firebase Console
- Verify internet connection
- Check firewall/proxy settings

### "Index required for query"

**Problem:** Firestore query needs a composite index.

**Solution:**
- Click the link in the error message to auto-create index
- Or manually add index in `firestore.indexes.json` and deploy

---

## Best Practices

### Security
- ✅ Never commit service account keys
- ✅ Use environment variables in production
- ✅ Implement proper security rules
- ✅ Enable App Check for additional security
- ✅ Regularly rotate service account keys

### Performance
- ✅ Create indexes for common queries
- ✅ Use pagination for large result sets
- ✅ Cache frequently accessed data
- ✅ Use batch writes when possible
- ✅ Monitor usage in Firebase Console

### Cost Optimization
- ✅ Delete old test data
- ✅ Use TTL (Time To Live) for temporary data
- ✅ Optimize document structure (avoid deep nesting)
- ✅ Use Cloud Functions for complex operations
- ✅ Monitor usage and set budget alerts

---

## Next Steps

1. ✅ Firebase configured
2. Start using Firestore in code:
   - See [Data Schemas](../schemas/README.md)
   - See [API Reference](../api/README.md)
3. Implement authentication:
   - User signup/login
   - Protected routes
4. Add Cloud Functions (optional):
   - Background tasks
   - Triggers for data changes

---

## Related Documentation

- [Data Schemas](../schemas/README.md) - Firestore collection schemas
- [API Reference](../api/README.md) - API endpoints using Firebase
- [Scripts README](../../scripts/README.md) - Automation scripts

---

**Need help?** Check the [Firebase Documentation](https://firebase.google.com/docs) or create an issue in the repository.
