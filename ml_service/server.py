"""
ML Inference Service for OQT-1.0
FastAPI server for Mistral 7B and LLaMA-2 inference
"""

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

# Initialize FastAPI
app = FastAPI(title="OQT-1.0 ML Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
MISTRAL_PATH = os.getenv('MISTRAL_MODEL_PATH', '../models/mistral-7b-instruct')
LLAMA_PATH = os.getenv('LLAMA_MODEL_PATH', '../models/llama-2-7b-chat')

# GPU configuration
USE_GPU = os.getenv('USE_GPU', 'true').lower() == 'true'
DEVICE = 'cuda' if USE_GPU and torch.cuda.is_available() else 'cpu'

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
    """Load model and tokenizer"""
    if model_name in models:
        return models[model_name], tokenizers[model_name]
    
    logger.info(f"Loading {model_name} from {model_path}...")
    
    try:
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Load model with optimizations
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if DEVICE == 'cuda' else torch.float32,
            device_map='auto' if DEVICE == 'cuda' else None,
            load_in_8bit=USE_GPU and os.getenv('USE_8BIT_QUANTIZATION', 'false').lower() == 'true'
        )
        
        if DEVICE == 'cpu':
            model = model.to(DEVICE)
        
        # Cache models
        models[model_name] = model
        tokenizers[model_name] = tokenizer
        
        logger.info(f"✓ {model_name} loaded successfully on {DEVICE}")
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading {model_name}: {str(e)}")
        raise

@app.on_event("startup")
async def startup_event():
    """Pre-load models on startup"""
    logger.info("Starting ML Service...")
    logger.info(f"Device: {DEVICE}")
    
    # Check if model directories exist
    if not Path(MISTRAL_PATH).exists():
        logger.warning(f"Mistral model not found at {MISTRAL_PATH}")
    
    if not Path(LLAMA_PATH).exists():
        logger.warning(f"LLaMA model not found at {LLAMA_PATH}")

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "OQT-1.0 ML Service",
        "version": "1.0.0",
        "status": "running",
        "device": DEVICE,
        "models_loaded": list(models.keys())
    }

@app.post("/inference/mistral", response_model=InferenceResponse)
async def mistral_inference(request: InferenceRequest):
    """Generate response using Mistral 7B"""
    import time
    start_time = time.time()
    
    try:
        # Load model if not cached
        model, tokenizer = load_model('mistral', MISTRAL_PATH)
        
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
            model="Mistral 7B",
            tokens=len(outputs[0]),
            latency_ms=latency_ms
        )
        
    except Exception as e:
        logger.error(f"Mistral inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inference/llama", response_model=InferenceResponse)
async def llama_inference(request: InferenceRequest):
    """Generate response using LLaMA-2 7B"""
    import time
    start_time = time.time()
    
    try:
        # Load model if not cached
        model, tokenizer = load_model('llama', LLAMA_PATH)
        
        # Prepare input with LLaMA chat format
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
            model="LLaMA-2 7B",
            tokens=len(outputs[0]),
            latency_ms=latency_ms
        )
        
    except Exception as e:
        logger.error(f"LLaMA inference error: {str(e)}")
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
