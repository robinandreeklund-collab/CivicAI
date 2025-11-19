# Firebase Integration – API Documentation

## Overview

This document describes the Firebase integration for CivicAI (OneSeek.AI), specifically Step 1: Question Collection and Real-time Status tracking.

## Architecture

All user questions submitted via Chat-V2's search field or landing page are stored in Firebase Firestore before processing. This enables:
- Persistent storage of all interactions
- Real-time status updates
- Audit trail through the transparency ledger
- Trigger-based ML pipeline execution

## Collection: `ai_interactions`

### Collection Path
```
ai_interactions/{docId}
```

### Document Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | Yes | User's question from Chat-V2 search or landing page |
| `created_at` | timestamp | Yes | When the question was received |
| `status` | string | Yes | Current status: `received` \| `processing` \| `completed` \| `ledger_verified` |
| `pipeline_version` | string | Yes | Version of ML pipeline used for processing |
| `analysis` | object | No | Results from ML pipeline (populated after processing) |
| `completed_at` | timestamp | No | When analysis was completed |
| `user_id` | string | No | Anonymous user identifier (if available) |
| `session_id` | string | No | Session identifier for tracking conversations |

### Example Document

```json
{
  "question": "Vad är Sveriges klimatpolitik?",
  "created_at": "2025-11-18T19:52:00.000Z",
  "status": "received",
  "pipeline_version": "1.0.0",
  "analysis": null,
  "completed_at": null,
  "user_id": "anonymous-user-123",
  "session_id": "session-456"
}
```

## Status Flow

### Status Values

1. **`received`** - Question has been stored in Firebase
   - Ledger block created: "Fråga mottagen"
   - ChatV2 displays: "Fråga mottagen"

2. **`processing`** - ML pipeline is actively processing the question
   - Trigger function started
   - ChatV2 displays: "Bearbetning pågår…"

3. **`completed`** - Analysis is complete
   - Results written to `analysis` field
   - Ledger block created: "Analys klar"
   - ChatV2 displays: "Analys färdig" + result cards

4. **`ledger_verified`** - Blockchain verification complete
   - Ledger component validated the block chain
   - ChatV2 displays: "Data verifierad"

### Status Transition Diagram

```
received → processing → completed → ledger_verified
   ↓            ↓            ↓              ↓
Ledger      Trigger      Ledger        Ledger
 block      started       block      validation
created                  created
```

## API Endpoints

### GET /api/firebase/status

Check Firebase configuration and availability.

**Response:**
```json
{
  "ok": true,
  "initialized": true,
  "projectId": "your-project-id",
  "message": "Firebase is configured and ready"
}
```

**Error Response (Not Configured):**
```json
{
  "ok": false,
  "initialized": false,
  "error": "Firebase Admin not initialized. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables, or set FIREBASE_SERVICE_ACCOUNT_PATH.",
  "message": "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables, or FIREBASE_SERVICE_ACCOUNT_PATH."
}
```

### POST /api/firebase/questions

Store a new question in Firebase.

**Request Body:**
```json
{
  "question": "User's question text",
  "userId": "optional-user-id",
  "sessionId": "optional-session-id"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "docId": "generated-document-id",
  "status": "received",
  "created_at": "2025-11-18T19:52:00.000Z",
  "timestamp": "2025-11-18T19:52:00.000Z",
  "message": "Question stored successfully"
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid request",
  "message": "Question is required and must be a non-empty string"
}
```

**Service Unavailable Response (503):**
```json
{
  "success": false,
  "error": "Firebase is not configured or available",
  "message": "Please configure Firebase credentials to use this feature. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables, or FIREBASE_SERVICE_ACCOUNT_PATH."
}
```

**Firestore Error Response (500):**
```json
{
  "success": false,
  "error": "Firebase Firestore initialization error",
  "message": "TypeError: firestore.collection is not a function — did you call admin.firestore()? Is FIREBASE_SERVICE_ACCOUNT_PATH correct?",
  "troubleshooting": "Check that FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set, or that FIREBASE_SERVICE_ACCOUNT_PATH points to a valid service account file."
}
```

