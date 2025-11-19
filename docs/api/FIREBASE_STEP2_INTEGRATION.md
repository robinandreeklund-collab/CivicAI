# Firebase Integration Step 2 – Enhanced Pipeline Processing

## Overview

Step 2 extends the Firebase integration with comprehensive ML pipeline data storage, real-time processing updates, and full transparency through ledger blocks. This document describes the enhanced schema, data flow, and API changes.

## What's New in Step 2

### Enhanced Data Storage
- **Raw AI Responses**: Complete responses from all AI services with metadata
- **Processed Pipeline Data**: Full ML pipeline analysis results
- **Processing Times**: Timing data for each service and pipeline step
- **Pipeline Metadata**: Start/end times, status log, processing stages
- **API Provenance**: Model versions, endpoints, request IDs for full traceability
- **Error Logging**: Detailed error tracking with stack traces
- **Quality Metrics**: Confidence scores, consensus levels, severity ratings
- **Ledger Integration**: Multiple ledger blocks for complete audit trail

### Real-time Pipeline Tracking
- Status updates at each pipeline stage
- Progress tracking with step counts
- Detailed status log visible in UI
- Processing time monitoring

## Enhanced Schema

### Collection: `ai_interactions`

#### New Fields (Step 2)

| Field | Type | Description |
|-------|------|-------------|
| `raw_responses` | array | Raw AI service responses with full metadata |
| `processed_data` | object | Complete ML pipeline analysis results |
| `processing_times` | object | Processing duration for each service/step |
| `pipeline_metadata` | object | Pipeline execution metadata and status log |
| `errors` | array | Error logs with timestamps and stack traces |
| `quality_metrics` | object | Quality indicators (confidence, consensus, etc.) |
| `ledger_blocks` | array | References to ledger blocks for this interaction |

#### Complete Document Example

```json
{
  "question": "Vad är Sveriges klimatpolitik?",
  "question_hash": "sha256:abc123...",
  "created_at": "2025-11-19T07:30:00.000Z",
  "status": "ledger_verified",
  "pipeline_version": "1.0.0",
  "user_id": "anonymous",
  "session_id": "session-123",
  
  "raw_responses": [
    {
      "service": "gpt-3.5",
      "model_version": "gpt-3.5-turbo-0125",
      "response_text": "Sveriges klimatpolitik...",
      "metadata": {
        "timestamp": "2025-11-19T07:30:05.000Z",
        "responseTimeMs": 1234,
        "tokenCount": 150,
        "characterCount": 780,
        "confidence": 0.85,
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "request_id": "req_abc123"
      },
      "analysis": {
        "tone": { "primary": "informative", "confidence": 0.9 },
        "bias": { "detected": false },
        "factCheck": { "claims": 3 }
      }
    },
    {
      "service": "gemini",
      "model_version": "gemini-1.5-flash",
      "response_text": "Klimatpolitiken i Sverige...",
      "metadata": {
        "timestamp": "2025-11-19T07:30:06.000Z",
        "responseTimeMs": 1456,
        "tokenCount": 165,
        "characterCount": 820,
        "confidence": 0.88,
        "endpoint": "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        "request_id": "req_xyz789"
      },
      "analysis": {
        "tone": { "primary": "balanced", "confidence": 0.87 },
        "bias": { "detected": false },
        "factCheck": { "claims": 4 }
      }
    }
  ],
  
  "processed_data": {
    "preprocessing": {
      "tokenCount": 450,
      "sentences": 12,
      "language": "sv",
      "entities": [
        { "text": "Sverige", "type": "GPE" },
        { "text": "klimatpolitik", "type": "TOPIC" }
      ]
    },
    "bias": {
      "overall_score": 0.15,
      "categories": {
        "political": 0.1,
        "commercial": 0.05,
        "cultural": 0.0
      }
    },
    "sentiment": {
      "compound": 0.2,
      "positive": 0.6,
      "neutral": 0.35,
      "negative": 0.05
    },
    "ideology": {
      "classification": "center",
      "confidence": 0.75,
      "left_score": 0.2,
      "right_score": 0.3,
      "center_score": 0.5
    },
    "topics": [
      { "topic": "climate_policy", "confidence": 0.92 },
      { "topic": "environmental_regulation", "confidence": 0.78 }
    ],
    "transparency": {
      "provenance": "complete",
      "audit_trail": "verified"
    },
    "aggregatedInsights": {
      "overallConfidence": 0.86,
      "keyThemes": ["sustainability", "regulation", "carbon_neutrality"]
    }
  },
  
  "processing_times": {
    "preprocessing": {
      "durationMs": 234,
      "model": "spaCy",
      "version": "3.7.2"
    },
    "bias_detection": {
      "durationMs": 156,
      "model": "detoxify",
      "version": "0.5.2"
    },
    "sentiment_analysis": {
      "durationMs": 123,
      "model": "VADER",
      "version": "3.3.2"
    },
    "ideology_classification": {
      "durationMs": 345,
      "model": "Swedish-BERT",
      "version": "4.36.2"
    }
  },
  
  "pipeline_metadata": {
    "start_time": "2025-11-19T07:30:05.000Z",
    "end_time": "2025-11-19T07:31:15.000Z",
    "total_duration_ms": 70000,
    "status_log": [
      {
        "status": "received",
        "timestamp": "2025-11-19T07:30:00.000Z",
        "message": "Question received and stored"
      },
      {
        "status": "processing",
        "timestamp": "2025-11-19T07:30:05.000Z",
        "message": "Starting ML pipeline processing"
      },
      {
        "status": "responses_saved",
        "timestamp": "2025-11-19T07:30:30.000Z",
        "message": "Saved 3 raw AI responses"
      },
      {
        "status": "pipeline_complete",
        "timestamp": "2025-11-19T07:31:00.000Z",
        "message": "ML pipeline analysis completed"
      },
      {
        "status": "completed",
        "timestamp": "2025-11-19T07:31:10.000Z",
        "message": "Analysis complete"
      },
      {
        "status": "ledger_verified",
        "timestamp": "2025-11-19T07:31:15.000Z",
        "message": "Ledger verification complete"
      }
    ]
  },
  
  "errors": [],
  
  "quality_metrics": {
    "confidence": 0.86,
    "consensus": 0.78,
    "severity": "low",
    "completeness": 1.0
  },
  
  "ledger_blocks": [
    "0",
    "1234",
    "1235",
    "1236",
    "1237"
  ],
  
  "completed_at": "2025-11-19T07:31:10.000Z",
  "verified_at": "2025-11-19T07:31:15.000Z",
  "updated_at": "2025-11-19T07:31:15.000Z"
}
```

