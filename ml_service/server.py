"""
ML Inference Service for OneSeek-7B-Zero.v1.1
FastAPI server for OneSeek-7B-Zero model inference
Replaces previous Mistral 7B and LLaMA-2 routing
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model paths - use absolute paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent.resolve()
# Support both Windows absolute path and project-relative path
# Windows path for user's local setup, falls back to project-relative
ONESEEK_PATH_WIN = r'C:\Users\robin\Documents\GitHub\CivicAI\models\oneseek-7b-zero'
ONESEEK_PATH_DEFAULT = str(PROJECT_ROOT / 'models' / 'oneseek-7b-zero')

# Use Windows path if it exists, otherwise use project-relative path
if Path(ONESEEK_PATH_WIN).exists():
    ONESEEK_PATH = os.getenv('ONESEEK_MODEL_PATH', ONESEEK_PATH_WIN)
else:
    ONESEEK_PATH = os.getenv('ONESEEK_MODEL_PATH', ONESEEK_PATH_DEFAULT)

# GPU configuration - Support for NVIDIA, Intel, and CPU
def get_device():
    """Automatically detect best available device"""
    # Try DirectML (Windows Intel/AMD GPU)
    try:
        import torch_directml
        if torch_directml.is_available():
            device = torch_directml.device()
            logger.info(f"DirectML device detected (Windows GPU acceleration)")
            return device, 'directml'
    except ImportError:
        pass
    
    # Try Intel GPU (XPU) via IPEX (Linux only)
    try:
        import intel_extension_for_pytorch as ipex
        if torch.xpu.is_available():
            logger.info("Intel GPU (XPU) detected via IPEX")
            return torch.device('xpu'), 'xpu'
    except ImportError:
        pass
    
    # Try NVIDIA GPU
    if torch.cuda.is_available():
        logger.info(f"NVIDIA GPU detected: {torch.cuda.get_device_name(0)}")
        return torch.device('cuda'), 'cuda'
    
    # Fallback to CPU
    logger.info("Using CPU (slow - consider GPU for better performance)")
    return torch.device('cpu'), 'cpu'

DEVICE, DEVICE_TYPE = get_device()

# Model cache
models = {}
tokenizers = {}

class InferenceRequest(BaseModel):
    text: str
    max_length: int = 512
    temperature: float = 0.7
    top_p: float = 0.9

class InferenceResponse(BaseModel):
    response: str
    model: str
    tokens: int
    latency_ms: float

def find_base_model_path():
    """Find a valid base model path for OneSeek-7B-Zero
    
    Checks in this order:
    1. oneseek-7b-zero directory itself (if it has config.json - fully trained model)
    2. oneseek-7b-zero/base_models/mistral-7b
    3. oneseek-7b-zero/base_models/llama-2-7b  
    4. Legacy models/mistral-7b-instruct
    5. Legacy models/llama-2-7b-chat
    """
    base_path = Path(ONESEEK_PATH)
    
    # Check if OneSeek directory itself has a config.json (complete model)
    if (base_path / 'config.json').exists():
        logger.info(f"Found complete OneSeek model at {base_path}")
        return str(base_path)
    
    # Check for base models in oneseek directory
    mistral_base = base_path / 'base_models' / 'mistral-7b'
    llama_base = base_path / 'base_models' / 'llama-2-7b'
    
    # Legacy paths (where user actually has the models)
    legacy_mistral = PROJECT_ROOT / 'models' / 'mistral-7b-instruct'
    legacy_llama = PROJECT_ROOT / 'models' / 'llama-2-7b-chat'
    
    # Check each path for config.json
    for name, path in [
        ('Mistral-7B (base_models)', mistral_base),
        ('LLaMA-2-7B (base_models)', llama_base),
        ('Mistral-7B (legacy)', legacy_mistral),
        ('LLaMA-2-7B (legacy)', legacy_llama)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found base model: {name} at {path}")
            return str(path)
    
    return None

def find_lora_weights():
    """Find the latest LoRA adapter weights for OneSeek-7B-Zero
    
    Checks for trained LoRA weights in:
    1. weights/oneseek-7b-zero-v*.pth (latest version)
    2. lora_adapters/oneseek-7b-zero-v*/adapter.pth
    
    Returns path to LoRA weights file, or None if not found
    """
    import json
    base_path = Path(ONESEEK_PATH)
    
    # Check weights directory for .pth files
    weights_dir = base_path / 'weights'
    if weights_dir.exists():
        # Find all version files
        weight_files = list(weights_dir.glob('oneseek-7b-zero-v*.pth'))
        if weight_files:
            # Sort by version number and get the latest
            latest_weight = sorted(weight_files, reverse=True)[0]
            logger.info(f"Found LoRA weights: {latest_weight}")
            return str(latest_weight)
        
        # Check for metadata files that point to current version
        json_files = list(weights_dir.glob('oneseek-7b-zero-v*.json'))
        for json_file in sorted(json_files, reverse=True):
            try:
                with open(json_file, 'r') as f:
                    metadata = json.load(f)
                if metadata.get('isCurrent', False):
                    # Check if corresponding .pth file exists
                    pth_file = json_file.with_suffix('.pth')
                    if pth_file.exists():
                        logger.info(f"Found current LoRA weights from metadata: {pth_file}")
                        return str(pth_file)
            except Exception as e:
                logger.debug(f"Could not read metadata from {json_file}: {e}")
    
    # Check lora_adapters directory
    lora_dir = base_path / 'lora_adapters'
    if lora_dir.exists():
        adapter_dirs = list(lora_dir.glob('oneseek-7b-zero-v*'))
        for adapter_dir in sorted(adapter_dirs, reverse=True):
            adapter_file = adapter_dir / 'adapter.pth'
            if adapter_file.exists():
                logger.info(f"Found LoRA adapter: {adapter_file}")
                return str(adapter_file)
    
    return None

def load_model(model_name: str, model_path: str):
    """Load model and tokenizer with device optimization, applying LoRA adapters if available"""
    if model_name in models:
        return models[model_name], tokenizers[model_name]
    
    # For OneSeek, find the actual base model path
    if model_name == 'oneseek-7b-zero':
        actual_path = find_base_model_path()
        if not actual_path:
            error_msg = (
                "No base model found for OneSeek-7B-Zero. Please download one of:\n"
                "  1. Mistral-7B: huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 "
                f"--local-dir {ONESEEK_PATH}/base_models/mistral-7b\n"
                "  2. LLaMA-2-7B: huggingface-cli download meta-llama/Llama-2-7b-chat-hf "
                f"--local-dir {ONESEEK_PATH}/base_models/llama-2-7b"
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        model_path = actual_path
        logger.info(f"Loading OneSeek-7B-Zero using base model from {model_path}...")
    else:
        logger.info(f"Loading {model_name} from {model_path}...")
    
    # Use FP16 for GPU acceleration, FP32 for CPU
    dtype = torch.float16 if DEVICE_TYPE in ['cuda', 'xpu', 'directml'] else torch.float32
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Load model with device-specific optimizations
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            dtype=dtype,  # Use modern 'dtype' instead of deprecated 'torch_dtype'
            low_cpu_mem_usage=True
        )
        
        # Move model to device
        model = model.to(DEVICE)
        
        # For OneSeek, try to load and apply LoRA adapters
        if model_name == 'oneseek-7b-zero':
            lora_weights = find_lora_weights()
            if lora_weights:
                try:
                    # Try to load LoRA using PEFT
                    from peft import PeftModel
                    logger.info(f"Applying LoRA adapters from {lora_weights}...")
                    # Note: This requires the LoRA weights to be in PEFT format
                    # If weights are in raw PyTorch format, we need different loading logic
                    lora_dir = Path(lora_weights).parent
                    if (lora_dir / 'adapter_config.json').exists():
                        model = PeftModel.from_pretrained(model, str(lora_dir))
                        logger.info("✓ LoRA adapters applied successfully")
                    else:
                        logger.info("⚠ LoRA weights found but not in PEFT format - using base model")
                        logger.info("  (Train with scripts/train_identity.py to create PEFT-compatible adapters)")
                except ImportError:
                    logger.warning("⚠ PEFT not installed - cannot apply LoRA adapters")
                    logger.info("  Install with: pip install peft")
                except Exception as e:
                    logger.warning(f"⚠ Could not apply LoRA adapters: {e}")
                    logger.info("  Using base model without adapters")
            else:
                logger.info("ℹ No LoRA adapters found - using base model")
                logger.info("  Train with: python scripts/train_identity.py")
        
        # Apply device-specific optimizations
        if DEVICE_TYPE == 'xpu':
            # Intel GPU optimization via IPEX
            try:
                import intel_extension_for_pytorch as ipex
                model = ipex.optimize(model)
                logger.info(f"✓ {model_name} optimized with IPEX")
            except ImportError:
                pass
        elif DEVICE_TYPE == 'directml':
            # DirectML is handled automatically by torch-directml
            logger.info(f"✓ {model_name} using DirectML acceleration")
        
        # Cache models
        models[model_name] = model
        tokenizers[model_name] = tokenizer
        
        logger.info(f"✓ {model_name} loaded successfully on {DEVICE_TYPE} ({dtype})")
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading {model_name}: {str(e)}")
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    logger.info("Starting ML Service...")
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"OneSeek-7B-Zero path: {ONESEEK_PATH}")
    
    # Check if model directory exists
    if not Path(ONESEEK_PATH).exists():
        logger.warning(f"OneSeek-7B-Zero model directory not found at {ONESEEK_PATH}")
        logger.info("Please ensure the directory structure is created")
    else:
        logger.info(f"✓ OneSeek-7B-Zero directory found")
        
        # Check for base models
        base_model = find_base_model_path()
        if base_model:
            logger.info(f"✓ Base model ready for inference")
        else:
            logger.warning("⚠ No base model found. Download required:")
            logger.warning(f"  huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --local-dir {ONESEEK_PATH}/base_models/mistral-7b")
            logger.warning("  OR")
            logger.warning(f"  huggingface-cli download meta-llama/Llama-2-7b-chat-hf --local-dir {ONESEEK_PATH}/base_models/llama-2-7b")
    
    yield
    
    # Shutdown (cleanup if needed)
    logger.info("Shutting down ML Service...")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="OQT-1.0 ML Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check"""
    device_info = {
        "service": "OneSeek-7B-Zero ML Service",
        "version": "1.1.0",
        "model": "OneSeek-7B-Zero.v1.1",
        "status": "running",
        "device": str(DEVICE),
        "device_type": DEVICE_TYPE,
        "models_loaded": list(models.keys())
    }
    
    # Add device-specific info
    if DEVICE_TYPE == 'cuda':
        device_info["gpu_name"] = torch.cuda.get_device_name(0)
        device_info["gpu_memory"] = f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB"
    elif DEVICE_TYPE == 'xpu':
        try:
            device_info["gpu_name"] = torch.xpu.get_device_name(0)
            device_info["intel_gpu"] = True
        except:
            pass
    
    return device_info

