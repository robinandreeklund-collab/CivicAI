# OneSeek-7B-Zero Migration Guide

## Overview

This document describes the migration from OQT-1.0 to OneSeek-7B-Zero, including naming conventions, backward compatibility, and implementation status.

## Model Identity Change

### Old Name
- **OQT-1.0** (Open Question-answering Transparent)

### New Name
- **OneSeek-7B-Zero**
  - **OneSeek**: Project for transparent, accountable AI
  - **7B**: 7 billion parameters (Mistral 7B + LLaMA-2)
  - **Zero**: Starting point for continuous training and evolution

## Versioning Format

### New Format
`OneSeek-7B-Zero.v{MAJOR}.{MICRO}`

**Example:**
```
OneSeek-7B-Zero.v1.0     ← Initial release after identity training
OneSeek-7B-Zero.v1.1     ← Microtraining Stage 1
OneSeek-7B-Zero.v1.2     ← Microtraining Stage 2
OneSeek-7B-Zero.v2.0     ← Next major batch training
```

### Legacy Format (Deprecated but Supported)
`OQT-1.0.v{major}.{micro}`

## Backward Compatibility

### Preserved Legacy References

The following OQT references are **intentionally preserved** for backward compatibility:

1. **API Endpoints:**
   - `/api/oqt/query`
   - `/api/oqt/multi-model-query`
   - `/api/oqt/micro-train`
   - `/api/oqt/train`
   - `/api/oqt/status`
   - `/api/oqt/metrics`
   - `/api/oqt/ledger/*`

2. **Firebase Collections:**
   - `oqt_queries`
   - `oqt_training_events`
   - `oqt_metrics`
   - `oqt_provenance`
   - `oqt_ledger`

3. **Configuration Variables:**
   - `ENABLE_MICROTRAINING`
   - Environment variable prefixes with `OQT_`

4. **Dashboard Route:**
   - `/oqt-dashboard` (remains unchanged)

### Updated References

The following now use OneSeek-7B-Zero naming:

1. **Documentation:**
   - README.md (with new section)
   - OQT-1.0-README.md (updated with backward compatibility note)

2. **Code:**
   - `ml/training/train_language_model.py` (OneSeekTrainer class)
   - Backend service headers (mistral.js, llama.js, oqtMultiModelPipeline.js)

3. **Directory Structure:**
   - `models/oneseek-7b-zero/` (new)
   - `datasets/oneseek_identity_v1.jsonl` (new)

## Implementation Status

### ✅ Completed

1. **Documentation:**
   - Comprehensive 11-step training guide in README.md
   - Updated OQT-1.0-README.md with new identity
   - Backward compatibility notes added
   - Architecture diagrams updated

2. **Instruction Dataset:**
   - Created 50 bilingual (Swedish/English) examples
   - Located at: `datasets/oneseek_identity_v1.jsonl`
   - Format: JSONL with instruction/input/output fields

3. **Code Refactoring:**
   - Training pipeline updated (train_language_model.py)
   - Backend services annotated (mistral.js, llama.js, oqtMultiModelPipeline.js)
   - Model directory structure created
   - Legacy OQT references preserved

4. **Testing:**
   - OQT multi-model tests passing
   - No regressions from naming changes

### 🔄 Requires PyTorch Implementation

The following items are documented but require additional ML implementation:

1. **LoRA/PEFT Integration:**
   - Hooks prepared in training pipeline
   - Requires PyTorch implementation

2. **Model Training:**
   - Stage 1: Raw data microtraining
   - Stage 2: Analyzed data microtraining
   - Requires base models (Mistral 7B, LLaMA-2)

3. **GPU/CPU Optimization:**
   - Configuration ready
   - Requires CUDA integration

4. **Weight Persistence:**
   - Directory structure ready
   - Requires PyTorch save/load implementation

## Directory Structure

