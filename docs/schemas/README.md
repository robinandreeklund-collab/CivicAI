# 📊 CivicAI Data Schemas

Firestore collection schemas and data models for the CivicAI platform.

## Collections Overview

| Collection | Purpose | Status |
|------------|---------|--------|
| `ai_interactions` | Store user queries and AI responses | 📋 Planned |
| `model_versions` | Track AI model versions and configurations | 📋 Planned |
| `ledger_blocks` | Blockchain-inspired transparency ledger | 📋 Planned |
| `change_events` | Change detection events and analysis | 📋 Planned |
| `users` | User accounts and preferences | 📋 Planned |
| `audit_logs` | System audit trail | 📋 Planned |

---

## 🔷 ai_interactions

Stores complete user interactions with AI models, including questions, responses, and analysis results.

### Schema

```javascript
{
  // Document ID: auto-generated UUID
  "interactionId": "string (UUID)",
  "userId": "string (optional)",
  "timestamp": "Timestamp",
  
  // Question data
  "question": {
    "text": "string",
    "hash": "string (SHA-256)",
    "language": "string (ISO 639-1)"
  },
  
  // AI responses
  "responses": [
    {
      "agent": "string (gpt-3.5|gemini|deepseek)",
      "response": "string",
      "responseTime": "number (ms)",
      "model": {
        "name": "string",
        "version": "string",
        "provider": "string"
      },
      
      // Basic analysis
      "analysis": {
        "tone": {
          "primary": "string",
          "secondary": "array<string>",
          "confidence": "number (0-100)"
        },
        "bias": {
          "biasScore": "number (0-10)",
          "types": "array<string>",
          "details": "array<object>"
        },
        "factCheck": {
          "claimsFound": "number",
          "claims": "array<object>"
        },
        "sentiment": {
          "label": "string (positive|negative|neutral)",
          "score": "number (-1 to 1)"
        }
      },
      
      // Pipeline analysis (if available)
      "pipelineAnalysis": {
        "preprocessing": "object",
        "biasAnalysis": "object",
        "sentimentAnalysis": "object",
        "ideologyClassification": "object",
        "topicModeling": "object",
        "timeline": "array<object>",
        "provenance": "array<object>"
      }
    }
  ],
  
  // Model synthesis
  "modelSynthesis": {
    "consensus": "number (0-100)",
    "divergences": "array<object>",
    "contradictions": "array<object>",
    "commonThemes": "array<string>"
  },
  
  // Debate data (if triggered)
  "debate": {
    "debateId": "string (reference to debates collection)",
    "triggered": "boolean",
    "winner": "string (optional)"
  },
  
  // Metadata
  "metadata": {
    "clientVersion": "string",
    "pythonMLEnabled": "boolean",
    "pipelineVersion": "string",
    "exportedAt": "Timestamp (optional)"
  }
}
```

### Indexes

```javascript
// Composite indexes
{
  "userId": "ascending",
  "timestamp": "descending"
}

{
  "question.hash": "ascending",
  "timestamp": "descending"
}
```

### Constraints

- `interactionId`: Must be unique UUID
- `question.text`: Required, max 10,000 characters
- `responses`: Required, min 1, max 10 items
- `timestamp`: Auto-set on creation

---

## 🔷 model_versions

Tracks AI model versions, configurations, and metadata.

### Schema

```javascript
{
  // Document ID: {provider}-{modelName}-{version}
  "modelId": "string",
  "provider": "string (openai|google|deepseek)",
  "modelName": "string",
  "version": "string",
  
  "configuration": {
    "maxTokens": "number",
    "temperature": "number",
    "topP": "number",
    "frequencyPenalty": "number",
    "presencePenalty": "number"
  },
  
  "capabilities": {
    "languages": "array<string>",
    "maxContextLength": "number",
    "streaming": "boolean",
    "functionCalling": "boolean"
  },
  
  "profile": {
    "strengths": "array<string>",
    "weaknesses": "array<string>",
    "characteristics": "object",
    "description": "string"
  },
  
  "usage": {
    "totalRequests": "number",
    "totalTokens": "number",
    "averageResponseTime": "number",
    "lastUsed": "Timestamp"
  },
  
  "metadata": {
    "addedAt": "Timestamp",
    "updatedAt": "Timestamp",
    "active": "boolean",
    "deprecated": "boolean"
  }
}
```

### Indexes

```javascript
{
  "provider": "ascending",
  "active": "ascending"
}
```

---

## 🔷 ledger_blocks

Blockchain-inspired ledger for transparency and auditability.

### Schema

```javascript
{
  // Document ID: auto-generated UUID
  "blockId": "string (UUID)",
  "blockNumber": "number",
  "timestamp": "Timestamp",
  
  // Chain integrity
  "previousHash": "string (SHA-256)",
  "currentHash": "string (SHA-256)",
  "nonce": "number",
  
  // Block data
  "data": {
    "type": "string (interaction|model_update|system_event)",
    
    // For interaction blocks
    "interactionId": "string (optional)",
    "questionHash": "string (SHA-256, optional)",
    "modelsUsed": "array<string> (optional)",
    "analysisPipeline": "string (version, optional)",
    
    // For model update blocks
    "modelId": "string (optional)",
    "updateType": "string (optional)",
    
    // For system events
    "eventType": "string (optional)",
    "eventData": "object (optional)"
  },
  
  // Metadata
  "metadata": {
    "createdBy": "string (system|user)",
    "verified": "boolean",
    "verifiedAt": "Timestamp (optional)"
  }
}
```

