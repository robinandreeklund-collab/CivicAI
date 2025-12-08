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

### Step 12: Export to GGUF Format (Optional)

Export your trained model to GGUF format for efficient inference with llama.cpp.

**Quick Start - Complete 2-step export:**

```bash
# Windows
.\scripts\export_gguf_q5.ps1 -Src "models\oneseek-7b-zero\weights" -Out "models\oneseek-q5.gguf"

# Linux/macOS
./scripts/export_gguf_q5.sh --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf

# Python (cross-platform)
python scripts/export_gguf_q5.py --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf
```

**Two-step process:**

1. **Export to F16 GGUF** (~14 GB for 7B model)
   ```bash
   python scripts/export_gguf_f16.py --src models/oneseek-7b-zero/weights --out models/oneseek-f16.gguf
   ```

2. **Quantize to Q5** (~6-7 GB for 7B model)
   ```bash
   python scripts/quantize_q5.py --src models/oneseek-f16.gguf --out models/oneseek-q5.gguf
   ```

**Requirements:**
- `llama-quantize` binary from [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases)
- Windows: Place at `%USERPROFILE%\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-quantize.exe`
- Linux/macOS: Install via package manager or build from source

**Run GGUF server:**
```bash
# Windows
.\scripts\run_gguf_server_cuda.ps1 -Model "models\oneseek-q5.gguf" -Port 8080

# Linux/macOS
./scripts/run_gguf_server_cuda.sh --model models/oneseek-q5.gguf --port 8080
```

📖 **Full documentation:** [docs/gguf-export.md](docs/gguf-export.md)

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

### 🤖 OneSeek Autonomy Engine v3.3 (NEW!)

Fully self-governing autonomous training system with human oversight:
- **Nightly autonomous cycles**: Automatic self-improvement
- **Triple-AI review**: Gemini + GPT-4o + DeepSeek validation
- **Dynamic dataset sizing**: Adjusts based on fidelity scores
- **Self-generation**: Creates training examples automatically
- **2-stage analysis**: Pre/post-training bias/toxicity checks
- **Double-gate approval**: 2 of 4 required (internal + external)
- **150-question verification**: Automated quality testing
- **Golden checkpoint**: Ed25519 cryptographic admin approval
- **PoW-protected voting**: Community input with bot prevention
- **Full audit ledger**: Blockchain-inspired transparency

See [AUTONOMY_ENGINE_V3.3.md](AUTONOMY_ENGINE_V3.3.md) for complete documentation.

### 🎭 System Prompt Management

Configure the AI's personality and behavior through the Admin Dashboard:
- **100% Model Integration**: System prompt is injected into every inference request
- **The model always knows who it is**: Prompt follows with every request automatically
- **Dashboard Configuration**: Manage prompts via Admin Dashboard → System Prompts tab
- **Real-time updates**: No server restart required - changes apply immediately
- **File-based persistence**: Prompts saved to `datasets/system_prompts/` as JSON files
- **Fallback default**: Uses built-in Swedish civic-AI prompt when no custom prompt is set

**API Endpoints:**
- `GET /api/system-prompts` - List all system prompts
- `POST /api/system-prompts` - Create a new system prompt
- `POST /api/system-prompts/{id}/activate` - Activate a prompt for inference
- `POST /api/system-prompts/sync-characters` - Sync all character cards as system prompts
- `GET /api/system-prompt` - Get the currently active system prompt (convenience endpoint)

**Character Card Integration:**
Character cards from `frontend/public/characters/` are automatically synced to system prompts at startup.
Each character card becomes an available system prompt that can be activated via the dashboard.

**How it works:**
The active system prompt is automatically prepended to every inference request:
```
[System Prompt]

User: [User's question]

Assistant:
```

This ensures the model always knows its identity, regardless of which character is selected.

### 🤖 Multi-AI Comparison

Ask the same question to multiple AI models simultaneously and compare:
- **GPT-3.5** (OpenAI) - Fast and efficient
- **Gemini** (Google) - Advanced reasoning
- **DeepSeek** - Technical precision

---

**Remember:** AI is a tool to support human decision-making, not replace it. Use CivicAI to gain insights, identify biases, and make more informed choices.

---

## 🔧 Admin Dashboard Features

### Model Management

The Admin Dashboard provides comprehensive model management capabilities:

#### Model Version Deletion

Delete non-active model versions from the Admin Dashboard → Models tab:

- **Hard deletion only**: Model directories are permanently removed
- **Active model protection**: Cannot delete the active model (target of OneSeek-7B-Zero-CURRENT symlink)
- **Path safety**: Strict directory whitelists prevent path traversal attacks
- **Audit logging**: All deletion operations are logged with user, version, timestamp, and outcome

**API Endpoint:**
```bash
DELETE /api/models/:version
```

**Error Codes:**
- `ACTIVE_MODEL` (409): Cannot delete the active model
- `MODEL_NOT_FOUND` (404): Model version doesn't exist
- `PATH_TRAVERSAL_BLOCKED` (403): Invalid path detected

#### Adapter Deletion

Delete specific adapters within model versions:

```bash
DELETE /api/models/:version/adapters/:adapterId
```

Essential adapters (adapter_model.bin, adapter_config.json) are protected on active models.

### Development Reset (Dev Reset)

Located in Admin Dashboard → Integrations → ONESEEK Δ+ Admin → Dev Reset tab.

**Purpose:** Reset development environment data for testing and development.

**Features:**
- Purge Firebase collections (oqt_* and delta_* prefixes)
- Purge prepared datasets (ml/data/prepared/)
- Purge training temp files and logs
- Reset memory context (caches, conversation history)

**API Endpoint:**
```bash
POST /api/admin/dev-reset
```

**Request Body:**
```json
{
  "purgeFirebase": true,
  "purgePreparedDatasets": true,
  "purgeTrainingTemp": true,
  "resetMemoryContext": true,
  "keepModels": true
}
```

**Environment Guards:**
- Only available when `NODE_ENV=development` or `ALLOW_DEV_RESET=true` in backend/.env
- Returns 403 in production unless explicitly enabled

**Firebase Collections Purged:**
- oqt_queries, oqt_metrics, oqt_training_events, oqt_ledger, oqt_provenance
- delta_topics, delta_messages, delta_typo_pairs, delta_gold_examples

### Memory Context Reset

Reset in-memory caches without purging persistent data:

**API Endpoint:**
```bash
POST /api/memory/reset
```

**Clears:**
- Conversation cache
- Inference cache
- OQT knowledge base
- Python NLP service context (if available)
- ML service context (if available)

**Status Check:**
```bash
GET /api/memory/status
```

Returns current cache sizes and health information.

---

**🌟 Star this repo if you find it useful!**
