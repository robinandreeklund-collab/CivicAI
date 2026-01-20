# OneSeek vLLM Inference Server

High-performance inference server for OneSeek using vLLM instead of llama-cpp-python.

## Why vLLM?

vLLM provides significantly better performance than llama-cpp-python, especially for:

- **Multi-user scenarios**: Continuous batching and PagedAttention optimize concurrent requests
- **GPU utilization**: Better memory management and CUDA kernel optimization
- **Throughput**: 2-3x faster inference compared to llama-cpp-python
- **RTX 5090 optimization**: Native support for Blackwell architecture (sm_120)

### Performance Comparison

| Metric | llama-cpp-python | vLLM | Improvement |
|--------|------------------|------|-------------|
| Single user latency | ~1.5s | ~1.2s | 20% faster |
| Multi-user throughput | 5 req/s | 15 req/s | 3x faster |
| GPU utilization | 60% | 90% | 50% better |
| Concurrent batching | Limited | Excellent | PagedAttention |

## Requirements

### Hardware
- **GPU**: NVIDIA GPU with compute capability 7.0+ (RTX 5090 recommended)
- **VRAM**: Minimum 16GB, 24GB+ recommended for larger models
- **CUDA**: 12.8+ for RTX 5090 Blackwell architecture

### Software
- Python 3.12
- vLLM >= 0.6.0 (for GGUF support)
- PyTorch with CUDA 12.8 support

## Installation

### 1. Install PyTorch (if not already installed)

For RTX 5090 with CUDA 12.8:

```powershell
pip install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128
```

Verify installation:
```powershell
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0))"
```

Expected output:
```
CUDA available: True
GPU: NVIDIA GeForce RTX 5090
```

### 2. Install vLLM

```powershell
pip install vllm>=0.6.0
```

Or install all vLLM requirements:
```powershell
pip install -r ml_service/requirements_vllm.txt
```

### 3. Set Model Path

Set the `ONESEEK_MODEL_PATH` environment variable to your GGUF model:

**Windows PowerShell:**
```powershell
$env:ONESEEK_MODEL_PATH = "C:\path\to\your\model.gguf"
```

**Linux/macOS:**
```bash
export ONESEEK_MODEL_PATH="/path/to/your/model.gguf"
```

**Permanent (add to .env.local):**
```
ONESEEK_MODEL_PATH=C:\path\to\your\model.gguf
```

## Usage

### Basic Usage

Start the vLLM server on default port 5001:

```powershell
cd ml_service
python server_vllm.py
```

The server will be available at `http://localhost:5001`

### Advanced Configuration

```powershell
python server_vllm.py \
  --host 0.0.0.0 \
  --port 5001 \
  --model /path/to/model.gguf \
  --gpu-memory-utilization 0.90 \
  --max-model-len 8192 \
  --max-num-seqs 256
```

**Configuration Options:**

- `--host`: Host to bind to (default: 0.0.0.0)
- `--port`: Port to bind to (default: 5001)
- `--model`: Path to model file (overrides ONESEEK_MODEL_PATH)
- `--gpu-memory-utilization`: GPU memory to use (0.0-1.0, default: 0.90)
- `--max-model-len`: Maximum context length in tokens (default: 8192)
- `--tensor-parallel-size`: Number of GPUs for tensor parallelism (default: 1)
- `--max-num-seqs`: Maximum batch size for concurrent requests (default: 256)

### Multi-GPU Setup

If you have multiple GPUs, enable tensor parallelism:

```powershell
python server_vllm.py --tensor-parallel-size 2
```

## API Endpoints

The vLLM server is API-compatible with the original `server.py`.

### POST /infer

Generate a response from the model.

**Request:**
```json
{
  "text": "Vad är huvudstaden i Sverige?",
  "max_length": 512,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50,
  "repetition_penalty": 1.1,
  "system_prompt": "Du är en hjälpsam svensk AI-assistent.",
  "history": [
    {
      "role": "user",
      "content": "Hej!"
    },
    {
      "role": "assistant",
      "content": "Hej! Hur kan jag hjälpa dig?"
    }
  ]
}
```

**Response:**
```json
{
  "response": "Stockholm är huvudstaden i Sverige.",
  "model": "OneSeek-7B-Zero-CURRENT",
  "tokens": 8,
  "latency_ms": 1245.67,
  "backend": "vllm"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "backend": "vllm",
  "model": "OneSeek-7B-Zero-CURRENT",
  "cuda_available": true,
  "gpu": "NVIDIA GeForce RTX 5090"
}
```

### GET /stats

Server statistics.

**Response:**
```json
{
  "total_requests": 1234,
  "model": "OneSeek-7B-Zero-CURRENT",
  "backend": "vllm",
  "vllm_config": {
    "tensor_parallel_size": 1,
    "gpu_memory_utilization": 0.9,
    "max_model_len": 8192
  },
  "cuda_available": true,
  "gpu_memory_allocated": "18.45 GB",
  "gpu_memory_reserved": "20.12 GB"
}
```