### Indexes

```javascript
{
  "blockNumber": "ascending"
}

{
  "data.interactionId": "ascending"
}
```

### Constraints

- `blockNumber`: Sequential, auto-increment
- `previousHash`: Must match previous block's currentHash
- `currentHash`: Computed from block data + previousHash + nonce
- Immutable after creation (no updates allowed)

### Validation Rules

```javascript
// Pseudo-code for write validation
function validateLedgerBlock(newBlock, previousBlock) {
  // Block number must be sequential
  assert(newBlock.blockNumber === previousBlock.blockNumber + 1);
  
  // Previous hash must match
  assert(newBlock.previousHash === previousBlock.currentHash);
  
  // Current hash must be valid
  const computedHash = sha256(
    JSON.stringify(newBlock.data) + 
    newBlock.previousHash + 
    newBlock.nonce
  );
  assert(newBlock.currentHash === computedHash);
  
  return true;
}
```

---

## 🔷 change_events

Records detected changes in AI model responses or system behavior.

### Schema

```javascript
{
  // Document ID: auto-generated UUID
  "eventId": "string (UUID)",
  "timestamp": "Timestamp",
  
  "changeType": "string (response_drift|model_update|bias_shift|performance_change)",
  
  // Related data
  "modelId": "string",
  "interactionId": "string (optional)",
  
  // Change details
  "changeDetails": {
    "before": "object",
    "after": "object",
    "delta": "object",
    "magnitude": "number (0-100)",
    "significance": "string (low|medium|high|critical)"
  },
  
  // Detection method
  "detection": {
    "method": "string (statistical|ml|rule_based)",
    "confidence": "number (0-100)",
    "algorithm": "string"
  },
  
  // Impact assessment
  "impact": {
    "affected": "array<string>",
    "severity": "string (low|medium|high)",
    "userNotified": "boolean",
    "actionTaken": "string (optional)"
  },
  
  "metadata": {
    "detectedBy": "string (system|user|ml_model)",
    "acknowledged": "boolean",
    "acknowledgedAt": "Timestamp (optional)",
    "acknowledgedBy": "string (optional)"
  }
}
```

### Indexes

```javascript
{
  "modelId": "ascending",
  "timestamp": "descending"
}

{
  "changeType": "ascending",
  "impact.severity": "ascending"
}
```

---

## 🔷 users

User accounts and preferences (future implementation).

### Schema

```javascript
{
  // Document ID: Firebase Auth UID
  "userId": "string (Firebase UID)",
  "email": "string",
  "displayName": "string",
  
  "profile": {
    "organization": "string (optional)",
    "role": "string (optional)",
    "bio": "string (optional)"
  },
  
  "preferences": {
    "defaultModels": "array<string>",
    "pythonMLEnabled": "boolean",
    "exportFormat": "string (yaml|json|pdf)",
    "theme": "string (dark|light)"
  },
  
  "usage": {
    "totalQueries": "number",
    "totalDebates": "number",
    "totalExports": "number",
    "lastActive": "Timestamp"
  },
  
  "metadata": {
    "createdAt": "Timestamp",
    "updatedAt": "Timestamp",
    "emailVerified": "boolean",
    "accountStatus": "string (active|suspended|deleted)"
  }
}
```

---

## 🔷 audit_logs

System-wide audit trail for security and compliance.

### Schema

```javascript
{
  // Document ID: auto-generated UUID
  "logId": "string (UUID)",
  "timestamp": "Timestamp",
  
  "eventType": "string (user_action|system_event|api_call|error)",
  "category": "string (auth|query|export|admin|security)",
  
  "actor": {
    "type": "string (user|system|api)",
    "id": "string",
    "ip": "string (optional)",
    "userAgent": "string (optional)"
  },
  
  "action": {
    "operation": "string",
    "resource": "string",
    "result": "string (success|failure|partial)",
    "details": "object"
  },
  
  "metadata": {
    "sessionId": "string (optional)",
    "requestId": "string (optional)",
    "duration": "number (ms, optional)"
  }
}
```

---

## 📝 Schema Validation

All writes to Firestore collections should validate against these schemas. Use the validation helpers in `/scripts/validate-schema.js`.

### Example Validation

```javascript
const { validateSchema } = require('../scripts/validate-schema');

// Before writing to Firestore
const interaction = {
  interactionId: uuid(),
  question: { text: "...", hash: "..." },
  responses: [...]
};

if (!validateSchema('ai_interactions', interaction)) {
  throw new Error('Invalid schema');
}

await db.collection('ai_interactions').add(interaction);
```

---

## 🔄 Schema Migration

When schemas change, use migration scripts in `/scripts/migrations/`.

Example migration script structure:
```bash
/scripts/migrations/
  001-add-debate-field-to-interactions.js
  002-update-ledger-hash-algorithm.js
  README.md
```

---

## 📚 Related Documentation

- [API Reference](../api/README.md) - API endpoints that use these schemas
- [Firebase Setup Guide](../guides/FIREBASE_SETUP.md) - Firebase initialization and configuration

---

**Last Updated**: 2025-11-18
**Schema Version**: v1.0.0 (Draft)