## Data Flow

### Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User submits question in ChatV2                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POST /api/firebase/questions                            │
│    - Create ai_interactions document                        │
│    - Status: "received"                                     │
│    - Create ledger block: "Fråga mottagen"                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ChatV2 calls POST /api/query (with firebaseDocId)      │
│    - Execute AI service queries in parallel                 │
│    - Collect raw responses                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Save Raw Responses                                       │
│    - saveRawResponses(docId, responses)                    │
│    - Update status_log: "responses_saved"                  │
│    - Create ledger block: "AI responses collected"         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Execute ML Pipeline                                      │
│    - Preprocessing (tokenization, NER, language detection) │
│    - Bias detection (political, commercial, toxicity)      │
│    - Sentiment analysis (VADER, polarity, subjectivity)    │
│    - Ideology classification (left/center/right)           │
│    - Topic modeling (BERTopic, keywords)                   │
│    - Transparency tracking (provenance, audit trail)       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Save Pipeline Data                                       │
│    - savePipelineData(docId, pipelineData)                 │
│    - Store processed_data, processing_times                │
│    - Calculate quality_metrics                             │
│    - Update status_log: "pipeline_complete"                │
│    - Create ledger block: "ML pipeline completed"          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Update Status to Completed                              │
│    - updateQuestionStatus(docId, {status: "completed"})    │
│    - Set completed_at timestamp                            │
│    - Store final analysis results                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Ledger Verification                                      │
│    - Create final ledger block: "Analysis verified"        │
│    - Update status to "ledger_verified"                    │
│    - Set verified_at timestamp                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. UI Updates                                               │
│    - ChatV2 polls for status updates                       │
│    - Display progress bar and current step                 │
│    - Show completion message when verified                 │
└─────────────────────────────────────────────────────────────┘
```

## New Backend Functions

### firebaseService.js

#### `saveRawResponses(docId, responses)`

Save raw AI service responses with complete metadata.

**Parameters:**
- `docId` (string): Firebase document ID
- `responses` (array): Array of AI service response objects

**Response Structure:**
```javascript
{
  service: "gpt-3.5",
  model_version: "gpt-3.5-turbo-0125",
  response_text: "...",
  metadata: {
    timestamp: "2025-11-19T07:30:05.000Z",
    responseTimeMs: 1234,
    tokenCount: 150,
    characterCount: 780,
    confidence: 0.85,
    endpoint: "https://api.openai.com/...",
    request_id: "req_abc123"
  },
  analysis: { tone, bias, factCheck }
}
```

#### `savePipelineData(docId, pipelineData)`

Save processed ML pipeline analysis results.

**Pipeline Data Structure:**
```javascript
{
  preprocessing: { tokenCount, sentences, entities, ... },
  bias: { overall_score, categories, ... },
  sentiment: { compound, positive, neutral, negative },
  ideology: { classification, confidence, scores },
  topics: [{ topic, confidence }],
  transparency: { provenance, audit_trail },
  aggregatedInsights: { overallConfidence, keyThemes },
  timeline: [{ step, startTime, endTime, durationMs }],
  metadata: {
    pipelineStartTime,
    pipelineEndTime,
    totalDurationMs
  }
}
```

#### `addLedgerBlockReference(docId, blockId)`

Add a ledger block reference to track the audit trail.

**Parameters:**
- `docId` (string): Firebase document ID
- `blockId` (string): Ledger block ID

#### `logQuestionError(docId, error)`

Log errors with detailed information for debugging.

**Error Structure:**
```javascript
{
  timestamp: "2025-11-19T07:30:00.000Z",
  message: "Error message",
  stack: "Stack trace...",
  code: "ERROR_CODE"
}
```

## Ledger Integration

### Ledger Block Creation Points

1. **Question Received** (`data_collection`)
   ```javascript
   {
     event_type: "data_collection",
     data: {
       description: "Fråga mottagen",
       question_hash: "sha256:...",
       firebase_doc_id: "abc123"
     }
   }
   ```

2. **AI Responses Collected** (`data_collection`)
   ```javascript
   {
     event_type: "data_collection",
     data: {
       description: "AI responses collected",
       firebase_doc_id: "abc123",
       services_count: 3,
       services: ["gpt-3.5", "gemini", "deepseek"],
       provenance: [...]
     }
   }
   ```

3. **Pipeline Completed** (`data_collection`)
   ```javascript
   {
     event_type: "data_collection",
     data: {
       description: "ML pipeline analysis completed",
       firebase_doc_id: "abc123",
       pipeline_version: "1.0.0",
       processing_time_ms: 70000,
       quality_metrics: { consensus: 0.78, confidence: 0.86 }
     }
   }
   ```

4. **Analysis Verified** (`data_collection`)
   ```javascript
   {
     event_type: "data_collection",
     data: {
       description: "Analysis complete and verified",
       firebase_doc_id: "abc123",
       verified: true,
       final_status: "completed"
     }
   }
   ```

## Frontend Integration

### Enhanced Hook: `useQuestionStatus`

New properties returned:

```javascript
const {
  status,              // Current status
  questionData,        // Full question data from Firebase
  error,              // Error message if any
  loading,            // Loading state
  pipelineProgress,   // NEW: Pipeline progress tracking
  createQuestion,     // Create question function
  fetchQuestion,      // Fetch question function
  getStatusMessage,   // Get user-friendly status message
  getStatusColor,     // Get Tailwind color class
  getProgressPercentage  // NEW: Get progress percentage
} = useQuestionStatus(docId);
```

**Pipeline Progress Structure:**
```javascript
{
  currentStep: "ML pipeline analysis completed",
  stepsCompleted: 5,
  totalSteps: 7,
  statusLog: [
    { status: "received", timestamp: "...", message: "..." },
    { status: "processing", timestamp: "...", message: "..." },
    // ...
  ]
}
```

### Enhanced Component: `FirebaseStatusIndicator`

New features:
- Progress bar for processing state
- Step counter (e.g., "Step 3/7")
- Progress percentage
- Collapsible status log viewer
- Real-time updates

**Usage:**
```jsx
<FirebaseStatusIndicator 
  status={status}
  pipelineProgress={pipelineProgress}
