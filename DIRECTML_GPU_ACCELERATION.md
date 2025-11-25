# DirectML GPU Acceleration for OneSeek

Enable DirectML GPU acceleration for dramatically faster inference on AMD Ryzen AI and Intel GPUs.

## Performance Improvement

**Before DirectML:**
- Response time: 30-90 seconds
- CPU-only inference
- Frequent timeouts

**After DirectML:**
- Response time: 2-4 seconds ⚡
- GPU/NPU accelerated
- Smooth, continuous operation

## Hardware Requirements

### Recommended
- AMD Ryzen AI Max 390 (Framework Laptop 13)
- Radeon 890M GPU
- XDNA 2 NPU
- 128 GB RAM (16 GB allocated to GPU)

### Minimum
- Any Windows PC with AMD or Intel integrated GPU
- Windows 10/11
- 16+ GB system RAM

## Quick Start

### Windows

```batch
start_inference_directml.bat
```

This will:
1. Auto-install torch-directml if needed
2. Start the ML service with DirectML acceleration
3. Configure optimal settings for Ryzen AI Max 390

### Linux/macOS

```bash
./start_inference_directml.sh
```

Note: DirectML is Windows-only. On Linux, this script will use CUDA or ROCm if available.

## Manual Installation

### 1. Install DirectML Support

```bash
pip install torch-directml
```

### 2. Start Service with DirectML

```bash
python ml_service/server.py --auto-devices --directml --n-gpu-layers 40 --gpu-memory 16
```

## Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--auto-devices` | Enable automatic device mapping for GPU/NPU offloading | Off |
| `--directml` | Force DirectML acceleration (Windows AMD/Intel GPU) | Off |
| `--load-in-4bit` | Load model in 4-bit quantization for memory efficiency | Off |
| `--load-in-8bit` | Load model in 8-bit quantization | Off |
| `--n-gpu-layers` | Number of layers to offload to GPU | 40 |
| `--gpu-memory` | GPU memory allocation in GB | 16.0 |
| `--timeout-keep-alive` | Timeout keep-alive in seconds | 600 |

## Configuration Details

### Device Mapping

With `--auto-devices`, the model uses PyTorch's `device_map="auto"` feature to automatically distribute layers across:
- GPU memory (VRAM)
- System RAM (when needed)
- NPU cores (on supported AMD Ryzen AI)

### Data Types

- **bfloat16**: Used with DirectML for optimal performance on AMD Ryzen AI Max 390
- **float16**: Used with CUDA/other GPUs
- **float32**: Fallback for CPU-only mode

### LoRA Adapters

All LoRA adapters are automatically loaded and mapped to the same device as the base model:

```
OneSeek-7B-Zero with chained LoRA adapters:
├── Base Model (bfloat16, device_map="auto")
├── kb-llama-3-1-8b-swedish-adapter (GPU)
├── oneseek-identity-v1-adapter (GPU)
└── oneseek-climate-v1-adapter (GPU)
```

## Example Output

When running with DirectML acceleration, you should see:

```
================================================================================
Device: directml:0
Device Type: AMD Radeon 890M + XDNA 2 NPU
GPU Memory Allocated: 16 GB (from system RAM)
Using DirectML acceleration – Ryzen AI Max 390 OPTIMIZED
================================================================================
Using torch.bfloat16 for optimal Ryzen AI Max 390 performance
Using device_map='auto' for GPU/NPU offloading
Loading OneSeek-7B-Zero with chained LoRA adapters...
Loading checkpoint shards: 100%|██████████| 4/4 [00:03<00:00, 1.25it/s]
Applying LoRA adapter: kb-llama-3-1-8b-swedish-adapter
Applying LoRA adapter: oneseek-identity-v1-adapter
Applying LoRA adapter: oneseek-climate-v1-adapter
✓ LoRA adapters applied successfully (PEFT format)
================================================================================
OneSeek-7B-Zero loaded in 4.1 seconds
Inference speed: ~25-38 tokens/second (expected on Ryzen AI Max 390)
OneSeek-7B-Zero is now LIVE and CONTINUOUS
================================================================================
```

## Troubleshooting

### "torch-directml not installed"

Install it:
```bash
pip install torch-directml
```

### Still slow after enabling DirectML

1. Check that DirectML is actually being used (look for "DirectML device detected" in logs)
2. Ensure you're using `--auto-devices` flag
3. Verify GPU drivers are up to date
4. Check system RAM allocation for GPU

### Out of memory errors

Reduce GPU layers or memory allocation:
```bash
python ml_service/server.py --auto-devices --directml --n-gpu-layers 30 --gpu-memory 12
```

Or use quantization:
```bash
python ml_service/server.py --auto-devices --directml --load-in-8bit
```

## Performance Tips

1. **Maximize allocated RAM**: In BIOS, allocate as much system RAM as possible to integrated GPU (4-16 GB recommended)

2. **Use bfloat16**: This is automatically enabled with `--auto-devices` + `--directml` on AMD GPUs

3. **Optimize layer distribution**: The default 40 layers works well for most 7B models. Adjust if needed:
   - More layers on GPU = faster but more VRAM needed
   - Fewer layers on GPU = slower but less VRAM needed

4. **Keep-alive timeout**: Set to 600 seconds (10 minutes) to avoid timeouts during inference

## See Also

- [PyTorch DirectML Documentation](https://github.com/microsoft/DirectML)
- [AMD Ryzen AI Documentation](https://www.amd.com/en/products/ryzen-ai)
- [ONESEEK_7B_ZERO_MIGRATION_GUIDE.md](../ONESEEK_7B_ZERO_MIGRATION_GUIDE.md) - Model setup guide