### GET /api/firebase/questions/:docId

Retrieve a specific question and its status.

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "User's question text",
    "created_at": "2025-11-18T19:52:00.000Z",
    "status": "processing",
    "pipeline_version": "1.0.0",
    "analysis": null,
    "completed_at": null
  }
}
```

### POST /api/firebase/questions/:docId/status

Update the status of a question (internal use by ML pipeline).

**Request Body:**
```json
{
  "status": "processing|completed|ledger_verified|error",
  "analysis": {}, // Optional, for completed status
  "completed_at": "2025-11-18T19:55:00.000Z", // Optional
  "verified_at": "2025-11-18T19:56:00.000Z" // Optional
}
```

**Valid Status Values:**
- `received` - Question has been stored
- `processing` - ML pipeline is processing
- `completed` - Analysis is complete
- `ledger_verified` - Blockchain verification complete
- `error` - An error occurred during processing

**Response:**
```json
{
  "success": true,
  "docId": "document-id",
  "status": "updated-status",
  "message": "Status updated successfully"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "error": "Invalid status",
  "message": "Status must be one of: received, processing, completed, ledger_verified, error"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "error": "Question not found",
  "message": "Question not found: invalid-doc-id"
}
```

### GET /api/firebase/questions

List recent questions (for admin/testing purposes).

**Query Parameters:**
- `limit` (optional, default: 10) - Maximum number of questions to return (1-100)
- `status` (optional) - Filter by status value

**Example Request:**
```
GET /api/firebase/questions?limit=20&status=completed
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "docId": "doc-id-1",
      "question": "User's question text",
      "created_at": "2025-11-18T19:52:00.000Z",
      "status": "completed",
      "pipeline_version": "1.0.0",
      "analysis": { ... },
      "completed_at": "2025-11-18T19:55:00.000Z"
    },
    {
      "docId": "doc-id-2",
      "question": "Another question",
      "created_at": "2025-11-18T19:50:00.000Z",
      "status": "completed",
      "pipeline_version": "1.0.0",
      "analysis": { ... },
      "completed_at": "2025-11-18T19:53:00.000Z"
    }
  ]
}
```

### DELETE /api/firebase/questions/:docId

Delete a question (GDPR compliance).

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

## Firebase Trigger Function

### Trigger: onQuestionCreate

**Event:** Firestore `onCreate` on collection `ai_interactions`

**Functionality:**
1. Automatically triggered when a new document is created
2. Updates status to `processing`
3. Starts ML pipeline processing
4. Writes analysis results back to the document
5. Updates status to `completed`
6. Creates ledger blocks for audit trail
7. Updates status to `ledger_verified`

### Pseudo-code Implementation

```javascript
exports.onQuestionCreate = functions.firestore
  .document('ai_interactions/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const docId = context.params.docId;
    
    try {
      // Step 1: Update status to processing
      await snap.ref.update({ 
        status: "processing",
        updated_at: new Date()
      });
      
      // Step 2: Create ledger block for "Fråga mottagen"
      await createLedgerBlock({
        event_type: "data_collection",
        data: {
          description: "Fråga mottagen",
          question_hash: hashQuestion(data.question),
          timestamp: data.created_at
        }
      });
      
      // Step 3: Run ML pipeline
      const result = await runPipeline(data.question);
      
      // Step 4: Update document with analysis results
      await snap.ref.update({
        status: "completed",
        analysis: result,
        completed_at: new Date()
      });
      
      // Step 5: Create ledger block for "Analys klar"
      await createLedgerBlock({
        event_type: "data_collection",
        data: {
          description: "Analys klar",
          question_hash: hashQuestion(data.question),
          analysis_summary: result.summary,
          timestamp: new Date()
        }
      });
      
      // Step 6: Verify ledger and update status
      await verifyLedgerChain();
      await snap.ref.update({ 
        status: "ledger_verified",
        verified_at: new Date()
      });
      
      console.log(`Question ${docId} processed successfully`);
      
    } catch (error) {
      console.error(`Error processing question ${docId}:`, error);
      await snap.ref.update({ 
        status: "error",
        error: error.message,
        error_at: new Date()
      });
    }
  });
