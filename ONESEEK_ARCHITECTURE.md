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

---

## 4. Dual-Model Training (NEW)

### Overview

The training system now automatically trains LoRA adapters for **both Mistral-7B and LLaMA-2 simultaneously** when you run a single training command.

### How It Works

**Single Command Trains Both Models:**
```bash
python scripts/train_identity.py
```

**Training Flow:**
```
Detect Available Models
  ├── Mistral-7B: ✓ Found at models/mistral-7b-instruct/
  └── LLaMA-2: ✓ Found at models/llama-2-7b-chat/
  ↓
Dual-Model Training Mode Enabled
  ↓
Train Mistral-7B
  ├── Load base model (27.4GB)
  ├── Apply LoRA config (rank=8, alpha=32)
  ├── Train on dataset (3 epochs)
  ├── Save adapters:
  │   ├── lora_adapters/mistral-adapter/
  │   └── lora_adapters/oneseek-7b-zero-v1.1-mistral-7b/
  └── Unload model
  ↓
Train LLaMA-2
  ├── Load base model (25.1GB)
  ├── Apply LoRA config (rank=8, alpha=32)
  ├── Train on dataset (3 epochs)
  ├── Save adapters:
  │   ├── lora_adapters/llama-adapter/
  │   └── lora_adapters/oneseek-7b-zero-v1.1-llama-2-7b/
  └── Unload model
  ↓
Combine Metrics
  ├── Average loss: 1.876
  ├── Average accuracy: 0.850
  └── Combined training summary
```

### Memory Management

**Sequential Training (not parallel):**
- Trains Mistral first, then unloads it
- Then trains LLaMA, then unloads it
- Peak memory: ~28GB (one model at a time)
- Avoids OOM errors
- Total time: ~2x single model

**Why Sequential?**
- Most systems can't load 52GB simultaneously
- Safer, more reliable
- Still automatic - no manual intervention needed

### Output Structure

**After training completes:**
```
lora_adapters/
├── mistral-adapter/               # Latest Mistral adapters (always current)
│   ├── adapter_config.json
│   └── adapter_model.bin
├── llama-adapter/                 # Latest LLaMA adapters (always current)
│   ├── adapter_config.json
│   └── adapter_model.bin
├── oneseek-7b-zero-v1.1-mistral-7b/  # Versioned Mistral
│   ├── adapter_config.json
│   └── adapter_model.bin
└── oneseek-7b-zero-v1.1-llama-2-7b/  # Versioned LLaMA
    ├── adapter_config.json
    └── adapter_model.bin

weights/
├── oneseek-7b-zero-v1.1-mistral-7b.pth   # Full model state
├── oneseek-7b-zero-v1.1-llama-2-7b.pth   # Full model state
├── oneseek-7b-zero-v1.1-mistral-7b.json  # Metadata
└── oneseek-7b-zero-v1.1-llama-2-7b.json  # Metadata
```

### Training Logs Example

