# ChatV2 API Integration Documentation

This document describes the API integration for the ChatV2 enhanced features and ML pipeline visualizations.

## Overview

The ChatV2 page now includes comprehensive visualization panels for ML pipeline outputs including:
- SHAP/LIME explainability analysis
- Detoxify toxicity detection (6 dimensions)
- BERTopic topic modeling
- Fairlearn bias and fairness metrics
- Tavily fact checking

All panels are designed to consume data from the API and include fallback/placeholder UI when data is not available.

## API Response Structure

### Expected Response Format

The `/api/query` endpoint should return a response with the following enhanced structure:

```json
{
  "queryId": "q_abc123",
  "responses": [
    {
      "agent": "gpt-3.5-turbo",
      "response": "...",
      "metadata": {
        "model": "gpt-3.5-turbo-0125",
        "version": "0125",
        "responseTimeMs": 1234,
        "tokenCount": 156,
        "confidence": 0.85,
        "language": {
          "detected": "sv",
          "confidence": 0.99
        }
      },
      "analysis": { ... },
      "pipelineAnalysis": {
        "timeline": [ ... ],
        "preprocessing": { ... },
        "sentimentAnalysis": { ... },
        "ideologicalClassification": { ... }
      }
    }
  ],
  "synthesizedSummary": "BERT summary text...",
  "modelSynthesis": {
    "consensusIndex": 0.78,
    "divergenceMeasure": 0.22,
    "weightedSentiment": { ... },
    "ideologicalLeaning": { ... }
  },
  "explainability": {
    "shap": {
      "shapValues": [0.15, -0.08, 0.22, ...],
      "tokens": ["word1", "word2", ...],
      "baseValue": 0.0,
      "topFeatures": [
        {"token": "wonderful", "contribution": 0.22, "direction": "positive"}
      ]
    },
    "lime": {
      "explanation": "The model classified...",
      "weights": [
        {"word": "policy", "weight": 0.45, "class": "green"}
      ],
      "prediction": "green",
      "confidence": 0.88
    }
  },
  "toxicity": {
    "toxicity": 0.08,
    "severe_toxicity": 0.005,
    "obscene": 0.02,
    "threat": 0.01,
    "insult": 0.04,
    "identity_attack": 0.015,
    "sexual_explicit": 0.003,
    "overall_toxic": false,
    "risk_level": "low"
  },
  "topics": {
    "topics": [
      {
        "id": 0,
        "label": "climate_change",
        "probability": 0.68,
        "terms": ["climate", "change", "warming"],
        "coherence": 0.75
      }
    ],
    "num_topics_found": 2,
    "outliers": 0.05
  },
  "fairness": {
    "demographicParity": 0.92,
    "demographicParityDifference": 0.08,
    "equalizedOdds": 0.88,
    "disparateImpact": 0.85,
    "biasMitigation": "recommended",
    "fairnessViolations": ["demographic_parity"],
    "recommendations": ["Apply threshold optimization"]
  },
  "factCheck": {
    "verificationStatus": "partially_true",
    "confidence": 0.78,
    "verdict": "Sweden has set a goal...",
    "sources": [
      {
        "url": "https://example.com/source",
        "title": "Source Title",
        "snippet": "Brief excerpt...",
        "credibility": 0.95,
        "date": "2024-03-15"
      }
    ],
    "supportingEvidence": 3,
    "contradictingEvidence": 0
  }
}
```

## Backend Endpoints to Implement

### Priority 1: Core ML Pipeline Endpoints

#### 1. SHAP Explainability - `/ml/shap`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "text": "Text to explain",
  "model": "sentiment",
  "prediction_class": "positive"
}
```
**Response:** See `src/schemas/chatv2/shap_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/shap_example.json`

#### 2. LIME Interpretability - `/ml/lime`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "text": "Text to explain",
  "model": "ideology",
  "num_features": 10,
  "num_samples": 5000
}
```
**Response:** See `src/schemas/chatv2/lime_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/lime_example.json`

#### 3. Toxicity Detection - `/ml/toxicity`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "text": "Text to analyze for toxicity"
}
```
**Response:** See `src/schemas/chatv2/detoxify_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/detoxify_example.json`

**Note:** Detoxify model needs to return all 6 dimensions:
- toxicity
- severe_toxicity
- obscene
- threat
- insult
- identity_attack

#### 4. Topic Modeling - `/ml/topics`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "text": "Long text about climate change...",
  "num_topics": 5,
  "method": "bertopic"
}
```
**Response:** See `src/schemas/chatv2/bertopic_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/bertopic_example.json`