@app.post("/inference/oneseek", response_model=InferenceResponse)
async def oneseek_inference(request: InferenceRequest):
    """Generate response using OneSeek-7B-Zero.v1.1"""
    import time
    start_time = time.time()
    
    try:
        # Load model if not cached
        model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
        
        # Prepare input
        inputs = tokenizer(request.text, return_tensors="pt").to(DEVICE)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode output
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input from response
        if response_text.startswith(request.text):
            response_text = response_text[len(request.text):].strip()
        
        latency_ms = (time.time() - start_time) * 1000
        
        return InferenceResponse(
            response=response_text,
            model="OneSeek-7B-Zero.v1.1",
            tokens=len(outputs[0]),
            latency_ms=latency_ms
        )
        
    except Exception as e:
        logger.error(f"OneSeek-7B-Zero inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inference/llama", response_model=InferenceResponse)
async def llama_inference(request: InferenceRequest):
    """Generate response using LLaMA-2 7B (legacy endpoint - redirects to OneSeek)"""
    import time
    start_time = time.time()
    
    try:
        # Redirect to OneSeek-7B-Zero.v1.1
        logger.info("Legacy llama endpoint called - redirecting to OneSeek-7B-Zero.v1.1")
        model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
        
        # Prepare input with LLaMA chat format for compatibility
        formatted_prompt = f"<s>[INST] {request.text} [/INST]"
        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(DEVICE)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode output
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input from response
        if formatted_prompt in response_text:
            response_text = response_text.split('[/INST]')[-1].strip()
        
        latency_ms = (time.time() - start_time) * 1000
        
        return InferenceResponse(
            response=response_text,
            model="OneSeek-7B-Zero.v1.1 (via legacy LLaMA endpoint)",
            tokens=len(outputs[0]),
            latency_ms=latency_ms
        )
        
    except Exception as e:
        logger.error(f"OneSeek inference error (via legacy endpoint): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inference/mistral", response_model=InferenceResponse)