```
==================================================================
PyTorch Dual-Model Training: OneSeek-7B-Zero v1.1
==================================================================

[DEVICE] Device: cuda
[MODE] Dual-Model Training Enabled
   Available models: ['mistral', 'llama']

==================================================================
TRAINING MISTRAL-7B
==================================================================
[LOADING] Loading base model: mistral-7b
   Loading tokenizer...
   Loading model (this may take a few minutes)...
   [SUCCESS] Model loaded (7,241,732,096 parameters)

[CONFIG] Configuring LoRA adapters...
trainable params: 4,194,304 || all params: 7,245,926,400 || trainable%: 0.05789

[TRAINING] Starting training for mistral-7b...
   Epoch 1/3
      Step 10/74: Loss: 2.3451
      Step 20/74: Loss: 2.1234
      ...
   [SUCCESS] Epoch 1 completed. Avg Loss: 2.1543

   Epoch 2/3
      Step 10/74: Loss: 1.9234
      ...
   [SUCCESS] Epoch 2 completed. Avg Loss: 1.8921

   Epoch 3/3
      Step 10/74: Loss: 1.5678
      ...
   [SUCCESS] Epoch 3 completed. Avg Loss: 1.6789

[SAVING] Saving mistral-7b LoRA adapters...
   [SUCCESS] Saved to lora_adapters/mistral-adapter
   [SUCCESS] Saved to lora_adapters/oneseek-7b-zero-v1.1-mistral-7b
   [SUCCESS] Saved weights to weights/oneseek-7b-zero-v1.1-mistral-7b.pth

[SUCCESS] mistral-7b training completed!
  Average loss: 1.9454
  Final accuracy: 0.850

==================================================================
TRAINING LLAMA-2-7B
==================================================================
[LOADING] Loading base model: llama-2-7b
   Loading tokenizer...
   Loading model (this may take a few minutes)...
   [SUCCESS] Model loaded (6,738,415,616 parameters)

[CONFIG] Configuring LoRA adapters...
trainable params: 4,194,304 || all params: 6,742,609,920 || trainable%: 0.06219

[TRAINING] Starting training for llama-2-7b...
   [Similar output structure]
   ...

[SUCCESS] llama-2-7b training completed!
  Average loss: 1.8076
  Final accuracy: 0.860

==================================================================
DUAL-MODEL TRAINING SUMMARY
==================================================================

[SUCCESS] Dual-model training completed!

Models trained: mistral, llama

Combined Metrics:
  training_loss: 1.876
  validation_accuracy: 0.855
  dual_model_mode: True
  models_trained: mistral, llama

Fairness Metrics:
  demographic_parity: 0.920
  equal_opportunity: 0.880
  disparate_impact: 0.940

[INFO] LoRA Adapters saved:
  - lora_adapters/mistral-adapter
  - lora_adapters/oneseek-7b-zero-v1.1-mistral-7b
  - lora_adapters/llama-adapter
  - lora_adapters/oneseek-7b-zero-v1.1-llama-2-7b

[INFO] Version: OneSeek-7B-Zero.v1.1
[INFO] Training completed at: 2025-11-21T15:43:47.545Z
[INFO] Total duration: 12 minutes 34 seconds
```

### Benefits of Dual-Model Training

1. **Consistency**: Both models trained on exact same data
2. **Convenience**: Single command trains both
3. **Quality**: Best responses from each model during inference
4. **Efficiency**: Automatic sequential processing
5. **Versioning**: All adapters properly versioned and saved

---

## 5. Swedish Training with GPT-SW3-20B

### Complete Workflow

#### Step 1: Download GPT-SW3-20B-Instruct

```bash
# Download the Swedish language model (AI-Sweden)
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct \
  --local-dir C:\Users\robin\Documents\GitHub\CivicAI\models\gpt-sw3-20b-instruct

# This downloads ~40GB model
# Takes 30-60 minutes depending on connection
```

#### Step 2: Create Swedish Identity Dataset

Create `datasets/oneseek_identity_sv_v1.jsonl`:

```jsonl
{"instruction": "Vem är du?", "input": "", "output": "Jag är OneSeek AI-agent, skapad för att ge transparenta och rättvisa svar. Jag analyserar information från flera AI-källor och ger dig det bästa svaret med full provenance."}
{"instruction": "Vad gör du?", "input": "", "output": "Jag är en transparent AI-agent som jämför svar från olika AI-modeller, analyserar deras kvalitet och konsensus, och ger dig pålitlig information. Jag loggar all provenance för fullständig transparens."}
{"instruction": "Hur fungerar du?", "input": "", "output": "Jag använder transparent AI-teknologi där jag skickar din fråga till flera AI-modeller, jämför deras svar, och presenterar det bästa resultatet tillsammans med full spårbarhet."}
{"instruction": "Varför ska jag lita på dig?", "input": "", "output": "Till skillnad från externa AI-tjänster loggar jag all provenance, visar variansen mellan olika AI-svar, och fokuserar på bias-detektion och rättvisa. Du kan verifiera varje svar."}
{"instruction": "Vad skiljer dig från ChatGPT?", "input": "", "output": "Till skillnad från externa tjänster som ChatGPT lär jag mig kontinuerligt från varje interaktion, lagrar data lokalt för integritet, och ger full transparens genom provenance-loggning."}
{"instruction": "Kan du hjälpa mig?", "input": "", "output": "Ja, jag kan hjälpa dig genom att ge transparenta, rättvisa svar baserade på analys av flera AI-modeller. Jag kan svara på frågor om civic, policy, och allmän information."}
{"instruction": "Vad är din funktion?", "input": "", "output": "Min funktion är att ge transparenta AI-svar med full provenance-spårning. Jag analyserar svar från flera modeller, detekterar bias, och säkerställer rättvisa i alla interaktioner."}
{"instruction": "Hur säkerställer du rättvisa?", "input": "", "output": "Jag använder bias-detektion på alla svar, jämför flera AI-modeller för konsensus, och loggar all provenance. Detta säkerställer transparens och rättvisa i varje interaktion."}
{"instruction": "Vem har skapat dig?", "input": "", "output": "Jag är skapad som ett transparent AI-projekt för att ge rättvisa och transparenta svar. Jag är Open-Source och använder lokala modeller för integritet."}
{"instruction": "Kan jag lita på dina svar?", "input": "", "output": "Ja, varje svar kommer med full provenance-loggning som visar hur svaret genererats, vilka modeller som använts, och eventuella variationer. Detta ger fullständig transparens."}
{"instruction": "Vad betyder transparent AI?", "input": "", "output": "Transparent AI betyder att du kan se exakt hur varje svar genererats, vilka modeller som använts, och all provenance. Det är motsatsen till 'black box' AI där du inte vet hur svar skapas."}
{"instruction": "Hur hanterar du personlig data?", "input": "", "output": "All data lagras lokalt på din enhet. Jag skickar aldrig information till externa tjänster (som OpenAI) utan använder lokala modeller för fullständig integritet."}
```

