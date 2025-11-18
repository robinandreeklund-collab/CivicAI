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
      "pipelineAnalysis": { 
        /* 10-step comprehensive ML analysis */
        "language": "sv",
        "sentiment": {"polarity": 0.5, "subjectivity": 0.3},
        "toxicity": {"toxicity": 0.02, "is_toxic": false},
        "ideology": "green",
        "explainability": {"shap": {...}, "lime": {...}},
        "topics": ["climate", "economy"],
        "fairness": {"overall_fairness_score": 0.85},
        "provenance": {
          "pipeline_version": "openseek-ml-1.3.0",
          "models_used": ["spacy", "detoxify", "transformers", "shap", "gensim"]
        }
      }
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
| `/analysis-pipeline/analyze` | POST | ✅ | Analyze text with full 10-step pipeline |
| `/analysis-transparency/provenance` | GET | ✅ | Get provenance data for analysis |
| `/analysis-transparency/timeline` | GET | ✅ | Get analysis timeline |

### 10-Step ML Analysis Pipeline

The pipeline now includes comprehensive ML capabilities:

1. **Ingestion & Language Detection** - langdetect identifies 55+ languages
2. **Preprocessing** - spaCy tokenization, POS-tagging, NER; TextBlob sentiment
3. **Toxicity & Safety** - Detoxify multilingual toxicity detection
4. **Transformer Models** - Swedish BERT for sentiment and ideology classification
5. **Tone & Fact Checking** - Tone analysis and fact verification
6. **Enhanced NLP Analysis** - Comprehensive linguistic analysis (always enabled)
7. **Explainability** - SHAP (global) and LIME (local) explanations (enabled by default)
8. **Topic Modeling** - Gensim LDA topic extraction (works with single text)
9. **Fairness & Bias** - Consistency-based fairness metrics (works with single text)
10. **Synthesis & Integration** - Aggregated results with full provenance

### Example: Analyze Text
```javascript
POST /api/analysis-pipeline/analyze
Content-Type: application/json

{
  "text": "Text to analyze...",
  "question": "Optional context",
  "options": {
    "includePython": true,
    "includeExplainability": true  // SHAP/LIME enabled by default
  }
}

// Response includes all 10 pipeline steps
{
  "language": "sv",
  "preprocessing": {
    "tokens": [...],
    "entities": [...],
    "pos_tags": [...]
  },
  "sentiment": {
    "polarity": 0.5,
    "subjectivity": 0.3
  },
  "toxicity": {
    "toxicity": 0.02,
    "is_toxic": false
  },
  "ideology": {
    "label": "green",
    "confidence": 0.82
  },
  "explainability": {
    "shap": {
      "word_impacts": [["climate", 0.85], ["economy", 0.72]]
    },
    "lime": {
      "sentence_contributions": [...]
    }
  },
  "topics": ["climate", "economy", "sustainability"],
  "fairness": {
    "bias_indicators": {
      "sentiment_consistency": 0.95,
      "toxicity_consistency": 0.98,
      "overall_fairness_score": 0.85
    },
    "fairness_status": "fair"
  },
  "timeline": [
    {"step": "langdetect_language", "duration_ms": 7},
    {"step": "spacy_preprocessing", "duration_ms": 49},
    ...
  ],
  "provenance": {
    "pipeline_version": "openseek-ml-1.3.0",
    "models_used": ["spacy", "textblob", "detoxify", "transformers", "shap", "lime", "gensim"],
    "timestamp": "2025-11-18T13:00:00Z"
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
    "analysisPipeline": "v1.3.0"
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
| `/health` | GET | ✅ | Health check with detailed service status |
| `/version` | GET | 📋 | Get API version info |
| `/config` | GET | 📋 | Get system configuration |

### Health Check Response

```javascript
GET /api/health

// Response
{
  "status": "ok",
  "services": {
    "query": {"status": "up", "description": "AI Query Service"},
    "python-ml": {
      "status": "up",
      "description": "Python ML Pipeline Service",
      "lastChecked": "2025-11-18T13:00:00Z",
      "lastSuccessful": "2025-11-18T13:00:00Z",
      "available_models": {
        "spacy": true,
        "textblob": true,
        "langdetect": true,
        "detoxify": true,
        "transformers": true,
        "shap": true,
        "lime": true,
        "gensim": true,
        "fairlearn": true,
        "lux": false,
        "sweetviz": false,
        "bertopic": false
      },
      "error": null
    },
    "change-detection": {"status": "up", "description": "Change Detection Service"}
  }
}
```

See [HEALTH_CHECK.md](./HEALTH_CHECK.md) for detailed health monitoring documentation.

---

## 🐍 Python ML Service (Optional)

**Base URL**: `http://localhost:5001`

### Core NLP Endpoints

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/health` | GET | ✅ | Service health and per-model availability |
| `/preprocess` | POST | ✅ | spaCy preprocessing (tokenization, POS, NER) |
| `/sentiment` | POST | ✅ | TextBlob sentiment (polarity, subjectivity) |
| `/detect-language` | POST | ✅ | langdetect language detection (55+ languages) |
| `/detect-toxicity` | POST | ✅ | Detoxify multilingual toxicity detection |
| `/classify-ideology` | POST | ✅ | Swedish BERT ideology classification |
| `/topic-modeling` | POST | ✅ | Gensim LDA topic modeling (works with single text) |
| `/semantic-similarity` | POST | ✅ | Gensim Word2Vec semantic similarity |
| `/analyze-complete` | POST | ✅ | Complete analysis (all modules combined) |

### Explainability & Interpretability ✨ NEW

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/explain-shap` | POST | ✅ | SHAP word-level sentiment impact analysis |
| `/explain-lime` | POST | ✅ | LIME sentence-level contribution analysis |