```

## Real-time Status Listening (Frontend)

### Implementation in ChatV2

```javascript
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../config/firebase.web.js';

// Listen to real-time status updates
const docRef = doc(firebaseDb, 'ai_interactions', docId);
const unsubscribe = onSnapshot(docRef, (doc) => {
  if (doc.exists()) {
    const data = doc.data();
    
    switch(data.status) {
      case 'received':
        displayStatus('Fråga mottagen');
        break;
      case 'processing':
        displayStatus('Bearbetning pågår…');
        break;
      case 'completed':
        displayStatus('Analys färdig');
        displayResults(data.analysis);
        break;
      case 'ledger_verified':
        displayStatus('Data verifierad');
        break;
    }
  }
});

// Clean up listener when component unmounts
return () => unsubscribe();
```

## Ledger Integration

### Ledger Block Schema

When a question is received or analysis is completed, a ledger block is created:

```json
{
  "block_id": 123,
  "timestamp": "2025-11-18T19:52:00.000Z",
  "previous_hash": "abc123...",
  "current_hash": "def456...",
  "event_type": "data_collection",
  "data": {
    "description": "Fråga mottagen | Analys klar",
    "question_hash": "sha256-hash-of-question",
    "model_version": "1.0.0",
    "provenance": {
      "source": "chat-v2",
      "user_id": "anonymous-user-123",
      "session_id": "session-456"
    }
  },
  "signatures": {
    "data_hash": "hash-of-data-field",
    "validator": "system"
  }
}
```

## Security Considerations

### Data Privacy
- Questions are stored with anonymous user IDs
- No personally identifiable information (PII) stored
- Users can request deletion of their data

### Access Control
- Backend uses Firebase Admin SDK with service account
- Frontend uses Firebase Web SDK with security rules
- Only authenticated backend can write to `ai_interactions`
- Frontend can only read documents they created

### Firestore Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ai_interactions/{docId} {
      // Allow read if user owns the document or is authenticated
      allow read: if request.auth != null;
      
      // Only backend can create/update (via Admin SDK)
      // Frontend creates through API endpoint
      allow create: if false;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

## Testing

### Manual Testing Flow

1. **Submit question via Chat-V2**
   ```
   Question: "Test question"
   Expected: Document created with status "received"
   ```

2. **Verify status progression**
   ```
   Check: status changes received → processing → completed → ledger_verified
   ```

3. **Verify ledger blocks**
   ```
   Check: Two ledger blocks created
   - Block 1: "Fråga mottagen"
   - Block 2: "Analys klar"
   ```

4. **Verify real-time updates**
   ```
   Check: ChatV2 UI updates as status changes
   ```

### Automated Testing

```javascript
// Test question creation
test('should create question in Firebase', async () => {
  const response = await fetch('/api/firebase/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Test question' })
  });
  
  expect(response.ok).toBe(true);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.status).toBe('received');
});

