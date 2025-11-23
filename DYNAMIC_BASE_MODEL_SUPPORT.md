# Dynamic Base Model Support

This document explains how the training system now supports any base model dynamically, including KB-Llama-3.1-8B-Swedish and future models.

## Overview

The training code has been refactored to **eliminate all hardcoded base model references** and support any base model selected from the admin panel. The system now:

1. **Discovers** all available base models automatically
2. **Trains** only the models selected by administrators
3. **Saves** all artifacts with actual model names
4. **Tracks** trained models throughout the entire pipeline

## Key Changes

### 1. Dynamic Model Discovery (`pytorch_trainer.py`)

#### `normalize_model_name(name: str) -> str`
Normalizes model names to a consistent format for matching and file system compatibility.

```python
# Examples:
normalize_model_name("KB-Llama-3.1-8B-Swedish") 
# → "kb-llama-3-1-8b-swedish"

normalize_model_name("Mistral-7B-Instruct") 
# → "mistral-7b-instruct"
```

#### `get_model_display_name(normalized_name: str, path: Path) -> str`
Extracts human-readable model names from `config.json` or directory name.

#### `check_base_models(base_models_dir: Path) -> Dict`
Dynamically discovers **ALL** available base models by scanning:
1. `models/oneseek-7b-zero/base_models/` directory
2. `models/` root directory (excluding special directories)

**Before:**
```python
# Hardcoded check for only Mistral and LLaMA
if 'mistral' in models_to_train:
    # train mistral
if 'llama' in models_to_train:
    # train llama
```

**After:**
```python
# Dynamic discovery of all models
available_models = check_base_models(base_models_dir)
# Returns: {'kb-llama-3-1-8b-swedish': Path(...), 
#           'mistral-7b-instruct': Path(...), ...}

# Dynamic training loop
for model_key, model_path in models_to_train.items():
    train_single_model_lora(model_name=model_key, ...)
```

### 2. Model Selection Matching

The system uses **fuzzy matching** to connect admin panel selections to available models:

```python
# Admin selects: "KB-Llama-3.1-8B-Swedish"
# System finds: "kb-llama-3-1-8b-swedish" directory
# Match successful via normalization and partial matching
```

Matching strategies (in order):
1. Direct normalized match
2. Substring match (contains)
3. Match without separators (handles "kb-llama" vs "kbllama")

### 3. Artifact Naming

All artifacts now use **actual model names**:

#### LoRA Adapters
```
models/oneseek-7b-zero/lora_adapters/
├── kb-llama-3-1-8b-swedish-adapter/      # Actual model name
├── mistral-7b-instruct-adapter/
└── oneseek-7b-zero-v1.0-kb-llama-3-1-8b-swedish/  # Versioned
```

**Before:** Only `mistral-adapter/` and `llama-adapter/`

#### Weight Files
```
models/oneseek-7b-zero/weights/
├── oneseek-7b-zero-v1.0-kb-llama-3-1-8b-swedish.pth
├── oneseek-7b-zero-v1.0-mistral-7b-instruct.pth
└── oneseek-7b-zero-v1.0.json
```

**Format:** `oneseek-7b-zero-v{version}-{actual-model-name}.pth`

#### Metadata JSON
```json
{
  "version": "OneSeek-7B-Zero.v1.0",
  "baseModels": ["KB-Llama-3.1-8B-Swedish"],  // Actual model names
  "modelSpecificWeights": {
    "kb-llama-3-1-8b-swedish": "oneseek-7b-zero-v1.0-kb-llama-3-1-8b-swedish.pth"
  }
}
```

**Before:** Always `["Mistral-7B", "LLaMA-2"]` regardless of actual training

### 4. Certified Directory (`oneseek-certified/`)

After training, `models/oneseek-certified/{run_id}/` contains:

#### `oneseek_dna.json`
```json
{
  "dna": "OneSeek-7B-Zero.v1.0.42a8c9",
  "baseModels": ["kb-llama-3-1-8b-swedish"],  // NEW: Actual models
  "final_weights": {
    "kb-llama-3-1-8b-swedish": 1.0
  }
}
```

#### `training_results.json`
```json
{
  "dna": "OneSeek-7B-Zero.v1.0.42a8c9",
  "baseModels": ["kb-llama-3-1-8b-swedish"],  // NEW: Actual models
  "trained_models": ["kb-llama-3-1-8b-swedish"],  // NEW: What was actually trained
  "metrics": { ... }
}
```

#### `live_metrics.json`
```json
{
  "type": "epoch_end",
  "val_losses": {
    "kb-llama-3-1-8b-swedish": 0.245  // Actual model key
  },
  "weights": {
    "kb-llama-3-1-8b-swedish": 1.0
  }
}
```

