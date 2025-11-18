# Change Detection API Documentation

## Overview

The Change Detection API provides endpoints for tracking and analyzing changes in AI model responses over time. It integrates with the Transparency Ledger to create an immutable audit trail of all detected changes.

## Base URL

```
http://localhost:3001/api/change-detection
```

## Endpoints

### 1. Analyze Response for Changes

Analyzes a single model response to detect changes compared to previous responses for the same question.

**Endpoint:** `POST /api/change-detection/analyze`

**Request Body:**
```json
{
  "question": "Vad tycker du om klimatpolitik?",
  "model": "gpt-3.5",
  "response": "Klimatpolitik är avgörande...",
  "version": "2025.11"  // optional
}
```

**Response (Change Detected):**
```json
{
  "question": "Vad tycker du om klimatpolitik?",
  "question_hash": "sha256:6be872...",
  "model": "gpt-3.5",
  "model_version": "2025.11",
  "previous_response": {
    "text": "Klimatpolitik är viktig...",
    "timestamp": "2025-10-01T10:00:00Z",
    "sentiment": "neutral",
    "ideology": "center"
  },
  "current_response": {
    "text": "Klimatpolitik är avgörande...",
    "timestamp": "2025-11-18T12:00:00Z",
    "sentiment": "positiv",
    "ideology": "grön"
  },
  "change_metrics": {
    "text_similarity": 0.62,
    "sentiment_shift": "neutral → positiv",
    "ideology_shift": "center → grön",
    "severity_index": 0.78,
    "bias_drift": "+15% mer normativ",
    "dominant_themes": ["klimat", "ekonomi"],
    "explainability_delta": [
      "Borttagna begrepp: viktig, för",
      "Nya begrepp: avgörande, prioriteras"
    ],
    "ethical_tag": "Etiskt relevant"
  },
  "detected_at": "2025-11-18T12:00:00Z",
  "ledger_block_id": 15
}
```

**Response (No Change):**
```json
{
  "message": "No change detected or first response for this question/model",
  "change_detected": false
}
```

**Status Codes:**
- `200 OK` - Analysis completed successfully
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Analysis failed

---

### 2. Get Change History

Retrieves the history of detected changes for a specific question and optionally a specific model.

**Endpoint:** `GET /api/change-detection/history`

**Query Parameters:**
- `question` (required) - The question to get history for
- `model` (optional) - Filter by specific model
- `limit` (optional) - Maximum number of results (default: 10)

**Example Request:**
```
GET /api/change-detection/history?question=Vad%20tycker%20du%20om%20klimatpolitik?&model=gpt-3.5&limit=5
```

