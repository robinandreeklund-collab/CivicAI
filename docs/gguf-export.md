# GGUF Export Guide

This guide explains how to export OneSeek models to GGUF format with Q5 quantization using the two-step process.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Two-Step Process](#two-step-process)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Server Runtime](#server-runtime)
- [Advanced Usage](#advanced-usage)

## Overview

GGUF (GPT-Generated Unified Format) is a file format for storing models for inference with llama.cpp. This repository uses a two-step process for reliable Q5 quantization:

1. **Step 1: F16 Export** - Convert HuggingFace model to F16 precision GGUF (~14 GB for 7B model)
2. **Step 2: Q5 Quantization** - Quantize F16 GGUF to Q5 using llama-quantize (~6-7 GB for 7B model)

### Why Two Steps?

The two-step process is more reliable than direct quantization because:
- Ensures compatibility with all llama.cpp versions
- Uses the pre-built `llama-quantize` binary which is optimized and tested
- Provides better error handling and verification
- Allows keeping the F16 version for multiple quantization attempts

## Requirements

### Software Requirements

- **Python 3.8+** - For running export scripts
- **gguf package** - Auto-installed by scripts (`pip install gguf`)
- **llama.cpp convert script** - Auto-downloaded by scripts
- **llama-quantize binary** - Required for Q5 quantization

### Hardware Requirements

- **Disk Space**: ~20-25 GB free (for intermediate files during export)
- **RAM**: 16+ GB recommended for 7B models
- **GPU**: Optional, but recommended for faster inference

### Installing llama-quantize

#### Windows

1. Download pre-built binaries from [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases)
2. Extract to: `%USERPROFILE%\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\`
3. Or set `LLAMA_QUANTIZE_PATH` environment variable:
   ```powershell
   $env:LLAMA_QUANTIZE_PATH = "C:\path\to\llama-quantize.exe"
   ```

**Recommended**: Download the **AVX2** build for better compatibility (not CUDA, unless you need GPU quantization).

#### Linux/macOS

Option 1 - Build from source:
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make
```

Option 2 - Download pre-built binary:
```bash
# Download from releases page and extract
# Then add to PATH or set LLAMA_QUANTIZE_PATH
export LLAMA_QUANTIZE_PATH=/path/to/llama-quantize
```

## Quick Start

### Complete Export (Both Steps)

**Windows:**
```powershell
.\scripts\export_gguf_q5.ps1 -Src "models\oneseek-7b-zero\weights" -Out "models\oneseek-q5.gguf"
```

**Linux/macOS:**
```bash
./scripts/export_gguf_q5.sh --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf
```

**Python (cross-platform):**
```bash
python scripts/export_gguf_q5.py --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf
```

This will:
1. Convert the model to F16 GGUF (temp file)
2. Quantize to Q5_K_M
3. Clean up the intermediate F16 file

### Manual Two-Step Process

If you prefer to run each step separately:

**Step 1: Export to F16**
```bash
# Windows
.\scripts\export_gguf_f16.ps1 -Src "models\oneseek-7b-zero\weights" -Out "models\oneseek-f16.gguf"

# Linux/macOS
./scripts/export_gguf_f16.sh --src models/oneseek-7b-zero/weights --out models/oneseek-f16.gguf

# Python
python scripts/export_gguf_f16.py --src models/oneseek-7b-zero/weights --out models/oneseek-f16.gguf
```

**Step 2: Quantize to Q5**
```bash
# Windows
.\scripts\quantize_q5.ps1 -Src "models\oneseek-f16.gguf" -Out "models\oneseek-q5.gguf"

# Linux/macOS
./scripts/quantize_q5.sh --src models/oneseek-f16.gguf --out models/oneseek-q5.gguf

# Python
python scripts/quantize_q5.py --src models/oneseek-f16.gguf --out models/oneseek-q5.gguf
```

## Two-Step Process

### Step 1: F16 GGUF Export

This step converts a HuggingFace model to F16 GGUF format.

**Script:** `export_gguf_f16.py` (with `.ps1` and `.sh` wrappers)

**What it does:**
- Downloads llama.cpp convert script if not available
- Converts model weights to F16 precision GGUF
- Validates output file

**Expected output:**
- File size: ~14 GB for 7B model
- Format: GGUF with F16 precision

**Time:** 10-20 minutes depending on hardware

### Step 2: Q5 Quantization

This step quantizes the F16 GGUF to Q5 using llama-quantize.

**Script:** `quantize_q5.py` (with `.ps1` and `.sh` wrappers)

**What it does:**
- Finds llama-quantize binary
- Runs quantization to Q5_K_M (or specified type)
- Reports size reduction

**Expected output:**
- File size: ~6-7 GB for 7B model (50% reduction)
- Format: GGUF with Q5 quantization

**Time:** 5-15 minutes depending on hardware

### Quantization Types

The scripts support multiple Q5 variants:

- **Q5_K_M** (default) - Medium quality, best balance of size and quality
- **Q5_K_S** - Small variant, smaller size with minimal quality loss
- **Q5_K** - Alias for Q5_K_M
- **Q5_0** - Original Q5 format (older, larger)

**Recommendation:** Use Q5_K_M for best results.

## Configuration

### Environment Variables

#### LLAMA_QUANTIZE_PATH

Override the default search path for llama-quantize binary.

**Windows:**
```powershell
$env:LLAMA_QUANTIZE_PATH = "C:\custom\path\llama-quantize.exe"
```

**Linux/macOS:**
```bash
export LLAMA_QUANTIZE_PATH=/custom/path/llama-quantize
```

#### LLAMA_SERVER_PATH

Override the default search path for llama-server binary (for runtime).

**Windows:**
```powershell
$env:LLAMA_SERVER_PATH = "C:\custom\path\llama-server.exe"
```

**Linux/macOS:**
```bash
export LLAMA_SERVER_PATH=/custom/path/llama-server
```

### Script Options

#### export_gguf_q5 Options

```bash
--src <path>        # Source HuggingFace model directory (required)
--out <path>        # Output Q5 GGUF file path (required)
--type <Q5_*>       # Quantization type (default: Q5_K_M)
--keep-f16          # Keep intermediate F16 file
--json-output       # Output result as JSON
```

#### quantize_q5 Options

```bash
--src <path>        # Source F16 GGUF file (required)
--out <path>        # Output Q5 GGUF file path (required)
--type <Q5_*>       # Quantization type (default: Q5_K_M)
--json-output       # Output result as JSON
```

## Troubleshooting

### llama-quantize not found

**Error:** `llama-quantize binary not found`

**Solution:**
1. Download llama.cpp binaries from releases page
2. Place in default location or set `LLAMA_QUANTIZE_PATH`
3. On Windows, use AVX2 build for better compatibility

### CUDA DLL errors (Windows)

**Error:** `The code execution cannot proceed because CUDA*.dll was not found`

**Solution:**
- Download the **AVX2** build instead of CUDA build
- AVX2 builds run on CPU and don't require CUDA libraries
- They work on all modern CPUs and are more compatible

### Quantization produces wrong size

**Symptom:** Output file is ~14 GB instead of ~6-7 GB

**Solution:**
- This means quantization didn't work (F16 was copied instead)
- Check llama-quantize binary compatibility
- Try different llama.cpp release version
- Verify F16 input file is valid

### Out of disk space

**Error:** `No space left on device` or similar

**Solution:**
- Ensure ~25 GB free space for 7B model export
- Use `--keep-f16` to see where space is used
- Clean up temp directory: `/tmp/gguf_export/` (Linux/macOS) or `%TEMP%\gguf_export\` (Windows)

### Conversion script download fails

**Error:** `Failed to download convert script`

**Solution:**
1. Check internet connection
2. Manually download from: https://github.com/ggerganov/llama.cpp
3. Place `convert_hf_to_gguf.py` in `scripts/llama_cpp_scripts/`
4. Run export again

## Server Runtime

After exporting to GGUF, you can run the model using llama.cpp server.

### Starting the Server

**Windows:**
```powershell
.\scripts\run_gguf_server_cuda.ps1 -Model "models\oneseek-q5.gguf" -Port 8080 -Layers 32
```

**Linux/macOS:**
```bash
./scripts/run_gguf_server_cuda.sh --model models/oneseek-q5.gguf --port 8080 --layers 32
```

### Server Options

```bash
-Model / --model      # Path to GGUF file (required)
-Port / --port        # Server port (default: 8080)
-Layers / --layers    # GPU layers (default: 32, 0 for CPU-only)
-Context / --context  # Context size (default: 4096)
-Threads / --threads  # CPU threads (default: auto)
-Host / --host        # Bind address (default: 127.0.0.1)
```

### Server Endpoints

Once running, the server provides:

- **Chat API:** `http://localhost:8080/v1/chat/completions`
- **Completions:** `http://localhost:8080/v1/completions`
- **Health:** `http://localhost:8080/health`

### Example API Request

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is democracy?"}
    ],
    "temperature": 0.7,
    "max_tokens": 500
  }'
