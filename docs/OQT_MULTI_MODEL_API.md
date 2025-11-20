# OQT-1.0 Multi-Model Integration API Documentation

## Overview

OQT-1.0 Multi-Model Integration extends the Open Quality Transformer with multi-model analysis capabilities using Mistral 7B and LLaMA-2 as foundational models. This implementation provides:

- **Multi-model response generation** (Mistral 7B + LLaMA-2)
- **Consensus analysis** between model outputs
- **Cross-model bias detection**
- **Fairness index calculation**
- **Meta-summary generation**
- **Two-step real-time microtraining**

## Architecture

```
User Query
    ↓
OQT Multi-Model Pipeline
    ├─→ Mistral 7B (Fast, analytical)
    ├─→ LLaMA-2 7B (Deep, comprehensive)
    └─→ [Optional: GPT-3.5, Gemini, Grok]
    ↓
Analysis Pipeline (per response)
    ├─→ Preprocessing (tokenization, POS)
    ├─→ Bias Detection
    ├─→ Sentiment Analysis
    ├─→ Ideology Classification
    ├─→ Tone Analysis
    └─→ Fairness Assessment
    ↓
Cross-Model Analysis
    ├─→ Consensus Calculation
    ├─→ Bias Aggregation
    ├─→ Fairness Index
    └─→ Meta-Summary
    ↓
OQT Synthesis
    ├─→ Response Selection/Generation
    └─→ Confidence Calculation
    ↓
Two-Step Microtraining
    ├─→ Stage 1: Train on raw responses
    └─→ Stage 2: Train on analyzed data
    ↓
Return Synthesized Response + Analysis
```

## API Endpoints

### 1. Multi-Model Query

**Endpoint:** `POST /api/oqt/multi-model-query`

**Description:** Process a query through multiple AI models with full analysis and real-time microtraining.

**Request Body:**
```json
{
  "question": "Hur påverkar AI samhället?",
  "includeExternal": false,
  "enableTraining": true
}
```

**Parameters:**
- `question` (string, required): The user's question
- `includeExternal` (boolean, optional, default: false): Include external models (GPT, Gemini, Grok)
- `enableTraining` (boolean, optional, default: true): Perform real-time microtraining

**Response:**
```json
{
  "success": true,
  "queryId": "uuid",
  "model": "OQT-1.0",
  "version": "1.2.0",
  
  "response": "OQT-1.0 Syntetiserat Svar...",
  "confidence": 0.92,
  
  "analysis": {
    "consensus": {
      "score": 0.95,
      "level": "high",
      "metrics": {
        "sentimentAgreement": 1.0,
        "toneAgreement": 0.5,
        "biasVariance": 0
      }
    },
    "bias": {
      "aggregatedScore": 0,
      "level": "low",
      "types": []
    },
    "fairness": {
      "score": 0.88,
      "level": "excellent"
    },
    "metaSummary": {
      "totalModels": 2,
      "consensusLevel": "high",
      "consensusScore": 0.95,
      "biasLevel": "low",
      "avgBiasScore": 0,
      "fairnessLevel": "excellent",
      "fairnessScore": 0.88,
      "keyThemes": ["artificiell", "intelligens", "system", ...],
      "recommendation": "Svaren visar hög konsensus..."
    }
  },
  
  "modelResponses": [
    {
      "model": "Mistral 7B",
      "responsePreview": "...",
      "metadata": {
        "temperature": 0.7,
        "latency_ms": 100,
        "tokens": 150
      }
    },
    {
      "model": "LLaMA-2 7B",
      "responsePreview": "...",
      "metadata": {
        "temperature": 0.7,
        "latency_ms": 150,
        "tokens": 200
      }
    }
  ],
  
  "training": {
    "stage1": {
      "method": "raw_response_training",
      "samplesProcessed": 2,
      "updated": true
    },
    "stage2": {
      "method": "analyzed_data_training",
      "metricsUpdated": true,
      "consensus": 0.848,
      "bias": 0.081,
      "fairness": 0.949
    },
    "microBatchCount": 42
  },
  
  "metadata": {
    "totalModels": 2,
    "processingTime_ms": 1250,
    "pipelineVersion": "2.0"
  },
  
  "timestamp": "2025-11-20T16:16:40.395Z"
}
```

### 2. Model Status

**Endpoint:** `GET /api/oqt/status`

**Description:** Get OQT-1.0 model status and health.

**Response:**
```json
{
  "success": true,
  "status": "up",
  "model": {
    "name": "OQT-1.0",
    "version": "1.2.0",
    "status": "active",
    "lastTraining": "2025-11-20T16:16:36.066Z",
    "architecture": "Transformer",
    "trainingMethod": "Supervised + RLHF"
  },
  "health": {
    "operational": true,
    "responseTime_ms": 5,
    "uptime": 5.007804086
  },
  "timestamp": "2025-11-20T16:16:40.395Z"
}
```

