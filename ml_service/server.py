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
# Updated to use OneSeek-7B-Zero.v1.1 model path
ONESEEK_PATH = os.getenv('ONESEEK_MODEL_PATH', r'C:\Users\robin\Documents\GitHub\CivicAI\models\oneseek-7b-zero')
# Fallback to project-relative path if Windows path doesn't exist
if not Path(ONESEEK_PATH).exists():
    ONESEEK_PATH = str(PROJECT_ROOT / 'models' / 'oneseek-7b-zero')

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

def load_model(model_name: str, model_path: str):
    """Load model and tokenizer with device optimization"""
    if model_name in models:
        return models[model_name], tokenizers[model_name]
    
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
        logger.warning(f"OneSeek-7B-Zero model not found at {ONESEEK_PATH}")
        logger.info("Please ensure the model is downloaded to the specified path")
    else:
        logger.info(f"✓ OneSeek-7B-Zero model directory found")
    
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