```
CivicAI/
├── models/
│   └── oneseek-7b-zero/
│       ├── weights/              # Model weights with versioning
│       │   ├── oneseek-7b-zero-v1.0.pth    # Major version
│       │   ├── oneseek-7b-zero-v1.0.json   # Metadata
│       │   ├── oneseek-7b-zero-v1.1.pth    # Micro version
│       │   ├── oneseek-7b-zero-v1.1.json   # Metadata
│       │   ├── oneseek-7b-zero-v1.2.pth
│       │   ├── oneseek-7b-zero-v1.2.json
│       │   └── README.md         # Naming convention documentation
│       │
│       ├── lora_adapters/        # LoRA adapter weights
│       │   ├── oneseek-7b-zero-v1.0/
│       │   ├── oneseek-7b-zero-v1.1/
│       │   └── ...
│       │
│       ├── checkpoints/          # Training checkpoints
│       │   ├── daily/
│       │   │   ├── checkpoint-2025-11-20.pth
│       │   │   └── ...
│       │   ├── weekly/
│       │   │   ├── checkpoint-week-47.pth
│       │   │   └── ...
│       │   └── README.md         # Checkpoint documentation
│       │
│       ├── backups/              # Model backups
│       │   ├── firebase-storage/ # Cloud backup sync
│       │   ├── local-backup/     # Local disk backups
│       │   └── README.md         # Backup strategy documentation
│       │
│       └── base_models/          # Base model weights
│           ├── mistral-7b/       # Mistral 7B weights (~14GB)
│           ├── llama-2-7b/       # LLaMA-2 weights (~13GB)
│           └── README.md         # Base models documentation
│
├── datasets/
│   └── oneseek_identity_v1.jsonl # Identity training dataset (50 examples)
│
├── ml/
│   ├── training/
│   │   └── train_language_model.py  # Updated with OneSeekTrainer
│   └── pipelines/
│       └── prepare_dataset.py
│
├── backend/
│   └── services/
│       ├── mistral.js             # Updated header
│       ├── llama.js               # Updated header
│       └── oqtMultiModelPipeline.js  # Updated header
│
├── README.md                      # New OneSeek-7B-Zero section + training guide
├── OQT-1.0-README.md             # Updated with new identity
└── ONESEEK_7B_ZERO_MIGRATION_GUIDE.md  # This file
```

## Training Guide Location

The comprehensive 11-step training guide is located in:

**File:** `README.md`  
**Section:** "🎓 Training OneSeek-7B-Zero: Step-by-Step Guide"

**Steps covered:**
1. Environment Setup
2. Download Base Models
3. Prepare Instruction Dataset
4. Initial Identity Fine-Tuning
5. Collect Training Data from External AI
6. Prepare Training Dataset
7. Batch Training (Major Version)
8. Enable Real-Time Microtraining
9. Monitor Training Progress
10. Validate Model Performance
11. Deploy to Production

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `datasets/oneseek_identity_v1.jsonl` | Identity training examples | ✅ Created (50 examples) |
| `ml/training/train_language_model.py` | Training pipeline | ✅ Updated naming |
| `models/oneseek-7b-zero/` | Model storage | ✅ Structure created |
| `README.md` | Main documentation | ✅ Updated with guide |
| `OQT-1.0-README.md` | Detailed docs | ✅ Updated with identity |
| `backend/services/mistral.js` | Mistral 7B service | ✅ Header updated |
| `backend/services/llama.js` | LLaMA-2 service | ✅ Header updated |
| `backend/services/oqtMultiModelPipeline.js` | Multi-model pipeline | ✅ Header updated |

## Usage Examples

### Query OneSeek-7B-Zero

```bash
# Via API (legacy endpoint name preserved)
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vem är du?"}'

# Expected response includes OneSeek-7B-Zero identity
```

### Train Model

```bash
# Using updated training script
python ml/training/train_language_model.py \
  --version 1.0.0 \
  --data-dir ml/data/prepared
```

### Check Model Version

```bash
# Via API (legacy endpoint name preserved)
curl http://localhost:3001/api/oqt/status

# Response includes: OneSeek-7B-Zero.v1.0
```

## Migration Checklist

For developers working on the codebase:

- [x] Update documentation with OneSeek-7B-Zero naming
- [x] Create instruction dataset for identity training
- [x] Update training pipeline code
- [x] Update backend service headers
- [x] Preserve legacy OQT API endpoints
- [x] Preserve legacy Firebase collection names
- [x] Test backward compatibility
- [ ] Implement PyTorch training (future work)
- [ ] Download base models (future work)
- [ ] Implement LoRA/PEFT (future work)

## FAQs

### Q: Why keep OQT in API endpoints?
**A:** To maintain backward compatibility with existing integrations and avoid breaking changes.