#### `ledger_proof.json`
```json
{
  "event": "dna_v2_training_completed",
  "baseModels": ["kb-llama-3-1-8b-swedish"],  // NEW: Actual models
  "final_weights": {
    "kb-llama-3-1-8b-swedish": 1.0
  }
}
```

## Training Flow

### 1. Admin Panel Selection
User selects base models in the admin panel:
- `KB-Llama-3.1-8B-Swedish`
- `Qwen-2.5-7B`

### 2. Environment Variable
`admin.js` sets environment variable:
```javascript
env: {
  BASE_MODELS: "KB-Llama-3.1-8B-Swedish,Qwen-2.5-7B"
}
```

### 3. Training Script
`train_dna_v2.py` receives models via:
- Command-line arg: `--base-models KB-Llama-3.1-8B-Swedish Qwen-2.5-7B`
- OR environment variable: `BASE_MODELS`

### 4. Model Discovery
`pytorch_trainer.py` discovers available models:
```python
available_models = check_base_models(base_models_dir)
# {'kb-llama-3-1-8b-swedish': Path(...), 
#  'qwen-2-5-7b': Path(...)}
```

### 5. Model Training
Dynamic loop trains each selected model:
```python
for model_key, model_path in models_to_train.items():
    train_single_model_lora(
        model_name=model_key,  # "kb-llama-3-1-8b-swedish"
        model_path=model_path,
        ...
    )
```

### 6. Artifact Saving
All artifacts use actual model names:
- LoRA adapters: `kb-llama-3-1-8b-swedish-adapter/`
- Weights: `oneseek-7b-zero-v1.0-kb-llama-3-1-8b-swedish.pth`
- Metadata: `baseModels: ["KB-Llama-3.1-8B-Swedish"]`

### 7. Certification
`train_dna_v2.py` saves certified files with actual model info:
- DNA metadata
- Training results
- Ledger proof
- Live metrics

All include `baseModels` field with actual trained models.

## Adding New Base Models

To add a new base model (e.g., `Gemma-2-9B`):

### 1. Download Model
Place in either location:
```
models/oneseek-7b-zero/base_models/gemma-2-9b/
  ├── config.json
  ├── pytorch_model.bin
  └── tokenizer files...

OR

models/gemma-2-9b/
  ├── config.json
  ├── pytorch_model.bin
  └── tokenizer files...
```

### 2. Select in Admin Panel
The model will automatically appear in the base model dropdown.

### 3. Train
Training will automatically:
- Discover the model
- Train with LoRA adapters
- Save artifacts as `gemma-2-9b-*`
- Include in metadata as `["Gemma-2-9B"]`

**No code changes required!**

## Backward Compatibility

The system remains compatible with existing Mistral and LLaMA models:

```
models/oneseek-7b-zero/base_models/
├── mistral-7b/          ✅ Still works
├── llama-2-7b/          ✅ Still works
└── kb-llama-3-1-8b-swedish/  ✅ New support
```

Old metadata files with `["Mistral-7B", "LLaMA-2"]` remain valid.

## Symlinks and Active Model

The symlink system (`OneSeek-7B-Zero-CURRENT`) is **not affected**:
- Points to `oneseek-7b-zero/` directory (contains all versions)
- Not model-specific
- Works the same regardless of which base models were trained

## Testing

Run the test suite:
```bash
cd ml/training
python3 test_pytorch_trainer.py
```

Tests verify:
1. ✅ Model name normalization
2. ✅ Model matching logic
3. ✅ Directory structure

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Model Discovery** | Hardcoded Mistral/LLaMA | Dynamic scan of all models |
| **Training Loop** | Two hardcoded if-blocks | Dynamic loop over selected models |
| **LoRA Adapters** | `mistral-adapter/`, `llama-adapter/` | `{model-name}-adapter/` |
| **Weight Files** | Fixed names | `oneseek-7b-zero-v{version}-{model}.pth` |
| **Metadata** | Always `["Mistral-7B", "LLaMA-2"]` | Actual trained models |
| **Certified Files** | Missing base model info | `baseModels` field everywhere |
| **Adding Models** | Code changes required | Just add to directory |

## Future Enhancements

- [ ] Add per-model adaptive weights (currently equal weights)
- [ ] Support different LoRA configurations per model
- [ ] Add model-specific hyperparameters
- [ ] Automatic model download from HuggingFace
- [ ] Model compatibility validation

## Related Files

- `ml/training/pytorch_trainer.py` - Core training with dynamic discovery
- `scripts/train_dna_v2.py` - DNA v2 training orchestration
- `backend/api/admin.js` - Admin panel integration
- `backend/config/trainingConfig.js` - Training configuration
- `ml/training/test_pytorch_trainer.py` - Test suite
