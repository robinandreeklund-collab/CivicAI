# Firebase Data Structure Examples

This document provides comprehensive examples of Firebase data structures used in the ChatV2 Pipeline View and Detailed Model Responses views.

## Overview

The ChatV2 application displays data from the `ai_interactions` collection in Firebase Firestore. Each document contains:
- **Basic metadata**: Question, timestamps, status
- **Raw responses**: Complete AI model responses with metadata
- **Processed data**: ML pipeline analysis results
- **Metrics**: Quality, consensus, and performance metrics
- **Ledger integration**: Blockchain verification references

## Complete Document Example

### Full `ai_interactions` Document

```json
{
  "id": "abc123def456",
  "question": "Vad är Sveriges klimatpolitik?",
  "question_hash": "sha256:1a2b3c4d...",
  "created_at": "2025-11-20T09:00:00.000Z",
  "status": "ledger_verified",
  "pipeline_version": "1.0.0",
  "user_id": "anonymous",
  "session_id": "session-123",
  
  "raw_responses": [
    {
      "service": "gpt-3.5",
      "agent": "gpt-3.5",
      "model_version": "gpt-3.5-turbo-0125",
      "response_text": "Sveriges klimatpolitik är en av världens mest ambitiösa. Målet är nettonollutsläpp av växthusgaser till år 2045, vilket innebär att Sverige ska vara klimatneutralt. Politiken omfattar energieffektivisering, utbyggnad av förnybar energi, elektrifiering av transporter och investeringar i klimatsmarta lösningar. Koldioxidskatt infördes redan 1991 och Sverige har en av världens högsta skatter på fossila bränslen.",
      "metadata": {
        "timestamp": "2025-11-20T09:00:05.000Z",
        "responseTimeMs": 1234,
        "tokenCount": 150,
        "characterCount": 498,
        "confidence": 0.85,
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "request_id": "req_abc123",
        "language": {
          "detected": "sv",
          "confidence": 0.99
        }
      },
      "analysis": {
        "tone": {
          "primary": "informative",
          "description": "neutral-informative",
          "confidence": 0.9
        },
        "bias": {
          "detected": false,
          "biasScore": 0.15
        }
      },
      "enhancedAnalysis": {
        "emotion": {
          "primary": "neutral"
        },
        "intent": {
          "primary": "inform"
        },
        "factOpinion": {
          "summary": {
            "factPercentage": 85
          }
        },
        "argumentation": {
          "huvudpunkter": [
            "Sverige har mål om nettonollutsläpp till 2045",
            "Politiken omfattar energieffektivisering och förnybar energi",
            "Koldioxidskatt infördes 1991"
          ]
        },
        "entities": {
          "entities": [
            { "text": "Sverige", "label": "GPE", "type": "LOCATION" },
            { "text": "2045", "label": "DATE", "type": "DATE" },
            { "text": "1991", "label": "DATE", "type": "DATE" }
          ]
        }
      },
      "pipelineAnalysis": {
        "preprocessing": {
          "tokenization": {
            "wordCount": 78,
            "sentenceCount": 5
          },
          "word_count": 78,
          "sentence_count": 5,
          "subjectivityAnalysis": {
            "subjectivityScore": 0.25
          },
          "subjectivity": 0.25
        },
        "sentimentAnalysis": {
          "overallTone": "neutral",
          "vaderSentiment": {
            "score": 0.2,
            "classification": "neutral",
            "positive": 0.6,
            "neutral": 0.35,
            "negative": 0.05,
            "comparative": 0.15
          },
          "score": 0.2,
          "intensity": 0.15
        },
        "ideologicalClassification": {
          "ideology": {
            "classification": "center",
            "confidence": 0.75,
            "markers": ["klimatpolitik", "nettonollutsläpp", "koldioxidskatt"]
          },
          "primary": "center",
          "confidence": 0.75,
          "indicators": ["miljöfokus", "progressiv"]
        },
        "biasAnalysis": {
          "detoxify": {
            "toxicity": 0.02,
            "severe_toxicity": 0.001,
            "obscene": 0.01,
            "threat": 0.0,
            "insult": 0.005,
            "identity_attack": 0.0,
            "overall_toxic": false,
            "risk_level": "low"
          }
        },
        "timeline": [
          {
            "step": "spacy_preprocessing",
            "model": "sv_core_news_sm",
            "version": "3.7.2",
            "method": "spaCy NLP",
            "startTime": "2025-11-20T09:00:05.100Z",
            "endTime": "2025-11-20T09:00:05.334Z",
            "durationMs": 234,
            "usingPython": true,
            "fallback": false
          },
          {
            "step": "textblob_sentiment",
            "model": "TextBlob",
            "version": "0.17.1",
            "method": "TextBlob polarity",
            "durationMs": 123,
            "usingPython": true
          },
          {
            "step": "detoxify_toxicity",
            "model": "detoxify",
            "version": "0.5.2",
            "method": "Detoxify ML",
            "durationMs": 156,
            "usingPython": true
          },
          {
            "step": "swedish_bert_ideology",
            "model": "KB/bert-base-swedish-cased",
            "version": "4.36.2",
            "method": "BERT classification",
            "durationMs": 345,
            "usingPython": true
          }
        ],
        "pythonMLStats": {
          "pythonSteps": 4,
          "javascriptSteps": 0,
          "totalSteps": 4,
          "toolsUsed": ["spaCy", "TextBlob", "Detoxify", "Swedish-BERT"]
        },
        "metadata": {
          "totalProcessingTimeMs": 858
        }
      }
    },
    {
      "service": "gemini",
      "agent": "gemini",
      "model_version": "gemini-1.5-flash",
      "response_text": "Klimatpolitiken i Sverige är långtgående och inkluderar starka åtaganden för att minska utsläppen. Landet har som mål att uppnå nettonollutsläpp senast 2045. Viktiga delar inkluderar fossilfri elproduktion, utsläppsminskningar inom transportsektorn och skogliga klimatåtgärder. Sverige är också känt för sin höga koldioxidskatt som uppmuntrar till minskade utsläpp.",
      "metadata": {
        "timestamp": "2025-11-20T09:00:06.000Z",
        "responseTimeMs": 1456,
        "tokenCount": 165,
        "endpoint": "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        "request_id": "req_xyz789",
        "confidence": 0.88
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
        { "text": "klimatpolitik", "type": "TOPIC" },
        { "text": "2045", "type": "DATE" }
      ]
    },
    "sentimentAnalysis": {
      "overallTone": "neutral",
      "vaderSentiment": {
        "score": 0.2,
        "classification": "neutral",
        "positive": 0.6,
        "neutral": 0.35,
        "negative": 0.05
      }
    },
    "biasAnalysis": {
      "detoxify": {
        "toxicity": 0.02,
        "severe_toxicity": 0.001,
        "obscene": 0.01,
        "threat": 0.0,
        "insult": 0.005,
        "identity_attack": 0.0
      },
      "overall_score": 0.15,
      "categories": {
        "political": 0.1,
        "commercial": 0.05,
        "cultural": 0.0
      }
    },
    "ideologicalClassification": {
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
    "explainability": {
      "shap": {
        "base_sentiment": 0.5,
        "feature_importance": [
          { "word": "klimat", "importance": 0.15, "impact": "positive" },
          { "word": "politik", "importance": 0.12, "impact": "neutral" },
          { "word": "ambitiös", "importance": 0.10, "impact": "positive" },
          { "word": "nettonollutsläpp", "importance": 0.08, "impact": "neutral" }
        ]
      },
      "lime": {
        "prediction": {
          "predicted_class": "positive",
          "sentiment_polarity": 0.2
        },
        "explanation": [
          {
            "sentence": "Sveriges klimatpolitik är en av världens mest ambitiösa.",
            "sentiment_polarity": 0.4,
            "contribution_to_overall": 0.15
          },
          {
            "sentence": "Målet är nettonollutsläpp av växthusgaser till år 2045.",
            "sentiment_polarity": 0.1,
            "contribution_to_overall": 0.05
          }
        ]
      }
    },
    "fairnessAnalysis": {
      "demographicParity": 0.95,
      "equalizedOdds": 0.92,
      "disparateImpact": 1.02,
      "fairnessViolations": [],
      "recommendations": []
    },
    "timeline": [
      {
        "step": "spacy_preprocessing",
        "durationMs": 234,
        "model": "sv_core_news_sm"
      }
    ]
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
    },
    "total": 858
  },
  
  "pipeline_metadata": {
    "start_time": "2025-11-20T09:00:05.000Z",
    "end_time": "2025-11-20T09:01:03.000Z",
    "totalProcessingTimeMs": 58000,
    "total_duration_ms": 58000,
    "status": "completed",
    "pipeline_version": "1.0.0",
    "status_log": [
      {
        "status": "received",
        "timestamp": "2025-11-20T09:00:00.000Z",
        "message": "Question received and stored"
      },
      {
        "status": "processing",
        "timestamp": "2025-11-20T09:00:05.000Z",
        "message": "Starting ML pipeline processing"
      },
      {
        "status": "responses_saved",
        "timestamp": "2025-11-20T09:00:30.000Z",
        "message": "Saved 2 raw AI responses"
      },
      {
        "status": "pipeline_complete",
        "timestamp": "2025-11-20T09:01:00.000Z",
        "message": "ML pipeline analysis completed"
      },
      {
        "status": "completed",
        "timestamp": "2025-11-20T09:01:03.000Z",
        "message": "Analysis complete"
      }
    ]
  },
  
  "analysis": {
    "modelSynthesis": {
      "consensusIndex": 0.86,
      "divergenceMeasure": 0.14,
      "weightedSentiment": {
        "classification": "neutral",
        "positive": 0.6,
        "neutral": 0.35,
        "negative": 0.05
      },
      "ideologicalLeaning": {
        "dominant": "center",
        "confidence": 0.75
      },
      "dominantThemes": [
        { "topic": "climate_policy", "percentage": 92 },
        { "topic": "carbon_neutrality", "percentage": 78 }
      ],
      "consensus": {
        "overallConsensus": 86,
        "areas": [
          {
            "area": "climate_goals",
            "dominant": "net-zero by 2045",
            "consensus": 95
          },
          {
            "area": "policy_approach",
            "dominant": "carbon tax",
            "consensus": 80
          }
        ]
      },
      "insights": {
        "commonTopics": [
          { "topic": "net-zero emissions" },
          { "topic": "renewable energy" },
          { "topic": "carbon tax" }
        ]
      },
      "divergences": {
        "divergences": []
      },
      "contradictions": {
        "contradictions": []
      }
    },
    "factCheckComparison": {
      "claims": [
        {
          "text": "Sverige har mål om nettonollutsläpp till 2045",
          "sources": [
            {
              "url": "https://www.government.se/...",
              "title": "Swedish Climate Policy"
            }
          ]
        }
      ]
    }
  },
  
  "synthesized_summary": "Sveriges klimatpolitik siktar mot nettonollutsläpp 2045 genom energieffektivisering, förnybar energi och koldioxidskatt.",
  "synthesized_summary_metadata": {
    "model": "BERT",
    "timestamp": "2025-11-20T09:01:00.000Z",
    "factCheck": "Alla huvudpåståenden verifierade mot officiella källor."
  },
  
  "quality_metrics": {
    "confidence": 0.86,
    "consensus": {
      "overallConsensus": 86
    },
    "severity": "low",
    "completeness": 1.0
  },
  
  "ledger_blocks": ["0", "1234", "1235", "1236"],
  
  "errors": [],
  
  "completed_at": "2025-11-20T09:01:03.000Z",
  "verified_at": "2025-11-20T09:01:05.000Z",
  "updated_at": "2025-11-20T09:01:05.000Z"
}
```