### 3. Model Metrics

**Endpoint:** `GET /api/oqt/metrics`

**Description:** Get OQT-1.0 performance metrics.

**Response:**
```json
{
  "success": true,
  "version": "1.2.0",
  "metrics": {
    "accuracy": 0.905,
    "fairness": 0.948,
    "bias": 0.082,
    "consensus": 0.847,
    "fairnessMetrics": {
      "demographicParity": 0.978,
      "equalOpportunity": 0.965,
      "disparateImpact": 0.982
    }
  },
  "training": {
    "totalSamples": 22000,
    "weeklyBatches": 0,
    "microBatches": 42,
    "lastTraining": "2025-11-20T16:16:36.066Z"
  },
  "timestamp": "2025-11-20T16:16:40.395Z"
}
```

## Analysis Metrics

### Consensus Score

**Range:** 0.0 - 1.0

**Calculation:**
```
consensus = (
  sentimentAgreement * 0.4 +
  toneAgreement * 0.3 +
  (1 - min(biasVariance / 10, 1)) * 0.3
)
```

**Levels:**
- **High:** ≥ 0.8 - Models strongly agree
- **Medium:** 0.6 - 0.79 - Moderate agreement
- **Low:** < 0.6 - Significant divergence

### Bias Score

**Range:** 0 - 10

**Calculation:** Average bias score across all model responses

**Levels:**
- **Low:** < 3 - Minimal bias detected
- **Medium:** 3 - 5.99 - Moderate bias
- **High:** ≥ 6 - Significant bias

### Fairness Index

**Range:** 0.0 - 1.0

**Calculation:** Based on consistency metrics across analytical perspectives

**Levels:**
- **Excellent:** ≥ 0.8
- **Good:** 0.7 - 0.79
- **Fair:** 0.6 - 0.69
- **Poor:** < 0.6

## Two-Step Microtraining

### Stage 1: Raw Response Training
- Processes raw AI model responses
- Updates knowledge base with consensus response
- Samples: Number of model responses

### Stage 2: Analyzed Data Training
- Processes pipeline-analyzed data
- Updates OQT metrics (consensus, bias, fairness)
- Uses exponential moving average: `new = old * 0.9 + analyzed * 0.1`

## Model Information

### Mistral 7B
- **Parameters:** 7 billion
- **Context Length:** 8,192 tokens
- **Strengths:** Fast inference, good reasoning, efficient
- **Use Case:** Quick analytical responses

### LLaMA-2 7B/13B
- **Parameters:** 7B or 13B
- **Context Length:** 4,096 tokens
- **Strengths:** Deep reasoning, nuanced analysis, comprehensive
- **Use Case:** Detailed, thoughtful responses

## Frontend Integration

### OQT Dashboard Query Interface

The OQT Dashboard (`/oqt-dashboard`) provides a query interface on the "Fråga OQT" tab:

**Features:**
1. **Query Input:** Text field for user questions
2. **Synthesized Response:** OQT-1.0 generated answer with confidence score
3. **Analysis Metrics:** Consensus, Bias, Fairness displayed in cards
4. **Model Responses:** Preview of responses from each model
5. **Training Info:** Display of two-step microtraining results
6. **Meta Summary:** Recommendations and key themes

## Usage Examples

### Basic Query
```bash
curl -X POST http://localhost:3001/api/oqt/multi-model-query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Vad är demokrati?",
    "includeExternal": false,
    "enableTraining": true
  }'
```

### Query with External Models
```bash
curl -X POST http://localhost:3001/api/oqt/multi-model-query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Hur påverkar AI samhället?",
    "includeExternal": true,
    "enableTraining": true
  }'
```

### Get Model Status
```bash
curl http://localhost:3001/api/oqt/status
```

### Get Model Metrics
```bash
curl http://localhost:3001/api/oqt/metrics
```

## Error Handling

All endpoints return error responses in the format:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (missing or invalid parameters)
- `429`: Rate limit exceeded
- `500`: Internal server error

## Rate Limiting

- **Window:** 60 seconds
- **Max Requests:** 60 per window per IP
- **Response:** 429 status code when exceeded

## Future Enhancements

1. **Model Expansion:**
   - Add more specialized models (domain-specific)
   - Support for multimodal models

2. **Advanced Analysis:**
   - Topic clustering across responses
   - Argument structure analysis
   - Citation and source verification

3. **Visualization:**
   - Consensus heatmap
   - Bias radar chart
   - Community trends timeline

4. **Training:**
   - Weekly batch training automation
   - Adaptive learning rate
   - Model versioning system

## References

- [PR #55: OQT-1.0 Integration](https://github.com/robinandreeklund-collab/CivicAI/pull/55)
- [Mistral AI](https://mistral.ai/)
- [LLaMA-2](https://ai.meta.com/llama/)
- [Transformer Architecture](https://arxiv.org/abs/1706.03762)