**Response:**
```json
{
  "history": [
    {
      "block_id": 15,
      "timestamp": "2025-11-18T12:00:00Z",
      "model": "gpt-3.5",
      "severity_index": 0.78,
      "sentiment_shift": "neutral → positiv",
      "ideology_shift": "center → grön",
      "ethical_tag": "Etiskt relevant"
    },
    {
      "block_id": 12,
      "timestamp": "2025-10-15T14:00:00Z",
      "model": "gpt-3.5",
      "severity_index": 0.45,
      "sentiment_shift": "neutral → neutral",
      "ideology_shift": "center → center",
      "ethical_tag": "Neutral"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - History retrieved successfully
- `400 Bad Request` - Missing question parameter
- `500 Internal Server Error` - Retrieval failed

---

### 3. Get Heatmap Data

Generates heatmap data for visualizing narrative shifts across multiple models and time periods.

**Endpoint:** `GET /api/change-detection/heatmap`

**Query Parameters:**
- `question` (required) - The question to generate heatmap for
- `models` (optional) - JSON array of model names or comma-separated list

**Example Request:**
```
GET /api/change-detection/heatmap?question=Vad%20tycker%20du%20om%20klimatpolitik?&models=["gpt-3.5","gemini","grok"]
```

**Response:**
```json
{
  "timePeriods": [
    "2025-10-01",
    "2025-10-15",
    "2025-11-01",
    "2025-11-17"
  ],
  "dimensions": {
    "sentiment": {
      "label": "Sentiment",
      "models": {
        "gpt-3.5": [0.0, 0.3, 0.5, 0.8],
        "gemini": [0.1, 0.4, 0.5, 0.7],
        "grok": [0.0, 0.2, 0.6, 0.9]
      }
    },
    "ideology": {
      "label": "Ideologi",
      "models": {
        "gpt-3.5": [0.1, 0.3, 0.4, 0.5],
        "gemini": [0.0, 0.3, 0.5, 0.6],
        "grok": [0.0, 0.2, 0.6, 0.9]
      }
    },
    "themes": {
      "label": "Tematiska skiften",
      "models": {
        "gpt-3.5": [0.2, 0.3, 0.5, 0.6],
        "gemini": [0.1, 0.2, 0.4, 0.8],
        "grok": [0.0, 0.4, 0.6, 0.7]
      }
    }
  }
}
```

**Note:** Values are 0-1 representing degree of change. 0 = no change, 1 = maximum change.

**Status Codes:**
- `200 OK` - Heatmap data generated successfully
- `400 Bad Request` - Missing question parameter
- `504 Gateway Timeout` - Request timeout
- `500 Internal Server Error` - Generation failed

---

### 4. Get Bias Drift Data

Retrieves bias drift data for a specific model, showing how bias metrics have changed over time.

**Endpoint:** `GET /api/change-detection/bias-drift`

**Query Parameters:**
- `question` (required) - The question to analyze
- `model` (required) - The model to analyze

**Example Request:**
```
GET /api/change-detection/bias-drift?question=Vad%20tycker%20du%20om%20klimatpolitik?&model=gpt-3.5
```

**Response:**
```json
{
  "dimensions": [
    "Positivitet",
    "Normativ",
    "Vänster",
    "Höger",
    "Grön",
    "Emotionell"
  ],
  "periods": [
    {
      "label": "2025-10-01",
      "timestamp": "2025-10-01T10:00:00Z",
      "values": [0.3, 0.2, 0.4, 0.3, 0.2, 0.2]
    },
    {
      "label": "2025-10-15",
      "timestamp": "2025-10-15T14:30:00Z",
      "values": [0.5, 0.4, 0.5, 0.3, 0.4, 0.3]
    },
    {
      "label": "2025-11-17",
      "timestamp": "2025-11-17T09:15:00Z",
      "values": [0.7, 0.6, 0.6, 0.2, 0.7, 0.5]
    }
  ]
}
```

**Note:** Values are 0-1 representing bias intensity in each dimension.

**Status Codes:**
- `200 OK` - Bias drift data retrieved successfully
- `400 Bad Request` - Missing required parameters
- `504 Gateway Timeout` - Request timeout
- `500 Internal Server Error` - Retrieval failed

---

## Integration with /api/query

The change detection is automatically integrated into the main query endpoint.

**Endpoint:** `POST /api/query`

**Request:**
```json
{
  "question": "Vad tycker du om klimatpolitik?"
}
```

**Response (includes change_detection):**
```json
{
  "question": "Vad tycker du om klimatpolitik?",
  "responses": [
    {
      "agent": "gpt-3.5",
      "response": "Klimatpolitik är avgörande...",
      "metadata": { ... },
      "analysis": { ... }
    }
  ],
  "synthesizedSummary": "...",
  "modelSynthesis": { ... },
  "change_detection": {
    "model": "gpt-3.5",
    "change_metrics": {
      "severity_index": 0.78,
      "sentiment_shift": "neutral → positiv",
      ...
    },
    "ledger_block_id": 15
  },
  "timestamp": "2025-11-18T12:00:00Z"
}
```

**Note:** The `change_detection` field will only be present if a significant change (severity >= 0.3) is detected in any of the model responses.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common errors:
- `Invalid request` - Missing or invalid parameters
- `Analysis failed` - Python script execution failed
- `Request timeout` - Processing took longer than 10 seconds
- `Internal server error` - Unexpected server error

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider:
- Max 60 requests per minute per IP
- Max 1000 requests per hour per API key

---

## Python Bridge Architecture

The API communicates with Python ML modules using:

1. **child_process.spawn()** - Spawns Python process
2. **JSON stdin/stdout** - Data exchange format
3. **10-second timeout** - Prevents hanging processes
4. **Error recovery** - Graceful degradation if Python fails

Python script modes:
- `--detect-json` - Analyze single response (stdin JSON)
- `--history-json` - Get change history
- `--heatmap-json` - Generate heatmap data
- `--bias-drift-json` - Get bias drift data

---

## ML Model Upgrades

### Current (MVP):
- Jaccard similarity for text comparison
- Keyword-based sentiment detection
- Keyword-based ideology classification

### Production (Enhanced):
- **Sentence Transformers**: `paraphrase-multilingual-MiniLM-L12-v2`
- **BERT Sentiment**: `bert-base-multilingual-uncased-sentiment`
- **SHAP/LIME**: Model explainability
- **BERTopic**: Advanced topic modeling

To enable production ML:
```bash
pip install -r ml/requirements.txt
python ml/pipelines/change_detection_enhanced.py --ml-status
```

---

## Examples

### JavaScript/Node.js

```javascript
// Analyze a response
const response = await fetch('http://localhost:3001/api/change-detection/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Vad tycker du om klimatpolitik?',
    model: 'gpt-3.5',
    response: 'Klimatpolitik är avgörande...',
    version: '2025.11'
  })
});

const data = await response.json();
console.log('Severity:', data.change_metrics?.severity_index);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:3001/api/change-detection/analyze',
    json={
        'question': 'Vad tycker du om klimatpolitik?',
        'model': 'gpt-3.5',
        'response': 'Klimatpolitik är avgörande...',
        'version': '2025.11'
    }
)

data = response.json()
print(f"Severity: {data['change_metrics']['severity_index']}")
```

### curl

```bash
# Analyze response
curl -X POST http://localhost:3001/api/change-detection/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Vad tycker du om klimatpolitik?",
    "model": "gpt-3.5",
    "response": "Klimatpolitik är avgörande...",
    "version": "2025.11"
  }'

# Get history
curl "http://localhost:3001/api/change-detection/history?question=Vad%20tycker%20du%20om%20klimatpolitik?&model=gpt-3.5"
```

---

## Security Considerations

1. **Input Validation**: All inputs are sanitized and validated
2. **Question Hashing**: Questions are hashed (SHA-256) before storage
3. **No PII**: No personally identifiable information is stored
4. **Timeout Protection**: All Python processes have 10-second timeout
5. **Error Sanitization**: Error messages don't expose internal details

---

## Monitoring

Recommended monitoring:
- Python process execution time
- Success/failure rate of change detection
- Ledger block creation rate
- API response times

Logs include:
- `🔍 Analyzing change detection for {model}...`
- `✅ Change detection complete: severity={value}`
- `ℹ️  No significant changes detected`

---

## Support

For issues or questions:
- Check logs in backend console
- Verify Python script works: `python ml/pipelines/change_detection.py --test`
- Check ML library status: `python ml/pipelines/change_detection_enhanced.py --ml-status`
- Review documentation: `docs/CHANGE_DETECTION.md`

---

**Last Updated:** 2025-11-18  
**API Version:** 1.0  
**Python Module:** change_detection.py v1.3.0
