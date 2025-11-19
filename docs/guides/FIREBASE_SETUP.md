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

You have **three options** to create collections:

### Option 1: Automated Script (Recommended) ⚡

Run the automated setup script:

```bash
./scripts/firebase-init-collections.sh
```

This script will:
- Check Firebase CLI installation
- Authenticate with your Firebase account
- Create all 6 required collections
- Add sample documents with proper schemas
- Display schema information for each collection

**Advantages:**
- Fast and automated
- Ensures correct schema structure
- Creates sample documents for testing
- No manual work required

---

### Option 2: Use YAML Schema with Firebase AI 🤖

We provide a complete YAML schema file that you can use with Firebase AI or other automation tools.

**File:** `firebase-schema.yaml`

**Instructions:**
1. Open the file at `firebase-schema.yaml` in the project root
2. Use it with Firebase AI by providing this schema
3. Or use it as reference for manual creation

**Example prompt for Firebase AI:**
```
Create Firestore collections based on this YAML schema:
[paste contents of firebase-schema.yaml]
```

**Schema includes:**
- All 6 collections with complete field definitions
- Field types, requirements, and descriptions
- Security rules for each collection
- Index configurations
- Enum values where applicable

---

### Option 3: Manual Creation Step-by-Step 📝

If you prefer manual control, follow these detailed steps for each collection:

#### Collection 1: ai_interactions

**Purpose:** Stores user questions and AI responses with analysis

**Steps:**
1. Go to Firebase Console → Firestore Database
2. Click **"Start collection"**
3. Collection ID: `ai_interactions`
4. Click **"Auto-ID"** or enter a custom document ID
5. Add the following fields:

| Field Name | Type | Value (for first doc) |
|------------|------|----------------------|
| `question` | string | "Sample question for testing" |
| `created_at` | timestamp | (current date/time) |
| `status` | string | "received" |
| `pipeline_version` | string | "1.0.0" |
| `analysis` | map | {} (empty object) |
| `completed_at` | timestamp | null |
| `user_id` | string | "system" |
| `session_id` | string | "init-session" |
| `question_hash` | string | "sample-hash-123" |

6. Click **"Save"**

---

#### Collection 2: model_versions

**Purpose:** Tracks AI model configurations and metadata

**Steps:**
1. Click **"Start collection"**
2. Collection ID: `model_versions`
3. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| `modelId` | string | "gpt-3.5-turbo-sample" |
| `provider` | string | "openai" |
| `modelName` | string | "gpt-3.5-turbo" |
| `version` | string | "0613" |
| `configuration` | map | { "temperature": 0.7, "maxTokens": 1000 } |
| `profile` | map | { "strengths": ["Fast", "Efficient"] } |
| `usage` | map | { "totalRequests": 0 } |
| `createdAt` | timestamp | (current date/time) |

4. Click **"Save"**

---

#### Collection 3: ledger_blocks

**Purpose:** Blockchain-inspired transparency ledger

**Steps:**
1. Click **"Start collection"**
2. Collection ID: `ledger_blocks`
3. Add fields (Genesis block):

| Field Name | Type | Value |
|------------|------|-------|
| `block_id` | number | 0 |
| `timestamp` | timestamp | (current date/time) |
| `previous_hash` | string | "0000000000000000000000000000000000000000000000000000000000000000" |
| `current_hash` | string | "genesis-block-hash" |
| `event_type` | string | "genesis" |
| `data` | map | { "description": "Genesis block", "model_version": "0.0.0" } |
| `signatures` | map | { "data_hash": "genesis", "validator": "system" } |

4. Click **"Save"**

---

#### Collection 4: change_events

**Purpose:** Records detected changes in model behavior

**Steps:**
1. Click **"Start collection"**
2. Collection ID: `change_events`
3. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| `eventId` | string | "change-sample-001" |
| `timestamp` | timestamp | (current date/time) |
| `changeType` | string | "model_update" |
| `modelId` | string | "sample-model" |
| `changeDetails` | map | { "before": "1.0", "after": "1.1" } |
| `detection` | map | { "method": "automated", "confidence": 0.95 } |
| `impact` | map | { "severity": "low" } |

4. Click **"Save"**

---

#### Collection 5: users

**Purpose:** User profiles and preferences

**Steps:**
1. Click **"Start collection"**
2. Collection ID: `users`
3. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| `userId` | string | "system-user" |
| `email` | string | "system@civicai.local" |
| `displayName` | string | "System User" |
| `role` | string | "admin" |
| `createdAt` | timestamp | (current date/time) |
| `lastLogin` | timestamp | (current date/time) |
| `preferences` | map | { "theme": "dark", "language": "sv" } |

4. Click **"Save"**

---

#### Collection 6: audit_logs

**Purpose:** System audit logs for compliance

**Steps:**
1. Click **"Start collection"**
2. Collection ID: `audit_logs`
3. Add fields:

| Field Name | Type | Value |
|------------|------|-------|
| `logId` | string | "log-init-001" |
| `timestamp` | timestamp | (current date/time) |
| `eventType` | string | "system_init" |
| `userId` | string | "system" |
| `action` | string | "collections_initialized" |
| `details` | map | { "method": "manual" } |
| `ipAddress` | string | null |

4. Click **"Save"**

---

### Verification

After creating collections (any method), verify:

1. **Check Firebase Console:**
   - All 6 collections should be visible
   - Each has at least one document
   - Fields match the schemas

2. **Test Backend Connection:**
   ```bash
   cd backend
   node -e "require('./services/firebaseService.js').isFirebaseAvailable().then(available => console.log('Firebase available:', available))"
   ```

3. **View Collections:**
   Navigate to: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore`

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
