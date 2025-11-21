# OneSeek-7B-Zero Architecture & Training Guide

## System Architecture Overview

### Current Flow (Step-by-Step)

#### 1. User Query Flow
```
User Question (Frontend)
    ↓
Backend API (/api/oqt/multi-model-query)
    ↓
ML Service Routing Decision
    ↓
/inference/mistral OR /inference/llama (Legacy endpoints)
    ↓
[REDIRECT] → /inference/oneseek (OneSeek-7B-Zero.v1.1)
    ↓
Load Base Model (Mistral-7B or LLaMA-2)
    ↓
Apply LoRA Adapters (if available in weights/)
    ↓
Generate Response
    ↓
Return to Frontend
```

#### 2. Model Loading Flow (Current Implementation)

**Step 1: Find Base Model**
```python
find_base_model_path() checks in order:
1. models/oneseek-7b-zero/config.json          # Complete trained model
2. models/oneseek-7b-zero/base_models/mistral-7b/
3. models/oneseek-7b-zero/base_models/llama-2-7b/
4. models/mistral-7b-instruct/                 # ← YOUR CURRENT SETUP
5. models/llama-2-7b-chat/
```

**Step 2: Load Base Model**
```python
# Load Mistral-7B (27.4GB) into memory
model = AutoModelForCausalLM.from_pretrained("models/mistral-7b-instruct")
tokenizer = AutoTokenizer.from_pretrained("models/mistral-7b-instruct")
```

**Step 3: Find LoRA Weights** (NEW in latest commit)
```python
find_lora_weights() checks:
1. weights/oneseek-7b-zero-v1.1.pth           # ← YOUR TRAINED WEIGHTS
2. weights/oneseek-7b-zero-v*.pth (latest)
3. lora_adapters/oneseek-7b-zero-v*/adapter.pth
```

**Step 4: Apply LoRA Adapters** (NEW in latest commit)
```python
if lora_weights_found:
    from peft import PeftModel
    model = PeftModel.from_pretrained(model, lora_weights_dir)
    # Now model = Mistral-7B + Your Identity Training
```

#### 3. What LoRA Adapters Are

**LoRA (Low-Rank Adaptation)** is a technique that:
- Keeps the base model (Mistral-7B) **frozen** (unchanged)
- Adds small "adapter" layers (only ~50MB)
- Trains only these adapters, not the full 27GB model
- Achieves 99% of full fine-tuning quality with 0.1% of parameters

**Your Current Setup:**
```
Base Model: Mistral-7B (27.4GB) - FROZEN
    +
LoRA Adapters: oneseek-7b-zero-v1.1 (~50MB) - TRAINED
    =
OneSeek-7B-Zero.v1.1 (effective 27.5GB)
```

**Benefits:**
- Train in minutes instead of days
- Multiple models from one base (Swedish, English, etc.)
- Easy rollback (just swap adapters)
- Minimal storage (50MB per version vs 27GB)

---

## Training OneSeek-7B-Zero with Swedish Support

### Current Status

You have successfully trained **OneSeek-7B-Zero.v1.1** with:
- Base Model: Mistral-7B
- Training Data: 74 samples (oneseek_identity_v1.jsonl)
- LoRA Rank: 8
- Metrics: Loss 4.48, Accuracy 0.85

### Training Flow Explained

#### Stage 1: Identity Training (English) - COMPLETED ✓

```bash
python scripts/train_identity.py
```

**What happens:**
1. **Load Base Model**: Mistral-7B (27.4GB) from `models/mistral-7b-instruct/`
2. **Prepare LoRA Config**:
   ```python
   lora_config = {
       "r": 8,              # Rank (complexity of adapters)
       "lora_alpha": 32,    # Scaling factor
       "target_modules": ["q_proj", "v_proj"],  # Which layers to adapt
   }
   ```
3. **Load Training Data**: `datasets/oneseek_identity_v1.jsonl` (74 examples)
4. **Train LoRA Adapters**:
   - Freeze Mistral-7B weights (27.4GB stays unchanged)
   - Train only LoRA adapters (~50MB)
   - 3 epochs, batch size 8, learning rate 0.0001
5. **Save Outputs**:
   - `weights/oneseek-7b-zero-v1.1.pth` (LoRA weights ~50MB)
   - `weights/oneseek-7b-zero-v1.1.json` (metadata)
   - `ml/ledger/` (provenance tracking)

**Result:**
- OneSeek now has "identity" - knows it's a transparent AI agent
- Trained on 74 bilingual examples (English + Swedish basics)
- Version: v1.1

#### Stage 2: Swedish Enhancement (with GPT-SW3-20B) - NOT YET DONE

```bash
# Download Swedish model
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct \
  --local-dir models/gpt-sw3-20b-instruct

# Train Swedish version
python scripts/train_identity.py \
  --language sv \
  --external-model gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl
```

