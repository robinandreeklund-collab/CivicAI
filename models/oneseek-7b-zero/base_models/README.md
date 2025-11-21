# Base Models Directory

This directory contains the base model weights for OneSeek-7B-Zero.

## Structure

### Mistral 7B (`mistral-7b/`)
Base model from Mistral AI (7 billion parameters).

**Purpose:** Fast real-time inference and quick responses.

**Download:**
```bash
# Using Hugging Face Hub
python scripts/download_models.py --model mistral-7b

# Or manually from:
# https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2
```

**Size:** ~14 GB

### LLaMA-2 7B (`llama-2-7b/`)
Base model from Meta AI (7 billion parameters).

**Purpose:** Deep linguistic analysis and comprehensive reasoning.

**Download:**
```bash
# Using Hugging Face Hub
python scripts/download_models.py --model llama-2-7b

# Or manually from:
# https://huggingface.co/meta-llama/Llama-2-7b-chat-hf
```

**Size:** ~13 GB

## Important Notes

1. **Base models are NOT modified:** These weights remain unchanged. All fine-tuning is done through LoRA adapters stored in `../lora_adapters/`.

2. **Storage:** Base models are large (~27 GB total). Ensure sufficient disk space.

3. **License:** Check model licenses before use:
   - Mistral 7B: Apache 2.0
   - LLaMA-2: Meta's LLaMA 2 Community License

4. **Cache:** Models are cached by Hugging Face in `~/.cache/huggingface/` by default.

## OneSeek-7B-Zero Integration

OneSeek-7B-Zero combines both base models:
- **Mistral 7B:** Used for fast response generation
- **LLaMA-2:** Used for deep analysis and verification

LoRA adapters are applied on top of these base models to create the OneSeek-7B-Zero identity without modifying the base weights.
