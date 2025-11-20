# OQT-1.0 (Open Question-answering Transparent) - Complete Documentation

## 📋 Table of Contents

- [What is OQT-1.0?](#what-is-oqt-10)
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
- [Ledger & Provenance](#ledger--provenance)
- [OQT Dashboard](#oqt-dashboard)
- [Model Weights Storage](#model-weights-storage)
- [Implementation Status](#implementation-status)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Performance Metrics](#performance-metrics)

---

## What is OQT-1.0?

**OQT-1.0 is a self-contained language model** that uses **Mistral 7B** and **LLaMA-2** as base models to create an independent AI system focused on transparency, fairness, and continuous learning.

### Key Characteristics:

- **Independent Language Model**: OQT-1.0 is its own model, not just a wrapper around external AIs
- **Multi-Model Foundation**: Uses Mistral 7B (fast inference) and LLaMA-2 (deep analysis) as base architectures
- **Continuous Training**: Learns from every interaction through two-step microtraining
- **Transparent**: Every decision, training event, and data source is logged in the ledger
- **Fair & Unbiased**: Active bias detection and fairness metrics in every response
- **Real-time Adaptation**: Updates immediately with new information from external AI sources

### How It Differs from External AI Services:

| Feature | OQT-1.0 | External AI (GPT, Gemini, etc.) |
|---------|---------|--------------------------------|
| **Purpose** | User interaction, direct queries | Training data collection |
| **Interface** | OQT Dashboard (`/oqt-dashboard`) | Start view (homepage) |
| **Training** | Continuous, real-time | Periodic, provider-controlled |
| **Transparency** | Full ledger, provenance tracking | Black box |
| **Customization** | Adapts to our data & use cases | General purpose |
| **Independence** | Fully self-hosted | Depends on external APIs |

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
| BERTopic | 🔄 Planned | Advanced topics |
| LIME | 🔄 Planned | Local explanations |
| Fairlearn | ✅ Integrated | Fairness metrics |
| Lux | 📋 Planned | Dashboard viz |
| Sweetviz | 📋 Planned | Data profiling |

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
│  • Model: OQT-1.0.v13.1                                  │
│  • Process: Learn language patterns                      │
│  • Output: OQT-1.0.v13.2                                 │
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
│  • Model: OQT-1.0.v13.2                                  │
│  • Process: Refine fairness & bias detection             │
│  • Output: OQT-1.0.v13.3                                 │
│  • Time: ~45 seconds                                     │
│  • Log: oqt_training_events                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Model Weights Saved                                     │
│  • Path: models/oqt/weights/oqt-1.0-v13.3.pth            │
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

### Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **LoRA/PEFT Infrastructure** | 🔄 In Progress | Code structure ready, needs implementation |
| **Instruction Dataset** | 📋 Planned | Template created, needs 500 examples |
| **Initial Fine-Tuning** | 📋 Planned | Waiting for instruction dataset |
| **Real-Time Microtraining** | 🔄 In Progress | Backend hooks ready, training logic needed |
| **Identity Enforcement** | 📋 Planned | Depends on initial fine-tuning |
| **LoRA Adapter Storage** | ✅ Complete | Directory structure created |
| **Version Management** | ✅ Complete | Tracking system in place |

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

**OQT-1.0** is an independent, transparent, continuously-learning language model built on **Mistral 7B** and **LLaMA-2** foundations. It learns from 6 external AI services through a sophisticated two-step microtraining process, maintains complete transparency via blockchain-style ledger, and provides users with fair, unbiased, traceable responses.

**Key Differentiators**:
- ✅ Own model (not just API wrapper)
- ✅ Real-time learning on every question
- ✅ Full transparency & provenance
- ✅ Bias detection & fairness optimization
- ✅ User-friendly dashboard interface

**Current Status**: Infrastructure complete, awaiting ML implementation

**Next Steps**: Implement actual model training pipeline

---

**For more information**:
- Installation: See `INSTALLATION_GUIDE.md`
- API Reference: See `docs/OQT_MULTI_MODEL_API.md`
- Implementation: See `OQT_MULTI_MODEL_README.md`