**What will happen:**

1. **Load Base Model**: Still Mistral-7B (or switch to GPT-SW3-20B)
2. **Load External Model**: GPT-SW3-20B-Instruct (Swedish language expert)
3. **Prepare Swedish Dataset**:
   ```jsonl
   {"instruction": "Vem är du?", "output": "Jag är OneSeek AI-agent..."}
   {"instruction": "Vad gör du?", "output": "Jag analyserar svar..."}
   ```
4. **Cross-Training Process**:
   - Load both models: Mistral-7B + GPT-SW3-20B
   - Extract Swedish linguistic patterns from GPT-SW3
   - Apply them to Mistral-7B via LoRA
   - Train on Swedish identity dataset
5. **Save Swedish Version**:
   - `weights/oneseek-7b-zero-v1.1-SV.pth` (Swedish LoRA adapters)
   - `weights/oneseek-7b-zero-v1.1-SV.json` (metadata)

**Result:**
- OneSeek-7B-Zero-SV.v1.1 (Swedish version)
- Same base model (Mistral-7B)
- Different LoRA adapters (Swedish-optimized)
- Can switch languages by swapping adapters

---

## How Base Models Work Together

### Option 1: Single Base Model (Current - Recommended)

```
Mistral-7B (27.4GB)
    ├── + LoRA v1.1 (English) → OneSeek-7B-Zero.v1.1
    ├── + LoRA v1.1-SV (Swedish) → OneSeek-7B-Zero-SV.v1.1
    └── + LoRA v1.2 (Future) → OneSeek-7B-Zero.v1.2
```

**Advantages:**
- One base model to maintain
- Fast switching between versions
- Minimal storage (one 27GB base + multiple 50MB adapters)

### Option 2: Multiple Base Models (For Comparison)

```
Mistral-7B (27.4GB) + LoRA → OneSeek-Mistral.v1.1
LLaMA-2 (25.1GB) + LoRA → OneSeek-LLaMA.v1.1
GPT-SW3 (20GB) + LoRA → OneSeek-Swedish.v1.1
```

**When to use:**
- Comparing different base architectures
- Specialized tasks (Swedish-only with GPT-SW3)
- Research and development

### GPT-SW3-20B Integration Strategy

**Strategy A: Knowledge Distillation** (Recommended)
```
GPT-SW3-20B (Teacher)
    ↓ [Generate Swedish training data]
Swedish Dataset (1000+ examples)
    ↓ [Train LoRA]
Mistral-7B + Swedish LoRA = OneSeek-SV.v1.1
```

**Advantages:**
- Keep using smaller Mistral-7B (faster inference)
- Learn Swedish from GPT-SW3 without loading it at runtime
- Best of both worlds

**Strategy B: Dual-Model Ensemble**
```
Mistral-7B (English) + GPT-SW3-20B (Swedish)
    ↓ [Route by language]
English Query → Mistral-7B + English LoRA
Swedish Query → GPT-SW3-20B + Swedish LoRA
```

**Advantages:**
- Native Swedish support with GPT-SW3
- Optimal for each language

**Disadvantages:**
- Requires 47GB in memory (both models)
- Slower language switching

---

## Path to Independence from Base Models

### Current State: LoRA on Base Models

```
OneSeek-7B-Zero = Mistral-7B (frozen) + LoRA adapters (trained)
```

### Future: Fully Merged Model

#### Phase 1: LoRA Merging (Near-term)
```python
# Merge LoRA weights into base model
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("mistral-7b-instruct")
peft_model = PeftModel.from_pretrained(base_model, "weights/oneseek-v1.1")

# Merge and save as standalone model
merged_model = peft_model.merge_and_unload()
merged_model.save_pretrained("models/oneseek-7b-zero-standalone-v1.1")
```

**Result:**
- Standalone OneSeek-7B-Zero model (27.5GB)
- No dependency on Mistral-7B
- Can distribute independently

#### Phase 2: Continued Pre-training (Long-term)
```python
# Train entire model (not just LoRA)
# Requires significant compute (weeks on GPU cluster)

# Start from merged model
base = "models/oneseek-7b-zero-standalone-v1.1"

# Train on massive datasets (100k+ examples)
train_full_model(
    base_model=base,
    dataset="large_swedish_corpus.jsonl",
    epochs=10,
    ... # More intensive training
)
```

**Result:**
- Truly independent OneSeek-7B-Zero
- Optimized weights throughout
- No "base model" concept

#### Phase 3: From-Scratch Training (Future)
```python
# Train entirely new model architecture
# Requires enormous compute (months, millions of dollars)

config = OneSeekConfig(
    vocab_size=32000,
    hidden_size=4096,
    num_layers=32,
    ...
)

model = OneSeekModel(config)
train_from_scratch(model, massive_dataset)
```

