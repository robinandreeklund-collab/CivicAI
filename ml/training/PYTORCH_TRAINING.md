# PyTorch Training for OneSeek-7B-Zero

This module implements real PyTorch training with LoRA/PEFT for OneSeek-7B-Zero.

## Requirements

```bash
pip install torch transformers peft
```

**For GPU support (CUDA):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Base Models

You need to download either or both:

1. **Mistral 7B** (recommended for fast inference)
2. **LLaMA-2 7B** (recommended for deep analysis)

### Download to:
```
models/oneseek-7b-zero/base_models/
├── mistral-7b/        # Mistral 7B model files
└── llama-2-7b/        # LLaMA-2 model files
```

### How to Download

**Option 1: Using Hugging Face CLI (RECOMMENDED)**
```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Download Mistral 7B with all files
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 \
  --local-dir models/oneseek-7b-zero/base_models/mistral-7b \
  --local-dir-use-symlinks False

# Download LLaMA-2 (requires access request)
huggingface-cli download meta-llama/Llama-2-7b-chat-hf \
  --local-dir models/oneseek-7b-zero/base_models/llama-2-7b \
  --local-dir-use-symlinks False
```

**IMPORTANT:** Use `--local-dir-use-symlinks False` to ensure all tokenizer files (especially `tokenizer.model`) are properly downloaded as actual files, not symlinks.

**Option 2: Using Python script**
```python
from transformers import AutoModel, AutoTokenizer

# Download Mistral 7B
model = AutoModel.from_pretrained("mistralai/Mistral-7B-Instruct-v0.2")
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.2")

model.save_pretrained("models/oneseek-7b-zero/base_models/mistral-7b")
tokenizer.save_pretrained("models/oneseek-7b-zero/base_models/mistral-7b")
```

## Features

### LoRA/PEFT Training
- **Parameter-efficient**: Only trains ~0.1% of parameters
- **Fast**: Much faster than full fine-tuning
- **Memory-efficient**: Can run on consumer GPUs
- **Preserves base model**: Base weights unchanged

### Configuration
```python
lora_config = LoraConfig(
    r=8,              # LoRA rank (higher = more capacity, slower)
    lora_alpha=32,    # LoRA alpha (scaling factor)
    lora_dropout=0.1, # Dropout for regularization
    target_modules=["q_proj", "v_proj"]  # Which layers to adapt
)
```

### 8-bit Quantization (Optional)
For lower memory usage:
```python
config['quantize_8bit'] = True
```

## Training Process

The training automatically:

1. ✅ Detects PyTorch, Transformers, PEFT
2. ✅ Checks for base models
3. ✅ Loads model with LoRA adapters
4. ✅ Trains on identity dataset
5. ✅ Saves LoRA adapters separately
6. ✅ Saves full model weights
7. ✅ Logs to transparency ledger

## Output Files

After training, you'll have:

```
models/oneseek-7b-zero/
├── weights/
│   └── oneseek-7b-zero-v1.0.pth          # Full model state
│
├── lora_adapters/
│   └── oneseek-7b-zero-v1.0/
│       ├── adapter_config.json            # LoRA configuration
│       ├── adapter_model.bin              # LoRA weights (small!)
│       ├── tokenizer_config.json
│       └── ...
```

**File sizes:**
- Full model state: ~13-14 GB
- LoRA adapters: ~50-100 MB (much smaller!)

## Usage

### Automatic (Recommended)
```bash
python scripts/train_identity.py
```

The script automatically detects if PyTorch is available and uses real training.

### Manual
```python
from ml.training.pytorch_trainer import train_with_pytorch_lora, verify_requirements
from pathlib import Path

# Verify requirements
if verify_requirements():
    # Train
    results = train_with_pytorch_lora(
        datasets=datasets,
        version='1.0',
        model_dir=Path('models/oneseek-7b-zero/weights'),
        base_models_dir=Path('models/oneseek-7b-zero/base_models'),
        config={
            'lora_rank': 8,
            'lora_alpha': 32,
            'learning_rate': 2e-5,
            'epochs': 3
        }
    )
```

## GPU vs CPU

### GPU Training (CUDA)
- **Faster**: 10-100x faster than CPU
- **Required**: For larger batches and longer training
- **Memory**: 8-16GB VRAM recommended

### CPU Training
- **Slower**: But works without GPU
- **Memory**: 16-32GB RAM recommended
- **Good for**: Testing and small-scale training

The script automatically uses CUDA if available.

## Troubleshooting

### "TypeError: not a string" when loading tokenizer
**Problem:** The tokenizer files (especially `tokenizer.model`) are symlinks or missing.

**Solution:**
1. Re-download the model with `--local-dir-use-symlinks False`:
   ```bash
   huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 \
     --local-dir models/oneseek-7b-zero/base_models/mistral-7b \
     --local-dir-use-symlinks False
   ```

2. Verify `tokenizer.model` exists and is a real file (not a symlink):
   ```bash
   ls -la models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model
   ```

3. If the file is a symlink on Windows, copy it as a real file:
   ```powershell
   # In PowerShell
   Copy-Item -Path models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model -Destination models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model.bak
   Remove-Item models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model
   Move-Item models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model.bak models/oneseek-7b-zero/base_models/mistral-7b/tokenizer.model
   ```

**Automatic Fallback:** The training script will automatically attempt to download the tokenizer from HuggingFace if local loading fails.

### "No base models found"
Download Mistral 7B or LLaMA-2 to:
```
models/oneseek-7b-zero/base_models/mistral-7b/
models/oneseek-7b-zero/base_models/llama-2-7b/
```

### "CUDA out of memory"
Solutions:
1. Use 8-bit quantization: `config['quantize_8bit'] = True`
2. Reduce batch size
3. Reduce LoRA rank: `lora_rank=4` instead of `8`

### "Slow training"
- Use GPU instead of CPU
- Reduce dataset size for testing
- Use smaller LoRA rank

### "Module not found"
Install requirements:
```bash
pip install torch transformers peft
```

## Next Steps

After training:

1. **Test the model:**
   ```python
   from peft import PeftModel
   from transformers import AutoModelForCausalLM
   
   # Load base model
   base_model = AutoModelForCausalLM.from_pretrained("path/to/base")
   
   # Load LoRA adapters
   model = PeftModel.from_pretrained(
       base_model,
       "models/oneseek-7b-zero/lora_adapters/oneseek-7b-zero-v1.0"
   )
   ```

2. **Extend the dataset:**
   Add more examples to `datasets/oneseek_identity_v1.jsonl`

3. **Train more versions:**
   ```bash
   python scripts/train_identity.py  # Creates v1.1
   ```

4. **Deploy to production:**
   See main README.md for deployment instructions

## References

- **LoRA Paper**: https://arxiv.org/abs/2106.09685
- **PEFT Library**: https://github.com/huggingface/peft
- **Transformers**: https://huggingface.co/docs/transformers