// Test status updates
test('should update status', async () => {
  const docId = 'test-doc-id';
  const response = await fetch(`/api/firebase/questions/${docId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'processing' })
  });
  
  expect(response.ok).toBe(true);
  const data = await response.json();
  expect(data.status).toBe('processing');
});
```

## Configuration

### Environment Variables

Firebase can be configured using either environment variables or a service account file.

#### Option 1: Environment Variables (Recommended for Production)

```bash
# Required environment variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----
```

**Note:** The `FIREBASE_PRIVATE_KEY` can be:
- Base64 encoded (will be automatically decoded)
- With escaped newlines (`\n`) which will be replaced with actual newlines

#### Option 2: Service Account File (Development)

```bash
# Path to service account JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json
```

### Verifying Configuration

After setting environment variables, you can verify Firebase is configured correctly:

```bash
# Check Firebase status
curl http://localhost:3001/api/firebase/status

# Expected response if configured:
{
  "ok": true,
  "initialized": true,
  "projectId": "your-project-id",
  "message": "Firebase is configured and ready"
}
```

## Troubleshooting

### Error: "TypeError: firestore.collection is not a function"

**Cause:** Firestore was not properly initialized, or `admin.firestore()` was not called with parentheses.

**Solution:**
1. Check that all required environment variables are set:
   ```bash
   echo $FIREBASE_PROJECT_ID
   echo $FIREBASE_CLIENT_EMAIL
   echo $FIREBASE_PRIVATE_KEY
   ```

2. Verify the service account has Firestore permissions in Google Cloud Console

3. Check backend startup logs for Firebase initialization errors

4. Try the diagnostic endpoint:
   ```bash
   curl http://localhost:3001/api/firebase/status
   ```

### Error: "Firebase is not configured or available"

**Cause:** Firebase environment variables are not set or service account file is missing.

**Solution:**
1. Set the required environment variables (see Configuration section above)

2. If using service account file, verify the file exists and path is correct:
   ```bash
   ls -la $FIREBASE_SERVICE_ACCOUNT_PATH
   ```

3. Restart the backend server after setting environment variables

### Error: "Question is required and must be a non-empty string"

**Cause:** The `question` field in the request body is missing, empty, or not a string.

**Solution:**
Ensure your request includes a non-empty `question` field:
```javascript
await fetch('/api/firebase/questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Your question here', // Must be non-empty string
    userId: 'optional-user-id',
    sessionId: 'optional-session-id'
  })
});
```

### Error: "Status must be one of: received, processing, completed, ledger_verified, error"

**Cause:** Invalid status value provided when updating question status.

**Solution:**
Use only valid status values:
```javascript
const validStatuses = ['received', 'processing', 'completed', 'ledger_verified', 'error'];
```

### Firebase Not Showing Up in Health Check

**Cause:** Firebase initialization failed silently or is not configured.

**Solution:**
1. Check the backend startup logs for Firebase initialization messages:
   ```
   [Firebase] Checking Firebase initialization...
   [Firebase] ✓ Firebase is initialized and ready
   [Firebase] Project ID: your-project-id
   ```

2. If you see warnings instead, follow the configuration steps in the logs

3. Use the health check endpoint to verify:
   ```bash
   curl http://localhost:3001/api/health | jq '.services.firebase'
   ```

### Testing Firebase Locally

You can test Firebase integration locally using curl:

```bash
# 1. Check status
curl http://localhost:3001/api/firebase/status

# 2. Create a question
curl -X POST http://localhost:3001/api/firebase/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the climate policy in Sweden?",
    "userId": "test-user-123",
    "sessionId": "test-session-456"
  }'

# Expected response (201):
# {
#   "success": true,
#   "docId": "generated-doc-id",
#   "status": "received",
#   "created_at": "2025-11-19T...",
#   "message": "Question stored successfully"
# }

# 3. Retrieve the question
curl http://localhost:3001/api/firebase/questions/{docId}

# 4. Update status
curl -X POST http://localhost:3001/api/firebase/questions/{docId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'

# 5. List questions
curl http://localhost:3001/api/firebase/questions?limit=10

# 6. Delete question (cleanup)
curl -X DELETE http://localhost:3001/api/firebase/questions/{docId}
```

## Next Steps

### Steg 2: Pipeline Processing and Analysis
- Implement actual trigger function in Firebase Functions
- Integrate with existing ML pipeline
- Add error handling and retry logic
- Monitor performance and optimize

### Steg 3: Enhanced Features
- Add support for conversation threads
- Store full response analysis in Firebase
- Enable filtering and search of past questions
- Add analytics and metrics tracking

## References

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)
- [CivicAI Transparency Ledger](../features/TRANSPARENCY_LEDGER.md)