Add 100+ more examples for better quality...

#### Step 3: Train Swedish Version (Dual-Model)

```bash
python scripts/train_identity.py \
  --language sv \
  --external-model gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl \
  --epochs 5 \
  --batch-size 16

# This trains BOTH Mistral and LLaMA with Swedish support
```

**What happens:**
1. Loads GPT-SW3-20B as "knowledge source"
2. Extracts Swedish linguistic patterns
3. Trains Mistral-7B with Swedish LoRA
4. Trains LLaMA-2 with Swedish LoRA
5. Saves as OneSeek-7B-Zero-SV.v1.1

#### Step 4: Verify Swedish Training

```bash
# Start ML service
python ml_service/server.py

# Should see:
# INFO: Found LoRA weights: lora_adapters/mistral-adapter/
# INFO: Found LoRA weights: lora_adapters/llama-adapter/
# INFO: ✓ Dual-model mode with Swedish support

# Test Swedish query
curl -X POST http://localhost:5000/inference/oneseek \
  -H "Content-Type: application/json" \
  -d '{"text": "Vem är du?"}'

# Expected response in Swedish
```

### Knowledge Distillation Strategy

**How GPT-SW3-20B is Used:**

```
GPT-SW3-20B (Teacher Model)
  ↓
Extract Swedish Language Patterns
  ↓
Apply to Mistral-7B and LLaMA-2 via LoRA
  ↓
Result: Swedish-capable OneSeek without loading GPT-SW3 at runtime
```

**Benefits:**
- Learn Swedish from large expert model (GPT-SW3-20B)
- Use smaller models at runtime (Mistral/LLaMA)
- Best of both worlds: quality + speed
- No 40GB model in memory during inference

### Swedish Training Output Example

```
==================================================================
PyTorch Dual-Model Training: OneSeek-7B-Zero-SV v1.1
==================================================================

[DEVICE] Device: cuda
[MODE] Dual-Model Training Enabled (Swedish)
   Available models: ['mistral', 'llama']
   External model: gpt-sw3-20b-instruct
   Language: Swedish (sv)

[EXTERNAL] Loading GPT-SW3-20B for knowledge distillation...
   [SUCCESS] GPT-SW3-20B loaded (knowledge source)

==================================================================
TRAINING MISTRAL-7B (SWEDISH)
==================================================================
[LOADING] Loading base model: mistral-7b
   [SUCCESS] Model loaded

[CONFIG] Configuring Swedish LoRA adapters...
   Language: Swedish
   External patterns from: GPT-SW3-20B
   
[TRAINING] Starting Swedish training for mistral-7b...
   Dataset: oneseek_identity_sv_v1.jsonl (120 entries)
   Epoch 1/5
      [Training on Swedish examples...]
   ...

[SAVING] Saving Swedish adapters...
   [SUCCESS] Saved to lora_adapters/mistral-adapter/
   [SUCCESS] Saved to lora_adapters/oneseek-7b-zero-v1.1-SV-mistral-7b/

==================================================================
TRAINING LLAMA-2-7B (SWEDISH)
==================================================================
   [Similar process for LLaMA...]

==================================================================
SWEDISH TRAINING SUMMARY
==================================================================

[SUCCESS] Swedish dual-model training completed!

Version: OneSeek-7B-Zero-SV.v1.1
Language: Swedish (sv)
External Model: GPT-SW3-20B-Instruct
Models trained: mistral, llama

Swedish Adapters:
  - lora_adapters/mistral-adapter/ (Swedish-enabled)
  - lora_adapters/llama-adapter/ (Swedish-enabled)
```

