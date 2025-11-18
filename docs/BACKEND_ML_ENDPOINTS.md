# Backend ML and Fact-Check Endpoints - Implementation Summary

## Overview
This document summarizes the implementation of 6 new backend API endpoints that provide data for the ChatV2 visualization panels.

## Implemented Endpoints

### 1. SHAP Explainability
**Endpoint:** `POST /api/ml/shap`

**Purpose:** Provides SHAP (SHapley Additive exPlanations) feature importance for model interpretability.

**Request:**
```json
{
  "text": "Text to explain",
  "model": "sentiment",
  "prediction_class": "positive"
}
```

**Response:**
```json
{
  "shapValues": [0.15, -0.08, 0.22, ...],
  "tokens": ["word1", "word2", ...],
  "baseValue": 0.0,
  "topFeatures": [
    {"token": "wonderful", "contribution": 0.22, "direction": "positive"}
  ],
  "globalImportance": {"word_sentiment": 0.45},
  "visualization": "base64_image_data",
  "metadata": {...}
}
```

**Integration:** 
- Uses Python service `/explain-shap` endpoint
- Falls back to placeholder structure if service unavailable

---

### 2. LIME Interpretability
**Endpoint:** `POST /api/ml/lime`

**Purpose:** Local Interpretable Model-agnostic Explanations for individual predictions.

**Request:**
```json
{
  "text": "Text to explain",
  "model": "ideology",
  "num_features": 10,
  "num_samples": 5000
}
```

**Response:**
```json
{
  "explanation": "The model classified...",
  "weights": [
    {"word": "policy", "weight": 0.45, "class": "green"}
  ],
  "prediction": "green",
  "confidence": 0.88,
  "intercept": 0.05,
  "score": 0.72,
  "metadata": {...}
}
```

**Integration:**
- Uses Python service `/explain-lime` endpoint
- Falls back to placeholder with zero weights

---

### 3. Toxicity Detection
**Endpoint:** `POST /api/ml/toxicity`

**Purpose:** Multi-dimensional toxicity analysis using Detoxify.

**Request:**
```json
{
  "text": "Your text to analyze for toxicity"
}
```

**Response:**
```json
{
  "toxicity": 0.08,
  "severe_toxicity": 0.005,
  "obscene": 0.02,
  "threat": 0.01,
  "insult": 0.04,
  "identity_attack": 0.015,
  "sexual_explicit": 0.003,
  "overall_toxic": false,
  "risk_level": "low",
  "metadata": {...}
}
```

**Integration:**
- Uses Python service `/detect-toxicity` endpoint
- **Note:** Python Detoxify model loading issue has been fixed
- Falls back to safe defaults (all zeros) if service unavailable

---

### 4. Topic Modeling
**Endpoint:** `POST /api/ml/topics`

**Purpose:** BERTopic-based topic extraction and clustering.

**Request:**
```json
{
  "text": "Long text about climate change and renewable energy...",
  "num_topics": 5,
  "method": "bertopic"
}
```

**Response:**
```json
{
  "topics": [
    {
      "id": 0,
      "label": "climate_change",
      "probability": 0.68,
      "terms": ["climate", "change", "warming", "global"],
      "coherence": 0.75
    }
  ],
  "num_topics_found": 2,
  "outliers": 0.05,
  "metadata": {...}
}
```

**Integration:**
- Uses Python service `/topic-modeling` endpoint
- Falls back to empty topics array

---

### 5. Fairness Metrics
**Endpoint:** `POST /api/ml/fairness`

**Purpose:** Fairlearn-based bias and fairness analysis.

**Request:**
```json
{
  "predictions": [0, 1, 1, 0, 1],
  "true_labels": [0, 1, 0, 0, 1],
  "sensitive_features": ["group_a", "group_b", "group_a", "group_b", "group_a"],
  "feature_names": ["gender"]
}
```

**Response:**
```json
{
  "demographicParity": 0.92,
  "demographicParityDifference": 0.08,
  "equalizedOdds": 0.88,
  "disparateImpact": 0.85,
  "biasMitigation": "recommended",
  "fairnessViolations": ["demographic_parity"],
  "groupMetrics": {
    "group_a": {"selection_rate": 0.60, "accuracy": 0.85},
    "group_b": {"selection_rate": 0.68, "accuracy": 0.82}
  },
  "recommendations": ["Apply threshold optimization"],
  "metadata": {...}
}
```

**Integration:**
- Uses Python service `/analyze-fairness` endpoint
- Falls back to zero metrics with unknown status

---

### 6. Fact Checking
**Endpoint:** `POST /api/fact-check/verify`

**Purpose:** Fact verification using Tavily API with source credibility scoring.

**Request:**
```json
{
  "claim": "Sweden has achieved carbon neutrality by 2045",
  "context": "Optional context text",
  "max_sources": 5
}
```

**Response:**
```json
{
  "verificationStatus": "partially_true",
  "confidence": 0.78,
  "verdict": "Sweden has set a goal for carbon neutrality by 2045...",
  "sources": [
    {
      "url": "https://example.gov/sweden-climate",
      "title": "Sweden Climate Goals",
      "snippet": "Sweden aims to reach net zero...",
      "credibility": 0.95,
      "date": "2024-03-15"
    }
  ],
  "supportingEvidence": 3,
  "contradictingEvidence": 0,
  "timestamp": "2025-11-18T10:00:00Z",
  "metadata": {...}
}
```

