# OneSeek Certified Models Structure

This document describes the new unified structure for certified OneSeek models.

## Overview

All finished, certified models are stored in `models/oneseek-certified/` with self-contained directories that include everything needed to run the model.

## Directory Structure

```
models/oneseek-certified/
├── OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
│   ├── config.json                    # Model configuration
│   ├── generation_config.json         # Generation parameters
│   ├── pytorch_model.bin              # Model weights (or sharded: model-00001-of-00003.bin)
│   ├── tokenizer.json                 # Tokenizer vocabulary
│   ├── tokenizer_config.json          # Tokenizer configuration
│   ├── special_tokens_map.json        # Special tokens
│   ├── added_tokens.json              # Additional tokens
│   ├── adapter_model.bin              # LoRA adapters (fine-tuning)
│   ├── adapter_config.json            # LoRA configuration
│   └── metadata.json                  # Training metadata
│
├── OneSeek-7B-Zero.v1.1.sv.dsIdentity.8f3a1c9d.a1b2c3d4/
│   └── (same structure)
│
├── OneSeek-7B-Zero-CURRENT            # Symlink to active version
│   → OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
│
└── ledger_proof.json                  # Immutable log of all versions
```

## Directory Naming Convention

Format: `OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{HASH1}.{HASH2}/`

Components:
- **Model Name**: `OneSeek-7B-Zero`
- **Version**: `v1.0`, `v1.1`, etc.
- **Language**: `sv` (Swedish), `en` (English), `ensv` (bilingual)
- **Datasets**: Short codes for datasets used (e.g., `dsCivicID-SwedID`)
- **Hash1**: Short hash of training data (8 chars)
- **Hash2**: Short hash of model weights (8 chars)

Examples:
- `OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/`
- `OneSeek-7B-Zero.v1.1.en.dsIdentity.8f3a1c9d.a1b2c3d4/`
- `OneSeek-7B-Zero.v2.0.ensv.dsCivic-Identity.abcd1234.ef567890/`

## Metadata File

Each model directory contains a `metadata.json` file:

```json
{
  "version": "OneSeek-7B-Zero.v1.0",
  "dna": "OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1",
  "createdAt": "2025-11-23T01:00:00Z",
  "baseModel": "KB-Llama-3.1-8B-Swedish",
  "language": "sv",
  "datasets": ["CivicID", "SwedID"],
  "trainingType": "dna-v2",
  "samplesProcessed": 50000,
  "metrics": {
    "loss": 0.245,
    "accuracy": 0.89,
    "fairness": 0.92
  },
  "hashes": {
    "trainingData": "141521ad",
    "modelWeights": "90cdf6f1"
  }
}
```

## Ledger Proof

The `ledger_proof.json` file maintains an immutable log:

```json
{
  "models": [
    {
      "directory": "OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1",
      "createdAt": "2025-11-23T01:00:00Z",
      "dna": "OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1",
      "certifiedBy": "training-system",
      "immutableHash": "sha256:abc123..."
    }
  ]
}
```

## Migration from Old Structure

The old structure had files scattered across:
- `models/oneseek-7b-zero/weights/` - weight files
- `models/oneseek-7b-zero/lora_adapters/` - LoRA adapters
- `models/oneseek-7b-zero/base_models/` - base models

The new structure consolidates everything into self-contained model directories.

## Benefits

1. **Self-contained**: Each model directory has everything needed
2. **Immutable**: Once created, directories are never modified
3. **Traceable**: DNA-based naming ensures uniqueness
4. **Simple**: Easy to understand what each directory contains
5. **Portable**: Can copy entire directory to use model elsewhere

## Implementation Status

✅ **COMPLETED**

- [x] Training code updated to save to new structure
  - `scripts/train_dna_v2.py` creates DNA-based directories
  - Uses certified_structure.py helper functions
  - Generates hashes for training data and model weights
  - Creates metadata.json in certified format
  - Updates ledger_proof.json with new entries
  - Creates/updates symlink to active model
  
- [x] ml_service updated to load from new structure
  - `ml_service/server.py` resolves -CURRENT symlink correctly
  - Reads metadata from DNA-based directories
  - Searches for LoRA adapters in certified structure
  - Maintains backward compatibility with legacy structure
  
- [x] Admin panel updated for new paths
  - `backend/api/admin.js` lists models from certified directory
  - `backend/api/models/set-current.js` creates symlinks to DNA directories
  - `ModelManagement.jsx` displays DNA-based model names
  - Shows certified vs legacy models with visual badges
  - Displays base model, datasets, and language for certified models
  
- [x] Symlink management updated
  - Handles both Unix symlinks and Windows marker files
  - Updates automatically after training
  - Can be manually set via admin panel
  
- [ ] Migration script for old models (optional for future)

### Directory Structure Example

After training, the structure looks like:

```
models/oneseek-certified/
├── OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
│   ├── metadata.json                  # Certified metadata
│   ├── training_results.json          # Training metrics
│   ├── kb-llama-3-1-8b-swedish-adapter/  # LoRA adapters (PEFT format)
│   │   ├── adapter_config.json
│   │   ├── adapter_model.bin
│   │   ├── tokenizer.json
│   │   └── tokenizer_config.json
│   └── oneseek-7b-zero-v1.0-kb-llama-3-1-8b-swedish.pth  # Full state dict
│
├── OneSeek-7B-Zero.v1.1.en.dsIdentity.8f3a1c9d.a1b2c3d4/
│   └── (same structure)
│
├── OneSeek-7B-Zero-CURRENT            # Symlink to active version
│   → OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
│
└── ledger_proof.json                  # Immutable log of all versions
```
