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

5. **`error`** - Processing failed
   - Error details stored in document
   - ChatV2 displays error message

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

Check Firebase availability and configuration status. Provides diagnostic information to help debug configuration issues.

**Request:**
```
GET /api/firebase/status
```

**Response (Configured):**
```json
{
  "available": true,
  "configured": true,
  "message": "Firebase is configured and ready",
  "error": null,
  "timestamp": "2025-11-18T10:00:00.000Z"
}
```

**Response (Not Configured):**
```json
{
  "available": false,
  "configured": false,
  "message": "Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.",
  "error": {
    "message": "Firebase Admin not initialized - missing credentials",
    "type": "Error"
  },
  "timestamp": "2025-11-18T10:00:00.000Z"
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

**Response:**
```json
{
  "success": true,
  "docId": "generated-document-id",
  "status": "received",
  "created_at": "2025-11-18T19:52:00.000Z"
}
```

**HTTP Status Codes:**
- `201 Created` - Question stored successfully
- `400 Bad Request` - Invalid input (missing or empty question)
- `503 Service Unavailable` - Firebase not configured
- `500 Internal Server Error` - Server error

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid request",
  "message": "Question is required and must be a non-empty string"
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
  "completed_at": "2025-11-18T19:55:00.000Z" // Optional
}
```

**Valid Status Values:**
- `received` - Question received and stored
- `processing` - ML pipeline is processing
- `completed` - Analysis complete
- `ledger_verified` - Ledger verification complete
- `error` - Processing failed

**Response:**
```json
{
  "success": true,
  "docId": "document-id",
  "status": "updated-status",
  "message": "Status updated successfully"
}
```

**HTTP Status Codes:**
- `200 OK` - Status updated successfully
- `400 Bad Request` - Invalid status value
- `404 Not Found` - Document not found
- `503 Service Unavailable` - Firebase not configured
- `500 Internal Server Error` - Server error

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
