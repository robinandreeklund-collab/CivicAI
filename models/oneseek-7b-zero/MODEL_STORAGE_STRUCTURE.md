# OneSeek-7B-Zero Model Storage Structure

This document describes the complete storage structure for OneSeek-7B-Zero models, matching the original OQT-1.0 structure but with updated naming conventions.

## Complete Directory Structure

```
models/
└── oneseek-7b-zero/
    ├── weights/
    │   ├── oneseek-7b-zero-v1.0.pth              # Major version
    │   ├── oneseek-7b-zero-v1.0.json             # Metadata
    │   ├── oneseek-7b-zero-v1.1.pth              # Micro version
    │   ├── oneseek-7b-zero-v1.1.json             # Metadata
    │   ├── oneseek-7b-zero-v1.2.pth
    │   ├── oneseek-7b-zero-v1.2.json
    │   ├── ...
    │   └── README.md                              # Documentation
    │
    ├── lora_adapters/
    │   ├── oneseek-7b-zero-v1.0/
    │   │   ├── mistral-7b-adapter.pth
    │   │   └── llama-2-adapter.pth
    │   ├── oneseek-7b-zero-v1.1/
    │   └── ...
    │
    ├── checkpoints/
    │   ├── daily/
    │   │   ├── checkpoint-2025-11-20.pth
    │   │   ├── checkpoint-2025-11-21.pth
    │   │   └── ...
    │   ├── weekly/
    │   │   ├── checkpoint-week-47.pth
    │   │   ├── checkpoint-week-48.pth
    │   │   └── ...
    │   └── README.md
    │
    ├── backups/
    │   ├── firebase-storage/             # Cloud backup sync
    │   │   └── (synced to Firebase Storage)
    │   ├── local-backup/                 # Local disk backups
    │   │   ├── oneseek-7b-zero-v1.0.pth
    │   │   ├── oneseek-7b-zero-v1.0.json
    │   │   └── ...
    │   └── README.md
    │
    └── base_models/
        ├── mistral-7b/                    # Mistral 7B weights (~14GB)
        │   ├── pytorch_model.bin
        │   ├── config.json
        │   └── tokenizer files...
        ├── llama-2-7b/                    # LLaMA-2 weights (~13GB)
        │   ├── pytorch_model.bin
        │   ├── config.json
        │   └── tokenizer files...
        └── README.md
```

## File Naming Conventions

### Model Weights (.pth files)

**Format:** `oneseek-7b-zero-v{MAJOR}.{MICRO}.pth`

**Examples:**
- `oneseek-7b-zero-v1.0.pth` - Initial major version
- `oneseek-7b-zero-v1.1.pth` - First microtraining (Stage 1)
- `oneseek-7b-zero-v1.2.pth` - Second microtraining (Stage 2)
- `oneseek-7b-zero-v2.0.pth` - Next major version

**Note:** In production with PyTorch, these files contain the model state dictionary.

### Metadata (.json files)

**Format:** `oneseek-7b-zero-v{MAJOR}.{MICRO}.json`

**Examples:**
- `oneseek-7b-zero-v1.0.json` - Metadata for v1.0
- `oneseek-7b-zero-v1.1.json` - Metadata for v1.1

**Contents:**
```json
{
  "version": "1.0",
  "model_name": "OneSeek-7B-Zero",
  "legacy_name": "OQT-1.0",
  "timestamp": "2025-11-21T08:00:00Z",
  "base_models": ["Mistral-7B", "LLaMA-2"],
  "training_config": {
    "dataset_size": 1000,
    "epochs": 3,
    "batch_size": 32,
    "learning_rate": 2e-5,
    "use_lora": true,
    "lora_rank": 8,
    "lora_alpha": 32
  },
  "metrics": {
    "validation_accuracy": 0.876,
    "fairness_score": 0.912,
    "bias_score": 0.123,
    "consensus_accuracy": 0.854
  },
  "fairness_metrics": {
    "demographic_parity": 0.945,
    "equal_opportunity": 0.928,
    "disparate_impact": 0.967
  },
  "provenance": {
    "training_data_hash": "sha256:abc123...",
    "ledger_block_id": "block-123",
    "trainer": "OneSeek-Training-Pipeline",
    "notes": "Batch training for version 1.0"
  }
}
```

### Checkpoints

**Daily Format:** `checkpoint-YYYY-MM-DD.pth`
- Example: `checkpoint-2025-11-20.pth`

**Weekly Format:** `checkpoint-week-WW.pth`
- Example: `checkpoint-week-47.pth`

### LoRA Adapters

**Directory Format:** `oneseek-7b-zero-v{MAJOR}.{MICRO}/`
- Example: `oneseek-7b-zero-v1.0/`

**Files:**
- `mistral-7b-adapter.pth` - LoRA adapter for Mistral 7B
- `llama-2-adapter.pth` - LoRA adapter for LLaMA-2

## Comparison with Legacy OQT-1.0

| Aspect | OQT-1.0 (Old) | OneSeek-7B-Zero (New) |
|--------|---------------|----------------------|
| **Directory** | `models/oqt/` | `models/oneseek-7b-zero/` |
| **Weight File** | `oqt-1.0-v1.0.pth` | `oneseek-7b-zero-v1.0.pth` |
| **Metadata File** | `oqt-1.0-v1.0.json` | `oneseek-7b-zero-v1.0.json` |
| **Version Format** | `OQT-1.0.v{major}.{micro}` | `OneSeek-7B-Zero.v{MAJOR}.{MICRO}` |
| **Model Identity** | OQT-1.0 | OneSeek-7B-Zero |

## Implementation Status

✅ **Directory structure created** with all subdirectories  
✅ **Documentation added** for each subdirectory  
✅ **Training script updated** to use new naming convention  
✅ **Metadata format defined** with all required fields  
🔄 **PyTorch implementation pending** for actual .pth file creation  

## Usage in Training Script

The `train_language_model.py` script now saves models using the correct naming:

```python
# Metadata saved as: models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.0.json
metadata_file = self.model_dir / f"oneseek-7b-zero-v{version}.json"

# Weights will be saved as: models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.0.pth
weights_file = self.model_dir / f"oneseek-7b-zero-v{version}.pth"
# torch.save(model.state_dict(), weights_file)  # In PyTorch implementation
```

## Storage Requirements

| Component | Size per Version | Total (50 versions) |
|-----------|------------------|---------------------|
| Model weights (.pth) | ~14 GB | ~700 GB |
| Metadata (.json) | ~2 KB | ~100 KB |
| LoRA adapters | ~50 MB | ~2.5 GB |
| Checkpoints (daily) | ~14 GB | ~98 GB (7 days) |
| Base models | ~27 GB | ~27 GB (static) |

**Recommended disk space:** 200-300 GB for local development, 1+ TB for production

## Backup Strategy

- **Firebase Storage:** All major versions + last 100 micro versions
- **Local Backup:** Last 5 major versions + last 50 micro versions
- **Retention:** Major versions permanent, micro versions rolling

## References

- Training Script: `ml/training/train_language_model.py`
- Migration Guide: `ONESEEK_7B_ZERO_MIGRATION_GUIDE.md`
- Main README: `README.md` (Section: Training OneSeek-7B-Zero)