async def mistral_inference(request: InferenceRequest):
    """Generate response using Mistral 7B (legacy endpoint - redirects to OneSeek)"""
    import time
    start_time = time.time()
    
    try:
        # Redirect to OneSeek-7B-Zero.v1.1
        logger.info("Legacy mistral endpoint called - redirecting to OneSeek-7B-Zero.v1.1")
        model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
        
        # Prepare input
        inputs = tokenizer(request.text, return_tensors="pt").to(DEVICE)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                inputs.input_ids,
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode output
        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove input from response
        if response_text.startswith(request.text):
            response_text = response_text[len(request.text):].strip()
        
        latency_ms = (time.time() - start_time) * 1000
        
        return InferenceResponse(
            response=response_text,
            model="OneSeek-7B-Zero.v1.1 (via legacy Mistral endpoint)",
            tokens=len(outputs[0]),
            latency_ms=latency_ms
        )
        
    except Exception as e:
        logger.error(f"OneSeek inference error (via legacy endpoint): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models/status")
async def models_status():
    """Get status of loaded models"""
    status = {}
    
    for model_name, model in models.items():
        status[model_name] = {
            "loaded": True,
            "device": str(model.device),
            "dtype": str(model.dtype)
        }
    
    return {
        "device": DEVICE,
        "cuda_available": torch.cuda.is_available(),
        "models": status
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('ML_SERVICE_PORT', '5000'))
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
