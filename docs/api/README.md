# 🔌 CivicAI API Documentation

Complete API endpoint reference for the CivicAI/OneSeek.AI platform.

## API Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: TBD

## 📊 Status Legend

- ✅ **Ready**: Fully implemented and tested
- 🔶 **Partial**: Partially implemented, may have limitations
- 📋 **Planned**: Not yet implemented

---

## 🔐 Authentication Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/auth/signup` | POST | 🔶 | User registration |
| `/auth/login` | POST | 📋 | User login |
| `/auth/logout` | POST | 📋 | User logout |
| `/auth/verify` | POST | 📋 | Verify authentication token |
| `/auth/refresh` | POST | 📋 | Refresh authentication token |

### Example: User Signup
```javascript
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

---

## 💬 AI Interactions Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/query` | POST | ✅ | Submit question to multiple AI models |
| `/query/:id` | GET | 📋 | Get specific query result |
| `/interactions` | GET | 📋 | List user's AI interactions |
| `/interactions/:id` | GET | 📋 | Get specific interaction details |
| `/interactions/:id/export` | GET | ✅ | Export interaction (YAML/JSON/PDF) |

### Example: Submit Query
```javascript
POST /api/query
Content-Type: application/json

{
  "question": "What is climate change?",
  "agents": ["gpt-3.5", "gemini", "deepseek"],
  "options": {
    "analysisPipeline": true,
    "includePython": false
  }
}

// Response
{
  "questionId": "1234567890",
  "responses": [
    {
      "agent": "gpt-3.5",
      "response": "Climate change refers to...",
      "analysis": { /* tone, bias, facts */ },
      "pipelineAnalysis": { /* detailed analysis */ }
    }
  ],
  "modelSynthesis": {
    "consensus": 75,
    "divergences": [],
    "contradictions": []
  }
}
```

---

## 🔬 Analysis Pipeline Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/analysis-pipeline/config` | GET | ✅ | Get pipeline configuration |
| `/analysis-pipeline/steps` | GET | ✅ | List available pipeline steps |
| `/analysis-pipeline/analyze` | POST | ✅ | Analyze text with full pipeline |
| `/analysis-transparency/provenance` | GET | ✅ | Get provenance data for analysis |
| `/analysis-transparency/timeline` | GET | ✅ | Get analysis timeline |

### Example: Analyze Text
```javascript
POST /api/analysis-pipeline/analyze
Content-Type: application/json

{
  "text": "Text to analyze...",
  "question": "Optional context",
  "options": {
    "includePython": true
  }
}
```

---

## 🤖 Model Management Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/models/versions` | GET | 📋 | List AI model versions |
| `/models/:modelId/config` | GET | 📋 | Get model configuration |
| `/models/:modelId/stats` | GET | 📋 | Get model usage statistics |
| `/models/profiles` | GET | ✅ | Get all AI agent profiles |

---

## 📜 Transparency Ledger Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/ledger/blocks` | GET | 📋 | List ledger blocks |
| `/ledger/blocks/:blockId` | GET | 📋 | Get specific block |
| `/ledger/verify` | POST | 📋 | Verify ledger chain integrity |
| `/ledger/interactions/:interactionId` | GET | 📋 | Get ledger entry for interaction |

### Planned Ledger Block Schema
```javascript
{
  "blockId": "block-uuid",
  "timestamp": "2025-11-18T08:00:00Z",
  "previousHash": "sha256-hash",
  "currentHash": "sha256-hash",
  "data": {
    "interactionId": "interaction-uuid",
    "questionHash": "sha256-hash",
    "modelsUsed": ["gpt-3.5", "gemini"],
    "analysisPipeline": "v1.2.0"
  }
}
```

---

## 🔍 Change Detection Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/change-detection/analyze` | POST | ✅ | Analyze text for changes |
| `/change-detection/events` | GET | 📋 | List change events |
| `/change-detection/events/:id` | GET | 📋 | Get specific change event |
| `/change-detection/compare` | POST | ✅ | Compare two versions |

See [CHANGE_DETECTION_API.md](./CHANGE_DETECTION_API.md) for detailed documentation.

---

## 🗳️ Consensus Debate Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/debate/check-trigger` | POST | ✅ | Check if debate should be triggered |
| `/debate/initiate` | POST | ✅ | Start new consensus debate |
| `/debate/:debateId` | GET | ✅ | Get debate details |
| `/debate/:debateId/round` | POST | ✅ | Execute next debate round |
| `/debate/:debateId/vote` | POST | ✅ | Execute AI voting |
| `/debate/config` | GET | ✅ | Get debate configuration |

### Example: Initiate Debate
```javascript
POST /api/debate/initiate
Content-Type: application/json

{
  "questionId": "q-1234",
  "question": "Should AI be regulated?",
  "agents": ["gpt-3.5", "gemini", "deepseek"],
  "initialResponses": [ /* agent responses */ ],
  "modelSynthesis": { /* synthesis result */ }
}
```

---

## 📊 Realtime Updates Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/realtime/subscribe` | WebSocket | 📋 | Subscribe to real-time updates |
| `/realtime/status` | GET | 📋 | Get real-time service status |

---

## 📤 Export Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/export/yaml` | POST | ✅ | Export to YAML format |
| `/export/json` | POST | ✅ | Export to JSON format |
| `/export/pdf` | POST | ✅ | Export to PDF format |
| `/export/readme` | POST | ✅ | Export to README markdown |

### Example: Export to YAML
```javascript
POST /api/export/yaml
Content-Type: application/json

{
  "type": "conversation",
  "data": { /* conversation data */ }
}
```

---