/>
```

## Firebase Functions

### Enhanced `onQuestionCreate` Trigger

**Timeout:** 540 seconds (9 minutes)
**Memory:** 2GB

**Features:**
- Extended timeout for complex ML processing
- Status logging helper function
- Passes `firebaseDocId` to backend for direct data saving
- Backend handles all data persistence
- Comprehensive error handling

**Environment Variables:**
```bash
BACKEND_URL=https://your-backend-url.com  # Backend API URL
```

### New `onStatusUpdate` Monitor

Monitors status changes for logging and analytics:

```javascript
exports.onStatusUpdate = functions.firestore
  .document('ai_interactions/{docId}')
  .onUpdate((change, context) => {
    // Log status changes
    // Could trigger notifications, update analytics, etc.
  });
```

## Quality Metrics

### Tracked Metrics

| Metric | Description | Range |
|--------|-------------|-------|
| `confidence` | Overall confidence in analysis results | 0.0 - 1.0 |
| `consensus` | Agreement level between AI models | 0.0 - 1.0 |
| `severity` | Severity of detected issues | "low" \| "medium" \| "high" |
| `completeness` | Completeness of pipeline execution | 0.0 - 1.0 |

### Calculation

```javascript
const qualityMetrics = {
  confidence: pipelineData.aggregatedInsights?.overallConfidence || 0,
  consensus: modelSynthesis?.consensus || 0,
  severity: determineSeverity(pipelineData.bias, pipelineData.sentiment),
  completeness: calculateCompleteness(pipelineData.timeline)
};
```

## Error Handling

### Error Logging

All errors are logged to the `errors` array with full context:

```javascript
{
  timestamp: "2025-11-19T07:30:00.000Z",
  message: "Pipeline processing failed",
  stack: "Error: ...\n  at ...\n  at ...",
  code: "PIPELINE_ERROR"
}
```

### Status on Error

When an error occurs:
1. Status updated to `"error"`
2. Error logged to `errors` array
3. Status log updated with error message
4. Processing stops gracefully
5. UI displays error state

### Graceful Degradation

- Firebase unavailable → Continue without persistence
- Individual service fails → Other services continue
- Pipeline step fails → Log error, continue with remaining steps

## Testing

### Manual Testing Checklist

- [ ] Create question → Verify `received` status
- [ ] Monitor status updates → Verify transitions
- [ ] Check raw_responses → Verify AI responses saved
- [ ] Check processed_data → Verify pipeline data saved
- [ ] Check ledger_blocks → Verify ledger integration
- [ ] Check quality_metrics → Verify metric calculation
- [ ] Trigger error → Verify error logging
- [ ] Check UI progress → Verify real-time updates

### Test Data Example

```bash
# Create test question
curl -X POST http://localhost:3001/api/firebase/questions \
  -H "Content-Type: application/json" \
  -d '{"question":"Test question","userId":"test","sessionId":"test-123"}'

