# 🧭 CivicAI (OneSeek.AI)

**Beslut med insyn. AI med ansvar.**

A transparent platform for comparing and analyzing AI model responses with advanced NLP analysis, consensus debate mechanisms, and blockchain-inspired transparency ledger.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://www.python.org/)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Current Status](#-current-status)
- [OneSeek-7B-Zero: Our Transparent Language Model](#-oneseek-7b-zero-our-transparent-language-model)
- [Training OneSeek-7B-Zero: Step-by-Step Guide](#-training-oneseek-7b-zero-step-by-step-guide)
- [Features](#-features)
- [Architecture](#-architecture)
- [Module Status](#-module-status)
- [Data Models](#-data-models)
- [Quality & Ethics](#-quality--ethics)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Python** 3.8+ (optional, for ML features)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/robinandreeklund-collab/CivicAI.git
   cd CivicAI
   ```

2. **Run setup script**
   ```bash
   ./scripts/setup.sh
   ```
   This will:
   - Install all dependencies
   - Create environment files
   - Check prerequisites

3. **Configure API keys**
   
   Edit `backend/.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key
   GEMINI_API_KEY=your_gemini_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

   Get your keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://aistudio.google.com/app/apikey
   - DeepSeek: https://platform.deepseek.com/

4. **Start the application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to http://localhost:5173

### Optional: Python ML Service

For advanced ML features (spaCy, Detoxify, BERTopic):

```bash
cd backend/python_services
./setup.sh
python3 nlp_pipeline.py
```

See [Python ML Integration Guide](docs/pipeline/PYTHON_ML_INTEGRATION.md) for details.

### Firebase Setup (Optional)

To enable data persistence and user authentication:

```bash
./scripts/firebase-bootstrap.sh
```

**Step-by-Step Deployment Guides:**
- **[Firebase Step 2 Deployment Guide](docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md)** - Complete production deployment guide (Swedish)
- [Firebase Setup Guide](docs/guides/FIREBASE_SETUP.md) - Basic setup instructions

---

## 📊 Current Status

### ✅ Implemented (Production Ready)

**Core Functionality:**
- ✅ Multi-AI comparison (GPT-3.5, Gemini, DeepSeek)
- ✅ Comprehensive 6-step analysis pipeline
- ✅ Hybrid architecture (JavaScript + optional Python ML)
- ✅ Auto-fallback system (always functional)
- ✅ Real-time consensus debate system
- ✅ Export to YAML/JSON/PDF/README

**Analysis Capabilities:**
- ✅ Text preprocessing (tokenization, POS tagging, NER)
- ✅ Bias detection (political, commercial, cultural, toxicity)
- ✅ Sentiment analysis (VADER, polarity, subjectivity)
- ✅ Ideological classification (left/center/right)
- ✅ Topic modeling (BERTopic, keyword extraction)
- ✅ Fact checking (claim identification)
- ✅ Transparency layer (provenance, timeline, audit trail)

**UI/UX:**
- ✅ Grok-inspired dark theme design
- ✅ Collapsible sidebar with conversation history
- ✅ AI model selector (toggle models)
- ✅ Animated loading states
- ✅ Pipeline analysis visualization
- ✅ Model synthesis view (divergences, consensus)
- ✅ Timeline navigator

**OneSeek-7B-Zero Model:**
- ✅ Multi-model architecture (Mistral 7B + LLaMA-2)
- ✅ Two-stage training pipeline (raw data + analyzed metrics)
- ✅ LoRA/PEFT integration for efficient fine-tuning
- ✅ Instruction dataset for identity training (50 examples)
- ✅ Automatic versioning (OneSeek-7B-Zero.v{MAJOR}.{MICRO})
- ✅ GPU/CPU optimization and 8-bit quantization support
- ✅ Model weights storage structure
- ✅ Model Verification System (Exact Match, BLEU, Semantic Similarity)
- ✅ Fidelity Score certification (CERTIFIED/WARNING/REJECT)
- ✅ Active model management via -CURRENT symlink
- ✅ PDF certificate generation for verified models
- 🔄 PyTorch training implementation

**Admin Dashboard:**
- ✅ Dataset management (upload, browse, validate)
- ✅ Training control panel (configure, start/stop, monitor)
- ✅ Model management (list versions, compare, rollback)
- ✅ Model verification tab with fidelity testing
- ✅ Real-time monitoring (progress, GPU/CPU, notifications)
- ✅ Unified admin design (grayscale theme, JetBrains Mono 13px)

### 🚧 In Progress

- 🔄 Firebase integration for data persistence
- 🔄 User authentication system
- 🔄 Transparency ledger blockchain implementation
- 🔄 Change detection enhanced features
- 🔄 OneSeek-7B-Zero PyTorch training implementation

### 📋 Planned

- [ ] Battle mode (user voting on best response)
- [ ] Public API for external applications
- [ ] Crowdsourced feedback system
- [ ] Additional AI models (Claude, Llama, Mistral)
- [ ] Real-time collaborative analysis
- [ ] Mobile application

---

## 🤖 OneSeek-7B-Zero: Our Transparent Language Model

**OneSeek-7B-Zero** is an independent, transparent, continuously-learning language model built on **Mistral 7B** and **LLaMA-2** foundations. Unlike external AI services, OneSeek-7B-Zero learns from multiple AI perspectives through a sophisticated two-stage training process, maintains complete transparency via blockchain-style ledger, and provides users with fair, unbiased, traceable responses.

### Key Characteristics

- **Independent Language Model**: Not just a wrapper around external AIs - it's our own fine-tuned model
- **Multi-Model Foundation**: Combines Mistral 7B (fast inference) and LLaMA-2 (deep analysis)
- **Continuous Training**: Learns from every interaction through two-step microtraining
- **Transparent**: Every decision, training event, and data source logged in the ledger
- **Fair & Unbiased**: Active bias detection and fairness metrics in every response
- **Real-time Adaptation**: Updates immediately with new information

### Model Identity & Versioning

**Format:** `OneSeek-7B-Zero.v{MAJOR}.{MICRO}`

- **Major versions** (v1, v2, v3...): Created during weekly/monthly batch training on large datasets
- **Micro versions** (.1, .2, .3...): Created during real-time microtraining (two increments per question)

**Example version progression:**
```
OneSeek-7B-Zero.v1.0    ← Major training (weekly batch)
OneSeek-7B-Zero.v1.1    ← Microtraining Stage 1 (raw data)
OneSeek-7B-Zero.v1.2    ← Microtraining Stage 2 (analyzed data)
OneSeek-7B-Zero.v1.3    ← Microtraining Stage 1 (next question)
OneSeek-7B-Zero.v1.4    ← Microtraining Stage 2 (next question)
...
OneSeek-7B-Zero.v2.0    ← Next major training
```

### Model Verification System

**OneSeek-7B-Zero** includes a comprehensive model verification system to ensure fidelity and quality:

**Verification Process:**
1. **Random Training Set (100 questions)**: Tests the model against randomly selected training examples
2. **Control Questions (50 questions)**: Mix-and-match control questions to test generalization
3. **Three Metrics**:
   - **Exact Match %**: Percentage of responses that exactly match expected output
   - **BLEU Score**: Measures linguistic quality (≥0.95 threshold)
   - **Semantic Similarity**: Measures meaning preservation (≥0.98 threshold)

**Fidelity Score & Certification:**
- **CERTIFIED (≥97%)**: Model meets all quality standards, green badge across admin
- **WARNING (90-96.9%)**: Model is functional but may need improvement
- **REJECT (<90%)**: Model does not meet quality standards

**Example Results:**
```
Slumpfrågor (Training Set):
  Exact Match: 93%
  BLEU: 98%
  Semantic: 99%

Kontrollfrågor (Control Questions):
  Exact Match: 46%
  BLEU: 49%
  Semantic: 48%

FINAL SCORE: 98.1% → CERTIFIED
```

**Active Model Management:**
- The verification system can set verified models as "current" via symlink
- OQT Dashboard always uses the active model at `models/oneseek-certified/OneSeek-7B-Zero-CURRENT`
- Production environments use `/app/models/oneseek-certified/OneSeek-7B-Zero-CURRENT`
- Main homepage and chat-v2 are unaffected by this symlink

**PDF Certificate:**
- Downloadable PDF certificate for certified models
- Includes all metrics, timestamps, and certification status
- Useful for documentation and compliance

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│              OneSeek-7B-Zero Architecture                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Base Models:                                            │
│  ┌─────────────────┐         ┌─────────────────┐       │
│  │  Mistral 7B     │         │   LLaMA-2       │       │
│  │  (Fast)         │         │   (Deep)        │       │
│  └────────┬────────┘         └────────┬────────┘       │
│           │                           │                 │
│           └───────────┬───────────────┘                 │
│                       ▼                                  │
│           ┌─────────────────────────┐                   │
│           │   LoRA/PEFT Adapters    │                   │
│           │   (Efficient Training)  │                   │
│           └───────────┬─────────────┘                   │
│                       ▼                                  │
│           ┌─────────────────────────┐                   │
│           │  OneSeek-7B-Zero Model  │                   │
│           │  + Identity Training    │                   │
│           └─────────────────────────┘                   │
│                                                           │
│  Training Pipeline:                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Stage 1: Raw AI Responses → Knowledge Base      │   │
│  │ Stage 2: Analyzed Metrics → Fairness & Ethics   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  Storage:                                                │
│  • models/oneseek-certified/                            │
│    (DNA-based certified model structure)                │
│  • models/basemodeller/ (base models)                   │
│  • Firebase Storage (backup)                             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### How It Differs from External AI Services

| Feature | OneSeek-7B-Zero | External AI (GPT, Gemini, etc.) |
|---------|-----------------|--------------------------------|
| **Purpose** | User interaction, direct queries | Training data collection |
| **Interface** | OQT Dashboard (`/oqt-dashboard`) | Start view (homepage) |
| **Training** | Continuous, real-time | Periodic, provider-controlled |
| **Transparency** | Full ledger, provenance tracking | Black box |
| **Customization** | Adapts to our data & use cases | General purpose |
| **Independence** | Fully self-hosted | Depends on external APIs |
| **Fairness** | Built-in metrics & monitoring | Unknown/unverified |

---

## 🎓 Training OneSeek-7B-Zero: Step-by-Step Guide

This comprehensive guide shows you how to train OneSeek-7B-Zero from scratch with identity integration.

### Prerequisites

Before starting, ensure you have:

- **Hardware:**
  - 16GB RAM minimum (32GB recommended)
  - 50GB free disk space
  - NVIDIA GPU with 12GB+ VRAM (recommended but optional)
  
- **Software:**
  - Python 3.8+ with pip
  - Node.js 18+
  - Git
  - CUDA toolkit (if using GPU)

- **Accounts:**
  - Firebase account (for data storage)
  - API keys for external AI services (optional, for training data collection)

### Step 1: Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI

# 2. Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install Node.js dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 5. Setup Firebase
python scripts/setup_firebase.py
# Follow prompts to configure Firebase credentials
```

### Step 2: Download Base Models

```bash
# Download Mistral 7B and LLaMA-2 base models
# This will download ~14-27GB of model files
python scripts/download_models.py

# Verify models are downloaded
ls -lh models/base_models/
# You should see:
# - mistral-7b/
# - llama-2-7b/
```

**Note:** If you don't have enough disk space, the training pipeline can work with simulated models for testing.

### Step 3: Prepare the Instruction Dataset

The instruction dataset teaches OneSeek-7B-Zero its identity as a transparent AI agent.

```bash
# The dataset is already created at:
cat datasets/oneseek_identity_v1.jsonl

# It contains 50 bilingual (Swedish/English) instruction examples
# covering:
# - Identity and purpose
# - Training process and versioning
# - Transparency and ledger
# - Fairness and bias detection
# - Ethical foundation
# - Technical architecture
```

**Dataset Format (JSONL):**
```json
{
  "instruction": "Vem är du?",
  "input": "",
  "output": "Jag är OpenSeek AI-agent, skapad för transparens..."
}
```

**To extend the dataset:**

1. Open `datasets/oneseek_identity_v1.jsonl`
2. Add new lines in the same JSON format
3. Focus on:
   - Common user questions about the model
   - Edge cases and ethical scenarios
   - Domain-specific knowledge
   - Multi-language support

**Recommended size:** 100-500 examples for initial training

### Step 4: Initial Identity Fine-Tuning

This step fine-tunes the base models with LoRA to give OneSeek-7B-Zero its identity.

```bash
# 1. Fine-tune using DNA v2 structure (recommended)
python scripts/train_dna_v2.py \
  --dataset datasets/oneseek_identity_v1.jsonl \
  --epochs 3 \
  --learning-rate 2e-5 \
  --auto-stop-threshold 0.95 \
  --auto-stop-patience 3

# Output: models/oneseek-certified/OneSeek-7B-Zero.v1.{N}.{lang}.{datasets}.{hash}.{timestamp}/
```

**Expected duration:** 2-4 hours on GPU, 8-12 hours on CPU

**What happens:**
- Model trained with DNA-based naming convention
- Stored in certified structure: `models/oneseek-certified/`
- Full provenance tracking via DNA fingerprint
- Training metrics and metadata saved
- Symlink created: `OneSeek-7B-Zero-CURRENT`
- Ledger block created for provenance

**Verify training:**
```bash
# Check certified models
ls -la models/oneseek-certified/

# Should see:
# - OneSeek-7B-Zero.v1.{N}.{lang}.{datasets}.{hash}.{timestamp}/
# - OneSeek-7B-Zero-CURRENT -> (symlink to latest)
# - training_metadata.json
```

### Step 5: Collect Training Data from External AI

To enable continuous learning, collect responses from external AI services.

```bash
# 1. Configure API keys in backend/.env
cat > backend/.env << EOF
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_API_KEY=your_deepseek_key
# Add other API keys as available
EOF

# 2. Start the backend service
cd backend
npm run dev
# Backend runs on http://localhost:3001

# 3. In another terminal, start the frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Collect data through the UI:**

1. Open http://localhost:5173
2. Navigate to the Start View (homepage)
3. Ask questions to collect AI responses
4. Each question collects responses from:
   - GPT-4 (OpenAI)
   - Gemini (Google)
   - Grok (xAI) 
   - Claude (Anthropic)
   - DeepSeek
   - Qwen

**Data is stored in Firebase:**
- Collection: `ai_interactions`
- Contains: raw responses, analysis, consensus, bias, fairness

### Step 6: Prepare Training Dataset

Convert collected data into training-ready format.

```bash
# Run dataset preparation pipeline
python ml/pipelines/prepare_dataset.py

# This will:
# 1. Load all interactions from Firebase
# 2. Calculate consensus scores
# 3. Classify data quality
# 4. Analyze fairness metrics
# 5. Split into train/validation/test sets
# 6. Save to ml/data/prepared/
```

**Output:**
```
ml/data/prepared/
├── train.json           # 80% of data
├── validation.json      # 10% of data
├── test.json           # 10% of data
└── fairness_report.json # Quality metrics
```

### Step 7: Batch Training (Major Version)

Perform comprehensive training on accumulated dataset.

```bash
# Train new major version
python ml/training/train_language_model.py \
  --version 1.0.0 \
  --data-dir ml/data/prepared

# This will:
# 1. Load prepared datasets
# 2. Train on both raw responses and analyzed metrics
# 3. Calculate fairness metrics
# 4. Save model weights
# 5. Log to transparency ledger
# 6. Verify ledger integrity
```

**Expected output:**
```
============================================================
Training OQT-1.0 Version 1.0.0
============================================================

Dataset sizes:
  Training: 800
  Validation: 100

Training configuration:
  model_name: OQT-1.0
  learning_rate: 2e-5
  batch_size: 32
  epochs: 3

Training completed!

Final Metrics:
  validation_accuracy: 0.876
  fairness_score: 0.912
  bias_score: 0.123

Saved to models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.dsCivicID.8f3a1c9d.2e7f4b1a/
Logged to transparency ledger (Block 1)

============================================================
Training Complete!
============================================================
```

### Step 8: Enable Real-Time Microtraining

Configure automatic training on every new question.

```bash
# 1. Verify Firebase integration
python scripts/setup_firebase.py --verify

# 2. Enable microtraining in backend configuration
# Edit backend/.env and add:
echo "ENABLE_MICROTRAINING=true" >> backend/.env
echo "ONESEEK_MODEL_VERSION=1.0.0" >> backend/.env

# 3. Restart backend service
cd backend
npm run dev
```

**How microtraining works:**

1. **User asks question** via OQT Dashboard
2. **Stage 1 training** (30-60s):
   - Collect raw AI responses
   - Update LoRA adapters with new knowledge
   - Version: v1.0 → v1.1
   - Log to `oqt_training_events`

3. **ML Pipeline analyzes** responses:
   - Calculate consensus score
   - Detect bias
   - Measure fairness

4. **Stage 2 training** (30-60s):
   - Update LoRA adapters with ethical reasoning
   - Version: v1.1 → v1.2
   - Log to `oqt_training_events`

5. **Ledger block created** with full provenance

### Step 9: Monitor Training Progress

Track model performance over time.

```bash
# View training events
# Visit: http://localhost:3000/oqt-dashboard
# Navigate to "Aktivitet" tab

# Query training metrics
curl http://localhost:3001/api/oqt/metrics

# Verify ledger integrity
curl http://localhost:3001/api/oqt/ledger/verify
```

**Dashboard Views:**

- **Chat:** Interact with OneSeek-7B-Zero
- **Aktivitet:** Real-time training events
- **Mätvärden:** Performance metrics over time
- **Ledger:** Complete transparency log

### Step 10: Validate Model Performance

Test the trained model to ensure quality.

```bash
# Run validation suite
python ml/training/validate_model.py \
  --version 1.0.0 \
  --test-data ml/data/prepared/test.json

# Expected metrics:
# - Validation accuracy: >85%
# - Fairness score: >88%
# - Bias score: <3.0
# - Consensus accuracy: >80%
```

**Test queries:**
```bash
# Test identity
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vem är du?"}'

# Should respond with OneSeek identity

# Test transparency
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How do you ensure fairness?"}'

# Should explain fairness metrics and ledger
```

### Step 11: Deploy to Production

Prepare for production deployment.

```bash
# 1. Backup model weights to Firebase Storage
python scripts/backup_model_weights.py --version 1.0.0

# 2. Create production environment
cp backend/.env backend/.env.production
# Edit .env.production with production settings

# 3. Build frontend
cd frontend
npm run build

# 4. Configure production server
# See docs/deployment/ for detailed instructions

# 5. Setup monitoring
# Configure alerts for:
# - Training failures
# - Low fairness scores
# - High bias detection
# - Ledger integrity issues
```

### Troubleshooting

**Problem: Out of memory during training**
```bash
# Solution 1: Use 8-bit quantization
python ml/training/train_language_model.py \
  --version 1.0.0 \
  --quantize 8bit

# Solution 2: Reduce batch size
python ml/training/train_language_model.py \
  --version 1.0.0 \
  --batch-size 16  # Default is 32
```

**Problem: Slow inference**
```bash
# Solution: Enable model caching
echo "ENABLE_MODEL_CACHE=true" >> backend/.env

# Or use GPU acceleration
python ml_service/server.py --device cuda
```

**Problem: Training not triggering**
```bash
# Check Firebase connection
python scripts/setup_firebase.py --test-connection

# Verify microtraining is enabled
grep ENABLE_MICROTRAINING backend/.env

# Check logs
tail -f backend/logs/training.log
```

### Best Practices

1. **Start small:** Train on 50-100 examples first, validate, then scale up
2. **Monitor fairness:** Check fairness metrics after each major training
3. **Verify ledger:** Run ledger verification regularly
4. **Backup frequently:** Backup model weights to Firebase Storage daily
5. **Test thoroughly:** Use validation dataset to catch degradation
6. **Document changes:** Log all training runs with metadata
7. **Version control:** Never delete old versions - keep for rollback
8. **Ethical review:** Review bias detection before major deployments

### Advanced: Custom Identity Training

To train OneSeek-7B-Zero for domain-specific use:

```bash
# 1. Create domain-specific instruction dataset
cat > datasets/oneseek_medical_v1.jsonl << EOF
{"instruction": "How do you handle medical information?", "input": "", "output": "I provide general information but always recommend consulting healthcare professionals..."}
{"instruction": "Can you diagnose diseases?", "input": "", "output": "No, I cannot diagnose diseases. I can provide educational information about symptoms and conditions..."}
EOF

# 2. Fine-tune with combined datasets
python ml/training/train_language_model.py \
  --base-model mistral-7b \
  --dataset datasets/oneseek_identity_v1.jsonl \
  --dataset datasets/oneseek_medical_v1.jsonl \
  --method lora \
  --output models/oneseek-certified/medical-variant

# 3. Test domain-specific responses
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are symptoms of flu?"}'
```

### Resources

- **Full OQT Documentation:** [OQT-1.0-README.md](OQT-1.0-README.md)
- **API Reference:** [docs/OQT_MULTI_MODEL_API.md](docs/OQT_MULTI_MODEL_API.md)
- **Training Scripts:** `ml/training/`
- **Dataset Examples:** `datasets/`
- **Model Architecture:** See Architecture section above

### Next Steps

After completing this training guide:

1. ✅ Collect more training data through user interactions
2. ✅ Schedule weekly batch training for major versions
3. ✅ Monitor fairness and bias metrics continuously
4. ✅ Extend instruction dataset with community contributions
5. ✅ Deploy to production with monitoring
6. ✅ Contribute improvements back to the project

**Questions?** Open an issue on GitHub or consult the full documentation in `OQT-1.0-README.md`.

---

## ✨ Features

### 🤖 Multi-AI Comparison

Ask the same question to multiple AI models simultaneously and compare:
- **GPT-3.5** (OpenAI) - Fast and efficient
- **Gemini** (Google) - Advanced reasoning
- **DeepSeek** - Technical precision

### 🔬 Advanced Analysis Pipeline

Each response undergoes a comprehensive 6-step analysis:

1. **Preprocessing** - Tokenization, POS tagging, language detection
2. **Bias Detection** - Political, commercial, cultural bias + toxicity
3. **Sentiment Analysis** - VADER scores, polarity, subjectivity
4. **Ideology Classification** - Multi-dimensional political positioning
5. **Topic Modeling** - BERTopic transformer-based topics
6. **Transparency Layer** - Full provenance and audit trail

### 🗳️ Consensus Live Debate

When AI models show high divergence (consensus < 60%):
- 🎯 AI agents debate in real-time (max 5 rounds)
- 🗳️ Agents vote on best response (no self-voting)
- 🏆 Winner determined by vote count
- 🔬 Automatic analysis of winning response
- 📊 Full timeline integration

### 📤 Flexible Export

Export complete analyses to:
- **YAML** - Structured data
- **JSON** - API compatible
- **PDF** - Formatted reports
- **README** - Markdown documentation

### 🔍 Transparency & Provenance

Every analysis includes:
- Model version and provider
- Analysis method and algorithm
- Processing timestamps
- Confidence scores
- Full audit trail

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React + Vite)                   │
│         Port 5173 - Modern UI/UX                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────┐
│      Backend (Node.js + Express)                    │
│            Port 3001 - Orchestrator                 │
│  ┌──────────────────────────────────────────────┐   │
│  │  Analysis Pipeline Service                   │   │
│  │  • Multi-AI dispatcher                       │   │
│  │  • Model synthesis                           │   │
│  │  • Consensus debate manager                  │   │
│  │  • Export engine                             │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│  ┌──────────────────┴───────────────────────────┐   │
│  │  Python NLP Client (Optional)                │   │
│  │  • Auto-fallback to JavaScript               │   │
│  │  • Timeout handling                          │   │
│  └──────────────────┬───────────────────────────┘   │
└────────────────────┼─────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
   ┌───▼──────────┐        ┌───────▼──────────┐
   │ Python ML    │        │ JavaScript       │
   │ Service      │        │ Fallback         │
   │ Port 5001    │        │ (Always active)  │
   │              │        │                  │
   │ • spaCy      │        │ • compromise.js  │
   │ • Detoxify   │        │ • sentiment      │
   │ • BERTopic   │        │ • custom NLP     │
   │ • SHAP       │        │                  │
   └──────────────┘        └──────────────────┘
       (Optional)              (Standard)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | Modern, responsive UI |
| **State** | Zustand | Lightweight state management |
| **Backend** | Node.js 18+, Express | RESTful API server |
| **Python ML** | Flask, spaCy, Detoxify, BERTopic, SHAP, LIME, Fairlearn, Lux, Sweetviz | Advanced ML models (optional) |
| **AI Models** | OpenAI, Google Gemini, DeepSeek | Multi-AI comparison |
| **Database** | Firebase Firestore (planned) | Data persistence |
| **Export** | js-yaml, markdown-it, PDFKit | Multi-format export |

### Pipeline Tools

| Step | JavaScript (Standard) | Python ML (Optional) |
|------|----------------------|---------------------|
| **Preprocessing** | compromise.js | spaCy 3.7.2, TextBlob, langdetect |
| **Bias Detection** | Custom keyword-based | Custom + Detoxify 0.5.2 |
| **Sentiment** | sentiment library (VADER) | VADER + TextBlob |
| **Ideology** | Custom keyword classifier | Transformers 4.36.2 (Swedish BERT) |
| **Topics** | compromise.js | BERTopic 0.16.0, Gensim 4.3.2 |
| **Explainability** | Keyword tracking | SHAP 0.44.0, LIME |
| **Fairness** | Basic bias detection | Fairlearn 0.10.0 (demographic parity, equal opportunity) |
| **Data Quality** | Manual analysis | Sweetviz (automated EDA), Lux (visualizations) |

---

## 📦 Module Status

### Backend Modules

| Module | Status | Description | API Endpoint |
|--------|--------|-------------|--------------|
| **query_dispatcher** | ✅ Ready | Multi-AI query orchestration | `/api/query` |
| **analysis_pipeline** | ✅ Ready | Full NLP analysis pipeline | `/api/analysis-pipeline/*` |
| **model_synthesis** | ✅ Ready | Model comparison and consensus | Part of query response |
| **debate** | ✅ Ready | Consensus live debate system | `/api/debate/*` |
| **export** | ✅ Ready | Multi-format export | `/api/export/*` |
| **auth** | 🔶 Partial | User authentication (signup only) | `/api/auth/signup` |
| **change_detection** | ✅ Ready | Detect response/model changes | `/api/change-detection/*` |
| **transparency_ledger** | 📋 Planned | Blockchain-inspired audit | `/api/ledger/*` |
| **realtime_update** | 📋 Planned | WebSocket real-time updates | `/api/realtime/*` |

### Frontend Components

| Component | Status | Description |
|-----------|--------|-------------|
| **AgentBubble** | ✅ Ready | AI response display with analysis |
| **PipelineAnalysisPanel** | ✅ Ready | Complete pipeline visualization |
| **TimelineNavigator** | ✅ Ready | Step-by-step process timeline |
| **ModelSynthesis** | ✅ Ready | Model comparison view |
| **DebatePanel** | ✅ Ready | Live debate visualization |
| **ExportPanel** | ✅ Ready | Export functionality |
| **BiasIndicator** | ✅ Ready | Bias visualization |
| **FactCheckIndicator** | ✅ Ready | Fact checking display |
| **AIServiceToggle** | ✅ Ready | Model selection |
| **Sidebar** | ✅ Ready | Conversation history |

### Python ML Models (Optional)

| Model | Status | Version | Purpose |
|-------|--------|---------|---------|
| **spaCy** | ✅ Ready | 3.7.2 | Tokenization, POS, NER, dependency parsing |
| **TextBlob** | ✅ Ready | 0.17.1 | Sentiment polarity and subjectivity |
| **langdetect** | ✅ Ready | Latest | Multi-language detection (55+ languages) |
| **Detoxify** | ✅ Ready | 0.5.2 | ML-based toxicity detection |
| **Transformers** | 🔶 Partial | 4.36.2 | Swedish BERT ideology classification |
| **SHAP** | ✅ Ready | 0.44.0 | Global model explainability |
| **Gensim** | ✅ Ready | 4.3.2 | Word2Vec, FastText, LDA semantic analysis |
| **BERTopic** | ✅ Ready | 0.16.0 | Transformer-based topic modeling |
| **LIME** | ✅ Ready | Latest | Local interpretable explanations |
| **Fairlearn** | ✅ Ready | 0.10.0 | Fairness metrics and bias analysis |
| **Lux** | ✅ Ready | Latest | Interactive visualization recommendations |
| **Sweetviz** | ✅ Ready | Latest | Automated EDA report generation |

### ML Pipeline Modules (Future)

| Module | Status | Purpose |
|--------|--------|---------|
| **prepare_dataset** | 📋 Planned | Dataset preparation for training |
| **train_language_model** | 📋 Planned | Custom model training |
| **model_evaluation** | 📋 Planned | Model performance metrics |
| **change_detection_enhanced** | 🔄 In Progress | Advanced change detection with ML |

---

## 💾 Data Models

### Core Collections (Firestore)

#### ai_interactions
Stores user queries and AI responses with complete analysis.

```javascript
{
  interactionId: "uuid",
  userId: "user-id",
  timestamp: Date,
  question: {
    text: "string",
    hash: "sha256",
    language: "iso-code"
  },
  responses: [{
    agent: "gpt-3.5|gemini|deepseek",
    response: "text",
    analysis: { tone, bias, sentiment },
    pipelineAnalysis: { preprocessing, topics, etc }
  }],
  modelSynthesis: {
    consensus: 0-100,
    divergences: [],
    contradictions: []
  }
}
```

#### model_versions
Tracks AI model configurations and metadata.

```javascript
{
  modelId: "provider-model-version",
  provider: "openai|google|deepseek",
  modelName: "string",
  version: "string",
  configuration: { temperature, maxTokens, ... },
  profile: { strengths, weaknesses, characteristics },
  usage: { totalRequests, averageResponseTime }
}
```

#### ledger_blocks
Blockchain-inspired transparency ledger for audit trail.

```javascript
{
  blockId: "uuid",
  blockNumber: number,
  previousHash: "sha256",
  currentHash: "sha256",
  data: {
    type: "interaction|model_update|system_event",
    interactionId: "uuid",
    modelsUsed: ["gpt-3.5", ...]
  },
  metadata: { verified: boolean }
}
```

#### change_events
Records detected changes in model behavior or responses.

```javascript
{
  eventId: "uuid",
  changeType: "response_drift|model_update|bias_shift",
  modelId: "string",
  changeDetails: { before, after, delta, magnitude },
  detection: { method, confidence },
  impact: { severity, affected }
}
```

See [Data Schemas Documentation](docs/schemas/README.md) for complete schemas.

---

## ⚖️ Quality & Ethics

### Transparency Principles

1. **Full Provenance** - Every analysis result includes source model, version, and method
2. **Reproducibility** - All analyses can be reproduced with the same inputs
3. **No Hidden Algorithms** - All analysis methods are documented
4. **Audit Trail** - Complete history of system decisions
5. **User Control** - Users can enable/disable features and models

### Bias Mitigation

- **Multi-model approach** - Compare multiple AI providers to identify biases
- **Bias detection** - Automated identification of political, commercial, cultural bias
- **Toxicity screening** - ML-based toxicity detection (Detoxify)
- **Provenance tracking** - Know which model produced which result
- **User awareness** - Clear visualization of detected biases

### Data Privacy

- **Local-first** - No data stored without explicit user action
- **Optional cloud** - Firebase integration is optional
- **No tracking** - Zero analytics or tracking by default
- **Open source** - Full transparency through public code
- **User ownership** - Users own their data and can export anytime

### Ethical AI Use

- **Clear attribution** - AI-generated content clearly marked
- **Fact checking** - Identify claims that need verification
- **Limitations disclosed** - Document what AI can and cannot do
- **Diverse perspectives** - Multiple AI models for balanced view
- **Human oversight** - Tools support human decision-making, not replace it

---

## 📚 Documentation

### Getting Started
- [Setup Guide](docs/guides/SETUP.md) - Detailed installation instructions
- [Development Guide](docs/guides/DEVELOPMENT.md) - Development workflow
- [User Interface Guide](docs/guides/ANVÄNDARGRÄNSSNITT_GUIDE.md) - UI/UX documentation

### Technical Documentation
- [API Reference](docs/api/README.md) - Complete API endpoint documentation
- [Data Schemas](docs/schemas/README.md) - Firestore collection schemas
- [Analysis Pipeline](docs/pipeline/ANALYSIS_PIPELINE.md) - Pipeline architecture
- [Python ML Integration](docs/pipeline/PYTHON_ML_INTEGRATION.md) - ML setup guide

### Feature Documentation
- [Consensus Debate](docs/features/CONSENSUS_DEBATE.md) - Live debate system
- [Change Detection](docs/features/CHANGE_DETECTION.md) - Change detection system
- [Transparency Ledger](docs/features/TRANSPARENCY_LEDGER.md) - Audit trail
- [Fact Checking](docs/features/FACTCHECK.md) - Fact checking implementation

### Implementation Reports
- [Implementation Complete](docs/implementation/IMPLEMENTATION_COMPLETE.md)
- [Pipeline Integration](docs/implementation/PIPELINE_INTEGRATION_GUIDE.md)
- [Final Integration Report](docs/implementation/FINAL_INTEGRATION_REPORT.md)

### Scripts & Tools
- [Scripts Documentation](scripts/README.md) - Utility scripts guide

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ Complete
- [x] Multi-AI comparison
- [x] Basic analysis (tone, bias, facts)
- [x] YAML/JSON export
- [x] Grok-inspired UI

### Phase 2: Advanced Analysis ✅ Complete
- [x] Full 6-step analysis pipeline
- [x] Python ML integration
- [x] Model synthesis
- [x] Consensus debate system
- [x] PDF/README export

### Phase 3: Data Persistence 🔄 In Progress
- [x] Firebase configuration setup
- [x] Firestore schema design
- [ ] Firebase Admin SDK integration
- [ ] Firebase Web SDK integration
- [ ] Data migration scripts
- [ ] User authentication
- [ ] Conversation history persistence

### Phase 4: Transparency Ledger 📋 Planned
- [ ] Blockchain-inspired ledger implementation
- [ ] Hash chain validation
- [ ] Block verification UI
- [ ] Ledger filtering and search
- [ ] Immutable audit trail

### Phase 5: Advanced Features 📋 Planned
- [ ] Battle mode (user voting)
- [ ] Public API for external apps
- [ ] Crowdsourced feedback
- [ ] Additional AI models (Claude, Llama, Mistral)
- [ ] Real-time collaborative analysis
- [ ] Advanced visualization dashboard

### Phase 6: Scale & Community 📋 Future
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Plugin system for custom analyzers
- [ ] Community model contributions
- [ ] Enterprise features
- [ ] API rate limiting and authentication

---

## 🤝 Contributing

We welcome contributions from developers, researchers, and ethics experts!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests and linters** (`./scripts/lint.sh`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described
- Ensure backward compatibility

### Areas We Need Help

- 🔧 **Frontend development** - UI/UX improvements
- 🧠 **ML/NLP** - New analysis methods
- 📊 **Data visualization** - Better charts and insights
- 🔒 **Security** - Authentication and authorization
- 📝 **Documentation** - Tutorials and guides
- 🌍 **Translations** - Multi-language support
- 🧪 **Testing** - Unit and integration tests

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

Free to use, modify, and distribute with attribution.

---

## 🙏 Acknowledgments

Built with passion for transparency, ethical AI, and informed decision-making.

**Core Technologies:**
- React, Vite, Tailwind CSS
- Node.js, Express
- spaCy, Detoxify, BERTopic
- OpenAI, Google Gemini, DeepSeek

**Inspiration:**
- Grok UI/UX design
- Open government principles
- Transparency in AI systems
- Civic technology movement

---

## 📞 Contact

**Project Maintainer:** Robin

**Repository:** https://github.com/robinandreeklund-collab/CivicAI

**Issues:** https://github.com/robinandreeklund-collab/CivicAI/issues

---

## 🔗 Quick Links

- **Live Demo:** Coming soon
- **Documentation:** [/docs](/docs)
- **API Reference:** [/docs/api](/docs/api)
- **Roadmap:** [GitHub Projects](https://github.com/robinandreeklund-collab/CivicAI/projects)

---

**Remember:** AI is a tool to support human decision-making, not replace it. Use CivicAI to gain insights, identify biases, and make more informed choices.

**🌟 Star this repo if you find it useful!**
