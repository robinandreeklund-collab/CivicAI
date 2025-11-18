# CivicAI Pipeline Integration - Visual Guide

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         CivicAI Frontend                               │
│                      (React + Tailwind CSS)                            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │ AgentBubble     │  │ ModelSynthesis   │  │ PipelineAnalysis │    │
│  │ (Individual AI) │  │ (Comparison)     │  │ (Complete View)  │    │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘    │
│           │                    │                      │                │
│           └────────────────────┴──────────────────────┘                │
│                              │                                         │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │ HTTP API (JSON)
                               │
┌──────────────────────────────┼─────────────────────────────────────────┐
│                Node.js Backend (Port 3001)                             │
├──────────────────────────────┼─────────────────────────────────────────┤
│                              │                                         │
│  ┌──────────────────────────────────────────────────────────┐         │
│  │           Query Dispatcher API (/api/query)              │         │
│  └──────────────────────────┬───────────────────────────────┘         │
│                              │                                         │
│  ┌──────────────────────────┴───────────────────────────────┐         │
│  │        Analysis Pipeline Service                          │         │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │         │
│  │  │ Preprocessing│→ │ Bias         │→ │ Sentiment    │   │         │
│  │  └──────────────┘  │ Detection    │  │ Analysis     │   │         │
│  │                    └──────────────┘  └──────────────┘   │         │
│  │  ┌──────────────┐  ┌──────────────┐                     │         │
│  │  │ Ideology     │→ │ Topic        │                     │         │
│  │  │ Classifier   │  │ Modeling     │                     │         │
│  │  └──────────────┘  └──────────────┘                     │         │
│  └──────────────────────────┬───────────────────────────────┘         │
│                              │                                         │
│  ┌──────────────────────────┴───────────────────────────────┐         │
│  │        Python NLP Client (pythonNLPClient.js)             │         │
│  │                                                            │         │
│  │  Check Python Service → Use ML → Fallback to JS          │         │
│  └──────────────────────────┬───────────────────────────────┘         │
│                              │ HTTP (if available)                     │
│                              │ Fallback to JavaScript                  │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
         ┌──────────▼──────────┐   ┌─────▼──────────────┐
         │  Python NLP Service │   │  JavaScript        │
         │  (Port 5001)        │   │  Fallbacks         │
         │  Flask API          │   │  (Always work)     │
         └─────────────────────┘   └────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│ spaCy  │  │Detoxify  │  │BERTopic  │
│TextBlob│  │Transform-│  │ Gensim   │
│Polyglot│  │  ers     │  │  SHAP    │
└────────┘  └──────────┘  └──────────┘
```

## Data Flow

```
User Question
     │
     ▼
┌────────────────────────────────────────┐
│  Query Dispatcher                      │
│  ├─ Ask GPT-3.5                        │
│  ├─ Ask Gemini                         │
│  └─ Ask DeepSeek                       │
└────────────┬───────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
For Each Response   Python ML
    │               Available?
    │                 │
    ▼                 ├─ Yes → Use Python ML
┌─────────────┐      │         ├─ spaCy preprocess
│ JavaScript  │      │         ├─ TextBlob sentiment
│ Analysis    │      │         ├─ Detoxify toxicity
│ Pipeline    │      │         ├─ Polyglot language
│             │      │         └─ BERTopic topics
│ ✓ Tone      │      │
│ ✓ Bias      │      └─ No → JavaScript Fallback
│ ✓ Sentiment │              ├─ compromise.js
│ ✓ Ideology  │              ├─ sentiment library
│ ✓ Topics    │              └─ custom analyzers
│ ✓ Facts     │
└─────┬───────┘
      │
      ▼
┌──────────────────────────────┐
│  Complete Analysis Result    │
│                              │
│  ✓ Response text             │
│  ✓ Basic analysis            │
│  ✓ Enhanced analysis         │
│  ✓ Pipeline analysis         │
│  ✓ Timeline with provenance  │
│  ✓ Quality indicators        │
│  ✓ Risk flags                │
└──────────────┬───────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
   Frontend         Model Synthesis
   Display          (Compare all)
      │                 │
      ▼                 ▼
   AgentBubble      Divergences
   Component        Contradictions
                    Consensus
```

## Pipeline Configuration Structure

```
pipelineConfig.js
│
├── workflow
│   ├── input: "User question"
│   ├── steps: [preprocess, bias, sentiment, ideology, topics]
│   └── output: "Best Answer + BERT summary"
│
├── steps
│   ├── preprocess
│   │   ├── tools: [spaCy, TextBlob, Polyglot]
│   │   └── outputs: [tokens, POS, subjectivity, language]
│   │
│   ├── bias_detection
│   │   ├── tools: [BiasCheck, Detoxify]
│   │   └── outputs: [bias score, toxicity, flagged terms]
│   │
│   ├── sentiment_analysis
│   │   ├── tools: [VADER, TextBlob]
│   │   └── outputs: [polarity, subjectivity, sarcasm, empathy]
│   │
│   ├── ideology_classification
│   │   ├── tools: [Transformers, SHAP, Gensim]
│   │   └── outputs: [left/center/right, dimensions, keywords]
│   │
│   └── topic_modeling
│       ├── tools: [BERTopic, Gensim]
│       └── outputs: [topics, clusters, keyphrases]
│
└── transparency_layer
    ├── Timeline Navigator (clickable steps)
    ├── Audit Trail (logs)
    └── Export Panel (YAML/PDF/JSON/README)
```

## Tool Mapping

```
Required Tool          →  Implementation
─────────────────────────────────────────────────
spaCy                  →  Python: spaCy 3.7.2
                          Fallback: compromise.js