**Integration:**
- Uses Tavily API directly (requires `TAVILY_API_KEY` env variable)
- Automatic credibility scoring based on domain (.gov=0.95, .edu=0.95, .org=0.85)
- Returns proper structure even when API key not configured

---

## Additional Endpoint

### Sources Search
**Endpoint:** `POST /api/fact-check/sources`

**Purpose:** Search for credible sources on a topic.

**Request:**
```json
{
  "query": "renewable energy statistics 2024",
  "num_sources": 10,
  "domain_filter": ["gov", "edu", "org"]
}
```

---

## File Structure

```
backend/
├── api/
│   ├── ml.js                    # NEW: ML endpoints (SHAP, LIME, Toxicity, Topics, Fairness)
│   ├── factcheck.js             # NEW: Fact checking endpoints (Verify, Sources)
│   └── [other existing files]
├── services/
│   └── pythonNLPClient.js       # UPDATED: Added wrapper functions
└── index.js                     # UPDATED: Registered new routes
```

---

## Environment Variables

### Optional Configuration

#### For Python ML Features:
```bash
PYTHON_NLP_SERVICE_URL=http://localhost:5001
```
- Default: `http://localhost:5001`
- All ML endpoints work with fallbacks if not configured

#### For Fact Checking:
```bash
TAVILY_API_KEY=your_tavily_api_key_here
```
- Required for actual fact checking
- Endpoints return proper structure even without key
- Get key from: https://tavily.com

---

## Health Check

Updated `/api/health` endpoint now includes:

```json
{
  "status": "ok",
  "services": {
    "ml-endpoints": {
      "status": "up",
      "description": "ML API Endpoints (SHAP, LIME, Toxicity, Topics, Fairness)",
      "endpoints": [
        "/api/ml/shap",
        "/api/ml/lime",
        "/api/ml/toxicity",
        "/api/ml/topics",
        "/api/ml/fairness"
      ]
    },
    "fact-check": {
      "status": "up" | "configured",
      "description": "Fact Checking Service (Tavily)",
      "endpoints": [
        "/api/fact-check/verify",
        "/api/fact-check/sources"
      ],
      "configured": true | false
    }
  }
}
```

---

## Testing

### Start Backend:
```bash
cd backend
npm install
npm start
```

### Test Endpoints:

#### SHAP:
```bash
curl -X POST http://localhost:3001/api/ml/shap \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a wonderful day!", "model": "sentiment"}'
```

#### Toxicity:
```bash
curl -X POST http://localhost:3001/api/ml/toxicity \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text here"}'
```

#### Topics:
```bash
curl -X POST http://localhost:3001/api/ml/topics \
  -H "Content-Type: application/json" \
  -d '{"text": "Climate change and renewable energy are important topics.", "num_topics": 5}'
```

#### Fairness:
```bash
curl -X POST http://localhost:3001/api/ml/fairness \
  -H "Content-Type: application/json" \
  -d '{"predictions": [1,0,1], "true_labels": [1,1,0], "sensitive_features": ["A","B","A"]}'
```

#### Fact Check:
```bash
curl -X POST http://localhost:3001/api/fact-check/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "Sweden aims for carbon neutrality by 2045"}'
```

#### Health Check:
```bash
curl http://localhost:3001/api/health
```

---

## Integration with Frontend

The ChatV2 frontend panels can now fetch data from these endpoints:

```javascript
// Example: Fetch toxicity for a text
const response = await fetch('http://localhost:3001/api/ml/toxicity', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: userText })
});
const toxicityData = await response.json();
```

All endpoints return proper JSON structures even when:
- Python ML service is unavailable (uses fallbacks)
- Tavily API key is not configured (returns unverified status)
- Errors occur (returns error structure, never crashes)

---

## Error Handling

All endpoints follow this pattern:
1. **Validate input** - Return 400 if required fields missing
2. **Try Python/external service** - Attempt to get real ML analysis
3. **Graceful fallback** - Return safe/placeholder data if service unavailable
4. **Structured errors** - Return 500 with error message if unexpected error

---

## Status Indicators

All responses include metadata indicating data source:

```json
{
  "metadata": {
    "model": "SHAP",
    "version": "0.44.0",
    "note": "Using Python ML service" | "Python service unavailable - placeholder"
  }
}
```

Frontend can check this to show appropriate UI indicators.

---

## Future Enhancements

### Auto-integration with /api/query:
Consider adding these ML analyses automatically to query responses:

```javascript
// In query_dispatcher.js
const mlData = await Promise.allSettled([
  mlService.analyzeToxicity(responseText),
  mlService.extractTopics(responseText),
  // etc.
]);

response.toxicity = mlData[0].value;
response.topics = mlData[1].value;
```

This would populate ChatV2 panels automatically without frontend needing separate API calls.

---

## Support

For issues or questions:
- Backend implementation: `backend/api/ml.js`, `backend/api/factcheck.js`
- Python integration: `backend/services/pythonNLPClient.js`
- Frontend schemas: `frontend/src/schemas/chatv2/*.json`
- Example responses: `frontend/src/fixtures/api_responses/chatv2/*.json`