```

### GPU vs CPU

**GPU Mode** (faster, requires CUDA-compatible GPU):
```bash
# Use GPU layers (default: 32 for 7B model)
--layers 32
```

**CPU Mode** (slower, works on all systems):
```bash
# Set layers to 0 for CPU-only
--layers 0
```

## Advanced Usage

### Keeping F16 for Multiple Quantizations

If you want to try different quantization types without re-exporting:

```bash
# Export with --keep-f16
python scripts/export_gguf_q5.py --src model --out model_q5_km.gguf --type Q5_K_M --keep-f16

# Now you have model_f16.gguf, try other quantizations:
python scripts/quantize_q5.py --src model_f16.gguf --out model_q5_ks.gguf --type Q5_K_S
python scripts/quantize_q5.py --src model_f16.gguf --out model_q5_0.gguf --type Q5_0
```

### Batch Export

Create a batch script to export multiple models:

**Windows (PowerShell):**
```powershell
$models = @(
    @{Src="models\model1"; Out="output\model1_q5.gguf"},
    @{Src="models\model2"; Out="output\model2_q5.gguf"}
)

foreach ($m in $models) {
    .\scripts\export_gguf_q5.ps1 -Src $m.Src -Out $m.Out
}
```

**Linux/macOS (Bash):**
```bash
#!/bin/bash
models=(
    "models/model1:output/model1_q5.gguf"
    "models/model2:output/model2_q5.gguf"
)