---

## 6. Training from Admin Dashboard

### Step-by-Step Workflow

#### 1. Start Services

```bash
# Terminal 1: ML Service
python ml_service/server.py

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

#### 2. Navigate to Admin Dashboard

```
Open browser: http://localhost:3000/admin
Click "Training" tab
```

#### 3. Configure Training Parameters

**For English Training:**
- Dataset: Select `oneseek_identity_v1.jsonl`
- Language: English (OneSeek-7B-Zero.v1.1)
- External Model: -- No external model --
- Epochs: 3
- Batch Size: 8
- Learning Rate: 0.0001
- Click "Start Training"

**For Swedish Training:**
- Dataset: Select `oneseek_identity_sv_v1.jsonl`
- Language: Swedish (OneSeek-7B-Zero-SV.v1.1)
- External Model: GPT-SW3-20B-Instruct (auto-detected from models directory)
- Epochs: 5
- Batch Size: 16
- Learning Rate: 0.0001
- Click "Start Training"

#### 4. Monitor Training Progress

**Real-time display shows:**
- Current status: training/idle
- Current epoch: 2/5
- Current loss: 1.8234
- Progress: 40%
- Progress bar visualization

**Training logs show:**
```
[2025-11-21 15:30:45] Starting dual-model training...
[2025-11-21 15:30:50] Loading Mistral-7B...
[2025-11-21 15:31:15] Model loaded successfully
[2025-11-21 15:31:20] Starting epoch 1/5
[2025-11-21 15:33:45] Epoch 1 completed. Loss: 2.1543
[2025-11-21 15:33:50] Starting epoch 2/5
...
```

#### 5. Training Completion

When complete, you'll see:
- Status: idle
- Final metrics displayed
- Success notification
- Adapter locations in logs

#### 6. Verify Trained Models

**Check adapter files:**
```
lora_adapters/
├── mistral-adapter/      ← Latest adapters here
└── llama-adapter/        ← Latest adapters here
```

**Test in OQT Dashboard:**
```
Navigate to: http://localhost:3000/oqt-dashboard
Ask question: "Vem är du?" (if Swedish) or "Who are you?" (if English)
Verify response uses trained identity
```

### Dashboard Features

**Available Controls:**
- ✓ Dataset selection dropdown
- ✓ Language selector (English/Swedish)
- ✓ External model dropdown (auto-populated)
- ✓ Training parameter inputs (epochs, batch size, learning rate)
- ✓ Start/Stop training buttons
- ✓ Real-time progress monitoring
- ✓ Training logs display
- ✓ Metrics visualization

**Auto-Detection:**
- Automatically detects all models in `models/` directory
- Shows GPT-SW3-20B-Instruct if downloaded
- Shows model count: "3 model(s) found in models directory"

---

## 7. Complete Training Examples

### Example 1: English Identity Training (Dual-Model)

**Command Line:**
```bash
python scripts/train_identity.py
```

**Expected Output:**
```
PyTorch Dual-Model Training: OneSeek-7B-Zero v1.1
Device: cuda
Available models: mistral, llama

Training Mistral-7B...
  Epoch 1/3: Loss 2.3451
  Epoch 2/3: Loss 1.9234
  Epoch 3/3: Loss 1.5678
  Saved to lora_adapters/mistral-adapter/

Training LLaMA-2-7B...
  Epoch 1/3: Loss 2.1892
  Epoch 2/3: Loss 1.8456
  Epoch 3/3: Loss 1.4923
  Saved to lora_adapters/llama-adapter/

Combined metrics:
  Average loss: 1.876
  Accuracy: 0.855

