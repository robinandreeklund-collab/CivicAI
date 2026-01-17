"""
ML Inference Service for OneSeek - vLLM Backend
FastAPI server for OneSeek model inference using vLLM for high-performance GPU acceleration
Supports GGUF models (vLLM 0.6+), multi-user batching, and PagedAttention

Key Differences from server.py:
- Uses vLLM instead of llama-cpp-python for ~2-3x faster inference
- Better GPU utilization with PagedAttention and continuous batching
- Native support for GGUF models (vLLM 0.6+)
- Optimized for multi-user scenarios with request batching
- Lower latency for concurrent requests

Requirements:
- vLLM >= 0.6.0 (for GGUF support)
- Python 3.12
- CUDA 12.8+ for RTX 5090 Blackwell architecture
- At least 16GB VRAM (24GB+ recommended for larger models)
"""

import os
os.environ['TRANSFORMERS_NO_SECURITY_CHECK'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import asyncio
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
import logging
import sys
import time
import argparse
from typing import Optional, List, Dict, Any, AsyncGenerator
import torch

# vLLM imports - compatible with vLLM 0.6+ through 0.13+
try:
    from vllm import LLM, SamplingParams
    # Import path changed in newer vLLM versions
    try:
        from vllm.engine.arg_utils import AsyncEngineArgs
    except ImportError:
        # For vLLM 0.13+
        from vllm import AsyncEngineArgs
    try:
        from vllm.engine.async_llm_engine import AsyncLLMEngine
    except ImportError:
        # For vLLM 0.13+
        from vllm import AsyncLLMEngine
    VLLM_AVAILABLE = True
except ImportError as e:
    VLLM_AVAILABLE = False
    LLM = None
    SamplingParams = None
    AsyncEngineArgs = None
    AsyncLLMEngine = None
    print(f"❌ vLLM not installed or import failed: {e}")
    print("Install with: pip install vllm>=0.6.0")
    sys.exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

# Model configuration
DEFAULT_MODEL_PATH = os.getenv(
    "ONESEEK_MODEL_PATH",
    str(Path(__file__).parent.parent / "models" / "oneseek-certified" / "OneSeek-7B-Zero-CURRENT")
)

# vLLM engine configuration
VLLM_CONFIG = {
    "tensor_parallel_size": 1,  # Number of GPUs to use (1 for single RTX 5090)
    "dtype": "auto",  # auto, float16, bfloat16
    "gpu_memory_utilization": 0.90,  # Use 90% of GPU memory
    "max_model_len": 8192,  # Maximum context length
    "enforce_eager": False,  # Use CUDA graphs for faster inference
    "trust_remote_code": True,  # Required for some models
    "max_num_seqs": 256,  # Maximum number of sequences to batch
    "max_num_batched_tokens": 8192,  # Maximum tokens per batch
}

# Server configuration
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 5001  # Different port from llama-cpp server (5000)

# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class InferenceRequest(BaseModel):
    """Request model for inference with input validation"""
    text: str = Field(..., min_length=1, max_length=20000, description="Input text for inference")
    max_length: int = Field(default=512, ge=1, le=8192, description="Maximum generation length")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Nucleus sampling parameter")
    top_k: int = Field(default=50, ge=1, le=100, description="Top-k sampling parameter")
    repetition_penalty: float = Field(default=1.1, ge=1.0, le=2.0, description="Repetition penalty")
    system_prompt: Optional[str] = Field(default=None, description="Custom system prompt")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Conversation history")
    stream: bool = Field(default=False, description="Stream the response")
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate and sanitize input text"""
        if not v or not v.strip():
            raise ValueError("Input text cannot be empty")
        v = v.replace('\x00', '')
        return v.strip()

class InferenceResponse(BaseModel):
    """Response model for inference results"""
    response: str
    model: str
    tokens: int
    latency_ms: float
    backend: str = "vllm"

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str

# =============================================================================
# GLOBAL STATE
# =============================================================================

# Global vLLM engine instance
vllm_engine: Optional[AsyncLLMEngine] = None
model_name: str = "unknown"
request_counter: int = 0

# =============================================================================
# VLLM ENGINE MANAGEMENT
# =============================================================================

def find_model_path() -> Path:
    """
    Find the ONESEEK model path.
    Checks:
    1. ONESEEK_MODEL_PATH environment variable
    2. DNA v2 certified symlink
    3. Legacy model symlink
    """
    # Check environment variable
    if os.getenv("ONESEEK_MODEL_PATH"):
        path = Path(os.getenv("ONESEEK_MODEL_PATH"))
        if path.exists():
            logger.info(f"✅ Found model via ONESEEK_MODEL_PATH: {path}")
            return path
    
    # Check DNA v2 certified symlink
    certified_path = Path(__file__).parent.parent / "models" / "oneseek-certified" / "OneSeek-7B-Zero-CURRENT"
    if certified_path.exists():
        logger.info(f"✅ Found DNA v2 certified model: {certified_path}")
        return certified_path
    
    # Check legacy symlink
    legacy_path = Path(__file__).parent.parent / "models" / "oneseek-7b-zero" / "OneSeek-7B-Zero-CURRENT"
    if legacy_path.exists():
        logger.info(f"✅ Found legacy model: {legacy_path}")
        return legacy_path
    
    # Model not found
    logger.error("❌ No model found. Set ONESEEK_MODEL_PATH environment variable.")
    raise FileNotFoundError(
        "No ONESEEK model found. Please set ONESEEK_MODEL_PATH environment variable "
        "or create a symlink at models/oneseek-certified/OneSeek-7B-Zero-CURRENT"
    )

async def initialize_vllm_engine():
    """Initialize the vLLM async engine"""
    global vllm_engine, model_name
    
    try:
        model_path = find_model_path()
        model_name = model_path.name
        
        logger.info("=" * 80)
        logger.info("🚀 INITIALIZING VLLM ENGINE")
        logger.info("=" * 80)
        logger.info(f"  Model: {model_path}")
        logger.info(f"  GPU Memory Utilization: {VLLM_CONFIG['gpu_memory_utilization'] * 100}%")
        logger.info(f"  Max Model Length: {VLLM_CONFIG['max_model_len']} tokens")
        logger.info(f"  Max Batch Size: {VLLM_CONFIG['max_num_seqs']} sequences")
        logger.info(f"  Tensor Parallel Size: {VLLM_CONFIG['tensor_parallel_size']} GPU(s)")
        logger.info("=" * 80)
        
        # Check if GGUF model
        is_gguf = str(model_path).endswith('.gguf')
        logger.info(f"  Model Format: {'GGUF' if is_gguf else 'HuggingFace'}")
        
        # Configure engine arguments
        engine_args = AsyncEngineArgs(
            model=str(model_path),
            tensor_parallel_size=VLLM_CONFIG["tensor_parallel_size"],
            dtype=VLLM_CONFIG["dtype"],
            gpu_memory_utilization=VLLM_CONFIG["gpu_memory_utilization"],
            max_model_len=VLLM_CONFIG["max_model_len"],
            enforce_eager=VLLM_CONFIG["enforce_eager"],
            trust_remote_code=VLLM_CONFIG["trust_remote_code"],
            max_num_seqs=VLLM_CONFIG["max_num_seqs"],
            max_num_batched_tokens=VLLM_CONFIG["max_num_batched_tokens"],
        )
        
        # Initialize async engine
        logger.info("⏳ Loading model into vLLM engine...")
        start_time = time.time()
        vllm_engine = AsyncLLMEngine.from_engine_args(engine_args)
        load_time = time.time() - start_time
        
        logger.info("=" * 80)
        logger.info(f"✅ vLLM ENGINE READY (loaded in {load_time:.2f}s)")
        logger.info("=" * 80)
        logger.info(f"  Backend: vLLM {get_vllm_version()}")
        logger.info(f"  CUDA Available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            logger.info(f"  GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"  GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize vLLM engine: {e}")
        raise

async def shutdown_vllm_engine():
    """Shutdown the vLLM engine"""
    global vllm_engine
    if vllm_engine:
        logger.info("🛑 Shutting down vLLM engine...")
        # vLLM doesn't have explicit shutdown, but we can set to None
        vllm_engine = None
        logger.info("✅ vLLM engine shutdown complete")

def get_vllm_version() -> str:
    """Get vLLM version"""
    try:
        import vllm
        return vllm.__version__
    except:
        return "unknown"

# =============================================================================
# PROMPT FORMATTING
# =============================================================================

def format_chat_prompt(
    user_text: str,
    system_prompt: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Format chat prompt in ChatML format for ONESEEK models.
    
    ChatML format:
    <|im_start|>system
    {system_prompt}<|im_end|>
    <|im_start|>user
    {message}<|im_end|>
    <|im_start|>assistant
    """
    # Default Swedish system prompt
    if system_prompt is None:
        system_prompt = (
            "Du är Zero, en svensk AI-assistent. "
            "Svara alltid på svenska och var hjälpsam, koncis och faktabaserad."
        )
    
    # Build messages
    messages = []
    
    # Add system message
    messages.append(f"<|im_start|>system\n{system_prompt}<|im_end|>")
    
    # Add history
    if history:
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            messages.append(f"<|im_start|>{role}\n{content}<|im_end|>")
    
    # Add current user message
    messages.append(f"<|im_start|>user\n{user_text}<|im_end|>")
    
    # Add assistant prompt
    messages.append("<|im_start|>assistant\n")
    
    return "\n".join(messages)

def clean_response(response: str) -> str:
    """Clean the generated response"""
    # Remove ChatML tokens if present
    response = response.replace("<|im_end|>", "")
    response = response.replace("<|im_start|>", "")
    
    # Strip whitespace
    response = response.strip()
    
    return response

# =============================================================================
# INFERENCE FUNCTIONS
# =============================================================================

async def generate_response(
    prompt: str,
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    repetition_penalty: float = 1.1,
    stream: bool = False
) -> str:
    """Generate response using vLLM engine"""
    global vllm_engine, request_counter
    
    if not vllm_engine:
        raise HTTPException(status_code=503, detail="vLLM engine not initialized")
    
    request_counter += 1
    request_id = f"req-{request_counter}"
    
    # Configure sampling parameters
    sampling_params = SamplingParams(
        max_tokens=max_tokens,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        repetition_penalty=repetition_penalty,
        stop=["<|im_end|>", "<|endoftext|>"],  # ChatML stop tokens
    )
    
    logger.info(f"[{request_id}] Generating response (max_tokens={max_tokens}, temp={temperature})")
    
    try:
        # Generate response
        start_time = time.time()
        
        if stream:
            # Streaming not yet implemented in this version
            # Would use vllm_engine.generate with streaming=True
            raise NotImplementedError("Streaming not yet implemented in vLLM server")
        else:
            # Non-streaming generation
            results = await vllm_engine.generate(
                prompt,
                sampling_params,
                request_id=request_id
            )
            
            # Extract generated text
            generated_text = results.outputs[0].text if results.outputs else ""
            
            generation_time = time.time() - start_time
            tokens_generated = len(results.outputs[0].token_ids) if results.outputs else 0
            
            logger.info(
                f"[{request_id}] Generated {tokens_generated} tokens in {generation_time:.2f}s "
                f"({tokens_generated/generation_time:.1f} tokens/s)"
            )
            
            return generated_text
            
    except Exception as e:
        logger.error(f"[{request_id}] Generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

# =============================================================================
# FASTAPI APP SETUP
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    # Startup
    logger.info("🚀 Starting vLLM OneSeek server...")
    await initialize_vllm_engine()
    yield
    # Shutdown
    logger.info("🛑 Shutting down vLLM OneSeek server...")
    await shutdown_vllm_engine()

# Create FastAPI app
app = FastAPI(
    title="OneSeek vLLM Inference Server",
    description="High-performance inference server for OneSeek using vLLM",
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

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    """Root endpoint with server info"""
    return {
        "server": "OneSeek vLLM Inference Server",
        "version": "1.0.0",
        "backend": "vLLM",
        "vllm_version": get_vllm_version(),
        "model": model_name,
        "status": "ready" if vllm_engine else "not initialized",
        "endpoints": {
            "inference": "/infer",
            "health": "/health",
            "stats": "/stats"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy" if vllm_engine else "unhealthy",
        "backend": "vllm",
        "model": model_name,
        "cuda_available": torch.cuda.is_available(),
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    }

@app.get("/stats")
async def stats():
    """Server statistics endpoint"""
    return {
        "total_requests": request_counter,
        "model": model_name,
        "backend": "vllm",
        "vllm_config": VLLM_CONFIG,
        "cuda_available": torch.cuda.is_available(),
        "gpu_memory_allocated": f"{torch.cuda.memory_allocated(0) / 1024**3:.2f} GB" if torch.cuda.is_available() else None,
        "gpu_memory_reserved": f"{torch.cuda.memory_reserved(0) / 1024**3:.2f} GB" if torch.cuda.is_available() else None,
    }

@app.post("/infer", response_model=InferenceResponse)
@limiter.limit("30/minute")
async def infer(request: Request, inference_request: InferenceRequest):
    """
    Main inference endpoint.
    Compatible with the original server.py API.
    """
    start_time = time.time()
    
    try:
        # Format prompt
        prompt = format_chat_prompt(
            user_text=inference_request.text,
            system_prompt=inference_request.system_prompt,
            history=inference_request.history
        )
        
        # Generate response
        raw_response = await generate_response(
            prompt=prompt,
            max_tokens=inference_request.max_length,
            temperature=inference_request.temperature,
            top_p=inference_request.top_p,
            top_k=inference_request.top_k,
            repetition_penalty=inference_request.repetition_penalty,
            stream=inference_request.stream
        )
        
        # Clean response
        clean_text = clean_response(raw_response)
        
        # Calculate metrics
        latency_ms = (time.time() - start_time) * 1000
        tokens = len(clean_text.split())  # Rough token count
        
        return InferenceResponse(
            response=clean_text,
            model=model_name,
            tokens=tokens,
            latency_ms=latency_ms,
            backend="vllm"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=str(exc)
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc)
        ).dict()
    )

# =============================================================================
# MAIN
# =============================================================================

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="OneSeek vLLM Inference Server")
    parser.add_argument("--host", type=str, default=DEFAULT_HOST, help="Host to bind to")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to bind to")
    parser.add_argument("--model", type=str, default=None, help="Path to model (overrides ONESEEK_MODEL_PATH)")
    parser.add_argument("--gpu-memory-utilization", type=float, default=0.90, help="GPU memory utilization (0.0-1.0)")
    parser.add_argument("--max-model-len", type=int, default=8192, help="Maximum model context length")
    parser.add_argument("--tensor-parallel-size", type=int, default=1, help="Number of GPUs for tensor parallelism")
    parser.add_argument("--max-num-seqs", type=int, default=256, help="Maximum batch size")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # Override config with command line args
    if args.model:
        os.environ["ONESEEK_MODEL_PATH"] = args.model
    
    VLLM_CONFIG["gpu_memory_utilization"] = args.gpu_memory_utilization
    VLLM_CONFIG["max_model_len"] = args.max_model_len
    VLLM_CONFIG["tensor_parallel_size"] = args.tensor_parallel_size
    VLLM_CONFIG["max_num_seqs"] = args.max_num_seqs
    
    # Check vLLM availability
    if not VLLM_AVAILABLE:
        print("❌ vLLM is not installed. Install with:")
        print("   pip install vllm>=0.6.0")
        sys.exit(1)
    
    # Print startup banner
    print("\n" + "=" * 80)
    print("🚀 ONESEEK vLLM INFERENCE SERVER")
    print("=" * 80)
    print(f"  Host: {args.host}:{args.port}")
    print(f"  vLLM Version: {get_vllm_version()}")
    print(f"  GPU Memory Utilization: {args.gpu_memory_utilization * 100}%")
    print(f"  Max Context Length: {args.max_model_len} tokens")
    print(f"  Tensor Parallel Size: {args.tensor_parallel_size}")
    print(f"  Max Batch Size: {args.max_num_seqs}")
    print("=" * 80 + "\n")
    
    # Start server
    import uvicorn
    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info"
    )
