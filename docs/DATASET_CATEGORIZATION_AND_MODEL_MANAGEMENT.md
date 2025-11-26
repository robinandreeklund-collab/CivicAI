# Dataset Categorization and Model Management

This document describes the dataset categorization system and model management features implemented in PR101.

## Dataset Categorization

### Directory Structure

Datasets are now organized into categories:

```
datasets/
├── politik/                    # Political and civic datasets
│   ├── politik_sv_v1.jsonl
│   ├── civic_participation_democracy_sv_v1.jsonl
│   ├── civic_rights_responsibilities_sv_v1.jsonl
│   └── policy_analysis_decision_support_sv_v1.jsonl
├── sverige/                    # Swedish society and culture datasets
│   ├── svensk_kultur_v1.jsonl
│   ├── historia_v1.jsonl
│   ├── community_development_cohesion_sv_v1.jsonl
│   ├── education_civic_literacy_sv_v1.jsonl
│   └── ... (other Swedish datasets)
├── oneseek/                    # OneSeek identity and platform datasets
│   ├── oneseek_identity_core_v1.jsonl
│   ├── oneseek_identity_v1.jsonl
│   ├── oneseek_platform_manifesto_v1.jsonl
│   └── ... (verification datasets)
└── custom/                     # User-uploaded custom datasets
    └── (user uploads go here)
```

### Using Categories in the Admin Dashboard

1. **Training Configuration**
   - Use the "Filter by Category" dropdown to view datasets by category
   - Select multiple datasets from different categories for combined training
   - The language analysis considers all selected datasets

2. **Dataset Management**
   - Upload datasets to specific categories using the "Target Category" selector
   - Filter existing datasets by category
   - View category tags on each dataset

### API Changes

The `/api/admin/datasets` endpoint now returns:

```json
{
  "datasets": [...],
  "categories": {
    "politik": [...],
    "sverige": [...],
    "oneseek": [...],
    "custom": [...]
  },
  "availableCategories": ["politik", "sverige", "oneseek", "custom"]
}
```

Dataset IDs now include the category path:
- Old format: `filename.jsonl`
- New format: `category/filename.jsonl` (e.g., `politik/civic_rights_sv_v1.jsonl`)

## LoRA Merge and GGUF Export

### Full LoRA Merge

The merge script creates standalone OneSeek models without KB-Llama dependencies:

```bash
python scripts/merge_adapters.py \
  --base-model KB-Llama-3.1-8B-Swedish \
  --adapters adapter1 adapter2 \
  --output models/oneseek-certified/merged \
  --output-name OneSeek-7B-Zero-Merged \
  --version 1.0 \
  --export-gguf \
  --quantization Q5_K_M
```

### GGUF Export

Export options:
- **Q5_K_M**: Medium quality, good balance (default)
- **Q6_K**: High quality, larger size
- **Q8_0**: Best quality, largest size

GGUF exports are stored in `/models/gguf/`.

## 100% Traceability with merge_manifest.json

Every merged model includes a `merge_manifest.json`:

```json
{
  "manifestVersion": "1.0",
  "generatedAt": "2025-11-26T08:00:00Z",
  "merge": {
    "version": "1.0",
    "outputName": "OneSeek-7B-Zero-Merged",
    "outputPath": "/models/oneseek-certified/merged/..."
  },
  "baseModel": {
    "name": "KB-Llama-3.1-8B-Swedish",
    "type": "standalone"
  },
  "adapters": [
    {
      "name": "adapter1",
      "hash": "abc12345",
      "lora_rank": 64,
      "trained_at": "2025-11-25T10:00:00Z",
      "datasets": ["politik/civic_rights_sv_v1.jsonl"]
    }
  ],
  "datasets": [...],
  "traceability": {
    "totalAdapters": 2,
    "mergeOrder": ["adapter1", "adapter2"]
  },
  "mergeHash": "unique-merge-hash"
}
```

### Viewing Manifests

In the Admin Dashboard > Model Management:
1. Click the "Merge Manifests" tab
2. View merge hash, adapter chain, and base model info
3. Click "View Full" for complete manifest JSON

## Version Table

The version table shows all models with:
- DNA fingerprint
- Merge status
- Adapter count
- Creation/merge time
- Base model info

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/models/merge` | POST | Merge adapters into standalone model |
| `/api/models/merge/manifests` | GET | List all merge manifests |
| `/api/models/merge/versions` | GET | Get version table for all models |
| `/api/models/gguf` | GET | List GGUF exports |
| `/api/models/gguf/export` | POST | Export model to GGUF format |

## Migration Notes

- Existing datasets have been moved to appropriate categories
- Training now supports category paths (e.g., `politik/filename.jsonl`)
- All features are backward compatible with existing workflows