## Integration with CivicAI

### Option 1: Replace llama-cpp server

Stop the current ML service and start vLLM server instead:

```powershell
# Terminal 1 - vLLM Server (replaces ml_service/server.py)
cd ml_service
python server_vllm.py --port 5000
```

Update your backend to use port 5000 (same as before).

### Option 2: Run alongside llama-cpp (for testing)

Run both servers on different ports for comparison:

```powershell
# Terminal 1 - vLLM Server
cd ml_service
python server_vllm.py --port 5001

# Terminal 2 - Original llama-cpp Server
cd ml_service
python server.py --port 5000
```

Update `backend/config.js` or `.env` to point to port 5001 for vLLM.

## Monitoring

### Check GPU Usage

While the server is running, monitor GPU usage with:

```powershell
nvidia-smi -l 1
```

You should see high GPU utilization (80-95%) during inference, indicating efficient batching.

### Server Logs

The vLLM server logs detailed information about each request:

```
[req-1] Generating response (max_tokens=512, temp=0.7)
[req-1] Generated 87 tokens in 1.23s (70.7 tokens/s)
```

### Performance Metrics

Access `/stats` endpoint to see real-time statistics:

```powershell
curl http://localhost:5001/stats
```

## Troubleshooting

### Out of Memory (OOM) Errors

If you encounter OOM errors, reduce GPU memory utilization:

```powershell
python server_vllm.py --gpu-memory-utilization 0.80
```

Or reduce max context length:

```powershell
python server_vllm.py --max-model-len 4096
```

### Slow First Request

The first request is slower due to CUDA graph compilation. This is normal and subsequent requests will be much faster.

### "vLLM not installed" Error Despite Installation

If you get "❌ vLLM not installed" error but `pip show vllm` shows it's installed:

**Cause**: Python/pip version mismatch or vLLM import path changed in newer versions.

**Solution**:
```powershell
# Ensure you're using the same Python for pip and running
python -m pip install --upgrade vllm>=0.6.0

# Verify installation
python -c "import vllm; print('vLLM version:', vllm.__version__)"

# Run server with same Python
python ml_service/server_vllm.py
```

**For vLLM 0.13+**: The import paths have changed. The server automatically handles both old and new import paths.

### GGUF Not Supported Error

Ensure you have vLLM >= 0.6.0:

```powershell
pip install --upgrade vllm>=0.6.0
```

### CUDA Version Mismatch

If you get CUDA compatibility errors, ensure PyTorch CUDA version matches your system:

```powershell
python -c "import torch; print('PyTorch CUDA:', torch.version.cuda)"
nvidia-smi
```

Both should show CUDA 12.8 or compatible versions.

## Differences from server.py

The vLLM server (`server_vllm.py`) is a streamlined version focused on high-performance inference:

**Included:**
- ✅ Core inference endpoint (`/infer`)
- ✅ ChatML prompt formatting
- ✅ Conversation history support
- ✅ Health check and statistics
- ✅ Rate limiting
- ✅ GGUF model support

**Not included (use original server.py for these):**
- ❌ Intent Engine
- ❌ Typo Checker
- ❌ Tavily Search integration
- ❌ Memory Manager
- ❌ Personality Selector
- ❌ API Integrations

For full ONESEEK features, use the original `server.py`. The vLLM server is designed for maximum inference performance in multi-user scenarios.

## Performance Tips

### 1. Optimize GPU Memory

For RTX 5090 (32GB VRAM), you can use higher memory utilization:

```powershell
python server_vllm.py --gpu-memory-utilization 0.95
```

### 2. Increase Batch Size

For many concurrent users, increase batch size:

```powershell
python server_vllm.py --max-num-seqs 512
```

### 3. Use CUDA Graphs

Enable CUDA graphs for faster inference (enabled by default):

```powershell
python server_vllm.py  # enforce_eager=False by default
```

### 4. Monitor and Adjust

Use `/stats` endpoint to monitor GPU memory usage and adjust accordingly.

## Benchmarking

Test the server performance with Apache Bench or similar tools:

```bash
# Single request latency
time curl -X POST http://localhost:5001/infer \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är huvudstaden i Sverige?", "max_length": 100}'

# Concurrent requests throughput
ab -n 100 -c 10 -T 'application/json' \
  -p request.json \
  http://localhost:5001/infer
```

Expected results for RTX 5090:
- Single request: ~1.2s latency
- 10 concurrent: ~15 requests/second
- GPU utilization: 85-95%

## Support

For issues specific to vLLM, check:
- [vLLM Documentation](https://docs.vllm.ai/)
- [vLLM GitHub Issues](https://github.com/vllm-project/vllm/issues)

For OneSeek-specific issues, refer to the main CivicAI documentation.
