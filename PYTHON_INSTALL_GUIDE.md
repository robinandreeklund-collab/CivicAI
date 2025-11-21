# Step-by-step Installation Guide for Python Dependencies

## Option 1: Minimal Installation (No ML Models)

If you only want to run the API and dashboard without actual model inference:

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\Activate.ps1  # Windows

# Install minimal requirements
pip install -r requirements-minimal.txt
```

This will run the system in **simulated mode** with pre-defined responses.

## Option 2: Full Installation (With ML Models)

For running actual Mistral 7B and LLaMA-2 inference:

### Step 1: Install PyTorch

**IMPORTANT: Install PyTorch FIRST before requirements.txt**

Choose based on your hardware:

#### For GPU (NVIDIA CUDA 11.8):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### For GPU (NVIDIA CUDA 12.1):
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

#### For CPU only:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

Verify PyTorch installation:
```bash
python -c "import torch; print(f'PyTorch {torch.__version__}'); print(f'CUDA available: {torch.cuda.is_available()}')"
```

### Step 2: Install Main Requirements

```bash
pip install -r requirements.txt
```

### Step 3: Install Optional Components

If you need advanced features:

```bash
# For 8-bit quantization (GPU only, Linux/Mac)
pip install bitsandbytes>=0.41.0

# For GPTQ quantization (advanced)
pip install auto-gptq>=0.5.0

# For advanced topic modeling
pip install bertopic>=0.15.0 umap-learn>=0.5.4
```

**Note:** `bitsandbytes` may not work on Windows. Use WSL or Docker if needed.

## Common Issues & Solutions

### Issue: "Could not find a version that satisfies the requirement aiohttp>=3.9.0"

**Solution:** You may have an outdated pip or need to clear cache:
```bash
pip install --upgrade pip
pip cache purge
pip install -r requirements.txt
```

### Issue: "error: metadata-generation-failed" or "No module named 'torch'"

**Cause:** Some packages require PyTorch to be installed first.

**Solution:** Install PyTorch separately BEFORE requirements.txt (see Step 1 above).

### Issue: "Mistral model not found" or "LLaMA model not found" warnings

**Cause:** Model files haven't been downloaded yet, or paths are incorrect.

**Solution:**

1. **Download models** (if not already done):
```bash
python scripts/download_models.py
```

2. **Verify model directories exist**:
```bash
# Check models directory
ls -la models/  # Linux/Mac
dir models\     # Windows

# Should show:
# - mistral-7b-instruct/
# - llama-2-7b-chat/
```

3. **Set custom paths** (if models are elsewhere):
```bash
# Linux/Mac
export MISTRAL_MODEL_PATH="/path/to/mistral-7b-instruct"
export LLAMA_MODEL_PATH="/path/to/llama-2-7b-chat"

# Windows PowerShell
$env:MISTRAL_MODEL_PATH="C:\path\to\mistral-7b-instruct"
$env:LLAMA_MODEL_PATH="C:\path\to\llama-2-7b-chat"

# Then start ML service
python ml_service/server.py
```

**Note:** The ML service now uses absolute paths, so it works correctly regardless of which directory you run it from.

**Solution:** Skip bitsandbytes (it's optional) or use WSL:
```bash
# Install without bitsandbytes
pip install -r requirements.txt
# The system will work without 8-bit quantization
```

### Issue: Package conflicts or dependency resolution errors

**Solution:** Use a fresh virtual environment:
```bash
# Remove old venv
rm -rf venv  # Linux/Mac
# or
Remove-Item -Recurse -Force venv  # Windows PowerShell

# Create fresh venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\Activate.ps1  # Windows

# Install step by step
pip install --upgrade pip
pip install torch torchvision torchaudio  # Choose appropriate index-url
pip install -r requirements.txt
```

## Verify Installation

After installation, verify everything works:

```bash
# Verify core packages
python -c "import torch; import transformers; import fastapi; print('✓ Core packages OK')"

# Verify Firebase
python -c "import firebase_admin; print('✓ Firebase OK')"

# Run verification script
bash scripts/verify_installation.sh  # Linux/Mac
```

## What Gets Installed

### Minimal Installation (~500MB):
- API frameworks (FastAPI, Flask)
- Firebase integration
- Basic NLP tools
- **System runs in simulated mode**

### Full Installation (~5-10GB):
- Everything from minimal
- PyTorch and CUDA libraries
- Transformers library
- Model optimization tools
- **System ready for real model inference**

### With Downloaded Models (~30GB total):
- Full installation above
- Mistral 7B model (~14GB)
- LLaMA-2 7B model (~13GB)
- **Complete system with real AI models**

## Next Steps

After successful installation:

1. **Minimal Mode**: 
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   # System works with simulated responses
   ```

2. **Full Mode**:
   ```bash
   python scripts/download_models.py  # Download models (~27GB)
   python ml_service/server.py        # Start ML service
   cd backend && npm run dev          # Start backend
   cd frontend && npm run dev         # Start frontend
   # System uses real AI models
   ```

See `INSTALLATION_GUIDE.md` for complete setup instructions.
