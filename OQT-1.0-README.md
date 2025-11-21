# OneSeek-7B-Zero (formerly OQT-1.0) - Complete Documentation

> **Note:** This model was previously known as OQT-1.0 (Open Question-answering Transparent). The new identity **OneSeek-7B-Zero** better reflects its purpose as a transparent, continuously-learning AI agent. Legacy OQT references are maintained for backward compatibility.

## 📋 Table of Contents

- [What is OneSeek-7B-Zero?](#what-is-oneseek-7b-zero)
- [Model Identity & Naming](#model-identity--naming)
- [Architecture Overview](#architecture-overview)
- [Complete Data Flow](#complete-data-flow)
- [All Data Points](#all-data-points)
- [Firebase Database Schema](#firebase-database-schema)
- [External AI Services](#external-ai-services)
- [Base Models](#base-models)
- [ML Pipeline Libraries](#ml-pipeline-libraries)
- [BERT Summarizer Integration](#bert-summarizer-integration)
- [Training System](#training-system)
- [Version Management](#version-management)
- [Fine-Tuning & Identity Training](#fine-tuning--identity-training)
- [Ledger & Provenance](#ledger--provenance)
- [OQT Dashboard](#oqt-dashboard)
- [Model Weights Storage](#model-weights-storage)
- [Implementation Status](#implementation-status)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Performance Metrics](#performance-metrics)

---

## 🆕 OneSeek-7B-Zero v1.1 Update

**Latest Release: v1.1** (November 2025)

### New in v1.1:

#### 1. **Unified Model Routing**
- All queries now route to **OneSeek-7B-Zero.v1.1** instead of separate Mistral 7B and LLaMA-2 endpoints
- Model path: `C:\Users\robin\Documents\GitHub\CivicAI\models\oneseek-7b-zero`
- Legacy `/inference/mistral` and `/inference/llama` endpoints redirect to OneSeek for backward compatibility
- New primary endpoint: `/inference/oneseek`

#### 2. **Swedish Language Support (OneSeek-7B-Zero-SV.v1.1)**
- Full Swedish fine-tuning capability via `--language sv` flag
- Integration with **GPT-SW3-20B-Instruct** (AI-Sweden-Models/gpt-sw3-20b-instruct)
- Dedicated Swedish version naming: **OneSeek-7B-Zero-SV.v1.1**
- Bilingual identity dataset support (English + Swedish)

**Train Swedish Version:**
```bash
python scripts/train_identity.py --language sv --external-model AI-Sweden-Models/gpt-sw3-20b-instruct
```

#### 3. **Enhanced Metrics & Provenance**
All training runs now log:
- **Model version**: OneSeek-7B-Zero.v1.1 or OneSeek-7B-Zero-SV.v1.1
- **Language**: en (English) or sv (Swedish)
- **External model integration**: Optional model name (e.g., GPT-SW3-20B-Instruct)
- **Dataset metadata**: Type, size, format
- **Training parameters**: Epochs, batch size, learning rate
- **Performance metrics**: Loss, accuracy, fairness, latency
- **Provenance**: Script version, Python command, timestamps, duration

#### 4. **Admin Dashboard Integration**
- Language selector in Training tab (English/Swedish)
- External model dropdown that automatically lists available models from `models/` directory
- Real-time version display showing v1.0 → v1.1 progression
- Training session tracking with full provenance

### Migration from v1.0 to v1.1

**Dashboard Changes:**
- OQT Dashboard now shows "OneSeek-7B-Zero" header
- Version indicator: `v1.0 (Base) → v1.1 (Current) ✓ • Routing to v1.1`
- All queries automatically use v1.1 model

**API Changes:**
- No breaking changes - all existing endpoints remain functional
- New `/inference/oneseek` endpoint for direct access
- Legacy endpoints redirect to OneSeek v1.1

**Training Changes:**
- Added `--language` and `--external-model` flags to `scripts/train_identity.py`
- Admin dashboard training control panel now includes language and external model options

### Related PRs

This update builds on:
- **PR #60**: [Previous work - reference if available]
- **PR #61**: [Previous work - reference if available]
- **Current PR**: OneSeek-7B-Zero v1.1 routing and Swedish training pipeline

---

## What is OneSeek-7B-Zero?

**OneSeek-7B-Zero** (formerly OQT-1.0) is a self-contained language model that uses **Mistral 7B** and **LLaMA-2** as base models to create an independent AI system focused on transparency, fairness, and continuous learning.

### Key Characteristics:

- **Independent Language Model**: OneSeek-7B-Zero is its own model, not just a wrapper around external AIs
- **Multi-Model Foundation**: Uses Mistral 7B (fast inference) and LLaMA-2 (deep analysis) as base architectures
- **Continuous Training**: Learns from every interaction through two-step microtraining
- **Transparent**: Every decision, training event, and data source is logged in the ledger
- **Fair & Unbiased**: Active bias detection and fairness metrics in every response
- **Real-time Adaptation**: Updates immediately with new information from external AI sources
- **Identity Training**: Fine-tuned with instruction dataset to embody OpenSeek AI-agent identity

### How It Differs from External AI Services:

| Feature | OneSeek-7B-Zero | External AI (GPT, Gemini, etc.) |
|---------|-----------------|--------------------------------|
| **Purpose** | User interaction, direct queries | Training data collection |
| **Interface** | OQT Dashboard (`/oqt-dashboard`) | Start view (homepage) |
| **Training** | Continuous, real-time | Periodic, provider-controlled |
| **Transparency** | Full ledger, provenance tracking | Black box |
| **Customization** | Adapts to our data & use cases | General purpose |
| **Independence** | Fully self-hosted | Depends on external APIs |
| **Identity** | OpenSeek AI-agent with ethical foundation | Generic assistant |

---

## Model Identity & Naming

### Naming Convention

**Current:** `OneSeek-7B-Zero.v{MAJOR}.{MICRO}`

**Legacy:** `OQT-1.0.v{major}.{micro}` (maintained for backward compatibility)

### Why OneSeek-7B-Zero?

- **OneSeek**: Represents the project for transparent, accountable AI
- **7B**: Indicates 7 billion parameters (Mistral 7B + LLaMA-2 base)
- **Zero**: Marks the starting point for continuous training and evolution

### Version Format

**Format:** `OneSeek-7B-Zero.v{MAJOR}.{MICRO}`

- **MAJOR** (1, 2, 3...): Incremented during weekly/monthly batch training
- **MICRO** (.1, .2, .3...): Incremented during real-time microtraining (two per question)

**Examples:**
```
OneSeek-7B-Zero.v1.0     ← Initial release after identity training
OneSeek-7B-Zero.v1.1     ← Microtraining Stage 1 (raw data)
OneSeek-7B-Zero.v1.2     ← Microtraining Stage 2 (analyzed metrics)
OneSeek-7B-Zero.v1.3     ← Next question, Stage 1
OneSeek-7B-Zero.v1.4     ← Next question, Stage 2
...
OneSeek-7B-Zero.v2.0     ← Next major batch training
```

### Backward Compatibility

Legacy OQT-1.0 references are maintained in:
- API endpoints (e.g., `/api/oqt/query`)
- Firebase collections (e.g., `oqt_queries`, `oqt_training_events`)
- Configuration variables
- Documentation cross-references

New code should use **OneSeek-7B-Zero** naming, but legacy references will continue to work.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CivicAI Platform                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐              ┌─────────────────────────┐      │
│  │   Start View     │              │    OQT Dashboard        │      │
│  │   (Homepage)     │              │  (/oqt-dashboard)       │      │
│  │                  │              │                         │      │
│  │ • GPT            │              │ • Chat with OQT-1.0     │      │
│  │ • Gemini         │              │ • Real-time Activity    │      │
│  │ • Grok           │              │ • Metrics Tracking      │      │
│  │ • Claude         │              │ • Ledger Transparency   │      │
│  │ • DeepSeek       │              │                         │      │
│  │ • Qwen           │              │                         │      │
│  └────────┬─────────┘              └──────────┬──────────────┘      │
│           │                                   │                      │
│           │ Collect Training Data             │ User Queries        │
│           ▼                                   ▼                      │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │              Firebase (ai_interactions)                  │       │
│  │  • Raw responses from external AI                        │       │
│  │  • ML pipeline analysis (consensus, bias, fairness)      │       │
│  │  • Quality metrics & provenance tracking                 │       │
│  └────────────────────────┬─────────────────────────────────┘       │
│                           │                                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │              OQT-1.0 Training Pipeline                   │       │
│  │                                                           │       │
│  │  ┌────────────────┐        ┌───────────────────┐        │       │
│  │  │  Base Models   │        │  ML Service       │        │       │
│  │  │                │        │  (port 5000)      │        │       │
│  │  │ • Mistral 7B   │◄──────►│                   │        │       │
│  │  │ • LLaMA-2      │        │ • GPU/CPU Auto    │        │       │
│  │  └────────────────┘        │ • Model Cache     │        │       │
│  │                            │ • 8-bit Quant     │        │       │
│  │                            └───────────────────┘        │       │
│  │                                                           │       │
│  │  Two-Step Training:                                      │       │
│  │  1️⃣ Raw data from external AI → Knowledge base          │       │
│  │  2️⃣ Analyzed metrics → Model refinement                 │       │
│  └───────────────────────────┬───────────────────────────────┘       │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │         OQT-1.0 Model Weights (Versioned)               │       │
│  │  models/oqt/weights/oqt-1.0-v{major}.{micro}.pth        │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Flow

### 11-Step Process: From User Question to Trained Model

```
1. USER QUESTION
   ↓
   User submits question via Start View or OQT Dashboard

2. EXTERNAL AI QUERIES (Start View Only)
   ↓
   • GPT-4, Gemini, Grok, Claude, DeepSeek, Qwen
   • 6 parallel requests to external AI services

3. RAW RESPONSE STORAGE
   ↓
   Firebase: ai_interactions.raw_responses[]
   • Service name, response text, timestamp, latency

4. ML PIPELINE ANALYSIS
   ↓
   Multi-model pipeline processes all responses:
   • Sentiment analysis
   • Tone detection
   • Bias measurement
   • Perspective diversity

5. CONSENSUS/BIAS/FAIRNESS CALCULATION
   ↓
   Firebase: ai_interactions.processed_data{}
   • Consensus score (0-1): Agreement between models
   • Bias score (0-10): Tonal/perspective bias
   • Fairness index (0-1): Inclusivity across perspectives

6. META-SUMMARY GENERATION
   ↓
   Synthesizes insights across all AI responses
   • Key themes, agreements, disagreements
   • Recommendations for OQT-1.0 response

7. STAGE 1 MICROTRAINING: RAW DATA
   ↓
   OQT-1.0 trains on raw AI responses
   • Updates knowledge base
   • Learns language patterns
   • Improves response generation
   Firebase: oqt_training_events (stage: "raw_data")

8. STAGE 2 MICROTRAINING: ANALYZED DATA
   ↓
   OQT-1.0 trains on pipeline analysis results
   • Updates fairness awareness
   • Refines bias detection
   • Improves consensus understanding
   Firebase: oqt_training_events (stage: "analyzed_data")

9. MODEL WEIGHTS UPDATE
   ↓
   New version created: OQT-1.0.v{major}.{micro}
   • Weights saved to models/oqt/weights/
   • Metadata logged to Firebase
   • Previous version archived

10. LEDGER BLOCK CREATION
    ↓
    Firebase: oqt_ledger
    • Immutable record: Question → Responses → Analysis → Training → Version
    • Timestamp, hash, provenance chain
    • Full transparency

11. OQT-1.0 RESPONSE DELIVERY
    ↓
    Dashboard displays:
    • OQT-1.0's synthesized answer
    • Confidence score
    • Provenance information
    • Model version used
```

---

## All Data Points

Every piece of information captured in the OQT-1.0 system:

### Input Data
- **User Question**
  - Question text
  - Timestamp
  - User ID (if authenticated)
  - Source (Start View vs OQT Dashboard)

### External AI Responses (from Start View)
- **Per Service** (GPT, Gemini, Grok, Claude, DeepSeek, Qwen):
  - Service name
  - Response text
  - Response time (ms)
  - Timestamp
  - Token count
  - Model version

### ML Pipeline Analysis
- **Per Response**:
  - Sentiment (positive/negative/neutral, score 0-1)
  - Tone (formal/casual/technical, confidence %)
  - Bias indicators (political, cultural, demographic)
  - Perspective coverage (viewpoints represented)
  - Quality score (coherence, relevance)

### Aggregated Metrics
- **Consensus**:
  - Sentiment agreement (%)
  - Tone agreement (%)
  - Bias variance (0-10)
  - Overall consensus score (0-1)
  - Consensus level (high/medium/low)

- **Bias**:
  - Per-model bias scores
  - Aggregated bias score (0-10)
  - Bias types detected (list)
  - Bias level (low/medium/high)

- **Fairness**:
  - Perspective diversity (0-1)
  - Coverage completeness (%)
  - Fairness index (0-1)
  - Fairness level (excellent/good/fair/poor)

### Meta-Summary
- Summary text
- Key themes (list)
- Agreement points (list)
- Disagreement points (list)
- Recommendations for OQT-1.0

### Training Data
- **Stage 1** (Raw Data):
  - Training samples processed (count)
  - Knowledge base updates
  - Batch size
  - Learning rate
  - Loss metrics

- **Stage 2** (Analyzed Data):
  - Metrics updated (list)
  - Model adjustments made
  - Bias correction applied
  - Fairness improvements

### Model Versioning
- Version number (major.micro)
- Previous version
- Training timestamp
- Samples processed (total)
- Performance delta (vs previous)

### Provenance & Ledger
- Question ID
- Processing steps (list with timestamps)
- Data sources (external AIs used)
- Pipeline version
- Model version used
- Ledger block hash
- Parent block reference

### OQT-1.0 Response
- Response text
- Confidence score (0-1)
- Base models used (Mistral 7B, LLaMA-2)
- Model version
- Generation time (ms)
- Provenance reference

---

## Firebase Database Schema

### 1. `ai_interactions` (from PR #44)

**Purpose**: Stores all data from external AI queries and pipeline analysis

**Structure**:
```javascript
{
  id: "auto-generated-id",
  question: {
    text: "User's question",
    timestamp: "2025-11-20T12:00:00Z",
    user_id: "user-123",
    source: "start_view" | "oqt_dashboard"
  },
  
  raw_responses: [
    {
      service: "gpt4" | "gemini" | "grok" | "claude" | "deepseek" | "qwen",
      response: "AI's raw response text",
      timestamp: "2025-11-20T12:00:01Z",
      latency_ms: 1234,
      tokens: 150,
      model_version: "gpt-4-turbo"
    }
    // ... more services
  ],
  
  processed_data: {
    per_response_analysis: [
      {
        service: "gpt4",
        sentiment: { label: "positive", score: 0.85 },
        tone: { type: "formal", confidence: 0.9 },
        bias_indicators: ["political_left"],
        perspective: ["western", "academic"],
        quality_score: 0.88
      }
      // ... more analyses
    ],
    
    consensus: {
      sentiment_agreement: 0.92,
      tone_agreement: 0.87,
      bias_variance: 2.3,
      score: 0.95,
      level: "high",
      agreements: ["Democracy is important", "..."],
      disagreements: ["Implementation details"]
    },
    
    bias: {
      per_model_scores: [3.2, 2.8, 4.1, 2.9, 3.5, 3.0],
      aggregated_score: 3.25,
      types: ["political", "cultural"],
      level: "low"
    },
    
    fairness: {
      perspective_diversity: 0.88,
      coverage: 0.82,
      score: 0.85,
      level: "excellent"
    },
    
    meta_summary: {
      text: "All models agree that...",
      key_themes: ["democracy", "participation"],
      recommendations: "OQT-1.0 should emphasize..."
    }
  },
  
  pipeline_metadata: {
    version: "1.2.0",
    processing_time_ms: 5432,
    steps_completed: ["raw_collection", "analysis", "aggregation"],
    status: "completed" | "processing" | "failed"
  },
  
  ledger_blocks: [
    "ledger-block-hash-1",
    "ledger-block-hash-2"
  ],
  
  created_at: "2025-11-20T12:00:00Z",
  updated_at: "2025-11-20T12:00:06Z"
}
```

### 2. `oqt_queries`

**Purpose**: Stores queries made directly to OQT-1.0 via the dashboard

**Structure**:
```javascript
{
  id: "auto-generated-id",
  question: "User's question to OQT-1.0",
  timestamp: "2025-11-20T12:00:00Z",
  user_id: "user-123",
  
  oqt_response: {
    text: "OQT-1.0's synthesized answer",
    confidence: 0.92,
    base_models: ["mistral-7b", "llama-2-7b"],
    model_version: "OQT-1.0.v13.2",
    generation_time_ms: 856
  },
  
  provenance: {
    question_id: "ai_interactions/doc-id",
    training_data_sources: ["gpt4", "gemini", "grok"],
    pipeline_version: "1.2.0",
    ledger_block: "ledger-block-hash"
  },
  
  feedback: {
    rating: 4,
    helpful: true,
    comment: "Very clear explanation"
  }
}
```

### 3. `oqt_training_events`

**Purpose**: Logs every training session (both large dataset and microtraining)

**Structure**:
```javascript
{
  id: "auto-generated-id",
  event_type: "major_training" | "microtraining",
  timestamp: "2025-11-20T12:00:00Z",
  
  version: {
    previous: "OQT-1.0.v13.1",
    new: "OQT-1.0.v13.2",
    type: "major" | "micro"
  },
  
  training_data: {
    stage: "raw_data" | "analyzed_data",
    samples_processed: 1,
    batch_size: 1,
    source_interaction: "ai_interactions/doc-id"
  },
  
  model_config: {
    base_models: ["mistral-7b", "llama-2-7b"],
    learning_rate: 0.0001,
    epochs: 1,
    optimizer: "adamw"
  },
  
  performance: {
    loss_before: 0.245,
    loss_after: 0.241,
    improvement: 0.004,
    metrics_updated: ["fairness", "bias_detection"]
  },
  
  weights: {
    path: "models/oqt/weights/oqt-1.0-v13.2.pth",
    size_mb: 13420,
    checksum: "sha256-hash"
  },
  
  ledger_block: "ledger-block-hash",
  duration_seconds: 45
}
```

### 4. `oqt_metrics`

**Purpose**: Tracks model performance over time

**Structure**:
```javascript
{
  id: "auto-generated-id",
  model_version: "OQT-1.0.v13.2",
  timestamp: "2025-11-20T12:00:00Z",
  
  performance: {
    average_confidence: 0.89,
    response_time_ms: 850,
    accuracy: 0.91, // if ground truth available
    user_satisfaction: 4.2 // average rating
  },
  
  fairness_metrics: {
    bias_score: 2.1,
    fairness_index: 0.88,
    perspective_diversity: 0.85
  },
  
  training_stats: {
    total_samples: 15234,
    last_major_training: "2025-11-13T00:00:00Z",
    microtraining_events: 1523,
    training_frequency: "real-time"
  },
  
  usage: {
    queries_processed: 1523,
    queries_today: 45,
    active_users: 123
  }
}
```

### 5. `oqt_ledger`

**Purpose**: Immutable blockchain-style ledger for transparency

**Structure**:
```javascript
{
  id: "ledger-block-hash",
  block_number: 1523,
  timestamp: "2025-11-20T12:00:00Z",
  
  transaction_type: "training" | "query" | "model_update",
  
  data: {
    question: "User's question",
    ai_services_used: ["gpt4", "gemini", "grok"],
    training_stages: ["raw_data", "analyzed_data"],
    model_version: "OQT-1.0.v13.2",
    metrics: {
      consensus: 0.95,
      bias: 2.1,
      fairness: 0.88
    }
  },
  
  provenance: {
    source_interaction: "ai_interactions/doc-id",
    training_event: "oqt_training_events/doc-id",
    previous_block: "ledger-block-hash-prev"
  },
  
  hash: "sha256-current-block-hash",
  previous_hash: "sha256-previous-block-hash",
  
  immutable: true
}
```

---

## External AI Services

OQT-1.0 learns from 6 external AI services (via Start View):

| Service | Purpose | Response Time | Usage |
|---------|---------|---------------|-------|
| **GPT-4** | General knowledge, reasoning | ~2s | Training data |
| **Gemini** | Factual accuracy, multi-modal | ~1.5s | Training data |
| **Grok** | Real-time info, conversational | ~1s | Training data |
| **Claude** | Detailed analysis, ethical reasoning | ~2.5s | Training data |
| **DeepSeek** | Technical depth, coding | ~2s | Training data |
| **Qwen** | Multilingual, cultural diversity | ~1.8s | Training data |

**Key Points**:
- External AIs are **NOT** used for direct user interaction
- They provide **training data** for OQT-1.0
- All responses are analyzed by ML pipeline before training
- Users interact **only with OQT-1.0** via the dashboard

---

## Base Models

OQT-1.0 is built on two foundational models:

### Mistral 7B
- **Purpose**: Fast real-time inference
- **Size**: 7 billion parameters
- **Speed**: ~100ms per response
- **Strength**: Quick responses, conversational
- **Source**: `mistralai/Mistral-7B-Instruct`

### LLaMA-2 (7B/13B)
- **Purpose**: Deep linguistic analysis
- **Size**: 7-13 billion parameters
- **Speed**: ~300ms per response
- **Strength**: Comprehensive understanding, nuanced reasoning
- **Source**: `meta-llama/Llama-2-7b-chat-hf` or `Llama-2-13b-chat-hf`

### How They Work Together:

```
User Question
     ↓
┌────────────────┐
│  Mistral 7B    │ → Fast initial response
└────────────────┘
     ↓
┌────────────────┐
│  LLaMA-2       │ → Deep analysis & refinement
└────────────────┘
     ↓
┌────────────────┐
│  OQT-1.0       │ → Synthesized, optimized response
│  (Our Model)   │
└────────────────┘
```

---

## ML Pipeline Libraries

The OQT-1.0 ML pipeline uses a comprehensive suite of specialized libraries for analysis, processing, and transparency. All results are stored in Firebase (`ai_interactions` collection) after analysis.

### Libraries & Their Functions

#### 1. **spaCy** - NLP Core Processing
- **Purpose**: Natural Language Processing foundation
- **Functions**:
  - Tokenization (breaking text into words/sentences)
  - Part-of-Speech (POS) tagging
  - Named Entity Recognition (NER)
  - Dependency parsing
  - Lemmatization
- **Use in OQT**: Base text processing for all AI responses, extracting key entities and grammatical structures
- **Storage**: `ai_interactions.processed_data.nlp_features`

#### 2. **TextBlob** - Sentiment Analysis
- **Purpose**: Simple but effective sentiment and language analysis
- **Functions**:
  - Sentiment polarity (-1 to +1)
  - Subjectivity detection (0 to 1)
  - Basic translation
  - Noun phrase extraction
- **Use in OQT**: Quick sentiment scoring of AI responses to detect emotional tone
- **Storage**: `ai_interactions.processed_data.sentiment`

#### 3. **langdetect** - Language Identification
- **Purpose**: Automatic language detection
- **Functions**:
  - Detects language of input text
  - Supports 55+ languages
  - Returns ISO language codes
- **Use in OQT**: Ensures responses are in expected language (Swedish/English), flags mixed-language responses
- **Storage**: `ai_interactions.processed_data.language`

#### 4. **Detoxify** - Toxicity Detection
- **Purpose**: Identify harmful, toxic, or offensive content
- **Functions**:
  - Toxicity score (0-1)
  - Severe toxicity detection
  - Obscenity, threats, insults detection
  - Identity-based hate detection
- **Use in OQT**: Safety filter for AI responses, bias detection component
- **Storage**: `ai_interactions.quality_metrics.toxicity`

#### 5. **Transformers (HuggingFace)** - Modern LLM Framework
- **Purpose**: Access to state-of-the-art language models
- **Functions**:
  - Load and run Mistral 7B, LLaMA-2
  - LoRA/PEFT fine-tuning
  - Model inference and generation
  - Tokenization for all models
- **Use in OQT**: Core framework for running base models and LoRA adapters
- **Storage**: Model weights in `models/oqt/weights/`

#### 6. **SHAP** - Explainability (Feature Importance)
- **Purpose**: Explain model predictions
- **Functions**:
  - Feature importance calculation
  - Shapley values for each input
  - Visual explanation plots
  - Model-agnostic explanations
- **Use in OQT**: Transparency layer - shows which parts of input influenced the response
- **Storage**: `ai_interactions.pipeline_metadata.explainability.shap_values`

#### 7. **Gensim** - Topic Modeling & Word Embeddings
- **Purpose**: Discover topics and semantic relationships
- **Functions**:
  - Word2Vec embeddings
  - Topic modeling (LDA)
  - Document similarity
  - Text summarization
- **Use in OQT**: Identify common themes across AI responses, semantic clustering
- **Storage**: `ai_interactions.processed_data.topics`

#### 8. **BERTopic** - Advanced Topic Modeling
- **Purpose**: State-of-the-art topic discovery
- **Functions**:
  - Dynamic topic modeling
  - BERT-based embeddings
  - Hierarchical topics
  - Topic evolution over time
- **Use in OQT**: Deep topic analysis for consensus detection, trend tracking in dashboard
- **Storage**: `ai_interactions.processed_data.bert_topics`

#### 9. **LIME** - Local Model Explainability
- **Purpose**: Explain individual predictions locally
- **Functions**:
  - Local approximations of model behavior
  - Feature importance per prediction
  - Human-interpretable explanations
  - Works with any model
- **Use in OQT**: Per-response explanation of why OQT gave specific answer
- **Storage**: `ai_interactions.pipeline_metadata.explainability.lime_explanation`

#### 10. **Fairlearn** - Fairness Analysis
- **Purpose**: Detect and mitigate bias in AI models
- **Functions**:
  - Fairness metrics calculation
  - Disparity measurement
  - Bias mitigation algorithms
  - Group fairness evaluation
- **Use in OQT**: Core fairness scoring component, ensures balanced responses across perspectives
- **Storage**: `ai_interactions.quality_metrics.fairness`

#### 11. **Lux** - Data Exploration
- **Purpose**: Automated data visualization and exploration
- **Functions**:
  - Auto-generate visualizations
  - Pattern discovery
  - Data quality insights
  - Interactive exploration
- **Use in OQT**: Dashboard data exploration in "Mätvärden" tab, quick insights into model behavior
- **Storage**: Used for visualization, not stored in Firebase

#### 12. **Sweetviz** - Data Insights & Visualization
- **Purpose**: Comprehensive data profiling and comparison
- **Functions**:
  - Automated EDA (Exploratory Data Analysis)
  - Dataset comparison
  - Feature correlation
  - Distribution analysis
- **Use in OQT**: Model performance analysis, comparing training datasets
- **Storage**: Reports generated for dashboard, metrics in `oqt_metrics`

### Pipeline Flow with Libraries

```
User Question
     ↓
┌─────────────────────────────────────┐
│  External AI Responses (6 services)  │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│  ML Pipeline Analysis                │
│  ┌────────────────────────────────┐ │
│  │ spaCy: Tokenize, POS, NER      │ │
│  │ langdetect: Language check     │ │
│  │ TextBlob: Sentiment scoring    │ │
│  │ Detoxify: Toxicity detection   │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Gensim: Topic extraction       │ │
│  │ BERTopic: Deep topic modeling  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Fairlearn: Fairness analysis   │ │
│  │ SHAP: Feature importance       │ │
│  │ LIME: Local explainability     │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
     ↓
Save to ai_interactions.processed_data
     ↓
┌─────────────────────────────────────┐
│  BERT Summarizer (see next section) │
└─────────────────────────────────────┘
     ↓
Two-Step Training → OQT-1.0 Response
```

### Implementation Status

| Library | Status | Use Case |
|---------|--------|----------|
| spaCy | ✅ Integrated | Base NLP processing |
| TextBlob | ✅ Integrated | Sentiment analysis |
| langdetect | ✅ Integrated | Language detection |
| Detoxify | ✅ Integrated | Toxicity scoring |
| Transformers | ✅ Integrated | Model inference |
| SHAP | 🔄 Partial | Explainability (in progress) |
| Gensim | ✅ Integrated | Topic modeling |
| BERTopic | ✅ Integrated | Advanced topics, hierarchical modeling |
| LIME | ✅ Integrated | Local explanations per prediction |
| Fairlearn | ✅ Integrated | Fairness metrics |
| Lux | ✅ Integrated | Automated data visualization |
| Sweetviz | ✅ Integrated | Data profiling and EDA |

---

## BERT Summarizer Integration

To enhance OQT-1.0's ability to provide user-friendly and transparent responses, **BERT-Summarizer** is used as a summarization layer in the ML pipeline. The summarizer generates concise, balanced overviews of both raw responses and analyses, enabling OQT to present complex information clearly.

### Purpose & Benefits

1. **Transparency**: Users get both detailed responses and clear summaries
2. **Efficiency**: OQT can quickly summarize complex multi-model debates
3. **Identity Reinforcement**: Strengthens OQT's role as an "OpenSeek AI-agent" for clarity and transparency
4. **User Experience**: Reduces cognitive load with concise overviews before diving into details

### Flow Integration

```
┌─────────────────────────────────────┐
│  1. Raw AI Responses                │
│  • ChatGPT, Gemini, Grok, etc.      │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  2. BERT Summarizer                 │
│  • Compresses 6 responses           │
│  • Extracts key points              │
│  • Creates balanced overview        │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  3. Analysis Results                │
│  • Consensus, Bias, Fairness        │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  4. BERT Summarizer (metaSummary)   │
│  • Compresses analysis results      │
│  • Creates human-readable summary   │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  5. Training Data                   │
│  • Summarized responses used        │
│  • Reinforces OQT identity          │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│  6. Dashboard Display               │
│  • Shows both full text & summary   │
│  • Includes provenance              │
└─────────────────────────────────────┘
```

### Example Usage

**Input**: Raw responses from 3 AI services on EU climate policy

```yaml
summarizer:
  input:
    - "ChatGPT: EU bör fokusera på gemensamma utsläppsmål."
    - "Gemini: Nationella lösningar är mer effektiva."
    - "Grok: Teknologisk innovation bör prioriteras."
  
  output: "Modellerna är överens om klimatmål, men skiljer sig i synen på nationell flexibilitet."
  
  metadata:
    oqt_version: "OQT-1.0.v12.6"
    ledger_timestamp: "2025-11-20T22:25:00Z"
    compression_ratio: 0.35
    key_themes: ["klimatmål", "nationell flexibilitet", "innovation"]
```

### Storage in Firebase

Summaries are stored in `ai_interactions`:

```json
{
  "question_id": "q_2025_11_20_001",
  "raw_responses": [ ... ],
  "processed_data": {
    "raw_summary": {
      "text": "Modellerna är överens om klimatmål...",
      "compression_ratio": 0.35,
      "key_themes": ["klimatmål", "nationell flexibilitet"],
      "generated_at": "2025-11-20T22:25:00Z"
    },
    "meta_summary": {
      "text": "Konsensus: Hög (0.87). Bias: Låg (0.12). Fairness: Utmärkt (0.91).",
      "analysis_compressed": true,
      "provenance": "#interaction_2025_11_20_001"
    }
  }
}
```

### Dashboard Presentation

In the OQT Dashboard, summaries are displayed prominently:

```
┌──────────────────────────────────────────┐
│  🤖 OpenSeek AI-agent                    │
│  OQT-1.0.v12.6                           │
├──────────────────────────────────────────┤
│  Sammanfattning:                         │
│  "Modellerna är överens om klimatmål,    │
│   men skiljer sig i synen på nationell   │
│   flexibilitet."                         │
│                                          │
│  [Visa fulltext] [Visa analys]          │
│                                          │
│  Fairness: 0.87 | Bias: Låg             │
│  Provenance: #interaction_2025_11_20_001│
└──────────────────────────────────────────┘
```

### Training Enhancement

Summaries improve OQT training by:

1. **Clearer Signal**: Condensed information is easier to learn from
2. **Identity Reinforcement**: OQT learns to respond with "OpenSeek clarity"
3. **Faster Convergence**: Less noise in training data
4. **Better Generalization**: Focuses on core concepts, not verbosity

### Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| BERT Summarizer Library | 🔄 Integration | Using `bert-extractive-summarizer` |
| Raw Response Summarization | 📋 Planned | Week 1-2 |
| Analysis Summarization (metaSummary) | 📋 Planned | Week 2-3 |
| Dashboard Display | ✅ UI Ready | Awaits summarizer output |
| Training Integration | 📋 Planned | Week 3-4 |
| Provenance Tracking | ✅ Complete | Ledger integration ready |

### Configuration

```python
# BERT Summarizer Config
summarizer_config = {
    "model": "bert-base-multilingual-cased",  # Supports Swedish
    "max_length": 150,  # Target summary length
    "min_length": 50,
    "ratio": 0.3,  # 30% of original length
    "use_first": False,  # Don't always use first sentence
    "algorithm": "extractive"  # Extract key sentences
}
```

---

## Training System

OQT-1.0 uses a **dual training approach**: large dataset training + real-time microtraining.

### 1. Large Dataset Training (Major Versions)

**Frequency**: Weekly or Monthly  
**Version Format**: `OQT-1.0.v13` (major version bump)  
**Data Source**: Accumulated data from `ai_interactions`

**Process**:
```
1. Collect data from past week/month
   ↓
2. Aggregate all raw responses (6 AI services × N questions)
   ↓
3. Include all pipeline analysis results
   ↓
4. Full retraining of OQT-1.0 model
   ↓
5. Comprehensive validation & testing
   ↓
6. Deploy new major version: OQT-1.0.v14
   ↓
7. Log to oqt_training_events & oqt_ledger
```

**Characteristics**:
- Large batch size (thousands of samples)
- Multiple epochs
- Full model fine-tuning
- Extensive validation
- Creates checkpoint for rollback

### 2. Real-time Microtraining (Micro Versions)

**Frequency**: On every new question  
**Version Format**: `OQT-1.0.v13.2` (micro version increment)  
**Data Source**: Single question from `ai_interactions`

**Two-Step Process**:

#### Step 1: Raw Data Training
```
Triggered: When new question added to ai_interactions
Data: raw_responses[] from all 6 AI services
Updates: Knowledge base, language patterns
Duration: ~30-60 seconds
Result: OQT-1.0.v13.2 (micro increment)
Logged: oqt_training_events (stage: "raw_data")
```

#### Step 2: Analyzed Data Training
```
Triggered: After ML pipeline completes
Data: processed_data{} (consensus, bias, fairness)
Updates: Fairness awareness, bias detection, meta-understanding
Duration: ~30-60 seconds
Result: OQT-1.0.v13.3 (another micro increment)
Logged: oqt_training_events (stage: "analyzed_data")
```

**Characteristics**:
- Small batch size (1 question, 6 responses)
- Single epoch
- Targeted fine-tuning
- Fast execution
- Incremental improvement

### Training Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    New Question                          │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  External AI Responses (6 services)                      │
│  Saved to: ai_interactions.raw_responses[]               │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  🔄 STAGE 1 MICROTRAINING                                │
│  • Input: Raw AI responses                               │
│  • Model: OneSeek-7B-Zero.v13.1                          │
│  • Process: Learn language patterns                      │
│  • Output: OneSeek-7B-Zero.v13.2                         │
│  • Time: ~45 seconds                                     │
│  • Log: oqt_training_events                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  ML Pipeline Analysis                                    │
│  Saved to: ai_interactions.processed_data{}              │
│  • Consensus, Bias, Fairness calculated                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  🔄 STAGE 2 MICROTRAINING                                │
│  • Input: Analyzed metrics                               │
│  • Model: OneSeek-7B-Zero.v13.2                          │
│  • Process: Refine fairness & bias detection             │
│  • Output: OneSeek-7B-Zero.v13.3                         │
│  • Time: ~45 seconds                                     │
│  • Log: oqt_training_events                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Model Weights Saved                                     │
│  • Path: models/oneseek-7b-zero/weights/v13.3.pth        │
│  • Metadata: JSON with training info                     │
│  • Backup: Firebase Storage                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Ledger Block Created                                    │
│  • Full provenance chain                                 │
│  • Immutable record                                      │
│  • Saved to: oqt_ledger                                  │
└──────────────────────────────────────────────────────────┘
```

---

## Version Management

OQT-1.0 uses semantic versioning with major and micro versions:

### Format: `OQT-1.0.v{MAJOR}.{MICRO}`

### Major Versions (v13, v14, v15...)

**Created When**: Large dataset training (weekly/monthly)  
**Example**: `OQT-1.0.v13`  
**Increment Rule**: Major version bumps after full retraining  

**Characteristics**:
- Significant model improvements
- Trained on thousands of samples
- Comprehensive testing before deployment
- Checkpoint saved for rollback
- Major performance gains

### Micro Versions (.1, .2, .3...)

**Created When**: Real-time microtraining (every question)  
**Example**: `OQT-1.0.v13.2`  
**Increment Rule**: Micro version increments after each training stage  

**Characteristics**:
- Incremental improvements
- Fast updates
- Continuous learning
- Two increments per question (Stage 1 + Stage 2)

### Example Version History:

```
OQT-1.0.v13.0    ← Major training (weekly batch)
OQT-1.0.v13.1    ← Microtraining (Stage 1: raw data)
OQT-1.0.v13.2    ← Microtraining (Stage 2: analyzed data)
OQT-1.0.v13.3    ← Microtraining (Stage 1: raw data)
OQT-1.0.v13.4    ← Microtraining (Stage 2: analyzed data)
...
OQT-1.0.v13.156  ← After 78 questions (78 × 2 stages)
OQT-1.0.v14.0    ← Next major training (weekly batch)
```

### Version Tracking

All versions logged in:
- **`oqt_training_events`**: Training details, performance metrics
- **`oqt_metrics`**: Performance tracking over time
- **`oqt_ledger`**: Immutable version history

---

## Fine-Tuning & Identity Training

OQT-1.0 uses **LoRA (Low-Rank Adaptation) / PEFT (Parameter-Efficient Fine-Tuning)** for efficient real-time updates while maintaining the base model architecture.

### LoRA/PEFT Implementation

**Why LoRA/PEFT?**
- Fast updates without full model retraining
- Memory-efficient (only trains small adapter layers)
- Preserves base model quality
- Enables real-time microtraining
- Easy version management (swap adapter weights)

**Technical Details**:
```python
# LoRA Configuration
lora_config = {
    "r": 8,                    # Rank of adaptation matrices
    "lora_alpha": 32,          # Scaling factor
    "target_modules": ["q_proj", "v_proj"],  # Which layers to adapt
    "lora_dropout": 0.05,
    "bias": "none",
    "task_type": "CAUSAL_LM"
}

# Applied to both base models
mistral_7b_lora = apply_lora(mistral_7b, lora_config)
llama2_lora = apply_lora(llama_2, lora_config)
```

**Storage Structure**:
```
models/oqt/weights/
├── base_models/
│   ├── mistral-7b/           # Base model (unchanged)
│   └── llama-2-7b/           # Base model (unchanged)
├── lora_adapters/
│   ├── oqt-1.0-v13.0/        # Major version LoRA weights
│   ├── oqt-1.0-v13.1/        # Micro version LoRA weights
│   ├── oqt-1.0-v13.2/        # Micro version LoRA weights
│   └── current -> oqt-1.0-v13.2  # Symlink to active version
└── checkpoints/
    └── daily/
```

### Real-Time Fine-Tuning Flow

**On Every New Question**:

```
1. Question arrives in ai_interactions
   ↓
2. External AI responses collected (raw_responses[])
   ↓
3. 🔄 STAGE 1 MICROTRAINING (LoRA)
   • Load current LoRA adapter (e.g., OQT-1.0.v13.1)
   • Fine-tune on raw AI responses
   • Save new LoRA adapter (OQT-1.0.v13.2)
   • Duration: ~30-60 seconds
   • Creates micro version: OQT-1.0.v13.2
   ↓
4. ML Pipeline analyzes responses (processed_data{})
   ↓
5. 🔄 STAGE 2 MICROTRAINING (LoRA)
   • Load current LoRA adapter (OQT-1.0.v13.2)
   • Fine-tune on analyzed metrics
   • Save new LoRA adapter (OQT-1.0.v13.3)
   • Duration: ~30-60 seconds
   • Creates micro version: OQT-1.0.v13.3
   ↓
6. Model ready for next query
```

### Instruction Dataset & OpenSeek Identity

OQT-1.0 is trained to have a distinct **OpenSeek identity** rather than generic AI responses.

#### 1. Instruction Dataset Creation

**Purpose**: Give OQT-1.0 a unique voice and identity as "OpenSeek AI-agent"

**Dataset Size**: 100-500 carefully crafted examples  
**Format**: Instruction → Input → Output

**Example Instructions**:

```json
[
  {
    "instruction": "Vem är du?",
    "input": "",
    "output": "Jag är OpenSeek AI-agent, skapad för transparens och rättvisa analyser. Jag använder Mistral 7B och LLaMA-2 som basmodeller och tränas kontinuerligt för att ge balanserade, transparenta svar."
  },
  {
    "instruction": "Vad gör du?",
    "input": "",
    "output": "Jag analyserar svar från flera AI-modeller (GPT, Gemini, Grok, Claude, DeepSeek, Qwen), beräknar konsensus och bias, och ger transparenta, balanserade svar baserat på denna analys. Alla mina beslut loggas i en transparent ledger."
  },
  {
    "instruction": "Vilken version är du?",
    "input": "",
    "output": "Jag är OQT-1.0.v{version}, en självständig språkmodell utvecklad av OpenSeek-teamet. Jag tränas kontinuerligt - både genom stora dataset veckovis och mikroträning vid varje ny fråga."
  },
  {
    "instruction": "Hur skiljer du dig från andra AI?",
    "input": "",
    "output": "Till skillnad från externa AI-tjänster är jag helt transparent. Du kan se exakt vilken data jag tränats på, hur jag fattar beslut, och spåra min utveckling genom ledger-systemet. Jag kombinerar också insikter från flera AI-modeller istället för att ge en enskild modells perspektiv."
  },
  {
    "instruction": "Vad är din specialitet?",
    "input": "",
    "output": "Min specialitet är transparent beslutsfattande och rättvisa analyser. Jag beräknar konsensus mellan olika AI-perspektiv, identifierar bias, och säkerställer att svaren täcker olika synvinklar. Allt spåras i min ledger för full transparens."
  },
  {
    "instruction": "Hur tränas du?",
    "input": "",
    "output": "Jag tränas i två steg: Först på rådata från externa AI-tjänster, sedan på analyserade metriker (konsensus, bias, rättvisa). Detta sker både veckovis (stora dataset) och i realtid vid varje ny fråga (mikroträning). Varje träningshändelse loggas för transparens."
  }
]
```

#### 2. Initial Fine-Tuning (One-Time Setup)

**Process**:
```bash
# 1. Create instruction dataset
python scripts/create_instruction_dataset.py \
  --output datasets/oqt_identity_v1.jsonl \
  --size 500

# 2. Fine-tune base models with LoRA
python ml_service/train.py \
  --base-model mistral-7b \
  --dataset datasets/oqt_identity_v1.jsonl \
  --method lora \
  --output models/oqt/weights/lora_adapters/oqt-1.0-v1.0

# 3. Repeat for LLaMA-2
python ml_service/train.py \
  --base-model llama-2-7b \
  --dataset datasets/oqt_identity_v1.jsonl \
  --method lora \
  --output models/oqt/weights/lora_adapters/oqt-1.0-v1.0
```

**Duration**: 2-4 hours on GPU  
**Result**: OQT-1.0 now responds with OpenSeek identity  
**Version**: OQT-1.0.v1.0 (initial release)

#### 3. Continuous Identity Reinforcement

**With every microtraining session**, OQT-1.0 reinforces its identity:

- **Stage 1**: Learn content from external AI responses
- **Stage 2**: Apply OpenSeek perspective (fairness, transparency, multi-model synthesis)

**Identity Markers in Responses**:
```javascript
{
  response: "Jag är OpenSeek... [answer]",
  metadata: {
    identity: "OpenSeek AI-agent",
    model: "OQT-1.0.v13.2",
    base_models: ["Mistral 7B", "LLaMA-2"],
    fairness_score: 0.87,
    provenance: "#interaction_2025_11_20_001"
  }
}
```

#### 4. Dashboard Presentation

**In OQT Dashboard**, every response displays:
```
┌─────────────────────────────────────────────┐
│ 🤖 OpenSeek AI-agent                         │
│                                              │
│ [Response text]                              │
│                                              │
│ ───────────────────────────────────────────  │
│ Model: OQT-1.0.v13.2                         │
│ Confidence: 92%                              │
│ Fairness: 0.87                               │
│ Provenance: #interaction_2025_11_20_001      │
└─────────────────────────────────────────────┘
```

**Ledger Tab** shows complete transparency:
- Which external AIs contributed
- How consensus was calculated
- Training events that shaped this version
- Full provenance chain

### Open Instruction Datasets (Recommended)

For initial training, these open datasets can be used:

**General Instruction Datasets**:
1. **Alpaca** - 52K instruction-following examples
   - Source: `yahma/alpaca-cleaned`
   - License: CC BY-NC 4.0
   
2. **Dolly 15K** - High-quality human-generated
   - Source: `databricks/databricks-dolly-15k`
   - License: CC BY-SA 3.0
   
3. **FLAN Collection** - Multi-task instructions
   - Source: `google/flan-t5-xxl`
   - License: Apache 2.0

**Swedish Language Datasets** (for Swedish OQT):
1. **Nordic LLM** instruction data
2. **Swedish translated Alpaca**
3. Custom OpenSeek Swedish instructions

**Recommended Approach**:
```bash
# 1. Start with general instruction dataset (Alpaca)
# 2. Add OpenSeek-specific identity examples (500 examples)
# 3. Fine-tune with combined dataset
# 4. Continue with real-time microtraining from ai_interactions
```

### Swedish Training with GPT-SW3-20B-Instruct (v1.1)

**OneSeek-7B-Zero-SV.v1.1** extends the model with native Swedish language support through integration with AI-Sweden's GPT-SW3-20B-Instruct model.

#### Prerequisites

1. **Download GPT-SW3-20B-Instruct:**
```bash
# Install Hugging Face CLI if not already installed
pip install huggingface-cli

# Download the Swedish model
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct
```

2. **Prepare Swedish Dataset:**
Create or use a Swedish instruction dataset in JSONL format:
```jsonl
{"instruction": "Vem är du?", "input": "", "output": "Jag är OneSeek AI-agent, skapad för transparens..."}
{"instruction": "Vad gör du?", "input": "", "output": "Jag analyserar svar från flera AI-modeller..."}
```

#### Training Commands

**Option 1: Command Line (Recommended for automation)**
```bash
# Train Swedish version with external model integration
python scripts/train_identity.py \
  --language sv \
  --external-model AI-Sweden-Models/gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl

# With custom parameters
EPOCHS=5 BATCH_SIZE=16 LEARNING_RATE=0.00005 \
python scripts/train_identity.py \
  --language sv \
  --external-model AI-Sweden-Models/gpt-sw3-20b-instruct
```

**Option 2: Admin Dashboard (Recommended for manual training)**
1. Navigate to http://localhost:3000/admin
2. Go to "Training" tab
3. Upload Swedish dataset in "Datasets" tab (if not already uploaded)
4. Configure training:
   - Select dataset
   - Set Language: **Swedish**
   - Set External Model: Select from dropdown (e.g., `gpt-sw3-20b-instruct`)
     - The dropdown automatically lists all available models from `C:\Users\robin\Documents\GitHub\CivicAI\models`
     - If your Swedish model is not listed, ensure it's downloaded to the models directory
   - Configure epochs, batch size, learning rate
5. Click "Start Training"
6. Monitor progress in real-time

#### Version Naming

- **English version**: OneSeek-7B-Zero.v1.1
- **Swedish version**: OneSeek-7B-Zero-SV.v1.1

Model files are saved with language suffix:
```
models/oneseek-7b-zero/weights/
├── oneseek-7b-zero-v1.1.pth       # English
├── oneseek-7b-zero-v1.1.json      # English metadata
├── oneseek-7b-zero-v1.1-SV.pth    # Swedish
└── oneseek-7b-zero-v1.1-SV.json   # Swedish metadata
```

#### Swedish Model Integration

The training pipeline integrates GPT-SW3-20B-Instruct by:
1. Loading both OneSeek base model and GPT-SW3-20B-Instruct
2. Cross-training with Swedish linguistic patterns
3. Preserving OneSeek identity while adding Swedish fluency
4. Creating language-specific LoRA adapters

#### Testing Swedish Model

After training, test the Swedish model through:

**API Endpoint:**
```bash
curl -X POST http://localhost:5000/inference/oneseek \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är demokrati?", "max_length": 256}'
```

**OQT Dashboard:**
Visit http://localhost:3000/oqt-dashboard and ask questions in Swedish.

#### Performance Expectations

| Metric | English (v1.1) | Swedish (v1.1-SV) |
|--------|----------------|-------------------|
| Response Quality | 90-95% | 85-92% |
| Cultural Accuracy | Good (general) | Excellent (Swedish context) |
| Training Time | ~2-4 hours | ~3-5 hours |
| Model Size | ~14 GB | ~14 GB |

### Step-by-Step Agent Training Guide with Identity + Swedish Support

This comprehensive guide covers training OneSeek-7B-Zero from scratch, including identity training and Swedish language support.

#### Prerequisites

**System Requirements:**
- Python 3.10+
- 16GB RAM minimum (32GB recommended)
- GPU with 12GB+ VRAM (NVIDIA/Intel recommended)
- 100GB free disk space
- Ubuntu 20.04+, macOS, or Windows 10+

**Software Requirements:**
```bash
# Install Python dependencies
pip install torch transformers peft huggingface-cli

# For Swedish training
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct
```

#### Step 1: Prepare Identity Dataset

**English Identity Dataset:**
```bash
# Dataset already provided at datasets/oneseek_identity_v1.jsonl
# Contains 74 bilingual examples (English + Swedish)

# Verify dataset
python scripts/train_identity.py --help
```

**Swedish Identity Dataset (Optional - for pure Swedish training):**
Create `datasets/oneseek_identity_sv_v1.jsonl`:
```jsonl
{"instruction": "Vem är du?", "input": "", "output": "Jag är OneSeek AI-agent..."}
{"instruction": "Vad gör du?", "input": "", "output": "Jag analyserar svar..."}
{"instruction": "Hur skiljer du dig från andra AI?", "input": "", "output": "Till skillnad från externa AI-tjänster..."}
```

#### Step 2: Train English Version (v1.1)

**Option A: Default Training**
```bash
# Train with default parameters (epochs=3, batch_size=8, lr=0.0001)
python scripts/train_identity.py

# Expected output:
# - models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.1.pth
# - models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.1.json
# - ml/ledger/ledger.json (provenance)
```

**Option B: Custom Parameters**
```bash
# Custom training with environment variables
EPOCHS=5 BATCH_SIZE=16 LEARNING_RATE=0.00005 \
python scripts/train_identity.py

# With specific dataset
python scripts/train_identity.py --dataset datasets/my_custom_dataset.jsonl
```

**Option C: Admin Dashboard**
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:3000/admin
4. Upload dataset in "Datasets" tab
5. Configure and start training in "Training" tab
6. Monitor progress in real-time

#### Step 3: Train Swedish Version (v1.1-SV)

**Prerequisite: Download Swedish Base Model**
```bash
# Download GPT-SW3-20B-Instruct
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct

# Verify download
ls ~/.cache/huggingface/hub/models--AI-Sweden-Models--gpt-sw3-20b-instruct/
```

**Train Swedish Version:**
```bash
# Train with Swedish language and external model integration
python scripts/train_identity.py \
  --language sv \
  --external-model AI-Sweden-Models/gpt-sw3-20b-instruct

# With custom Swedish dataset
python scripts/train_identity.py \
  --language sv \
  --external-model AI-Sweden-Models/gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl

# With custom parameters
EPOCHS=5 BATCH_SIZE=16 LEARNING_RATE=0.00005 \
python scripts/train_identity.py \
  --language sv \
  --external-model AI-Sweden-Models/gpt-sw3-20b-instruct

# Expected output:
# - models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.1-SV.pth
# - models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.1-SV.json
```

#### Step 4: Verify Training Results

**Check Model Files:**
```bash
# List generated model files
ls -lh models/oneseek-7b-zero/weights/

# Expected files:
# oneseek-7b-zero-v1.1.pth      (~14 GB)
# oneseek-7b-zero-v1.1.json     (metadata)
# oneseek-7b-zero-v1.1-SV.pth   (~14 GB) - if Swedish trained
# oneseek-7b-zero-v1.1-SV.json  (metadata)
```

**Inspect Metadata:**
```bash
# View training metadata
cat models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.1.json

# Should contain:
# - version: "v1.1"
# - language: "en" or "sv"
# - training parameters
# - performance metrics
# - provenance data
```

**Check Transparency Ledger:**
```bash
# View training provenance
cat ml/ledger/ledger.json

# Contains full training history and provenance chain
```

#### Step 5: Test Trained Models

**Start ML Service:**
```bash
# Terminal 1: ML Service
python ml_service/server.py
# Runs on http://localhost:5000

# Verify service is running
curl http://localhost:5000/
# Should return: {"service": "OneSeek-7B-Zero ML Service", "version": "1.1.0", ...}
```

**Test English Model:**
```bash
# Test inference
curl -X POST http://localhost:5000/inference/oneseek \
  -H "Content-Type: application/json" \
  -d '{"text": "What is democracy?", "max_length": 256}'

# Expected: Response from OneSeek-7B-Zero.v1.1
```

**Test Swedish Model (if trained):**
```bash
# Test Swedish inference
curl -X POST http://localhost:5000/inference/oneseek \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är demokrati?", "max_length": 256}'

# Expected: Response from OneSeek-7B-Zero-SV.v1.1
```

**Test via OQT Dashboard:**
```bash
# Terminal 2: Backend
cd backend && npm run dev  # Port 3001

# Terminal 3: Frontend
cd frontend && npm run dev  # Port 3000

# Open browser: http://localhost:3000/oqt-dashboard
# Ask questions in English or Swedish
# View: v1.0 (Base) → v1.1 (Current) ✓ indicator
```

#### Step 6: Monitor Training History

**View Training History:**
```bash
# Check training history file
cat ml/training_history.json

# Admin Dashboard: http://localhost:3000/admin
# Navigate to "Monitoring" tab → "Training History"
```

**Training Session Data Includes:**
- Model version (v1.1 or v1.1-SV)
- Language (en/sv)
- External model (if used)
- Dataset metadata
- Training parameters
- Performance metrics
- Provenance data

#### Step 7: Production Deployment

**Prepare for Production:**
```bash
# 1. Backup model weights
cp -r models/oneseek-7b-zero/weights/ backups/weights-$(date +%Y%m%d)/

# 2. Verify model integrity
python scripts/verify_model.py --version v1.1

# 3. Configure production environment
# Set ONESEEK_MODEL_PATH in .env to production path
echo "ONESEEK_MODEL_PATH=/production/path/to/models/oneseek-7b-zero" >> .env

# 4. Start services with production config
ML_SERVICE_PORT=5000 python ml_service/server.py
```

**Load Balancing (Optional):**
For high-traffic deployments, run multiple ML service instances:
```bash
# Instance 1
ML_SERVICE_PORT=5000 python ml_service/server.py &

# Instance 2
ML_SERVICE_PORT=5001 python ml_service/server.py &

# Configure nginx/HAProxy to load balance between ports 5000-5001
```

#### Troubleshooting

**Issue: Model not found**
```bash
# Check model path
ls -la C:\Users\robin\Documents\GitHub\CivicAI\models\oneseek-7b-zero

# Fallback to project-relative path if Windows path doesn't exist
ls -la models/oneseek-7b-zero
```

**Issue: Out of memory during training**
```bash
# Reduce batch size
BATCH_SIZE=4 python scripts/train_identity.py

# Use CPU if GPU memory insufficient
python ml_service/server.py  # Auto-detects and falls back to CPU
```

**Issue: Swedish model integration fails**
```bash
# Verify GPT-SW3-20B-Instruct download
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct --resume-download

# Check cache
ls ~/.cache/huggingface/hub/
```

**Issue: Training script errors**
```bash
# Enable debug output
python scripts/train_identity.py --help

# Check Python version
python --version  # Should be 3.10+

# Verify dependencies
pip install -r requirements.txt
```

### Next Steps

| Component | Status | Notes |
|-----------|--------|-------|
| **Model Routing to v1.1** | ✅ Complete | All queries route to OneSeek-7B-Zero.v1.1 |
| **Swedish Support** | ✅ Complete | Command-line and Admin dashboard support |
| **LoRA/PEFT Infrastructure** | ✅ Complete | Real PyTorch training operational |
| **Instruction Dataset** | ✅ Complete | 74 bilingual examples (English + Swedish) |
| **Initial Fine-Tuning** | ✅ Complete | v1.1 trained and operational |
| **Swedish Fine-Tuning** | ✅ Complete | GPT-SW3-20B-Instruct integration ready |
| **Real-Time Microtraining** | 🔄 In Progress | Backend hooks ready, training logic needed |
| **Identity Enforcement** | ✅ Complete | OpenSeek identity dataset integrated |
| **LoRA Adapter Storage** | ✅ Complete | Directory structure created |
| **Version Management** | ✅ Complete | v1.0 → v1.1 tracking system in place |
| **Metrics & Provenance** | ✅ Complete | Full tracking with language, model, params |
| **Admin Dashboard Integration** | ✅ Complete | Language selector and external model field |

### Next Steps

1. **Create Instruction Dataset** (Week 1)
   - Write 500 OpenSeek identity examples
   - Include Swedish and English variants
   - Add fairness/transparency focus

2. **Initial Fine-Tuning** (Week 2)
   - Fine-tune Mistral 7B with LoRA
   - Fine-tune LLaMA-2 with LoRA
   - Test identity responses

3. **Implement Microtraining** (Week 3)
   - Connect ai_interactions to training pipeline
   - Implement Stage 1 & 2 LoRA updates
   - Test version increments

4. **Deploy & Monitor** (Week 4)
   - Launch OQT-1.0.v1.0
   - Monitor identity consistency
   - Track performance metrics

---

## Ledger & Provenance

OQT-1.0 maintains **complete transparency** through blockchain-style ledger.

### Provenance Chain

Every OQT-1.0 response can be traced back through the entire process:

```
Question
  ↓
Raw AI Responses (6 services)
  ↓
ML Pipeline Analysis
  ↓
Training Stage 1 (Raw Data)
  ↓
Training Stage 2 (Analyzed Data)
  ↓
Model Version Update
  ↓
Ledger Block
  ↓
OQT-1.0 Response
```

### What's Logged:

1. **Original Question**
   - Text, timestamp, user

2. **Data Sources**
   - Which AI services responded
   - Response timestamps

3. **Analysis Results**
   - Consensus, bias, fairness scores
   - ML pipeline version

4. **Training Events**
   - Both training stages
   - Model versions before/after
   - Performance changes

5. **Model Updates**
   - Weight file paths
   - Checksums for verification

6. **Response Generation**
   - Which model version answered
   - Confidence score
   - Generation time

### Ledger Storage

**Primary**: `oqt_ledger` collection in Firebase  
**Backup**: Exported to blockchain-style blocks  

Each ledger entry includes:
- Timestamp
- Transaction type
- Data hash
- Previous block reference
- Immutable flag

### Transparency Dashboard

Users can view full provenance in **OQT Dashboard → Ledger tab**:
- See which AI services contributed to training
- View analysis metrics that influenced the model
- Trace model version evolution
- Verify data integrity via hashes

---

## OQT Dashboard

The OQT Dashboard (`/oqt-dashboard`) provides real-time interaction and monitoring of OQT-1.0.

### 4 Tabs:

### 1. Chat (Chatt)

**Purpose**: Direct conversation with OQT-1.0

**Features**:
- **Minimal chat interface** with message bubbles
- **User messages**: Light background, right-aligned
- **OQT-1.0 responses**: Dark background with 🤖 icon, left-aligned
- **Auto-scroll**: Automatically scrolls to latest message
- **Loading animation**: Bouncing dots during inference
- **Confidence score**: Shows OQT-1.0's confidence (0-100%)
- **Input field**: Fixed bottom, matches ChatV2 design

**User Experience**:
```
User: "What is democracy?"
  ↓
OQT-1.0 (93% confident):
"Democracy is a system of government where power is held by the 
people, either directly or through elected representatives..."
```

### 2. Aktivitet (Activity)

**Purpose**: Real-time training activity visualization

**Features** (Planned):
- **Live training log**: Shows each microtraining event as it happens
- **Training stages**: Visual indication of Stage 1 (raw) and Stage 2 (analyzed)
- **Version updates**: Real-time version increments
- **Performance metrics**: Loss improvements, accuracy changes
- **Timeline**: Chronological view of all training events

**Example Display**:
```
🔄 Training in progress...
├─ Stage 1: Raw data from 6 AI services
│  Model: OQT-1.0.v13.2 → v13.3
│  Samples: 6 | Duration: 45s | Loss: 0.245 → 0.241
│
├─ Stage 2: Analyzed metrics (consensus: 0.95, bias: 2.1)
│  Model: OQT-1.0.v13.3 → v13.4
│  Updates: fairness+0.02, bias_detection+0.01 | Duration: 38s
│
✅ Training complete! Model updated to OQT-1.0.v13.4
```

### 3. Mätvärden (Metrics)

**Purpose**: Model performance tracking over time

**Features** (Planned):
- **Performance graphs**: Response time, confidence, accuracy
- **Fairness metrics**: Bias scores, fairness index over time
- **Training statistics**: Total samples, training frequency
- **Comparison charts**: Current vs previous major version
- **Usage stats**: Queries processed, active users

**Example Metrics**:
```
Model Performance (OQT-1.0.v13.4)
├─ Average Confidence: 89%
├─ Response Time: 850ms
├─ User Satisfaction: 4.2/5
├─ Bias Score: 2.1/10 (Low)
├─ Fairness Index: 88% (Excellent)
└─ Queries Today: 45
```

### 4. Ledger

**Purpose**: Transparency and provenance tracking

**Features** (Planned):
- **Blockchain-style ledger**: Immutable transaction log
- **Provenance chains**: Trace any response back to sources
- **Data integrity**: Hash verification for all blocks
- **Audit trail**: Complete history of model updates
- **Search/filter**: Find specific transactions or questions

**Example Ledger Entry**:
```
Block #1523
├─ Timestamp: 2025-11-20 12:00:00
├─ Type: Microtraining
├─ Question: "What is democracy?"
├─ AI Sources: GPT-4, Gemini, Grok, Claude, DeepSeek, Qwen
├─ Training: Stage 1 (raw) + Stage 2 (analyzed)
├─ Version: OQT-1.0.v13.2 → v13.4
├─ Metrics: Consensus 0.95, Bias 2.1, Fairness 0.88
├─ Hash: sha256:a3f2...
└─ Previous: sha256:b1e4...
```

---

## Model Weights Storage

### Recommended Directory Structure

```
models/
└── oqt/
    ├── weights/
    │   ├── oqt-1.0-v1.0.pth              # Major version
    │   ├── oqt-1.0-v1.0.json             # Metadata
    │   ├── oqt-1.0-v1.1.pth              # Micro version
    │   ├── oqt-1.0-v1.1.json             # Metadata
    │   ├── oqt-1.0-v1.2.pth
    │   ├── oqt-1.0-v1.2.json
    │   └── ...
    │
    ├── checkpoints/
    │   ├── daily/
    │   │   ├── checkpoint-2025-11-20.pth
    │   │   └── ...
    │   └── weekly/
    │       ├── checkpoint-week-47.pth
    │       └── ...
    │
    ├── backups/
    │   ├── firebase-storage/             # Cloud backup sync
    │   └── local-backup/
    │
    └── base_models/
        ├── mistral-7b/                    # Mistral 7B weights
        └── llama-2-7b/                    # LLaMA-2 weights
```

### File Formats

**Model Weights**:
- **Format**: PyTorch `.pth` or Safetensors `.safetensors`
- **Size**: ~13-14 GB per version (7B parameters)
- **Compression**: None (for fast loading)

**Metadata JSON**:
```json
{
  "version": "OQT-1.0.v13.2",
  "created_at": "2025-11-20T12:00:00Z",
  "base_models": ["mistral-7b", "llama-2-7b"],
  "training": {
    "samples_processed": 15234,
    "last_major_training": "2025-11-13T00:00:00Z",
    "microtraining_events": 1523
  },
  "performance": {
    "average_confidence": 0.89,
    "bias_score": 2.1,
    "fairness_index": 0.88
  },
  "checksum": "sha256:a3f2e1b4...",
  "file_size_bytes": 14256789456
}
```

### Storage Strategy

1. **Local Storage** (Primary):
   - Fast access for inference
   - Keep last 3 major versions
   - Keep last 50 micro versions

2. **Firebase Storage** (Backup):
   - All major versions (permanent)
   - Last 100 micro versions (rolling)
   - Automatic sync after training

3. **Archival**:
   - Major versions archived monthly
   - Compressed for long-term storage
   - Accessible for rollback if needed

### Disk Space Requirements

- **Base models**: ~28 GB (Mistral 7B + LLaMA-2 7B)
- **OQT-1.0 versions**: ~14 GB per version
- **Recommended**: 100-200 GB SSD for local storage
- **Cloud backup**: Managed via Firebase Storage

---

## Implementation Status

### ✅ Fully Implemented

**Backend Services**:
- ✅ `services/mistral.js` - Mistral 7B integration (simulated)
- ✅ `services/llama.js` - LLaMA-2 integration (simulated)
- ✅ `services/oqtMultiModelPipeline.js` - Multi-model orchestration

**API Endpoints**:
- ✅ `/api/oqt/query` - Direct OQT-1.0 queries
- ✅ `/api/oqt/multi-model-query` - Multi-model pipeline

**Frontend**:
- ✅ OQT Dashboard with minimal chat interface
- ✅ 4 tabs: Chat, Aktivitet, Mätvärden, Ledger
- ✅ Chat functionality with message bubbles
- ✅ Auto-scroll and loading animations
- ✅ Input field matching ChatV2 design

**Firebase Integration**:
- ✅ Uses existing `ai_interactions` collection (PR #44)
- ✅ `oqt_queries` collection
- ✅ `oqt_training_events` collection
- ✅ `oqt_metrics` collection
- ✅ `oqt_ledger` collection
- ✅ Ledger services (`ledgerService.js`, `oqtLedgerService.js`)

**Infrastructure**:
- ✅ ML service skeleton (`ml_service/server.py`)
- ✅ Model download script (`scripts/download_models.py`)
- ✅ Firebase setup script (`scripts/setup_firebase.py`)
- ✅ Quick setup automation (`.sh` and `.ps1`)

**Documentation**:
- ✅ Installation guide (`INSTALLATION_GUIDE.md`)
- ✅ API documentation (`docs/OQT_MULTI_MODEL_API.md`)
- ✅ Implementation guide (`OQT_MULTI_MODEL_README.md`)
- ✅ Complete OQT-1.0 README (this document)

**ML Pipeline Libraries**:
- ✅ spaCy - NLP core processing
- ✅ TextBlob - Sentiment analysis  
- ✅ langdetect - Language detection
- ✅ Detoxify - Toxicity scoring
- ✅ Transformers - Model framework
- ✅ Gensim - Topic modeling
- ✅ Fairlearn - Fairness metrics
- ✅ Complete OQT-1.0 documentation (this file)

**Testing**:
- ✅ 14 tests for services and pipeline
- ✅ Frontend build verification

### 🔄 Needs Implementation

**ML Service (Actual Inference)**:
- 🔄 Real Mistral 7B model loading
- 🔄 Real LLaMA-2 model loading
- 🔄 GPU/CPU optimization
- 🔄 Model caching implementation
- 🔄 8-bit quantization

**Training Pipeline**:
- 🔄 Actual PyTorch training implementation
- 🔄 LoRA/PEFT fine-tuning setup
- 🔄 Stage 1: Raw data fine-tuning
- 🔄 Stage 2: Analyzed data fine-tuning
- 🔄 Large dataset training scheduler
- 🔄 Model weight persistence
- 🔄 Version management automation
- 🔄 Instruction dataset creation (500 OpenSeek identity examples)

**ML Pipeline - Advanced Libraries**:
- 🔄 SHAP - Explainability (partial integration)
- 📋 BERTopic - Advanced topic modeling
- 📋 LIME - Local explanations
- 📋 Lux - Dashboard visualizations
- 📋 Sweetviz - Data profiling

**BERT Summarizer Integration**:
- 🔄 BERT Summarizer library integration
- 📋 Raw response summarization (Week 1-2)
- 📋 Analysis summarization (metaSummary) (Week 2-3)
- ✅ Dashboard UI for summary display (ready)
- 📋 Training integration with summaries (Week 3-4)
- ✅ Provenance tracking (complete)

**Dashboard Tabs (Content)**:
- ✅ Chat tab (functional)
- 🔄 Aktivitet tab (placeholder → real-time training visualization)
- 🔄 Mätvärden tab (placeholder → performance graphs)
- 🔄 Ledger tab (placeholder → ledger blockchain view)

**Production Features**:
- 🔄 Model weight backups to Firebase Storage
- 🔄 Automatic rollback on failure
- 🔄 Performance monitoring alerts
- 🔄 Usage analytics
- 🔄 Rate limiting
- 🔄 Caching layer

### 📋 Development Roadmap

**Phase 1**: ML Infrastructure (Current)
- Implement actual model loading (Mistral 7B, LLaMA-2)
- GPU optimization and memory management
- Basic inference endpoint

**Phase 2**: Training Pipeline
- Stage 1 microtraining (raw data)
- Stage 2 microtraining (analyzed data)
- Weight persistence and versioning

**Phase 3**: Large Dataset Training
- Weekly/monthly batch training
- Major version management
- Checkpoint system

**Phase 4**: Dashboard Enhancement
- Real-time Aktivitet tab
- Performance Mätvärden graphs
- Ledger blockchain visualization

**Phase 5**: Production Hardening
- Monitoring and alerting
- Backup and recovery
- Performance optimization
- Security hardening

---

## API Endpoints

### 1. `/api/oqt/query`

**Method**: `POST`  
**Purpose**: Direct OQT-1.0 inference (used by dashboard)

**Request**:
```json
{
  "question": "What is democracy?",
  "user_id": "user-123" // optional
}
```

**Response**:
```json
{
  "response": "Democracy is a system of government...",
  "confidence": 0.93,
  "model_version": "OQT-1.0.v13.4",
  "base_models": ["mistral-7b", "llama-2-7b"],
  "generation_time_ms": 856,
  "provenance": {
    "training_sources": ["gpt4", "gemini", "grok"],
    "ledger_block": "ledger-hash-123"
  }
}
```

### 2. `/api/oqt/multi-model-query`

**Method**: `POST`  
**Purpose**: Multi-model pipeline for training data collection

**Request**:
```json
{
  "question": "What is democracy?",
  "includeExternal": true,
  "enableTraining": true
}
```

**Response**:
```json
{
  "response": "OQT-1.0 synthesized response...",
  "confidence": 0.92,
  "model_version": "OQT-1.0.v13.4",
  
  "external_responses": [
    {
      "service": "gpt4",
      "response": "Democracy is...",
      "latency_ms": 1234
    },
    // ... 5 more services
  ],
  
  "analysis": {
    "consensus": {
      "score": 0.95,
      "level": "high",
      "agreements": ["Democracy involves voting"],
      "disagreements": []
    },
    "bias": {
      "aggregated_score": 2.1,
      "level": "low",
      "types": []
    },
    "fairness": {
      "score": 0.88,
      "level": "excellent"
    }
  },
  
  "training": {
    "stage1": {
      "status": "completed",
      "samples_processed": 6,
      "model_updated": "OQT-1.0.v13.2 → v13.3"
    },
    "stage2": {
      "status": "completed",
      "metrics_updated": ["fairness", "bias_detection"],
      "model_updated": "OQT-1.0.v13.3 → v13.4"
    }
  },
  
  "ledger_block": "ledger-hash-123"
}
```

### 3. `/api/oqt/status`

**Method**: `GET`  
**Purpose**: Get current model status

**Response**:
```json
{
  "model_version": "OQT-1.0.v13.4",
  "status": "ready",
  "base_models": {
    "mistral-7b": "loaded",
    "llama-2-7b": "loaded"
  },
  "last_training": "2025-11-20T12:00:00Z",
  "queries_today": 45,
  "uptime_seconds": 86400
}
```

### 4. `/api/oqt/metrics`

**Method**: `GET`  
**Purpose**: Get performance metrics

**Response**:
```json
{
  "current_version": "OQT-1.0.v13.4",
  "performance": {
    "average_confidence": 0.89,
    "average_response_time_ms": 850,
    "user_satisfaction": 4.2
  },
  "fairness": {
    "bias_score": 2.1,
    "fairness_index": 0.88
  },
  "training": {
    "total_samples": 15234,
    "microtraining_events_today": 45
  }
}
```

---

## Firebase Collections (Aktuell Användning)

OQT-1.0 använder **6 collections** i Firebase Firestore. Redundanta collections har tagits bort baserat på faktisk användning i koden.

### Aktiva Collections:

#### 1. **`ai_interactions`**
- **Syfte**: Unified lagring av frågor, råsvar från externa AI-tjänster, och ML-pipeline-analyser
- **Datatyp**: Dokument med nested objekt
- **Schema**:
  ```javascript
  {
    interactionId: "auto-generated",
    question: {
      text: "Användarens fråga",
      timestamp: "ISO timestamp",
      userId: "valfritt",
      source: "start_view | oqt_dashboard"
    },
    raw_responses: [
      {
        service: "gpt4 | gemini | grok | claude | deepseek | qwen",
        response: "AI-svar text",
        timestamp: "ISO timestamp",
        latency_ms: 123,
        tokens: 150,
        model_version: "gpt-4-turbo"
      }
    ],
    processed_data: {
      consensus: { score: 0.95, level: "high", metrics: {} },
      bias: { aggregated_score: 2.1, level: "low", types: [] },
      fairness: { score: 0.88, level: "excellent" },
      meta_summary: { ... }
    },
    timestamp: "ISO timestamp"
  }
  ```
- **Användning**: Central datakälla för träning, analys och transparens

#### 2. **`oqt_queries`**
- **Syfte**: Direkta frågor till OQT-1.0 från dashboard
- **Datatyp**: Dokument
- **Schema**:
  ```javascript
  {
    queryId: "auto-generated",
    question: "Användarens fråga",
    response: "OQT-1.0 svar",
    confidence: 0.92,
    timestamp: "ISO timestamp",
    model: "OQT-1.0",
    version: "1.2.0",
    metadata: { tokens: 150, latency_ms: 850, modelsUsed: ["mistral", "llama"] }
  }
  ```
- **Användning**: Spårar användarinteraktioner med OQT-1.0

#### 3. **`oqt_training_events`**
- **Syfte**: Loggning av träningssessioner (micro-training och batch training)
- **Datatyp**: Dokument
- **Schema**:
  ```javascript
  {
    trainingId: "auto-generated",
    type: "micro-training | batch-training | weekly-training",
    timestamp: "ISO timestamp",
    samplesProcessed: 6,
    stage1: { method: "raw_response_training", samplesProcessed: 6, updated: true },
    stage2: { method: "analyzed_data_training", metricsUpdated: true },
    modelVersion: "1.2.0",
    metrics: { accuracy: 0.91, fairness: 0.88, bias: 2.1, consensus: 0.95 }
  }
  ```
- **Användning**: Transparens kring modellträning

#### 4. **`oqt_metrics`**
- **Syfte**: Prestationsmetriker för OQT-1.0 över tid
- **Datatyp**: Dokument
- **Schema**:
  ```javascript
  {
    metricId: "auto-generated",
    version: "1.2.0",
    timestamp: "ISO timestamp",
    metrics: { accuracy: 0.91, fairness: 0.88, bias: 2.1, consensus: 0.95 },
    training: { totalSamples: 15234, weeklyBatches: 12, microBatches: 1523 }
  }
  ```
- **Användning**: Dashboard "Mätvärden" tab

#### 5. **`oqt_provenance`**
- **Syfte**: Provenienshantering för transparens
- **Datatyp**: Dokument
- **Schema**:
  ```javascript
  {
    provenanceId: "auto-generated",
    queryId: "referens till oqt_queries",
    timestamp: "ISO timestamp",
    model: "OQT-1.0",
    version: "1.2.0",
    processingSteps: [
      { step: "tokenization", timestamp: "ISO timestamp" },
      { step: "inference", timestamp: "ISO timestamp" }
    ],
    inputHash: "hash av input"
  }
  ```
- **Användning**: Fullständig spårbarhet av beslut

#### 6. **`oqt_ledger`**
- **Syfte**: Blockchain-stil immutable ledger
- **Datatyp**: Dokument
- **Schema**:
  ```javascript
  {
    blockNumber: 1523,
    type: "query | training | update",
    timestamp: "ISO timestamp",
    data: { queryId: "...", trainingId: "...", description: "..." },
    hash: "SHA256 hash av block",
    previousHash: "hash av föregående block"
  }
  ```
- **Användning**: Orubblig logg för full transparens

### Borttagna Collections (Redundanta):

Följande collections har tagits bort från `setup_firebase.py` eftersom deras data redan finns i befintliga collections:

- ❌ **`questions`** → Data finns i `ai_interactions.question`
- ❌ **`external_raw_responses`** → Data finns i `ai_interactions.raw_responses[]`
- ❌ **`per_response_analysis`** → Data finns i `ai_interactions.processed_data`
- ❌ **`oqt_model_versions`** → Kan härledas från `oqt_training_events`
- ❌ **`ledger_entries`** → Duplikat av `oqt_ledger`

---

## API Endpoints Status

### OQT-1.0 Core Endpoints

| Endpoint | Method | Status | Beskrivning |
|----------|--------|--------|-------------|
| `/api/oqt/query` | POST | ✅ UP | Generera svar från OQT-1.0 (simulerat) |
| `/api/oqt/multi-model-query` | POST | ✅ UP | Multi-model pipeline (Mistral + LLaMA + analys) |
| `/api/oqt/micro-train` | POST | ✅ UP | Real-time micro-training (två-stegs) |
| `/api/oqt/train` | POST | ✅ UP | Veckovis batch-träning (simulerat) |
| `/api/oqt/status` | GET | ✅ UP | Modellstatus och hälsa |
| `/api/oqt/metrics` | GET | ✅ UP | Prestationsmetriker |
| `/api/oqt/ledger/verify` | GET | ✅ UP | Verifiera ledger-integritet |
| `/api/oqt/ledger/stats` | GET | ✅ UP | Ledger-statistik |

### ML Service Endpoints (Port 5000)

| Endpoint | Method | Status | Beskrivning |
|----------|--------|--------|-------------|
| `/` | GET | ✅ UP | Hälsokontroll |
| `/inference/mistral` | POST | 🔄 SKELETON | Mistral 7B inferens (kräver nedladdad modell) |
| `/inference/llama` | POST | 🔄 SKELETON | LLaMA-2 inferens (kräver nedladdad modell) |
| `/models/status` | GET | ✅ UP | Status för laddade modeller |

### Endpoint Status-förklaring:

- ✅ **UP**: Fullt funktionell (kan vara simulerad)
- 🔄 **SKELETON**: Kodskelett finns, kräver modellnedladdning för verklig inferens
- ⚠️ **PARTIAL**: Delvis implementerad
- ❌ **DOWN**: Ej implementerad/fungerar inte

### Testa Endpoints:

```bash
# Testa OQT query
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vad är demokrati?"}'

# Testa multi-model query
curl -X POST http://localhost:3001/api/oqt/multi-model-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vad är AI?", "includeExternal": false, "enableTraining": true}'

# Testa ML service (kräver nedladdade modeller)
curl -X POST http://localhost:5000/inference/mistral \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är AI?", "max_length": 256}'

# Kontrollera status
curl http://localhost:3001/api/oqt/status
curl http://localhost:5000/
```

---

## Implementation Status & Integration

### ✅ Fullt Implementerat

**Backend Services**:
- ✅ `services/mistral.js` - Mistral 7B integration (simulerad tills modell laddas)
- ✅ `services/llama.js` - LLaMA-2 integration (simulerad tills modell laddas)
- ✅ `services/oqtMultiModelPipeline.js` - Multi-model orkestrering

**API Endpoints**:
- ✅ `/api/oqt/query` - Direkt OQT-1.0 frågor
- ✅ `/api/oqt/multi-model-query` - Multi-model pipeline med analys
- ✅ `/api/oqt/micro-train` - Real-time micro-training
- ✅ `/api/oqt/train` - Batch training
- ✅ Alla status/metrics endpoints

**Frontend**:
- ✅ OQT Dashboard (`/oqt-dashboard`)
- ✅ Chat-funktionalitet med meddelandebubblor
- ✅ 4 flikar: Chat, Aktivitet, Mätvärden, Ledger
- ✅ Auto-scroll och laddningsanimationer

**Firebase Integration**:
- ✅ 6 centrala collections (se ovan)
- ✅ Ledger services (`ledgerService.js`, `oqtLedgerService.js`)
- ✅ Firebase service (`oqtFirebaseService.js`)

**Infrastruktur**:
- ✅ ML service skeleton (`ml_service/server.py`)
- ✅ Modellnedladdningsskript (`scripts/download_models.py`)
- ✅ Firebase setup script (`scripts/setup_firebase.py`)
- ✅ Snabbinstallation (`.sh` och `.ps1`)

**Dokumentation**:
- ✅ Installationsguide (`INSTALLATION_GUIDE.md`)
- ✅ API-dokumentation (`docs/OQT_MULTI_MODEL_API.md`)
- ✅ Komplett OQT-1.0 README (detta dokument)

### 🔄 Kräver Modellnedladdning

**ML Service (Verklig Inferens)**:
- 🔄 Mistral 7B modell laddning och inferens
- 🔄 LLaMA-2 modell laddning och inferens
- 🔄 GPU/CPU optimering
- 🔄 8-bit quantization

**Träningspipeline**:
- 🔄 PyTorch-baserad träning
- 🔄 LoRA/PEFT fine-tuning
- 🔄 Stage 1: Rådataträning
- 🔄 Stage 2: Analyserad dataträning
- 🔄 Modellversionering

### Köra Systemet

**1. Simulerat Läge (Fungerar Nu)**:
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: ML Service (optional - skeleton)
python ml_service/server.py

# Öppna: http://localhost:3000/oqt-dashboard
```

**Status**: ✅ Alla endpoints fungerar med simulerade svar

**2. Verkligt Läge (Kräver Modellnedladdning)**:
```bash
# 1. Ladda ner modeller
python scripts/download_models.py

# 2. Kör samma som ovan
# ML service kommer nu använda verkliga modeller
```

**Status**: 🔄 Kräver ~27GB modellfiler (Mistral 7B + LLaMA-2)

### Verklig vs Simulerad Inferens

| Komponent | Simulerat (Nu) | Verkligt (Efter Nedladdning) |
|-----------|----------------|------------------------------|
| **Mistral 7B** | ✅ Förutbestämda svar | 🔄 Verklig transformer-inferens |
| **LLaMA-2** | ✅ Förutbestämda svar | 🔄 Verklig transformer-inferens |
| **Pipeline** | ✅ Fungerar fullt | ✅ Samma (analyspipeline) |
| **Träning** | ✅ Simulerad metricsuppdatering | 🔄 Verklig LoRA fine-tuning |
| **Dashboard** | ✅ Fullt funktionell | ✅ Samma |
| **API** | ✅ Alla endpoints | ✅ Samma |

### Nästa Steg för Full Implementation

1. **Ladda Ner Modeller** (27GB totalt):
   ```bash
   python scripts/download_models.py
   ```

2. **Verifiera Modellfiler**:
   ```bash
   ls -lh models/mistral-7b-instruct/
   ls -lh models/llama-2-7b-chat/
   ```

3. **Implementera Verklig Träning**:
   - LoRA adapters för Mistral 7B
   - LoRA adapters för LLaMA-2
   - Stage 1 & 2 micro-training

4. **Optimering**:
   - GPU acceleration
   - Model caching
   - 8-bit quantization

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- 16GB RAM minimum (32GB recommended)
- 50GB disk space minimum
- NVIDIA GPU with 12GB+ VRAM (recommended)

### Installation

**Automated (Recommended)**:

```bash
# Linux/Mac
./scripts/quick_setup.sh

# Windows PowerShell
.\scripts\quick_setup.ps1
```

**Manual**:

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\Activate.ps1  # Windows

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Download base models
python scripts/download_models.py

# 4. Setup Firebase
python scripts/setup_firebase.py

# 5. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your Firebase credentials

# 6. Install Node.js dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application

**Terminal 1 - ML Service**:
```bash
source venv/bin/activate  # Activate venv
python ml_service/server.py
# Runs on http://localhost:5000
```

**Terminal 2 - Backend**:
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

**Access OQT Dashboard**:
```
http://localhost:3000/oqt-dashboard
```

---

## Performance Metrics

### Current Performance (Simulated)

| Metric | Value | Target |
|--------|-------|--------|
| **Response Time** | ~850ms | <1s |
| **Confidence** | 89% avg | >90% |
| **Bias Score** | 2.1/10 | <3.0 |
| **Fairness Index** | 88% | >85% |
| **Training Time** | ~90s/question | <60s |
| **GPU Memory** | ~8GB | <12GB |

### Expected Performance (With Real Models)

| Metric | Value | Notes |
|--------|-------|-------|
| **Response Time** | 1-2s | With GPU |
| **Response Time** | 5-10s | CPU only |
| **Confidence** | 90-95% | After training |
| **Bias Score** | <2.0 | With improvements |
| **Fairness Index** | >90% | Goal |
| **Queries/hour** | 1000+ | With caching |

---

## Summary

**OneSeek-7B-Zero** (formerly OQT-1.0) is an independent, transparent, continuously-learning language model built on **Mistral 7B** and **LLaMA-2** foundations. It learns from 6 external AI services through a sophisticated two-step microtraining process, maintains complete transparency via blockchain-style ledger, and provides users with fair, unbiased, traceable responses.

**Key Differentiators**:
- ✅ Own model (not just API wrapper)
- ✅ Real-time learning on every question
- ✅ Full transparency & provenance
- ✅ Bias detection & fairness optimization
- ✅ User-friendly dashboard interface
- ✅ **Identity training with LoRA/PEFT for OpenSeek AI-agent personality**

---

## Phase 2 Completion Status (November 2025)

### ✅ Completed in This Phase

**1. Model Identity & Naming**:
- ✅ Renamed from OQT-1.0 to OneSeek-7B-Zero
- ✅ Implemented versioning: `OneSeek-7B-Zero.v{MAJOR}.{MICRO}`
- ✅ Maintained backward compatibility for all OQT references
- ✅ Updated all documentation and code references

**2. Instruction Dataset & Identity Training**:
- ✅ Created identity dataset: `datasets/oneseek_identity_v1.jsonl` (74 bilingual examples)
- ✅ Covers: Identity, training process, transparency, fairness, bias detection, versioning
- ✅ Bilingual support (Swedish/English) for OpenSeek identity
- ✅ Dataset integrated into training pipeline structure

**3. Training Pipeline Framework**:
- ✅ PyTorch trainer implementation: `ml/training/train_language_model.py`
- ✅ OneSeekTrainer class with LoRA/PEFT configuration
- ✅ Auto-detection of PyTorch, Transformers, PEFT libraries
- ✅ Real LoRA/PEFT training when dependencies available
- ✅ Automatic fallback to simulation mode when dependencies missing
- ✅ Two-stage training architecture (Stage 1: raw data, Stage 2: analyzed metrics)

**4. Model Storage Structure**:
- ✅ Complete directory hierarchy established
- ✅ Proper naming convention: `oneseek-7b-zero-v{MAJOR}.{MICRO}.pth/json`
- ✅ Supports both new structure (`models/oneseek-7b-zero/`) and legacy paths
- ✅ Auto-detects existing models at `models/mistral-7b-instruct/` and `models/llama-2-7b-chat/`
- ✅ LoRA adapter storage: `models/oneseek-7b-zero/lora_adapters/`
- ✅ Checkpoints: daily/ and weekly/ subdirectories
- ✅ Backups: firebase-storage/ and local-backup/

**5. PyTorch Training Implementation**:
- ✅ Real PyTorch/LoRA training module: `ml/training/pytorch_trainer.py`
- ✅ Smart base model detection (multiple location search)
- ✅ GPU/CPU auto-detection
- ✅ 8-bit quantization support
- ✅ Robust error handling with multiple fallback strategies
- ✅ Tokenizer loading with automatic recovery from symlink issues
- ✅ Dependency version management (protobuf==3.20.3)

**6. Quick-Start Training Script**:
- ✅ One-command training: `python scripts/train_identity.py`
- ✅ Automatic dataset verification and conversion
- ✅ Integrated data preparation pipeline
- ✅ PyTorch auto-detection with clear status reporting
- ✅ Progress reporting and error messages
- ✅ Works with existing model installations

**7. Complete Documentation**:
- ✅ Main README with OneSeek-7B-Zero section and 11-step training guide
- ✅ OQT-1.0-README.md updated with new identity and backward compatibility notes
- ✅ SNABBSTART_TRÄNING.md - Swedish quick-start guide with protobuf fix
- ✅ ml/training/PYTORCH_TRAINING.md - Complete PyTorch setup guide
- ✅ ONESEEK_7B_ZERO_MIGRATION_GUIDE.md - Migration documentation
- ✅ models/oneseek-7b-zero/MODEL_STORAGE_STRUCTURE.md - Storage documentation

**8. Bug Fixes & Robustness**:
- ✅ Fixed tokenizer loading errors (symlink issues on Windows)
- ✅ Fixed protobuf dependency conflicts (version pinning)
- ✅ Fixed model path detection (supports multiple locations)
- ✅ Auto-recovery from loading failures
- ✅ Clear error messages with exact fix instructions

### 🎯 Training Status

**Identity Training Working!**
- ✅ PyTorch training pipeline operational: `python scripts/train_identity.py`
- ✅ Uses existing Mistral 7B and LLaMA-2 models from `models/mistral-7b-instruct/` and `models/llama-2-7b-chat/`
- ✅ LoRA/PEFT parameter-efficient fine-tuning (~0.1% of parameters trainable)
- ✅ Saves model versions with proper naming: `oneseek-7b-zero-v1.0.pth`
- ✅ Transparency ledger integration
- ✅ Full metadata and provenance tracking

**Training Output Structure**:
```
models/oneseek-7b-zero/
├── weights/
│   ├── oneseek-7b-zero-v1.0.pth         # Full model state
│   └── oneseek-7b-zero-v1.0.json        # Metadata with provenance
├── lora_adapters/
│   └── oneseek-7b-zero-v1.0/
│       ├── adapter_config.json           # LoRA configuration
│       └── adapter_model.bin             # LoRA weights (~50-100MB)
└── ml/ledger/ledger.json                 # Transparency log
```

---

## Next Development Phase: Admin Dashboard for OpenSeek

### 📋 Phase 3 Objectives

**Purpose**: Create a dedicated admin dashboard for managing OneSeek-7B-Zero training and dataset operations.

**Key Features**:

**1. Dataset Management**:
- Upload new training datasets (JSONL format)
- Browse and preview existing datasets
- Validate dataset format and quality
- Edit dataset entries inline
- Version control for datasets

**2. Training Control Panel**:
- Select dataset for training
- Configure training parameters (epochs, batch size, learning rate)
- Start/stop training sessions
- Monitor real-time training progress
- View training logs and metrics

**3. Model Management**:
- List all model versions
- View model metadata and performance metrics
- Download model weights and LoRA adapters
- Compare versions side-by-side
- Rollback to previous versions

**4. Real-time Monitoring**:
- Live training progress (loss, accuracy)
- GPU/CPU utilization graphs
- Training time estimates
- Resource usage tracking

**5. Automation & Scheduling**:
- Schedule periodic training (weekly/monthly batch training)
- Auto-training on new datasets
- Notification system for training completion
- Automatic backup to Firebase Storage

**Frontend Location**: `/admin/oneseek-dashboard` or `/oneseek-admin`

**Technology Stack**:
- React with existing UI components
- Real-time updates via Firebase listeners
- Chart.js or Recharts for visualizations
- File upload with drag-and-drop

**Benefits**:
- ✅ No command-line needed for training
- ✅ Non-technical users can train models
- ✅ Visual feedback for all operations
- ✅ Centralized model management
- ✅ Easy dataset experimentation

**Timeline**: Next milestone after Phase 2 completion

---

## Phase 3: Admin Dashboard for OneSeek-7B-Zero (✅ COMPLETED)

### Overview

The **Admin Dashboard** provides a comprehensive web interface for managing OneSeek-7B-Zero training and dataset operations. Located at `/admin`, it matches the graphical profile and UI/UX of `/api-docs` and `/oqt-dashboard`.

### Features Implemented

#### 1. **Dataset Management** ✅
- **Upload Interface**: Drag-and-drop file upload supporting JSONL and JSON formats
- **File Validation**: Real-time validation of dataset format and quality
- **Dataset Browser**: List all uploaded datasets with metadata (entries count, size, upload date)
- **Preview Modal**: View dataset contents in a formatted JSON preview
- **Quality Metrics**: Display validation results showing valid/invalid entries
- **Delete Functionality**: Remove unwanted datasets

**Key Components:**
- Drag-and-drop upload zone with visual feedback
- Automatic file validation on upload
- Dataset preview with syntax highlighting
- Error reporting for invalid entries

#### 2. **Training Control Panel** ✅
- **Dataset Selection**: Choose from available datasets for training
- **Parameter Configuration**: Adjust epochs, batch size, and learning rate
- **Training Controls**: Start/stop training sessions
- **Real-time Status**: Monitor training progress, current epoch, and loss
- **Progress Bar**: Visual representation of training completion
- **Training Logs**: Live log viewer showing training events

**Training Parameters:**
- Epochs: 1-100 (default: 3)
- Batch Size: 1-64 (default: 8)
- Learning Rate: 0.00001-0.01 (default: 0.0001)

#### 3. **Model Management** ✅
- **Version List**: Display all model versions with metadata
- **Current Model Indicator**: Highlight the active model version
- **Model Comparison**: Side-by-side comparison of up to 2 model versions
- **Download Options**: Download model weights and LoRA adapters
- **Rollback Functionality**: Restore previous model versions
- **Detailed Metrics**: View loss, accuracy, fairness, and other performance metrics

**Model Information:**
- Version identifier (e.g., OneSeek-7B-Zero.v1.0)
- Creation timestamp
- Training type (initial, micro-training, batch)
- Samples processed
- Performance metrics

#### 4. **Monitoring Dashboard** ✅
- **Resource Charts**: Real-time CPU and GPU usage visualization using Chart.js
- **Training History**: List of recent training sessions with metrics
- **Notifications System**: Alert users about training completion and events
- **Training Scheduler**: Configure periodic and automatic training
- **Live Updates**: Polling-based real-time data refresh (5-second intervals)

**Monitoring Features:**
- CPU/GPU usage line charts (last 50 data points)
- Training schedule configuration (manual, daily, weekly, monthly)
- Auto-train on new data toggle
- Notification management with dismiss functionality

### UI/UX Design

The admin dashboard follows the established OneSeek design language:

**Color Scheme:**
- Background: `#0a0a0a` (dark black)
- Panels: `#111` (dark gray)
- Borders: `#2a2a2a` (medium gray)
- Text: `#eee` (primary), `#888` (secondary), `#666` (tertiary)
- Accents: Minimalist borders and subtle hover effects

**Typography:**
- Font: Monospace (system font stack)
- Sizes: 10-18px for various UI elements
- Consistent spacing and alignment

**Layout:**
- Tab-based navigation (Datasets, Training, Models, Monitoring)
- Responsive grid layouts
- Modal dialogs for detailed views
- Fixed headers with consistent branding

### Access Control

**Admin Authentication:**
- Route protected by admin role check
- User role stored in localStorage (`oneseek_user`)
- Access denied page for non-admin users
- Graceful redirect to homepage

**Note:** Current implementation uses simplified client-side role checking. For production, implement server-side authentication middleware.

### Backend API Endpoints

All admin endpoints are prefixed with `/api/admin`:

**Dataset Management:**
- `GET /api/admin/datasets` - List all datasets
- `POST /api/admin/datasets/upload` - Upload new dataset (multipart/form-data)
- `GET /api/admin/datasets/:id/validate` - Validate dataset format
- `DELETE /api/admin/datasets/:id` - Delete dataset

**Training Control:**
- `GET /api/admin/training/status` - Get current training status
- `POST /api/admin/training/start` - Start training session
- `POST /api/admin/training/stop` - Stop training

**Model Management:**
- `GET /api/admin/models` - List all model versions
- `GET /api/admin/models/:id/download?type=weights|lora` - Download model
- `POST /api/admin/models/:id/rollback` - Rollback to model version

**Monitoring:**
- `GET /api/admin/monitoring/resources` - Get CPU/GPU metrics
- `GET /api/admin/monitoring/training-history` - Get training history
- `GET /api/admin/monitoring/schedule` - Get training schedule
- `POST /api/admin/monitoring/schedule` - Update training schedule
- `GET /api/admin/monitoring/notifications` - Get notifications
- `DELETE /api/admin/monitoring/notifications/:id` - Clear notification

### Firebase Integration

The admin dashboard integrates with existing Firebase collections:

**Collections Used:**
- `oqt_training_events` - Training session logs
- `oqt_queries` - Model inference queries
- `oqt_ledger` - Immutable training and query ledger
- `oqt_provenance` - Provenance tracking
- `oqt_metrics` - Model performance metrics

**Real-time Updates:**
- Polling-based updates (5-second intervals)
- Can be enhanced with Firebase real-time listeners

### File Upload & Validation

**Supported Formats:**
- JSONL (JSON Lines) - Preferred format
- JSON (Array of objects)

**Validation Rules:**
- Each line/entry must be valid JSON
- Maximum file size: 100MB
- Automatic error reporting with line numbers

**Example Valid JSONL Entry:**
```jsonl
{"instruction": "Who are you?", "input": "", "output": "I am OpenSeek AI-agent..."}
{"instruction": "What is democracy?", "input": "", "output": "Democracy is..."}
```

### Training Workflow

1. **Upload Dataset**: Drag-and-drop or browse to upload JSONL file
2. **Validate**: System automatically validates format and counts entries
3. **Configure**: Set training parameters (epochs, batch size, learning rate)
4. **Start Training**: Click "Start Training" button
5. **Monitor**: Watch real-time progress, logs, and metrics
6. **Completion**: Receive notification when training finishes
7. **Review**: Check model metrics and compare with previous versions

### Technology Stack

**Frontend:**
- React 18+ with hooks
- React Router for navigation
- Chart.js + react-chartjs-2 for visualizations
- Tailwind CSS for styling
- Fetch API for backend communication

**Backend:**
- Express.js REST API
- Multer for file upload handling
- In-memory state (can be replaced with database)
- Firebase integration (existing infrastructure)

**Charts:**
- Chart.js configured with dark theme
- Responsive line charts for metrics
- Monospace font labels
- Custom color scheme matching UI

### Usage Instructions

**Access the Dashboard:**
1. Navigate to `http://localhost:3000/admin` (or your deployment URL)
2. Ensure you have admin privileges (role: "admin" or isAdmin: true in user object)

**Upload a Dataset:**
1. Go to "Datasets" tab
2. Drag JSONL file to upload zone or click "Browse Files"
3. Review validation results
4. Dataset appears in list below

**Start Training:**
1. Go to "Training" tab
2. Select a dataset from dropdown
3. Configure parameters (epochs, batch size, learning rate)
4. Click "Start Training"
5. Monitor progress in real-time

**Manage Models:**
1. Go to "Models" tab
2. View all model versions
3. Click "Details" to see full metadata
4. Download weights or LoRA adapters
5. Rollback to previous version if needed

**Monitor System:**
1. Go to "Monitoring" tab
2. View CPU/GPU usage charts
3. Check training history
4. Configure training schedule
5. Manage notifications

### Benefits

✅ **No Command Line Required**: Entire training workflow accessible via web UI  
✅ **Visual Feedback**: Real-time charts, progress bars, and status indicators  
✅ **User-Friendly**: Drag-and-drop uploads, intuitive controls  
✅ **Transparency**: Full visibility into training process and model versions  
✅ **Accessible**: Non-technical users can train and manage models  
✅ **Centralized**: All operations in one dashboard  
✅ **Version Control**: Easy comparison and rollback  
✅ **Monitoring**: Resource usage and training history tracking  

### Future Enhancements

**Planned Features:**
- [ ] Firebase real-time listeners for live updates (replace polling)
- [ ] Advanced dataset editing (inline edit, search, filter)
- [ ] Model comparison diff view
- [ ] Training queue management
- [ ] Automatic backup to Firebase Storage
- [ ] Email/push notifications
- [ ] Advanced resource monitoring (memory, disk)
- [ ] Training cost estimation
- [ ] Model performance benchmarking
- [ ] Export training reports
- [ ] Multi-user collaboration features

### Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Dataset Upload | ✅ Complete | Drag-and-drop, validation |
| Dataset Management | ✅ Complete | List, preview, delete |
| Training Control | ✅ Complete | Start/stop, parameters |
| Training Monitoring | ✅ Complete | Progress, logs, metrics |
| Model Listing | ✅ Complete | All versions with metadata |
| Model Comparison | ✅ Complete | Side-by-side 2 models |
| Model Download | 🔄 Partial | API ready, needs file streaming |
| Model Rollback | 🔄 Partial | API ready, needs implementation |
| CPU/GPU Charts | ✅ Complete | Real-time visualization |
| Training History | ✅ Complete | Recent sessions list |
| Notifications | ✅ Complete | Alert system |
| Training Schedule | ✅ Complete | Periodic, auto-train config |
| Access Control | ✅ Complete | Admin role check |
| Firebase Integration | 🔄 Partial | Using existing collections |

---

## Next Development Phase: Advanced Features

**Timeline**: Next milestone after Phase 3 completion

**Current Status**: **Phase 2 Complete!** ✅ Training pipeline fully operational with real PyTorch/LoRA training.

**Phase 3 Status**: **Admin Dashboard Implemented!** ✅ Web-based training and model management interface.

**Next Steps**: Begin Phase 4 - Advanced monitoring and automation features

---

## Changelog

### Version 1.1 (November 2025) - Current Release

**Major Changes:**
- ✅ Unified all model routing to OneSeek-7B-Zero.v1.1
- ✅ Added Swedish language support (OneSeek-7B-Zero-SV.v1.1)
- ✅ Integrated GPT-SW3-20B-Instruct for Swedish training
- ✅ Enhanced metrics, versioning, and provenance tracking
- ✅ Admin dashboard with language selector and external model integration
- ✅ Command-line flags for Swedish training (--language, --external-model)

**Model Routing:**
- Primary endpoint: `/inference/oneseek`
- Legacy endpoints redirect to v1.1: `/inference/mistral`, `/inference/llama`
- Model path: `C:\Users\robin\Documents\GitHub\CivicAI\models\oneseek-7b-zero`

**Training Enhancements:**
- Language support: English (en), Swedish (sv)
- External model integration for cross-training
- Version naming: v1.1 (English), v1.1-SV (Swedish)
- Enhanced metrics: language, external model, latency, provenance

**Admin Dashboard:**
- Language dropdown (English/Swedish)
- External model input field
- Real-time version display (v1.0 → v1.1)
- Training session tracking with full metadata

**Documentation:**
- New section: OneSeek-7B-Zero v1.1 Update
- Swedish Training with GPT-SW3-20B-Instruct guide
- Command-line and dashboard usage examples
- Migration guide from v1.0 to v1.1

**Related PRs:**
- Building on PR #60 and PR #61
- Current PR: OneSeek-7B-Zero v1.1 routing and Swedish training pipeline

### Version 1.0 (October 2025) - Initial Release

**Features:**
- Initial OneSeek-7B-Zero model with Mistral 7B and LLaMA-2 base models
- LoRA/PEFT parameter-efficient fine-tuning
- Identity training with bilingual dataset (74 examples)
- Admin dashboard for training and model management
- Real-time microtraining capability
- Transparency ledger and provenance tracking
- Firebase integration for metrics and history
- OQT Dashboard for user interaction

---

**For more information**:
- Installation: See `INSTALLATION_GUIDE.md`
- API Reference: See `docs/OQT_MULTI_MODEL_API.md`
- Implementation: See `OQT_MULTI_MODEL_README.md`
- Training Guide: See `SNABBSTART_TRÄNING.md` (Swedish) or `README.md` (English)
- PyTorch Setup: See `ml/training/PYTORCH_TRAINING.md`

---

## DNA Fingerprint v2 Specification

### Overview

DNA Fingerprint v2 provides **cryptographic provenance** and **immutability** for OneSeek-7B-Zero models. Every training run produces a unique DNA fingerprint that encodes model metadata, training configuration, and dataset information in a tamper-proof format.

### DNA Format

```
OneSeek-7B-Zero.v{VERSION}.{WEIGHTS_HASH}.{CATEGORIES_HASH}.{TIMESTAMP_HASH}
```

**Example:**
```
OneSeek-7B-Zero.v1.0.6b30afe8.4539991e.a16f0dd0
```

**Components:**
- `OneSeek-7B-Zero`: Model name
- `v1.0`: Version number (MAJOR.MICRO)
- `6b30afe8`: First 8 chars of SHA-256 hash of canonical JSON of final weights
- `4539991e`: First 8 chars of SHA-256 hash of sorted dataset categories
- `a16f0dd0`: First 8 chars of SHA-256 hash of ISO timestamp

### Canonical JSON Rules

All hashing uses **canonical JSON** to ensure determinism:
- Keys sorted alphabetically
- UTF-8 encoding
- No whitespace (compact format)
- Consistent number formatting

**Example:**
```python
from src.training.dna import canonical_json

obj = {"b": 2, "a": 1}
canonical = canonical_json(obj)
# Result: b'{"a":1,"b":2}'
```

### Signing Algorithm

Ledger entries are signed using **Ed25519** (NaCl/libsodium):
- Signing key: 32 bytes (private key)
- Verify key: 32 bytes (public key)
- Signature: 64 bytes
- All values stored as hexadecimal strings

**Key Generation (for testing):**
```python
from src.training.dna import generate_test_keypair

# WARNING: Only for testing! Use proper key management in production
private_key, public_key = generate_test_keypair('/path/to/keys')
```

**Production Key Management:**
- Store private keys in HSM (Hardware Security Module) or secure vault
- Never commit private keys to git
- Use environment variable `LEDGER_PRIVATE_KEY_PATH` to reference key file
- Rotate keys periodically

### Ledger Entry Schema

```json
{
  "event": "training",
  "model": "OneSeek-7B-Zero",
  "version": "1.0",
  "dna": "OneSeek-7B-Zero.v1.0.6b30afe8.4539991e.a16f0dd0",
  "dataset_hashes": [
    {
      "path": "/path/to/dataset.jsonl",
      "hash": "sha256_hash_of_dataset_file"
    }
  ],
  "final_weights": {
    "mistral-7b": 0.6,
    "llama-2": 0.4
  },
  "training_config": {
    "epochs": 10,
    "base_lr": 0.0001,
    "seed": 42
  },
  "timestamp": "2025-11-21T12:00:00Z",
  "immutable_hash": "sha256_hash_of_entire_payload",
  "signature": "ed25519_signature_hex",
  "signer_public_key": "ed25519_public_key_hex"
}
```

### Dataset Category Extraction

Categories are extracted from dataset filenames using these rules:
- Split on `_`, `-`, and `.`
- Convert to lowercase for matching
- Map tokens to canonical tags

**Canonical Tags:**
- `CivicID` ← civic, civicid, civic_id
- `Identity` ← identity, id
- `SwedID` ← swedish, swed, sv, swedid
- `Privacy` ← privacy, private, gdpr
- `Nordic` ← nordic, scandinavian
- `Fairness` ← fairness, fair, bias, unbiased
- `Transparency` ← transparency
- `Ethics` ← ethics, ethical
- `Multilingual` ← multilingual
- `QA` ← qa, question, answer
- `Instruction` ← instruction, instruct
- `Conversational` ← chat, conversation, dialog

**Example:**
```python
from src.training.dataset_parser import extract_categories_from_filenames

files = [
    "civic_identity_train.jsonl",
    "swedish-privacy-data.json",
    "fairness_nordic.jsonl"
]

categories = extract_categories_from_filenames(files)
# Result: {'CivicID', 'Identity', 'SwedID', 'Privacy', 'Fairness', 'Nordic'}
```

### Adaptive Weight Adjustment

Training dynamically adjusts model weights based on validation loss:

**Rules:**
- **Best performing model:** +20% to +50% weight increase
- **Worst performing model:** -30% to -50% weight decrease
- **Other models:** No change
- Weights normalized to sum to 1.0

**Auto-stop:** Training stops when loss change < 0.001 over 3 consecutive epochs

**Example Training Flow:**
```
Epoch 1: mistral-7b(loss=0.45), llama-2(loss=0.50)
  → Adjust: mistral-7b +30%, llama-2 -40%
  → Normalized: mistral-7b=0.65, llama-2=0.35

Epoch 2: mistral-7b(loss=0.42), llama-2(loss=0.48)
  → Continue (loss change > 0.001)

Epoch 3-5: Loss plateaus at ~0.40
  → Auto-stop (loss change < 0.001 over 3 epochs)
```

---

## How to Run Training with DNA v2

### Prerequisites

```bash
pip install pynacl pytest
```

### 1. Generate Signing Keys (One-time Setup)

```python
from src.training.dna import generate_test_keypair

# Generate keys for development (DO NOT use in production!)
generate_test_keypair('/tmp/oneseek_keys')
```

**Production:** Use proper key management system and set:
```bash
export LEDGER_PRIVATE_KEY_PATH=/secure/path/to/private_key.bin
```

### 2. Run Adaptive Training

```python
from src.training.dynamic_trainer import run_adaptive_training
from src.ledger.ledger_client import InMemoryLedgerClient

config = {
    'models_dir': 'models',  # Will auto-discover base models
    'dataset_paths': [
        'datasets/civic_identity.jsonl',
        'datasets/swedish_fairness.json'
    ],
    'epochs': 10,
    'learning_rate': 0.0001,
    'auto_stop_threshold': 0.001,
    'auto_stop_patience': 3,
    'output_dir': 'models/oneseek-certified/run-2025-11-21',
    'private_key_path': '/tmp/oneseek_keys/test_private_key.bin',
    'ledger_client': InMemoryLedgerClient(),  # Or HttpLedgerClient() for production
    'seed': 42  # For reproducibility
}

result = run_adaptive_training(config)

print(f"DNA: {result['dna']}")
print(f"Immutable Hash: {result['immutable_hash']}")
print(f"Output: {result['output_path']}")
```

### 3. Generated Artifacts

Training produces a certified model package:

```
models/oneseek-certified/run-2025-11-21/
├── adapter_model.bin          # LoRA adapter weights
├── oneseek_dna.json           # DNA fingerprint metadata
├── ledger_proof.json          # Signed ledger entry
└── verify_integrity.py        # Verification script (auto-copied)
```

### Environment Variables

- `MODELS_DIR`: Base models directory (default: `models`)
- `DATASET_PATH`: Dataset file path override
- `LEDGER_URL`: HTTP ledger service URL (for HttpLedgerClient)
- `LEDGER_PRIVATE_KEY_PATH`: Path to Ed25519 private key file

---

## How to Verify Model Integrity

### Command-Line Verification

```bash
cd models/oneseek-certified/run-2025-11-21
python verify_integrity.py
```

**Output:**
```json
{
  "dna": "VALID",
  "ledger": "SYNCED",
  "datasets": "UNCHANGED",
  "overall": "VALID",
  "details": {
    "dna": "OneSeek-7B-Zero.v1.0.6b30afe8.4539991e.a16f0dd0",
    "signer_public_key": "abc123...",
    "datasets_verified": 2
  }
}
```

### Admin UI Verification Button

**Endpoint:** `POST /api/admin/models/verify`

**Request:**
```json
{
  "model_path": "models/oneseek-certified/run-2025-11-21"
}
```

**Response:**
```json
{
  "dna_valid": true,
  "ledger_synced": true,
  "datasets_unchanged": true,
  "details": {
    "dna": "OneSeek-7B-Zero.v1.0.6b30afe8.4539991e.a16f0dd0",
    "immutable_hash": "full_sha256_hash...",
    "datasets_verified": 2
  }
}
```

### Verification Checks

1. **DNA Fingerprint:** Matches stored DNA in `oneseek_dna.json` and `ledger_proof.json`
2. **Ledger Signature:** Ed25519 signature verifies against public key
3. **Dataset Integrity:** SHA-256 hashes of dataset files match recorded hashes
4. **Immutable Hash:** SHA-256 of canonical JSON payload matches stored hash

### What Each Status Means

- `DNA: VALID` - DNA fingerprint matches across all files
- `DNA: INVALID` - Mismatch between DNA files (tampering detected)
- `Ledger: SYNCED` - Signature is valid and entry is authentic
- `Ledger: UNSIGNED` - No signature found (old format or test run)
- `Ledger: MISMATCH` - Invalid signature (tampering detected)
- `Datasets: UNCHANGED` - All dataset files match recorded hashes
- `Datasets: MODIFIED` - One or more datasets have been altered
- `Datasets: MISSING` - One or more datasets cannot be found

---

## Security Considerations

### GDPR Compliance

**Personal Data in Training:**
- OneSeek-7B-Zero may be trained on anonymized civic data
- Dataset hashes allow verification without storing sensitive data
- Ledger entries contain only metadata, not actual training data
- User consent required before training on personal information

**Data Subject Rights:**
- Right to erasure: Model can be retrained excluding specific data
- Right to access: Ledger provides full training provenance
- Right to explanation: DNA fingerprint shows exact training configuration

### Key Management

**DO NOT:**
- ❌ Commit private keys to git
- ❌ Share private keys via email or chat
- ❌ Use test keypairs in production
- ❌ Reuse keys across environments

**DO:**
- ✅ Use HSM (Hardware Security Module) for production keys
- ✅ Store keys in secure vault (e.g., HashiCorp Vault, AWS KMS)
- ✅ Rotate keys every 90 days
- ✅ Use separate keys for dev/staging/production
- ✅ Audit all key access
- ✅ Backup keys securely (encrypted, offline)

### Determinism Caveats

**Guaranteed Deterministic:**
- DNA fingerprint generation (canonical JSON + SHA-256)
- Immutable hash calculation
- Signature generation (Ed25519)

**NOT Deterministic (without explicit seed):**
- Model weight initialization
- Dropout masks during training
- Data shuffling
- GPU operations (non-deterministic by default)

**For Full Reproducibility:**
```python
config = {
    'seed': 42,  # Set explicit seed
    # Other config...
}
```

**Note:** Even with seed, GPU non-determinism may cause minor variations. Use CPU for exact reproducibility.

### Attack Scenarios & Mitigations

**1. Model Weight Tampering**
- **Attack:** Replace `adapter_model.bin` with malicious weights
- **Mitigation:** Hash model file and include in ledger entry
- **Detection:** Recompute hash during verification

**2. Dataset Substitution**
- **Attack:** Replace training dataset with biased or harmful data
- **Mitigation:** SHA-256 hash of dataset files in ledger entry
- **Detection:** `verify_integrity.py` compares file hashes

**3. Ledger Entry Forgery**
- **Attack:** Modify ledger entry to hide training details
- **Mitigation:** Ed25519 signature prevents tampering
- **Detection:** Signature verification fails

**4. Replay Attack**
- **Attack:** Reuse old ledger entry for new model
- **Mitigation:** Immutable hash includes timestamp
- **Detection:** DNA fingerprint mismatch (timestamp hash differs)

**5. Man-in-the-Middle (HTTP Ledger)**
- **Attack:** Intercept ledger POST requests
- **Mitigation:** Use HTTPS, verify server certificate
- **Detection:** TLS warnings, certificate mismatch

---

## Breaking Changes from Previous Versions

### Changes from PR #62

**Updated:**
- ✅ Hardcoded Mistral/LLaMA logic replaced with `discover_base_models()`
- ✅ Static weights replaced with adaptive weight adjustment
- ✅ Manual versioning replaced with DNA fingerprinting

**Backward Compatibility:**
- ✅ Old model versions still load (no DNA, no signature)
- ✅ Existing training scripts continue to work
- ✅ Legacy endpoints remain functional

**Migration Path:**
1. Retrain models using `run_adaptive_training()` for DNA v2
2. Update admin UI to show DNA fingerprint
3. Add "Verify Integrity" button for new models
4. Keep old models for historical reference

---

## Changelog - DNA Fingerprint v2

### Version 2.0.0 (November 2025) - DNA v2 Release

**New Modules:**
- ✅ `src/training/dna.py` - Cryptographic hashing and signing
- ✅ `src/training/dataset_parser.py` - Category extraction
- ✅ `src/training/dynamic_trainer.py` - Adaptive multi-model training
- ✅ `src/ledger/ledger_client.py` - Immutable ledger abstraction
- ✅ `models/oneseek-certified/verify_integrity.py` - Local verification

**Features:**
- ✅ Dynamic base model discovery
- ✅ Adaptive weight adjustment (+20-50% best, -30-50% worst)
- ✅ Confidence-based auto-stop (loss < 0.001 over 3 epochs)
- ✅ SHA-256 DNA fingerprinting with canonical JSON
- ✅ Ed25519 signature-based ledger entries
- ✅ Certified model packaging with verification scripts
- ✅ Dataset category extraction from filenames
- ✅ Full reproducibility with explicit seeds

**Testing:**
- ✅ Comprehensive test suite (test_dna.py, test_adaptive_weighting.py, etc.)
- ✅ CI/CD integration tests (.github/workflows/integration-tests.yml)
- ✅ Simulated training runs with verification

**Documentation:**
- ✅ DNA v2 specification (this section)
- ✅ Training guide with environment variables
- ✅ Verification instructions (CLI + Admin UI)
- ✅ Security considerations (GDPR, key management, attack scenarios)

**Dependencies:**
- ✅ Added pynacl for Ed25519 signing
- ✅ Added pytest for testing

**Related PRs:**
- Builds on PR #62 (multi-model training foundation)
- Supersedes manual weight configuration

---
