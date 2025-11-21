# OneSeek-7B-Zero Model Weights

This directory contains model weights for OneSeek-7B-Zero with the following naming convention:

## File Naming Convention

### Model Weights
- Format: `oneseek-7b-zero-v{MAJOR}.{MICRO}.pth`
- Example: `oneseek-7b-zero-v1.0.pth`, `oneseek-7b-zero-v1.1.pth`, `oneseek-7b-zero-v1.2.pth`

### Metadata Files
- Format: `oneseek-7b-zero-v{MAJOR}.{MICRO}.json`
- Example: `oneseek-7b-zero-v1.0.json`, `oneseek-7b-zero-v1.1.json`, `oneseek-7b-zero-v1.2.json`

## Version Types

### Major Versions (v1.0, v2.0, v3.0, ...)
Created during weekly/monthly batch training on large accumulated datasets.

**Example:**
- `oneseek-7b-zero-v1.0.pth` - Initial release after identity training
- `oneseek-7b-zero-v1.0.json` - Metadata (training config, metrics, provenance)

### Micro Versions (v1.1, v1.2, v1.3, ...)
Created during real-time microtraining - two increments per question.

**Example progression:**
- `oneseek-7b-zero-v1.1.pth` - After Stage 1 microtraining (raw data)
- `oneseek-7b-zero-v1.1.json` - Metadata
- `oneseek-7b-zero-v1.2.pth` - After Stage 2 microtraining (analyzed metrics)
- `oneseek-7b-zero-v1.2.json` - Metadata

## Metadata File Structure

Each `.json` file contains:
```json
{
  "version": "1.0",
  "model_name": "OneSeek-7B-Zero",
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
    "bias_score": 0.123
  },
  "provenance": {
    "training_data_hash": "sha256:...",
    "ledger_block_id": "block-123",
    "trainer": "OneSeek-Training-Pipeline"
  }
}
```

## Storage Requirements

- Each `.pth` file: ~13-14 GB (7B parameters)
- Each `.json` file: ~1-2 KB
- Recommended: Keep last 3 major versions + last 50 micro versions locally
- All versions backed up to Firebase Storage

## LoRA Adapters

For LoRA/PEFT fine-tuning, adapter weights are stored separately in:
`../lora_adapters/oneseek-7b-zero-v{MAJOR}.{MICRO}/`

This keeps the base model weights separate from the adapter weights for efficient storage and loading.