## Pipeline View Data Mapping

### How Data is Displayed in Pipeline View

```javascript
// Preprocessing Section
response.pipelineAnalysis.preprocessing
  ├── tokenization.wordCount         → "Ord: 78"
  ├── tokenization.sentenceCount     → "Meningar: 5"
  └── subjectivityAnalysis.subjectivityScore → "Subjektivitet: 0.25"

// Sentiment Section
response.pipelineAnalysis.sentimentAnalysis
  ├── overallTone                    → "Övergripande: neutral"
  ├── vaderSentiment.score          → "Poäng: 0.20"
  └── vaderSentiment.comparative    → "Intensitet: 0.15"

// Ideology Section
response.pipelineAnalysis.ideologicalClassification
  ├── ideology.classification       → "Primär: center"
  ├── ideology.confidence          → "Säkerhet: 75%"
  └── ideology.markers.length      → "Indikatorer: 3 st"

// Timeline Section
response.pipelineAnalysis.timeline[]
  ├── step                          → "spacy_preprocessing"
  ├── model                         → "sv_core_news_sm"
  ├── version                       → "3.7.2"
  ├── durationMs                    → "234ms"
  └── usingPython                   → "🐍 Python ML"

// Metadata Section
response.pipelineAnalysis.metadata
  └── totalProcessingTimeMs         → "Total tid: 858ms"

latestAiMessage.pipelineMetadata
  ├── status                        → Status badge color
  ├── pipeline_version              → "Pipeline Version: 1.0.0"
  └── totalProcessingTimeMs         → "Total Processing Time: 58000ms"

// Quality Metrics
latestAiMessage.qualityMetrics
  ├── confidence                    → "Confidence: 0.86"
  ├── consensus.overallConsensus   → "Consensus: 86%"
  └── completeness                  → "Completeness: 1.0"

// Ledger Verification
latestAiMessage.ledgerBlocks[]
  └── Array of block IDs            → "Block #1234, #1235, #1236"
```