# Get question status
curl http://localhost:3001/api/firebase/questions/{docId}
```

## Performance Considerations

### Optimization Strategies

1. **Parallel Processing**: AI services called in parallel
2. **Efficient Updates**: Use field paths for nested updates
3. **Polling Optimization**: Only poll while `processing` or `received`
4. **Data Compression**: Store only essential metadata
5. **Index Optimization**: Indexes on `status` and `created_at`

### Expected Timings

| Operation | Average Duration |
|-----------|-----------------|
| Question creation | < 500ms |
| AI service responses | 1-3 seconds each |
| ML pipeline processing | 5-15 seconds |
| Data persistence | 500-1000ms |
| Ledger block creation | 200-500ms |
| Total end-to-end | 30-90 seconds |

## Security

### Data Protection

- API keys stored securely in environment variables
- User IDs anonymized
- IP addresses hashed
- No PII stored in raw responses
- Firestore security rules enforce access control

### Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ai_interactions/{docId} {
      // Read: Authenticated users only
      allow read: if request.auth != null;
      
      // Create: Authenticated users only
      allow create: if request.auth != null;
      
      // Update/Delete: Backend only
      allow update, delete: if false;
    }
  }
}
```

## Monitoring & Observability

### Logging

All pipeline stages log to console:
- `📝 Processing question: ...`
- `💾 Saving pipeline results to Firebase...`
- `✅ Firebase integration complete`
- `❌ Firebase integration error: ...`

### Status Dashboard (Future)

Real-time monitoring of:
- Active processing jobs
- Error rates
- Average processing times
- Quality metric trends
- System health

## Migration from Step 1

### Backward Compatibility

Step 2 is fully backward compatible with Step 1:
- Existing documents continue to work
- New fields are optional
- Legacy endpoints unchanged
- Old UI components still functional

### Upgrade Path

1. Deploy new backend code
2. Deploy new Firebase Functions
3. Update frontend components
4. Test with sample questions
5. Monitor for issues
6. Gradually enable for all users

## Conclusion

Firebase Integration Step 2 provides comprehensive data persistence, real-time tracking, and full transparency for the ML pipeline. The enhanced schema captures all aspects of the analysis process while maintaining backward compatibility and graceful degradation.

For questions or issues, refer to:
- [Firebase Step 1 Documentation](./API-Firebase-Integration.md)
- [Firebase Testing Guide](./FIREBASE_TESTING_GUIDE.md)
- [Repository Issues](https://github.com/robinandreeklund-collab/CivicAI/issues)