## 🔬 Policy Questions Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/policy-questions` | GET | ✅ | List policy question bank |
| `/policy-questions/:id` | GET | ✅ | Get specific policy question |
| `/policy-questions` | POST | 📋 | Create custom policy question |

---

## 📊 Audit Trail Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/audit` | GET | ✅ | Get audit trail events |
| `/audit/:eventId` | GET | 📋 | Get specific audit event |
| `/audit/export` | POST | 📋 | Export audit trail |

---

## 🔧 System Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/health` | GET | ✅ | Health check |
| `/version` | GET | 📋 | Get API version info |
| `/config` | GET | 📋 | Get system configuration |

---

## 🐍 Python ML Service (Optional)

### Core NLP Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/health` | GET | ✅ | Python service health check and model availability |
| `/preprocess` | POST | ✅ | Text preprocessing with spaCy (tokenization, POS, NER) |
| `/sentiment` | POST | ✅ | Sentiment analysis with TextBlob (polarity, subjectivity) |
| `/detect-language` | POST | ✅ | Language detection with langdetect (55+ languages) |
| `/detect-toxicity` | POST | ✅ | Toxicity detection with Detoxify (multilingual) |
| `/classify-ideology` | POST | 🔶 | Political ideology classification with Swedish BERT |
| `/topic-modeling` | POST | ✅ | Topic modeling with BERTopic (transformer-based) |
| `/semantic-similarity` | POST | ✅ | Semantic similarity analysis with Gensim (Word2Vec) |
| `/analyze-complete` | POST | ✅ | Complete NLP analysis (all modules combined) |

### Explainability & Interpretability

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/explain-shap` | POST | ✅ | Model explainability with SHAP (global feature importance) |
| `/explain-lime` | POST | ✅ | Local interpretable explanations with LIME |

### Fairness & Quality

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/fairness-metrics` | POST | ✅ | Fairness analysis with Fairlearn (demographic parity, equal opportunity) |
| `/generate-eda-report` | POST | ✅ | Automated EDA reports with Sweetviz (data quality) |
| `/lux-recommendations` | POST | ✅ | Interactive visualization recommendations with Lux |

**Python Service Base URL**: `http://localhost:5001`

### Available Models

The Python ML service includes the following models:

- **spaCy** 3.7.2 - Tokenization, POS tagging, NER, dependency parsing
- **TextBlob** 0.17.1 - Sentiment polarity and subjectivity
- **langdetect** - Multi-language detection (55+ languages, Windows-compatible)
- **Detoxify** 0.5.2 - ML-based toxicity detection
- **Transformers** 4.36.2 - Swedish BERT for ideology classification
- **SHAP** 0.44.0 - Model explainability and feature importance
- **Gensim** 4.3.2 - Word2Vec, FastText, LDA for semantic analysis
- **BERTopic** 0.16.0 - Transformer-based topic modeling
- **LIME** - Local interpretable model-agnostic explanations
- **Fairlearn** 0.10.0 - Fairness metrics and bias detection
- **Lux** - Interactive visualization recommendations
- **Sweetviz** - Automated EDA report generation

### Example: Complete Analysis

```javascript
POST /api/python-ml/analyze-complete
Content-Type: application/json

{
  "text": "Text to analyze...",
  "question": "Optional context"
}

// Response
{
  "preprocessing": {
    "tokens": ["text", "to", "analyze"],
    "pos_tags": [...],
    "entities": [...]
  },
  "sentiment": {
    "polarity": 0.1,
    "subjectivity": 0.5
  },
  "language": {
    "detected": "sv",
    "confidence": 0.95
  },
  "toxicity": {
    "toxicity": 0.02,
    "severe_toxicity": 0.01,
    "is_toxic": false
  },
  "topics": [...],
  "provenance": {
    "models_used": ["spaCy", "TextBlob", "langdetect", "Detoxify", "BERTopic"],
    "timestamp": "2025-11-18T..."
  }
}
```

### Example: SHAP Explainability

```javascript
POST /api/python-ml/explain-shap
Content-Type: application/json

{
  "text": "Text to explain..."
}

// Response
{
  "feature_importance": [
    {
      "class": "left",
      "features": [
        ["word1", 0.85],
        ["word2", 0.72]
      ]
    }
  ],
  "explanation_type": "global",
  "model": "KB/bert-base-swedish-cased"
}
```

### Example: Fairness Metrics

```javascript
POST /api/python-ml/fairness-metrics
Content-Type: application/json

{
  "texts": ["text1", "text2", "text3"],
  "sensitive_features": ["group_a", "group_b", "group_a"]
}

// Response
{
  "selection_rates": {
    "group_a": {
      "left": 0.5,
      "center": 0.3,
      "right": 0.2
    }
  },
  "demographic_parity": {
    "left": 0.05,
    "center": 0.03,
    "right": 0.02
  },
  "overall_fairness_score": 0.033,
  "fairness_status": "fair"
}
```

---

## 📝 Error Responses

All endpoints return standard error responses:

```javascript
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": { /* additional error details */ }
}
```

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## 🔒 Authentication

Most endpoints (marked with 🔐) require authentication via Bearer token:

```
Authorization: Bearer <token>
```

---

## 📚 Related Documentation

- [Change Detection API](./CHANGE_DETECTION_API.md) - Detailed change detection endpoint documentation
- [Data Schemas](../schemas/README.md) - Firestore collection schemas
- [Pipeline Guide](../pipeline/ANALYSIS_PIPELINE.md) - Analysis pipeline documentation

---

**Last Updated**: 2025-11-18
**API Version**: v1.0.0 (Development)