#### 5. Fairness Metrics - `/ml/fairness`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "predictions": [0, 1, 1, 0, 1],
  "true_labels": [0, 1, 0, 0, 1],
  "sensitive_features": ["group_a", "group_b", ...],
  "feature_names": ["gender"]
}
```
**Response:** See `src/schemas/chatv2/fairlearn_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/fairlearn_example.json`

### Priority 2: Fact Checking

#### 6. Fact Verification - `/fact-check/verify`
**Method:** POST  
**Status:** TODO  
**Request:**
```json
{
  "claim": "Sweden has achieved carbon neutrality by 2045",
  "context": "Optional context text",
  "max_sources": 5
}
```
**Response:** See `src/schemas/chatv2/tavily_schema.json`  
**Fixture:** See `src/fixtures/api_responses/chatv2/tavily_example.json`

**Note:** Requires Tavily API integration

### Priority 3: Already Documented (Partial Implementation)

These endpoints are already documented in ApiDocumentationPage but may need status updates:

- `/ml/preprocessing` (spaCy) - Status: Ready
- `/ml/sentiment` (TextBlob) - Status: Ready
- `/ml/language` (langdetect) - Status: Ready
- `/ml/ideology` (Swedish BERT) - Status: Ready
- `/ml/eda` (Sweetviz) - Status: Partial
- `/ml/viz` (Lux) - Status: Partial

## Integration Points in ChatV2

### 1. Explainability Panel
**Location:** `ChatV2Page.jsx` line ~545  
**Condition:** `latestAiMessage.explainability` exists  
**Data Source:** Should come from main API response  
**TODO Marker:** Line ~577

### 2. Toxicity Analysis Panel
**Location:** `ChatV2Page.jsx` line ~590  
**Condition:** `latestAiMessage.toxicity` exists  
**Data Source:** Should come from main API response  
**TODO Marker:** Line ~599

### 3. Topic Modeling Panel
**Location:** `ChatV2Page.jsx` line ~665  
**Condition:** `latestAiMessage.topics` exists  
**Data Source:** Should come from main API response  
**TODO Marker:** Line ~674

### 4. Bias & Fairness Panel
**Location:** `ChatV2Page.jsx` line ~706  
**Condition:** `latestAiMessage.fairness` exists  
**Data Source:** Should come from main API response  
**TODO Marker:** Line ~715

### 5. Fact Checking Panel
**Location:** `ChatV2Page.jsx` line ~790  
**Condition:** `latestAiMessage.factCheck` exists  
**Data Source:** Should come from main API response  
**TODO Marker:** Line ~799

## Testing

### Manual Testing with Mock Data

You can test the UI panels by modifying the API response in the browser console:

```javascript
// In browser console after making a query
const mockData = {
  explainability: { /* use fixture data */ },
  toxicity: { /* use fixture data */ },
  topics: { /* use fixture data */ },
  fairness: { /* use fixture data */ },
  factCheck: { /* use fixture data */ }
};

// Panels will show when data is present in API response
```

### Using Fixtures

All fixture files are located in `src/fixtures/api_responses/chatv2/`:
- `shap_example.json`
- `lime_example.json`
- `detoxify_example.json`
- `bertopic_example.json`
- `fairlearn_example.json`
- `tavily_example.json`

These can be used for:
- Backend development reference
- Integration testing
- Mock API responses during development

## Development Workflow

### For Backend Team

1. Review the JSON schemas in `src/schemas/chatv2/`
2. Implement the endpoint according to the schema
3. Test with the example fixtures
4. Update endpoint status in `ApiDocumentationPage.jsx` from "Partial" to "Ready"
5. Update this documentation with any deviations from the schema

### For Frontend Team

1. Panels are already implemented with fallback UI
2. When backend is ready, verify data mapping
3. Adjust field names if backend uses different naming
4. Add any additional error handling as needed

## Notes

- All panels include graceful fallbacks when data is missing
- TODO markers are placed in code for easy searching: `// TODO: Backend`
- Status badges in API documentation use: "Ready", "Partial", "Planned"
- All visualizations follow the existing OneSeek.AI grayscale design system

## Questions?

Contact the frontend team or backend team leads for clarification on:
- Schema requirements
- API integration details
- UI/UX design decisions