**Result:**
- 100% independent OneSeek architecture
- No dependencies on any base model
- Custom optimizations for transparency/fairness

---

## Recommended Training Workflow

### Step 1: English Identity (COMPLETED ✓)
```bash
python scripts/train_identity.py
# → oneseek-7b-zero-v1.1.pth
```

### Step 2: Swedish Dataset Preparation
```bash
# Create Swedish identity dataset
cat > datasets/oneseek_identity_sv_v1.jsonl << 'EOF'
{"instruction": "Vem är du?", "input": "", "output": "Jag är OneSeek AI-agent, skapad för att ge transparenta och rättvisa svar. Jag analyserar information från flera AI-källor och ger dig det bästa svaret."}
{"instruction": "Vad gör du?", "input": "", "output": "Jag är en transparent AI-agent som jämför svar från olika AI-modeller, analyserar deras kvalitet och konsensus, och ger dig pålitlig information."}
{"instruction": "Hur skiljer du dig från andra AI?", "input": "", "output": "Till skillnad från externa AI-tjänster lär jag mig kontinuerligt från varje interaktion, loggar all provenance för transparens, och fokuserar på rättvisa och bias-detektion."}
EOF

# Add 100+ more examples...
```

### Step 3: Download GPT-SW3-20B (Optional, for Strategy A)
```bash
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct \
  --local-dir models/gpt-sw3-20b-instruct
```

### Step 4: Train Swedish Version
```bash
python scripts/train_identity.py \
  --language sv \
  --external-model gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl \
  --epochs 5 \
  --batch-size 16

# → oneseek-7b-zero-v1.1-SV.pth
```

### Step 5: Test Both Versions
```bash
# Start ML service
python ml_service/server.py

# Test English
curl -X POST http://localhost:5000/inference/oneseek \
  -d '{"text": "Who are you?"}'

# Test Swedish (after loading SV adapters)
curl -X POST http://localhost:5000/inference/oneseek \
  -d '{"text": "Vem är du?"}'
```

### Step 6: Merge for Production (Optional)
```bash
python scripts/merge_lora.py \
  --base-model models/mistral-7b-instruct \
  --lora-weights weights/oneseek-7b-zero-v1.1.pth \
  --output models/oneseek-7b-zero-standalone-v1.1
```

---

## Technical Details

### LoRA Configuration
```python
{
    "r": 8,                          # Rank (8-32 typical)
    "lora_alpha": 32,                # Scaling (usually 2-4× rank)
    "target_modules": [              # Which layers to adapt
        "q_proj",                    # Query projection
        "v_proj",                    # Value projection
        "k_proj",                    # Key projection (optional)
        "o_proj",                    # Output projection (optional)
    ],
    "lora_dropout": 0.05,            # Regularization
    "bias": "none",                  # Don't train bias terms
    "task_type": "CAUSAL_LM"         # Language modeling task
}
```

### Storage Requirements
```
Base Models (one-time download):
├── Mistral-7B:        27.4 GB
├── LLaMA-2:           25.1 GB
└── GPT-SW3-20B:       ~40 GB

OneSeek Versions (cumulative):
├── v1.1 LoRA:         ~50 MB
├── v1.1-SV LoRA:      ~50 MB
├── v1.2 LoRA:         ~50 MB
└── ... (50MB each)

Total for 10 versions: ~27.5 GB (base) + 500 MB (adapters)
```

### Training Times (Estimates)
```
On Your Setup (DirectML GPU):
├── Identity Training (74 samples):      ~5-10 minutes
├── Swedish Training (500 samples):      ~20-30 minutes
└── Large Training (5000 samples):       ~2-3 hours

On Cloud GPU (A100):
├── Identity Training:                   ~1-2 minutes
├── Swedish Training:                    ~5-10 minutes
└── Full Model Merge:                    ~30-60 minutes
```

---

## Summary

### Current State
✓ OneSeek-7B-Zero.v1.1 routes correctly
✓ Uses Mistral-7B as base model  
✓ LoRA adapters trained (74 samples)
⚠ LoRA adapters NOW auto-load (latest commit)

### Next Steps
1. **Pull latest changes** (LoRA auto-loading added)
2. **Create Swedish dataset** (100+ examples)
3. **Train Swedish version** (--language sv)
4. **Test both versions** (English + Swedish)
5. **(Optional) Merge to standalone model**

### Long-term Vision
- Fully independent OneSeek-7B-Zero model
- No dependency on Mistral/LLaMA
- Custom architecture optimized for transparency
- 100+ language support through specialized LoRAs

---

## Questions & Next Steps

Let me know if you want me to:
1. ✅ Add LoRA auto-loading (DONE in latest commit)
2. Create example Swedish training dataset
3. Add language detection and auto-routing
4. Implement LoRA merging script
5. Add multi-LoRA support (load different adapters per query)