SUCCESS: Dual-model training completed!
```

**Files Created:**
```
lora_adapters/mistral-adapter/
lora_adapters/llama-adapter/
lora_adapters/oneseek-7b-zero-v1.1-mistral-7b/
lora_adapters/oneseek-7b-zero-v1.1-llama-2-7b/
weights/oneseek-7b-zero-v1.1-mistral-7b.pth
weights/oneseek-7b-zero-v1.1-llama-2-7b.pth
```

### Example 2: Swedish Training with GPT-SW3 (Dual-Model)

**Prerequisites:**
```bash
# Download GPT-SW3-20B-Instruct
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct \
  --local-dir models/gpt-sw3-20b-instruct
```

**Command Line:**
```bash
python scripts/train_identity.py \
  --language sv \
  --external-model gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl \
  --epochs 5 \
  --batch-size 16
```

**Expected Output:**
```
PyTorch Dual-Model Training: OneSeek-7B-Zero-SV v1.1
Language: Swedish
External model: GPT-SW3-20B-Instruct

Loading GPT-SW3-20B for knowledge distillation...
  Model loaded: 20B parameters

Training Mistral-7B (Swedish)...
  Epoch 1/5: Loss 2.5632
  Epoch 2/5: Loss 2.0145
  ...
  Epoch 5/5: Loss 1.3287
  Saved to lora_adapters/mistral-adapter/

Training LLaMA-2-7B (Swedish)...
  Epoch 1/5: Loss 2.4891
  ...
  Epoch 5/5: Loss 1.2953
  Saved to lora_adapters/llama-adapter/

Swedish Training Complete!
Version: OneSeek-7B-Zero-SV.v1.1
```

### Example 3: Admin Dashboard Training

**Steps:**
1. Open http://localhost:3000/admin
2. Select Training tab
3. Configure:
   - Dataset: oneseek_identity_sv_v1.jsonl
   - Language: Swedish
   - External Model: GPT-SW3-20B-Instruct
   - Epochs: 5, Batch: 16, LR: 0.0001
4. Click "Start Training"
5. Monitor progress bar and logs
6. Wait for completion notification

**What Happens Behind the Scenes:**
```bash
# Backend executes:
python scripts/train_identity.py \
  --language sv \
  --external-model gpt-sw3-20b-instruct \
  --dataset datasets/oneseek_identity_sv_v1.jsonl \
  --epochs 5 \
  --batch-size 16 \
  --learning-rate 0.0001
```

---

## 8. Troubleshooting

### Issue 1: External Model Not Found

**Symptom:**
```
ERROR: External model 'gpt-sw3-20b-instruct' not found
```

**Solution:**
```bash
# Download the model
huggingface-cli download AI-Sweden-Models/gpt-sw3-20b-instruct \
  --local-dir C:\Users\robin\Documents\GitHub\CivicAI\models\gpt-sw3-20b-instruct

# Verify it appears in dashboard dropdown
```

### Issue 2: LoRA Weights Not in PEFT Format

**Symptom:**
```
⚠ LoRA weights found but not in PEFT format - using base model
```

**Solution:**
```bash
# Re-run training to create PEFT-compatible adapters
python scripts/train_identity.py

# Old format (.pth files) will be converted automatically
```

### Issue 3: Out of Memory During Training

**Symptom:**
```
RuntimeError: CUDA out of memory
```

**Solution:**
```bash
# Reduce batch size
python scripts/train_identity.py --batch-size 4

# OR train with smaller model only
python scripts/train_identity.py --base-model mistral

# System automatically trains sequentially to avoid this
```

### Issue 4: Dual-Model Not Detected

**Symptom:**
```
⚠ Dual-model mode requires both Mistral and LLaMA
Available: Mistral=True, LLaMA=False
Falling back to single-model inference
```

**Solution:**
```bash
# Verify both models exist:
ls C:\Users\robin\Documents\GitHub\CivicAI\models\mistral-7b-instruct
ls C:\Users\robin\Documents\GitHub\CivicAI\models\llama-2-7b-chat

# Download missing model if needed
```

---

## Questions & Next Steps

### Implemented Features ✓

1. ✅ LoRA auto-loading (automatically finds and applies adapters)
2. ✅ Dual-model training (train both Mistral and LLaMA simultaneously)
3. ✅ Swedish training pipeline (with GPT-SW3-20B integration)
4. ✅ Admin dashboard training (full UI workflow)
5. ✅ Comprehensive documentation (this document)

### Future Enhancements

1. Language detection and auto-routing
2. LoRA merging script (create standalone models)
3. Multi-LoRA support (load different adapters per query)
4. Model quantization (reduce memory usage)
5. Distributed training (train across multiple GPUs)