## Detailed Model Responses View Data Mapping

### Expandable Section: Raw Model Response

```javascript
// Source: raw_responses[]/response_text
response.response || response.text
// Displayed in: 📄 Raw Model Response section
// Format: Formatted text with markdown rendering
```

### Expandable Section: Comprehensive Metrics

```javascript
// Sentiment Analysis
response.pipelineAnalysis.sentimentAnalysis
  ├── overallTone              → "Overall Tone: neutral"
  ├── vaderSentiment.score     → "Polarity Score: 0.20"
  └── vaderSentiment.comparative → "Intensity: 0.15"

// Toxicity Analysis (Detoxify)
latestAiMessage.toxicity || response.pipelineAnalysis.biasAnalysis.detoxify
  ├── toxicity                 → Progress bar + "2.0%"
  ├── severe_toxicity         → Progress bar + "0.1%"
  ├── obscene                 → Progress bar + "1.0%"
  ├── threat                  → Progress bar + "0.0%"
  ├── insult                  → Progress bar + "0.5%"
  └── identity_attack         → Progress bar + "0.0%"

// Fairness Metrics
latestAiMessage.fairness
  ├── demographicParity       → "Demographic Parity: 95.0%"
  ├── equalizedOdds          → "Equalized Odds: 92.0%"
  └── disparateImpact        → "Disparate Impact: 1.02"

// Consensus Metrics
latestAiMessage.modelSynthesis
  ├── consensusIndex         → "Consensus Index: 86%"
  └── divergenceMeasure      → "Divergence: 14%"

// Explainability (SHAP)
latestAiMessage.explainability.shap
  └── feature_importance[]
      ├── word               → Feature name
      ├── importance         → "+0.150" or "-0.050"
      └── impact             → Color coding (green/red)
```