TextBlob               →  Python: TextBlob 0.17.1
                          Fallback: sentiment + custom

Polyglot               →  Python: Polyglot 16.7.4
                          Fallback: pattern matching

BiasCheck              →  Custom bias detector (JS)

Detoxify               →  Python: Detoxify 0.5.2
                          Fallback: custom aggression detector

VADER                  →  sentiment library (JS)

PoliticalBERT/RoBERTa  →  Python: Transformers 4.36.2
                          (placeholder, needs fine-tuning)
                          Fallback: keyword-based classifier

SHAP                   →  Python: SHAP 0.44.0
                          (ready for integration)
                          Fallback: keyword tracking

Gensim                 →  Python: Gensim 4.3.2
                          (Word2Vec, FastText, LDA)
                          Fallback: co-occurrence analysis

BERTopic               →  Python: BERTopic 0.16.0
                          Fallback: compromise.js topics
```

## API Endpoints Map

```
Frontend               Backend                    Python Service
───────────────────────────────────────────────────────────────────

AgentBubble
   │
   └─→ GET /api/query
           │
           ├─→ POST /preprocess        → spaCy tokenization
           ├─→ POST /sentiment          → TextBlob polarity
           ├─→ POST /detect-language    → Polyglot detection
           ├─→ POST /detect-toxicity    → Detoxify scores
           ├─→ POST /classify-ideology  → Transformers
           └─→ POST /topic-modeling     → BERTopic

ModelSynthesis
   │
   └─→ Uses data from /api/query
       (model comparison, divergences)

PipelineAnalysis
   │
   ├─→ GET /api/analysis-pipeline/config
   ├─→ GET /api/analysis-pipeline/steps
   └─→ GET /api/analysis-pipeline/info

Export
   │
   ├─→ POST /api/export/yaml
   ├─→ POST /api/export/json
   ├─→ POST /api/export/pdf
   └─→ POST /api/export/readme
```

## Export Data Structure

```yaml
question: "User's question"
timestamp: "2025-11-15T15:30:00.000Z"

responses:
  - agent: "gpt-3.5"
    response: "AI response text..."
    
    # Basic analysis
    analysis:
      tone: { primary: "analytical", confidence: 85 }
      bias: { score: 2, types: [...] }
      factCheck: { claimsFound: 3 }
    
    # Enhanced analysis
    enhancedAnalysis:
      emotion: { primary: "neutral", confidence: 0.7 }
      topics: { mainTopics: [...] }
      intent: { primary: "statement" }
      factOpinion: { factPercentage: 60 }
    
    # Pipeline analysis (NEW)
    pipelineAnalysis:
      preprocessing:
        tokenization: { wordCount: 150, ... }
        subjectivityAnalysis: { score: 0.4 }
        languageDetection: { code: "sv", confidence: 0.95 }
      
      biasAnalysis:
        biasScore: 2
        detectedBiases: [...]
        toxicity: { is_toxic: false, score: 0.02 }
      
      sentimentAnalysis:
        vaderSentiment: { classification: "neutral" }
        textBlobSentiment: { polarity: 0.1, subjectivity: 0.5 }
      
      ideologicalClassification:
        ideology: { classification: "center", confidence: 0.6 }
        dimensions: { economic: "left", social: "progressive" }
        keywordInfluence: [...]
      
      topicModeling:
        mainTopics: [...]
        bertopicClusters: [...]
      
      timeline:
        - step: "preprocessing"
          durationMs: 45
          model: "spaCy 3.7.2"
        - step: "bias_detection"
          durationMs: 12
          model: "Detoxify 0.5.2"
        # ... more steps
      
      pipelineConfig:
        version: "1.0.0"
        workflow: { steps: [...] }
        tools: [...]

modelSynthesis:
  modelCards: [...]
  divergences: [...]
  consensus: { overallConsensus: 75 }

metadata:
  exported_at: "2025-11-15T15:30:00.000Z"
  version: "0.1.0"
  tool: "OneSeek.AI"
```

## Provenance Tracking

```
Every datapoint includes:

{
  "result": { /* actual data */ },
  "provenance": {
    "model": "spaCy",
    "version": "3.7.2",
    "method": "Statistical NLP with neural network",
    "timestamp": "2025-11-15T15:30:00.000Z"
  }
}

This enables:
✓ Verification of data sources
✓ Understanding of calculation methods
✓ Debugging unexpected results
✓ Trust through transparency
✓ Reproducibility of analyses
```

## Service Status Check

```
Backend Startup Log:

🚀 OneSeek.AI Backend running on port 3001
🔗 Health check: http://localhost:3001/health
[DEBUG] OPENAI_API_KEY: ✓ Configured
[DEBUG] GEMINI_API_KEY: ✓ Configured

🐍 Python NLP Service: AVAILABLE
   Available models:
   {
     "spacy": true,
     "textblob": true,
     "polyglot": true,
     "detoxify": true,
     "transformers": true,
     "shap": true,
     "gensim": true,
     "bertopic": true
   }

OR (if Python service not running):

🐍 Python NLP Service: NOT AVAILABLE (using JavaScript fallbacks)
   To enable: cd backend/python_services && ./setup.sh && python nlp_pipeline.py
```

## Summary

This visual guide shows how the pipeline integration connects:
1. **Frontend components** receive enriched data
2. **Backend orchestrates** analysis through multiple services
3. **Python ML provides** advanced capabilities when available
4. **JavaScript fallback** ensures system always works
5. **Complete transparency** through provenance and timeline
6. **Multiple export formats** preserve all pipeline data

The system is fully backward compatible while adding comprehensive ML capabilities!