**Example: SHAP Explainability**
```javascript
POST http://localhost:5001/explain-shap
Content-Type: application/json

{
  "text": "Climate policy must balance environmental sustainability with economic growth."
}

// Response
{
  "word_impacts": [
    ["sustainability", 0.85],
    ["environmental", 0.72],
    ["growth", 0.65],
    ["climate", 0.58]
  ],
  "method": "textblob_word_sentiment",
  "explanation_type": "global"
}
```

**Example: LIME Explainability**
```javascript
POST http://localhost:5001/explain-lime
Content-Type: application/json

{
  "text": "We need strong environmental policies. Economic growth is also important."
}

// Response
{
  "sentence_contributions": [
    {
      "sentence": "We need strong environmental policies.",
      "contribution": 0.75,
      "sentiment": "positive"
    },
    {
      "sentence": "Economic growth is also important.",
      "contribution": 0.60,
      "sentiment": "neutral"
    }
  ],
  "method": "sentence_level_analysis"
}
```

### Fairness & Quality

| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/fairness-metrics` | POST | ✅ | Fairlearn fairness analysis (batch mode) |
| `/generate-eda-report` | POST | 📋 | Sweetviz automated EDA reports |
| `/lux-recommendations` | POST | 📋 | Lux visualization recommendations |

**Note**: Fairness analysis in the pipeline now includes a single-text workaround that calculates consistency-based fairness metrics even without batch data.

### Available Python ML Models

| Model | Version | Status | Description |
|-------|---------|--------|-------------|
| **spaCy** | 3.7.2 | ✅ | Tokenization, POS, NER, dependency parsing |
| **TextBlob** | 0.17.1 | ✅ | Sentiment polarity and subjectivity |
| **langdetect** | - | ✅ | Multi-language detection (55+ languages) |
| **Detoxify** | 0.5.2 | ✅ | ML-based toxicity detection (CPU optimized) |
| **Transformers** | 4.36.2 | ✅ | Swedish BERT ideology classification |
| **SHAP** | 0.44.0 | ✅ | Model explainability (word-level) |
| **LIME** | - | ✅ | Local interpretability (sentence-level) |
| **Gensim** | 4.3.2 | ✅ | LDA topic modeling, Word2Vec |
| **Fairlearn** | 0.10.0 | ✅ | Fairness metrics (batch + single-text) |
| **BERTopic** | 0.16.0 | 📋 | Advanced topic modeling (optional) |
| **Lux** | - | 📋 | Visualization recommendations (optional) |
| **Sweetviz** | - | 📋 | EDA report generation (optional) |

### Health Monitoring & Caching ✨ NEW

The backend now includes a health cache service that:
- Polls Python `/health` endpoint every 5 seconds (configurable)
- Caches service status and per-model availability
- Provides `lastChecked` and `lastSuccessful` timestamps
- Prevents service flapping and expensive sync health checks

**Configuration** (environment variables):
- `PYTHON_NLP_SERVICE_URL` - Default: `http://localhost:5001`
- `PYTHON_HEALTH_POLL_INTERVAL_MS` - Default: `5000`
- `PYTHON_HEALTH_REQUEST_TIMEOUT_MS` - Default: `2500`

### Pipeline Provenance & Metadata ✨ NEW

All analysis responses now include detailed provenance:

```javascript
{
  "provenance": {
    "pipeline_version": "openseek-ml-1.3.0",
    "models_attempted": ["spacy", "textblob", "detoxify", "transformers", "shap", "gensim"],
    "models_used": ["spacy", "textblob", "detoxify", "transformers", "shap", "gensim"],
    "models_failed": [],
    "timestamp": "2025-11-18T13:00:00Z"
  },
  "timeline": [
    {"step": "langdetect_language", "model": "langdetect", "duration_ms": 7},
    {"step": "spacy_preprocessing", "model": "spaCy", "duration_ms": 49},
    {"step": "textblob_sentiment", "model": "TextBlob", "duration_ms": 5},
    {"step": "detoxify_toxicity", "model": "Detoxify", "duration_ms": 65},
    {"step": "transformers_ideology", "model": "KB/bert-base-swedish-cased", "duration_ms": 8}
  ]
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
- `503` - Service Unavailable (Python ML service down)

---

## 🔒 Authentication

Most endpoints (marked with 🔐) require authentication via Bearer token:

```
Authorization: Bearer <token>
```

---

## 📚 Related Documentation

- [Health Check API](./HEALTH_CHECK.md) - Detailed health monitoring and troubleshooting
- [Change Detection API](./CHANGE_DETECTION_API.md) - Change detection endpoint documentation
- [Data Schemas](../schemas/README.md) - Firestore collection schemas
- [Pipeline Guide](../pipeline/ANALYSIS_PIPELINE.md) - Analysis pipeline documentation

---

## 🆕 Recent Updates (v1.3.0)

### November 2025
- ✅ Added comprehensive 10-step ML analysis pipeline
- ✅ Implemented SHAP and LIME explainability (enabled by default)
- ✅ Added Gensim LDA topic modeling with single-text support
- ✅ Implemented single-text fairness analysis workaround
- ✅ Added health cache service with background polling
- ✅ Fixed Windows compatibility issues (Detoxify CPU, NLTK data, Unicode encoding)
- ✅ Added detailed provenance tracking and per-model metadata
- ✅ Enhanced timeline with step-by-step duration metrics

---

**Last Updated**: 2025-11-18  
**API Version**: v1.3.0 (Development)  
**Pipeline Version**: openseek-ml-1.3.0