### Q: Should new code use OQT or OneSeek-7B-Zero?
**A:** Use OneSeek-7B-Zero in documentation and user-facing content. Use OQT in technical references (APIs, collections) for consistency.

### Q: Where is the instruction dataset?
**A:** `datasets/oneseek_identity_v1.jsonl` - 50 bilingual examples in JSONL format.

### Q: How do I extend the instruction dataset?
**A:** Add new lines to `oneseek_identity_v1.jsonl` in the same JSON format. Recommended total: 100-500 examples.

### Q: What's the difference between MAJOR and MICRO versions?
**A:** 
- **MAJOR** (v1, v2, v3...): Created during weekly/monthly batch training
- **MICRO** (.1, .2, .3...): Created during real-time microtraining (two per question)

## References

- **Main README:** [README.md](README.md)
- **Detailed Documentation:** [OQT-1.0-README.md](OQT-1.0-README.md)
- **Training Script:** [ml/training/train_language_model.py](ml/training/train_language_model.py)
- **Instruction Dataset:** [datasets/oneseek_identity_v1.jsonl](datasets/oneseek_identity_v1.jsonl)

## Contact

For questions about the migration, refer to:
- GitHub Issues: https://github.com/robinandreeklund-collab/CivicAI/issues
- Main README: [README.md](README.md)

---

**Last Updated:** 2025-11-23  
**Migration Status:** Documentation Complete, DNA v2 Structure Active

## UPDATE 2025-11-23: DNA-Based Certified Structure

### New Directory Structure

The project has migrated to a **DNA-based certified structure**. The old `oneseek-7b-zero` directory structure is deprecated.

**Current Structure:**
```
models/
├── basemodeller/                 ← Base models (preserved during resets)
│   ├── kb-llama-3-1-8b-swedish/
│   ├── mistral-7b/
│   └── qwen-2-5-7b/
│
└── oneseek-certified/            ← ONLY location for trained models
    ├── OneSeek-7B-Zero.v1.492.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a/
    │   ├── metadata.json
    │   ├── adapter_config.json
    │   ├── adapter_model.bin
    │   ├── training_results.json
    │   └── verify_integrity.py
    │
    ├── OneSeek-7B-Zero.v1.493.sv.dsCivicID+Autonomy.f1e2d3c4.b5e6f7g8/
    │   └── ...
    │
    └── OneSeek-7B-Zero-CURRENT → v1.493... (symlink)
```

### DNA Naming Format

**Format:** `OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{WEIGHTS_HASH}.{TIMESTAMP_HASH}`

**Example:** `OneSeek-7B-Zero.v1.492.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a`

- `v1.492` - Version number
- `sv` - Language code (sv=Swedish, en=English, ensv=Bilingual)
- `dsCivicID-SwedID` - Dataset categories (ds prefix for dataset-specific)
- `8f3a1c9d` - Weights hash (8 chars)
- `2e7f4b1a` - Timestamp hash (8 chars)

### Reset Functionality

A new **Reset All** feature has been added to the Admin Dashboard:

**Location:** Admin Dashboard → Models Tab → "⚠️ Reset All" button

**What it does:**
- Deletes entire `/models/oneseek-certified/` directory
- Preserves `/models/basemodeller/` (base models safe)
- Creates empty certified directory with README
- Logs action in ledger
- Requires typing "RESET" to confirm

**API Endpoint:** `POST /api/models/reset`

### Migration from Old Structure

The old `models/oneseek-7b-zero/` structure is **deprecated** but still supported for backward compatibility during transition.

**To migrate:**
1. Use Admin Dashboard to train new models (they auto-use DNA v2)
2. Old models will still appear in model list
3. Use "Reset All" to start completely fresh
4. Old directory can be manually deleted if desired

### Training with DNA v2

```bash
# Train using DNA v2 structure (automatic)
python scripts/train_dna_v2.py \
  --dataset datasets/oneseek_identity_v1.jsonl \
  --epochs 3 \
  --learning-rate 2e-5 \
  --auto-stop-threshold 0.95

# Output: models/oneseek-certified/OneSeek-7B-Zero.v1.{N}.{lang}.{datasets}.{hash}.{timestamp}/
```

See [DNA_V2_QUICK_REFERENCE.md](DNA_V2_QUICK_REFERENCE.md) for full details.