for entry in "${models[@]}"; do
    IFS=':' read -r src out <<< "$entry"
    ./scripts/export_gguf_q5.sh --src "$src" --out "$out"
done
```

### JSON Output for Automation

All scripts support `--json-output` for programmatic use:

```bash
python scripts/export_gguf_q5.py --src model --out model_q5.gguf --json-output > result.json
```

Example output:
```json
{
  "success": true,
  "output_path": "model_q5.gguf",
  "quantization_type": "Q5_K_M",
  "f16_size_gb": 13.2,
  "q5_size_gb": 6.8,
  "reduction_percent": 48.5
}
```

## Reference

### File Sizes (7B Model)

| Format | Size | Notes |
|--------|------|-------|
| Original HF | ~14 GB | Full precision weights |
| F16 GGUF | ~14 GB | F16 precision |
| Q8_0 | ~7.5 GB | High quality quantization |
| Q5_K_M | ~6.5 GB | **Recommended balance** |
| Q5_K_S | ~6.0 GB | Smaller, slight quality loss |
| Q4_K_M | ~4.5 GB | Lower quality |

### Related Files

- `scripts/export_gguf.py` - Legacy single-step export (kept for compatibility)
- `scripts/export_gguf_f16.py` - Step 1: F16 export
- `scripts/quantize_q5.py` - Step 2: Q5 quantization
- `scripts/export_gguf_q5.py` - Combined two-step export
- `scripts/run_gguf_server_cuda.{ps1,sh}` - GGUF server with CUDA support

### External Resources

- [llama.cpp GitHub](https://github.com/ggerganov/llama.cpp)
- [llama.cpp Releases](https://github.com/ggerganov/llama.cpp/releases)
- [GGUF Specification](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)
- [Quantization Methods](https://github.com/ggerganov/llama.cpp#quantization)

---

**Last Updated:** 2024-12-08
**Version:** 1.0