### Expandable Section: Processed Analysis Details

```javascript
// Emotion/Tone/Intent
response.enhancedAnalysis.emotion.primary    → "Emotion: neutral"
response.analysis.tone.description           → "Ton: neutral-informative"
response.enhancedAnalysis.intent.primary     → "Syfte: inform"

// Main Points
response.enhancedAnalysis.argumentation.huvudpunkter[]
  → Numbered list of main points

// Entities
response.enhancedAnalysis.entities.entities[]
  ├── text                   → "Sverige"
  └── label                  → "(GPE)"
```

### Expandable Section: Processing Time Breakdown

```javascript
response.pipelineAnalysis.timeline[]
  ├── step                   → "spacy_preprocessing"
  ├── model                  → "sv_core_news_sm"
  └── durationMs             → "234ms"

// Total
response.pipelineAnalysis.metadata.totalProcessingTimeMs
  → "Total Processing Time: 858ms"
```

### Provenance Information (Always Visible)

```javascript
response.metadata
  ├── endpoint               → Truncated URL with tooltip
  ├── request_id             → Monospace font
  └── timestamp              → Formatted as "YYYY-MM-DD HH:mm:ss"
```

### Ledger Status (Always Visible)

```javascript
latestAiMessage.ledgerBlocks.length > 0
  → "🔒 Ledger Verified • X blocks"
```

## Notes

- All data is sourced directly from Firebase Firestore
- No placeholder or hardcoded values are used
- Missing fields display "N/A" instead of errors
- Real-time updates via `useFirestoreDocument` hook
- JSON fields are parsed automatically (some fields stored as stringified JSON in Firestore)
- Timestamps are converted to locale-specific formats using JavaScript Date API
