"""
ML Inference Service for OneSeek - DNA v2 Certified
FastAPI server for OneSeek model inference with DNA v2 certified model support
Supports rate limiting, dynamic model routing, and legacy model deprecation
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
import os
from pathlib import Path
import logging
import sys
import time
import argparse

# Parse command-line arguments
parser = argparse.ArgumentParser(description='OneSeek ML Inference Service')
parser.add_argument('--auto-devices', action='store_true', 
                    help='Enable automatic device mapping for multi-GPU/NPU offloading')
parser.add_argument('--directml', action='store_true',
                    help='Force DirectML acceleration (Windows AMD/Intel GPU)')
parser.add_argument('--use-direct', action='store_true',
                    help='Force direct device placement (fixes DirectML tensor issues)')
parser.add_argument('--load-in-4bit', action='store_true',
                    help='Load model in 4-bit quantization for memory efficiency')
parser.add_argument('--load-in-8bit', action='store_true',
                    help='Load model in 8-bit quantization')
parser.add_argument('--n-gpu-layers', type=int, default=40,
                    help='Number of layers to offload to GPU (default: 40, use 99 for all layers)')
parser.add_argument('--gpu-memory', type=float, default=16.0,
                    help='GPU memory allocation in GB (default: 16.0)')
parser.add_argument('--timeout-keep-alive', type=int, default=600,
                    help='Timeout keep-alive in seconds (default: 600)')
parser.add_argument('--listen', action='store_true',
                    help='Listen on all network interfaces (0.0.0.0) instead of localhost')
parser.add_argument('--api', action='store_true',
                    help='Enable API mode (currently always enabled, for compatibility)')
args, unknown = parser.parse_known_args()

# Setup logging with DEBUG support
# Use ONESEEK_DEBUG=1 environment variable for verbose debug output
DEBUG_MODE = os.getenv('ONESEEK_DEBUG', '0') == '1'
log_level = logging.DEBUG if DEBUG_MODE else logging.INFO
logging.basicConfig(
    level=log_level,
    format='[%(asctime)s.%(msecs)03d] %(levelname)s %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)
if DEBUG_MODE:
    logger.info("🔍 DEBUG MODE ENABLED - Verbose logging active")

# Configuration
# Rate limiting: Set high for development (1000/min), use lower in production via env var
RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '1000'))

# Model paths - use absolute paths relative to project root or MODELS_DIR env var
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

def get_models_base_dir():
    """
    Get the base models directory, respecting MODELS_DIR environment variable.
    This allows for flexible deployment and testing scenarios.
    
    Priority:
    1. MODELS_DIR environment variable (if set)
    2. PRODUCTION_MODELS_PATH environment variable (legacy support)
    3. PROJECT_ROOT/models (default)
    """
    models_dir = os.getenv('MODELS_DIR')
    if models_dir:
        models_path = Path(models_dir)
        if models_path.exists():
            logger.info(f"✓ Using MODELS_DIR: {models_path}")
            return models_path
        else:
            logger.warning(f"⚠ MODELS_DIR set but doesn't exist: {models_dir}")
            logger.warning("  Falling back to default location")
    
    # Legacy env var support
    prod_models = os.getenv('PRODUCTION_MODELS_PATH')
    if prod_models:
        prod_path = Path(prod_models)
        if prod_path.exists():
            logger.info(f"✓ Using PRODUCTION_MODELS_PATH: {prod_path}")
            return prod_path
    
    # Default to project root models directory
    default_path = PROJECT_ROOT / 'models'
    logger.info(f"Using default models directory: {default_path}")
    return default_path

def get_active_model_path():
    """
    Get the active OneSeek model path with DNA v2 certified model priority.
    
    Priority order for finding certified models (DNA v2):
    1. Environment variable ONESEEK_MODEL_PATH (for manual override)
    2. oneseek-certified/OneSeek-7B-Zero-CURRENT symlink (DNA v2 certified)
    3. Fallback to base models if certified model not found
    
    The certified symlink points to DNA-based directories like:
    models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
    """
    models_base = get_models_base_dir()
    
    # Check environment variable first (manual override)
    env_path = os.getenv('ONESEEK_MODEL_PATH')
    if env_path:
        env_path_obj = Path(env_path)
        if env_path_obj.exists():
            # Check if this is a valid model directory (has config.json or metadata.json)
            # or if it's just the models base directory
            if (env_path_obj / 'config.json').exists() or (env_path_obj / 'metadata.json').exists():
                logger.info(f"✓ Using OneSeek model from ONESEEK_MODEL_PATH: {env_path}")
                return str(env_path_obj.resolve())
            elif env_path_obj.name == 'models':
                # User set the entire models directory - we'll search for certified models
                logger.warning(f"⚠ ONESEEK_MODEL_PATH points to models directory, will search for certified model")
                models_base = env_path_obj
            else:
                logger.warning(f"⚠ ONESEEK_MODEL_PATH path exists but is not a valid model directory: {env_path}")
                logger.warning("  Expected config.json or metadata.json in the directory")
        else:
            logger.error(f"✗ ONESEEK_MODEL_PATH set but path doesn't exist: {env_path}")
            sys.exit(1)
    
    # Check for DNA v2 certified model (PRIORITY)
    certified_current = models_base / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT'
    if certified_current.exists() or certified_current.is_symlink():
        try:
            resolved_path = certified_current.resolve()
            if resolved_path.exists():
                logger.info(f"✓ Using DNA v2 CERTIFIED model: {certified_current}")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve certified symlink: {e}")
    
    # Check for marker file (Windows fallback when symlinks require admin)
    certified_marker = models_base / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT.txt'
    if certified_marker.exists():
        try:
            with open(certified_marker, 'r', encoding='utf-8') as f:
                target_path = f.read().strip()
            target_path_obj = Path(target_path)
            if target_path_obj.exists():
                logger.info(f"✓ Using DNA v2 CERTIFIED model (marker): {certified_marker}")
                logger.info(f"  → Points to: {target_path}")
                return str(target_path_obj.resolve())
        except Exception as e:
            logger.error(f"✗ Error reading certified marker file: {e}")
    
    # Auto-discover latest certified model (fallback when no symlink/marker exists)
    certified_dir = models_base / 'oneseek-certified'
    if certified_dir.exists():
        try:
            # Find all certified model directories (format: OneSeek-7B-Zero.v*.*)
            certified_models = []
            for item in certified_dir.iterdir():
                if item.is_dir() and item.name.startswith('OneSeek-7B-Zero.v'):
                    # Check if it has metadata.json (valid trained model)
                    if (item / 'metadata.json').exists():
                        certified_models.append(item)
            
            if certified_models:
                # Use max() for efficiency - only need the latest model
                latest_model = max(certified_models, key=lambda p: p.stat().st_mtime)
                logger.info(f"✓ Auto-discovered latest certified model: {latest_model.name}")
                logger.info(f"  → Found {len(certified_models)} certified model(s)")
                return str(latest_model.resolve())
        except (PermissionError, OSError) as e:
            logger.warning(f"⚠ Could not scan certified models directory: {e}")
    
    # Fallback to legacy oneseek-7b-zero if certified not found
    legacy_current = models_base / 'oneseek-7b-zero' / 'OneSeek-7B-Zero-CURRENT'
    if legacy_current.exists() or legacy_current.is_symlink():
        try:
            resolved_path = legacy_current.resolve()
            if resolved_path.exists():
                logger.warning("⚠ Using LEGACY model (oneseek-7b-zero)")
                logger.warning("  → Consider migrating to DNA v2 certified models")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve legacy symlink: {e}")
    
    # NO MODEL FOUND - Fail clearly with helpful error message
    logger.error("")
    logger.error("=" * 80)
    logger.error("✗ ACTIVE MODEL NOT FOUND")
    logger.error("=" * 80)
    logger.error("")
    logger.error("No active model found. You must set a DNA v2 certified model as active.")
    logger.error("")
    logger.error("How to fix:")
    logger.error("  1. Go to Admin Dashboard → Models tab")
    logger.error("  2. Click 'Set as Active' on a DNA v2 certified model")
    logger.error("  3. Restart this service")
    logger.error("")
    logger.error("Checked locations:")
    logger.error(f"  - Environment variable ONESEEK_MODEL_PATH: {env_path or 'Not set'}")
    logger.error(f"  - DNA v2 certified symlink: {certified_current} (Not found)")
    logger.error(f"  - Auto-discovery in: {certified_dir} (No certified models found)")
    logger.error(f"  - Legacy model symlink: {legacy_current} (Not found)")
    logger.error("")
    logger.error("For DNA v2 migration guide, see: ONESEEK_7B_ZERO_MIGRATION_GUIDE.md")
    logger.error("=" * 80)
    logger.error("")
    sys.exit(1)

# Get model path (REQUIRED - will exit if not found)
ONESEEK_PATH = get_active_model_path()

# GPU configuration - Support for NVIDIA, Intel, DirectML (AMD/Intel on Windows), and CPU
def get_device():
    """Automatically detect best available device with enhanced DirectML support"""
    
    # Force DirectML if requested
    if args.directml:
        try:
            import torch_directml
            if torch_directml.is_available():
                device = torch_directml.device()
                logger.info("=" * 80)
                logger.info("Device: directml:0")
                logger.info("Device Type: AMD Radeon 890M + XDNA 2 NPU")
                logger.info(f"GPU Memory Allocated: {args.gpu_memory} GB (from system RAM)")
                logger.info("Using DirectML acceleration – Ryzen AI Max 390 OPTIMIZED")
                logger.info("=" * 80)
                return device, 'directml'
            else:
                logger.warning("DirectML requested but not available")
        except ImportError:
            logger.error("DirectML requested but torch-directml not installed")
            logger.error("Install with: pip install torch-directml")
            sys.exit(1)
    
    # Try DirectML (Windows Intel/AMD GPU) - auto-detection
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
    
    # Try NVIDIA GPU with proper initialization for multi-GPU support
    if torch.cuda.is_available():
        # Initialize CUDA to ensure all devices are accessible
        # This may raise RuntimeError if CUDA drivers are not properly installed,
        # or if initialization was already done - both cases are non-fatal
        try:
            torch.cuda.init()
        except RuntimeError:
            # CUDA already initialized or initialization not needed
            pass
        
        device_count = torch.cuda.device_count()
        logger.info(f"NVIDIA GPU detected: {torch.cuda.get_device_name(0)}")
        if device_count > 1:
            logger.info(f"Multi-GPU system: {device_count} CUDA devices available")
            for i in range(device_count):
                try:
                    name = torch.cuda.get_device_name(i)
                    props = torch.cuda.get_device_properties(i)
                    memory_gb = props.total_memory / (1024**3)
                    logger.info(f"  cuda:{i} - {name} ({memory_gb:.1f} GB)")
                except Exception as e:
                    logger.warning(f"  cuda:{i} - Error getting info: {e}")
        return torch.device('cuda'), 'cuda'
    
    # Fallback to CPU
    logger.info("Using CPU (slow - consider GPU for better performance)")
    return torch.device('cpu'), 'cpu'

DEVICE, DEVICE_TYPE = get_device()

def ensure_device_compatibility(inputs, model=None):
    """
    Ensure tokenizer inputs are on the correct device for DirectML.
    
    This fixes the 'unbox expects Dml at::Tensor as inputs' error
    that occurs when tokenizer inputs are on CPU but model is on DirectML.
    
    Args:
        inputs: TokenizerOutput or dict with tensors
        model: Optional model to get device from
    
    Returns:
        inputs moved to the correct device
    """
    try:
        # Determine target device
        target_device = None
        
        # If --use-direct flag is set, force direct device placement
        if args.use_direct or args.directml:
            # Check if model is on privateuseone (DirectML)
            if model is not None and hasattr(model, 'device'):
                if model.device.type == 'privateuseone':
                    target_device = model.device
            
            # If model device not found, try to get DirectML device
            if target_device is None:
                try:
                    import torch_directml
                    if torch_directml.is_available():
                        target_device = torch_directml.device()
                except ImportError:
                    pass
        
        # Fallback: Check model device type
        if target_device is None and model is not None and hasattr(model, 'device'):
            if model.device.type == 'privateuseone':  # DirectML device type
                target_device = model.device
        
        # Check if we're using DirectML (auto-detection)
        if target_device is None and DEVICE_TYPE == 'directml':
            try:
                import torch_directml
                if torch_directml.is_available():
                    target_device = torch_directml.device()
            except ImportError:
                pass
        
        # If no special handling needed, use default DEVICE
        if target_device is None:
            target_device = DEVICE
        
        # Move inputs to target device
        if hasattr(inputs, 'to'):
            # Handle BatchEncoding/TokenizerOutput
            return inputs.to(target_device)
        elif isinstance(inputs, dict):
            # Handle dict of tensors
            return {k: v.to(target_device) if hasattr(v, 'to') else v for k, v in inputs.items()}
        
        return inputs
    except Exception as e:
        logger.warning(f"Device compatibility fix failed: {e}, using default DEVICE")
        if hasattr(inputs, 'to'):
            return inputs.to(DEVICE)
        return inputs

def get_directml_target_device():
    """
    Get the correct target device for DirectML.
    Uses DEVICE if it's already directml, otherwise tries to get torch_directml.device().
    This is needed because device_map="auto" may report model.device as cpu.
    """
    if DEVICE_TYPE == 'directml':
        try:
            import torch_directml
            if torch_directml.is_available():
                return torch_directml.device()
        except ImportError:
            pass
    return DEVICE

def sync_inputs_to_model_device(inputs, model):
    """
    Sync tokenizer inputs to the SAME device as the model.
    This fixes the 'unbox expects Dml at::Tensor' and device mismatch errors.
    
    Args:
        inputs: TokenizerOutput or dict with tensors
        model: The model to sync inputs to
    
    Returns:
        inputs moved to the model's device
    """
    # Get model's actual device
    try:
        if hasattr(model, 'device'):
            target_device = model.device
            logger.debug(f"→ Model.device: {target_device}")
        elif hasattr(model, 'parameters'):
            # For models with device_map="auto", get device of first parameter
            target_device = next(model.parameters()).device
            logger.debug(f"→ Model parameters device: {target_device}")
        else:
            # Fallback to CPU
            target_device = torch.device('cpu')
            logger.debug(f"→ Fallback to CPU device")
    except Exception as e:
        logger.debug(f"→ Device detection error: {e}, using CPU")
        target_device = torch.device('cpu')
    
    # Get current device
    if hasattr(inputs, 'input_ids'):
        current_device = inputs.input_ids.device
        input_shape = inputs.input_ids.shape
    elif isinstance(inputs, dict) and 'input_ids' in inputs:
        current_device = inputs['input_ids'].device
        input_shape = inputs['input_ids'].shape
    else:
        logger.debug("→ No input_ids found in inputs")
        return inputs
    
    logger.debug(f"→ Input tensor shape: {input_shape}")
    logger.debug(f"→ Current input device: {current_device}")
    logger.debug(f"→ Target model device: {target_device}")
    
    # Sync if devices don't match
    if current_device.type != target_device.type:
        logger.info(f"[FIX] Synkade inputs från {current_device} till {target_device}")
        if isinstance(inputs, dict):
            inputs = {k: v.to(target_device) if hasattr(v, 'to') else v for k, v in inputs.items()}
        elif hasattr(inputs, 'to'):
            inputs = inputs.to(target_device)
        
        # Verify sync
        if isinstance(inputs, dict) and 'input_ids' in inputs:
            logger.debug(f"→ After sync: input_ids device = {inputs['input_ids'].device}")
        elif hasattr(inputs, 'input_ids'):
            logger.debug(f"→ After sync: input_ids device = {inputs.input_ids.device}")
    else:
        logger.debug(f"→ Devices match, no sync needed")
    
    return inputs

# Model cache
models = {}
tokenizers = {}

# Single-model configuration for OneSeek-7B-Zero
# Set to False to use only the active certified model (recommended)
# Set to True only if you want legacy dual-model inference (requires Mistral + LLaMA installed)
DUAL_MODEL_MODE = False  # Use only the single certified OneSeek-7B-Zero model

def read_model_metadata():
    """Read the latest model metadata to determine which base model was trained
    
    Returns dict with metadata including baseModels list, or None if not found
    """
    import json
    base_path = Path(ONESEEK_PATH)
    
    # Check if we're in a DNA-based certified directory
    # Format: OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1
    if 'OneSeek-7B-Zero.v' in base_path.name:
        # We're in a certified directory - check for metadata.json
        metadata_file = base_path / 'metadata.json'
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                logger.info(f"Found certified model metadata: {metadata_file}")
                # Check if baseModel exists (singular) and convert to list
                # Only convert if baseModels is missing or empty
                if 'baseModel' in metadata and not metadata.get('baseModels'):
                    metadata['baseModels'] = [metadata['baseModel']]
                return metadata
            except Exception as e:
                logger.warning(f"Could not read certified metadata from {metadata_file}: {e}")
    
    # Legacy fallback: check weights directory for old structure
    weights_dir = base_path / 'weights'
    
    if not weights_dir.exists():
        return None
    
    # Find all metadata files - prioritize ..json format (admin panel format)
    json_files_double_dot = list(weights_dir.glob('oneseek-7b-zero-v*..json'))
    json_files_single_dot = list(weights_dir.glob('oneseek-7b-zero-v*.json'))
    
    # Filter out ..json from single dot list to avoid duplicates
    json_files_single_dot = [f for f in json_files_single_dot if not str(f).endswith('..json')]
    
    # Prioritize double-dot files (admin panel format)
    all_json_files = json_files_double_dot + json_files_single_dot
    
    # Try to find the one marked as current first
    for json_file in sorted(all_json_files, reverse=True):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            if metadata.get('isCurrent', False):
                logger.info(f"Found current model metadata: {json_file}")
                return metadata
        except Exception as e:
            logger.debug(f"Could not read metadata from {json_file}: {e}")
    
    # Fallback to latest metadata file
    if all_json_files:
        try:
            latest_json = sorted(all_json_files, reverse=True)[0]
            with open(latest_json, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            logger.info(f"Using latest model metadata: {latest_json}")
            return metadata
        except Exception as e:
            logger.warning(f"Could not read latest metadata: {e}")
    
    return None


def normalize_model_name_for_lookup(name: str) -> str:
    """Normalize model name for directory lookup (same logic as pytorch_trainer.py)"""
    return name.lower().replace('.', '-').replace('_', '-')


def find_base_model_from_metadata():
    """Find the base model that was actually trained based on metadata
    
    Returns path to the base model, or None if not found
    """
    # Read metadata to find which base model was actually trained
    metadata = read_model_metadata()
    if not metadata:
        logger.warning("No model metadata found - falling back to legacy search")
        return None
    
    # Check for base models in two possible locations:
    # 1. metadata.baseModels (training code format)
    # 2. metadata.dna.baseModels (admin panel format)
    base_models = metadata.get('baseModels')
    if not base_models and 'dna' in metadata:
        base_models = metadata.get('dna', {}).get('baseModels')
    
    if not base_models:
        logger.warning("Metadata doesn't specify base models - falling back to legacy search")
        logger.debug(f"Metadata keys: {list(metadata.keys())}")
        if 'dna' in metadata:
            logger.debug(f"DNA keys: {list(metadata.get('dna', {}).keys())}")
        return None
    
    # Use the first base model from the list (or only model if single-model training)
    target_model = base_models[0]
    logger.info(f"Metadata indicates trained with base model: {target_model}")
    
    # Normalize the model name for directory matching
    normalized_target = normalize_model_name_for_lookup(target_model)
    
    base_path = Path(ONESEEK_PATH)
    
    # Search in base_models directory first
    base_models_dir = base_path / 'base_models'
    if base_models_dir.exists():
        for item in base_models_dir.iterdir():
            if item.is_dir():
                normalized_dir = normalize_model_name_for_lookup(item.name)
                # Try exact match or substring match
                if normalized_target == normalized_dir or normalized_target in normalized_dir or normalized_dir in normalized_target:
                    if (item / 'config.json').exists():
                        logger.info(f"Found base model in base_models: {item}")
                        return str(item)
    
    # Search in root models directory
    root_models = PROJECT_ROOT / 'models'
    if root_models.exists():
        for item in root_models.iterdir():
            if item.is_dir() and item.name not in ['oneseek-7b-zero', 'oneseek-certified', 'backups']:
                normalized_dir = normalize_model_name_for_lookup(item.name)
                # Try exact match or substring match
                if normalized_target == normalized_dir or normalized_target in normalized_dir or normalized_dir in normalized_target:
                    if (item / 'config.json').exists():
                        logger.info(f"Found base model in root models: {item}")
                        return str(item)
    
    logger.warning(f"Could not find base model directory for: {target_model}")
    return None


def find_all_base_models():
    """Find all available base models for dual-model OneSeek-7B-Zero
    
    Returns dict with 'mistral' and 'llama' paths, or None if not found
    """
    base_path = Path(ONESEEK_PATH)
    
    # Check if OneSeek directory itself has a config.json (complete model)
    if (base_path / 'config.json').exists():
        logger.info(f"Found complete OneSeek model at {base_path}")
        return {'oneseek_complete': str(base_path)}
    
    models_found = {}
    
    # Check for base models in oneseek directory
    mistral_base = base_path / 'base_models' / 'mistral-7b'
    llama_base = base_path / 'base_models' / 'llama-2-7b'
    
    # Legacy paths (where user actually has the models)
    legacy_mistral = PROJECT_ROOT / 'models' / 'mistral-7b-instruct'
    legacy_llama = PROJECT_ROOT / 'models' / 'llama-2-7b-chat'
    
    # Check for Mistral
    for name, path in [
        ('Mistral-7B (base_models)', mistral_base),
        ('Mistral-7B (legacy)', legacy_mistral)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found Mistral base model: {name} at {path}")
            models_found['mistral'] = str(path)
            break
    
    # Check for LLaMA
    for name, path in [
        ('LLaMA-2-7B (base_models)', llama_base),
        ('LLaMA-2-7B (legacy)', legacy_llama)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found LLaMA base model: {name} at {path}")
            models_found['llama'] = str(path)
            break
    
    return models_found if models_found else None

class InferenceRequest(BaseModel):
    """Request model for inference with input validation"""
    text: str = Field(..., min_length=1, max_length=10000, description="Input text for inference")
    max_length: int = Field(default=512, ge=1, le=2048, description="Maximum generation length")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Nucleus sampling parameter")
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate and sanitize input text"""
        if not v or not v.strip():
            raise ValueError("Input text cannot be empty")
        # Basic sanitization - remove null bytes
        v = v.replace('\x00', '')
        return v.strip()

class InferenceResponse(BaseModel):
    """Response model for inference results"""
    response: str
    model: str
    tokens: int
    latency_ms: float
    
class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    migration_guide: str = None

def find_base_model_path():
    """Find a valid base model path for OneSeek-7B-Zero
    
    Checks in this order:
    1. Model specified in metadata (actual trained model)
    2. oneseek-7b-zero directory itself (if it has config.json - fully trained model)
    3. Legacy fallback to Mistral/LLaMA discovery
    """
    # FIRST: Check metadata to see which base model was actually trained
    metadata_base_model = find_base_model_from_metadata()
    if metadata_base_model:
        return metadata_base_model
    
    # SECOND: Check if OneSeek directory itself has a config.json (complete model)
    base_path = Path(ONESEEK_PATH)
    if (base_path / 'config.json').exists():
        logger.info(f"Found complete OneSeek model at {base_path}")
        return str(base_path)
    
    # THIRD: Legacy fallback - check for base models in oneseek directory
    mistral_base = base_path / 'base_models' / 'mistral-7b'
    llama_base = base_path / 'base_models' / 'llama-2-7b'
    
    # Legacy paths (where user actually has the models)
    legacy_mistral = PROJECT_ROOT / 'models' / 'mistral-7b-instruct'
    legacy_llama = PROJECT_ROOT / 'models' / 'llama-2-7b-chat'
    
    # KB-Llama Swedish model paths (commonly used base model)
    kb_llama_path = PROJECT_ROOT / 'models' / 'KB-Llama-3.1-8B-Swedish'
    kb_llama_alt = PROJECT_ROOT / 'models' / 'kb-llama-3-1-8b-swedish'
    
    # Check each path for config.json - prioritize KB-Llama since it's commonly used
    for name, path in [
        ('KB-Llama-3.1-8B-Swedish', kb_llama_path),
        ('KB-Llama-3.1-8B-Swedish (lowercase)', kb_llama_alt),
        ('Mistral-7B (base_models)', mistral_base),
        ('LLaMA-2-7B (base_models)', llama_base),
        ('Mistral-7B (legacy)', legacy_mistral),
        ('LLaMA-2-7B (legacy)', legacy_llama)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found base model: {name} at {path}")
            return str(path)
    
    # Also search for any model with config.json in the models directory
    models_dir = PROJECT_ROOT / 'models'
    if models_dir.exists():
        logger.info("Searching for any base model in models directory...")
        for item in models_dir.iterdir():
            if item.is_dir() and item.name not in ['oneseek-7b-zero', 'oneseek-certified', 'backups']:
                if (item / 'config.json').exists():
                    logger.info(f"Found base model by search: {item.name} at {item}")
                    return str(item)
    
    return None

def find_lora_weights(adapter_suffix=''):
    """Find the latest LoRA adapter weights for OneSeek-7B-Zero
    
    Args:
        adapter_suffix: Optional suffix like 'mistral' or 'llama' for model-specific adapters
    
    Works with both certified and legacy structures:
    - Certified: Model files in DNA-based directory (e.g., OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/)
    - Legacy: Model files in oneseek-7b-zero/weights/ and oneseek-7b-zero/lora_adapters/
    
    Returns path to LoRA weights file or directory, or None if not found
    """
    import json
    base_path = Path(ONESEEK_PATH)
    
    # Check if we're in a certified directory
    if 'OneSeek-7B-Zero.v' in base_path.name:
        # Look for LoRA adapters in certified directory
        logger.info(f"Searching for LoRA adapters in certified directory: {base_path}")
        
        # FIRST: Check metadata.json for adapter paths (most reliable)
        metadata_file = base_path / 'metadata.json'
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                adapters = metadata.get('adapters', [])
                if adapters:
                    # Use the latest adapter (last in list)
                    latest_adapter_path = adapters[-1]
                    # Adapters are stored relative to the certified model directory
                    full_adapter_path = base_path / latest_adapter_path
                    if full_adapter_path.exists() and (full_adapter_path / 'adapter_config.json').exists():
                        logger.info(f"Found LoRA adapter from metadata: {full_adapter_path}")
                        return str(full_adapter_path)
                    else:
                        logger.warning(f"Adapter path from metadata not found: {full_adapter_path}")
            except Exception as e:
                logger.warning(f"Could not read adapters from metadata: {e}")
        
        # FALLBACK: Look for adapter directories matching pattern
        for item in base_path.iterdir():
            if item.is_dir() and '-adapter' in item.name:
                # Check for PEFT format
                if (item / 'adapter_config.json').exists():
                    logger.info(f"Found PEFT LoRA adapter in certified directory: {item}")
                    return str(item)
        
        # Check lora_adapters subdirectory
        lora_adapters_dir = base_path / 'lora_adapters'
        if lora_adapters_dir.exists():
            # Find all adapter directories
            adapter_dirs = [d for d in lora_adapters_dir.iterdir() if d.is_dir() and (d / 'adapter_config.json').exists()]
            if adapter_dirs:
                # Sort by modification time (newest first) and use the latest
                latest_adapter = max(adapter_dirs, key=lambda p: p.stat().st_mtime)
                logger.info(f"Found PEFT LoRA adapter in lora_adapters: {latest_adapter}")
                return str(latest_adapter)
        
        # Look for .pth weight files
        pth_files = list(base_path.glob('*.pth'))
        if pth_files:
            # Sort by modification time, use latest
            latest_pth = max(pth_files, key=lambda p: p.stat().st_mtime)
            logger.info(f"Found weight file in certified directory: {latest_pth}")
            return str(latest_pth)
        
        logger.info(f"No LoRA adapters found in certified directory - using base model")
        return None
    
    # Legacy structure: check weights directory
    # Read metadata to find model-specific weights
    metadata = read_model_metadata()
    if metadata:
        # Check for modelSpecificWeights in metadata
        model_specific_weights = metadata.get('modelSpecificWeights', {})
        if model_specific_weights:
            # Get the base models list to determine which weight file to use
            base_models = metadata.get('baseModels', [])
            if base_models:
                # Use the first base model (or only model in single-model training)
                target_model = base_models[0]
                normalized_model = normalize_model_name_for_lookup(target_model)
                
                # Look for matching key in modelSpecificWeights
                for key, weight_file in model_specific_weights.items():
                    if normalized_model in key or key in normalized_model:
                        weight_path = base_path / 'weights' / weight_file
                        if weight_path.exists():
                            logger.info(f"Found model-specific LoRA weights from metadata: {weight_path}")
                            return str(weight_path)
    
    # Check for model-specific LoRA adapter directory (PEFT format)
    if adapter_suffix:
        lora_dir = base_path / 'lora_adapters'
        
        # Check for adapter directory with the suffix
        adapter_dir = lora_dir / f'{adapter_suffix}-adapter'
        if adapter_dir.exists():
            # PEFT format - return directory path
            if (adapter_dir / 'adapter_config.json').exists():
                logger.info(f"Found PEFT LoRA adapter directory: {adapter_dir}")
                return str(adapter_dir)
            # Legacy format - check for adapter.pth
            elif (adapter_dir / 'adapter.pth').exists():
                logger.info(f"Found legacy LoRA adapter: {adapter_dir / 'adapter.pth'}")
                return str(adapter_dir / 'adapter.pth')
    
    # Check weights directory for .pth files (legacy fallback)
    weights_dir = base_path / 'weights'
    if weights_dir.exists():
        # Find all version files
        weight_files = list(weights_dir.glob('oneseek-7b-zero-v*.pth'))
        if weight_files:
            # Sort by version number and get the latest
            latest_weight = sorted(weight_files, reverse=True)[0]
            logger.info(f"Found LoRA weights (latest): {latest_weight}")
            return str(latest_weight)
    
    # Check lora_adapters directory for versioned adapters
    lora_dir = base_path / 'lora_adapters'
    if lora_dir.exists():
        adapter_dirs = list(lora_dir.glob('oneseek-7b-zero-v*'))
        for adapter_dir in sorted(adapter_dirs, reverse=True):
            # Check for PEFT format
            if (adapter_dir / 'adapter_config.json').exists():
                logger.info(f"Found PEFT LoRA adapter directory: {adapter_dir}")
                return str(adapter_dir)
            # Check for legacy format
            adapter_file = adapter_dir / 'adapter.pth'
            if adapter_file.exists():
                logger.info(f"Found legacy LoRA adapter: {adapter_file}")
                return str(adapter_file)
    
    return None

def load_model(model_name: str, model_path: str):
    """Load model and tokenizer with device optimization, applying LoRA adapters if available"""
    logger.debug(f"→ load_model called: model_name={model_name}")
    logger.debug(f"→ model_path parameter: {model_path}")
    
    if model_name in models:
        logger.debug(f"→ Model {model_name} already cached, returning from cache")
        return models[model_name], tokenizers[model_name]
    
    # For OneSeek models, find the actual base model path
    if model_name.startswith('oneseek'):
        if model_name == 'oneseek-mistral':
            # Load Mistral base model
            available_models = find_all_base_models()
            if available_models and 'mistral' in available_models:
                model_path = available_models['mistral']
                logger.info(f"Loading Mistral-7B for OneSeek dual-model...")
            else:
                raise FileNotFoundError("Mistral-7B not found for dual-model mode")
                
        elif model_name == 'oneseek-llama':
            # Load LLaMA base model
            available_models = find_all_base_models()
            if available_models and 'llama' in available_models:
                model_path = available_models['llama']
                logger.info(f"Loading LLaMA-2 for OneSeek dual-model...")
            else:
                raise FileNotFoundError("LLaMA-2 not found for dual-model mode")
                
        elif model_name == 'oneseek-7b-zero':
            # Single-model mode
            actual_path = find_base_model_path()
            if not actual_path:
                error_msg = (
                    "No base model found for OneSeek-7B-Zero. Please ensure one of these models exists:\n"
                    f"  1. KB-Llama-3.1-8B-Swedish at {PROJECT_ROOT / 'models' / 'KB-Llama-3.1-8B-Swedish'}\n"
                    f"  2. Mistral-7B at {PROJECT_ROOT / 'models' / 'mistral-7b-instruct'}\n"
                    f"  3. LLaMA-2-7B at {PROJECT_ROOT / 'models' / 'llama-2-7b-chat'}\n"
                    "  Or download a model with: huggingface-cli download <model-id> --local-dir <path>"
                )
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            model_path = actual_path
            logger.info(f"Loading OneSeek-7B-Zero using base model from {model_path}...")
    else:
        logger.info(f"Loading {model_name} from {model_path}...")
    
    # Determine dtype based on device and flags
    # Use bfloat16 for DirectML/GPU (better performance on AMD Ryzen AI)
    # Use float16 for CUDA/XPU
    # Use float32 for CPU
    if args.auto_devices and DEVICE_TYPE == 'directml':
        dtype = torch.float16
        logger.info("Using torch.bfloat16 for optimal Ryzen AI Max 390 performance")
    elif DEVICE_TYPE in ['cuda', 'xpu', 'directml']:
        dtype = torch.float16
    else:
        dtype = torch.float32
    
    # Prepare model loading kwargs
    model_kwargs = {
        'torch_dtype': dtype,
        'low_cpu_mem_usage': True,
        'trust_remote_code': True,
    }
    
    # Add device_map and offloading if auto-devices is enabled
    if args.auto_devices:
        model_kwargs['device_map'] = 'auto'
        model_kwargs['offload_folder'] = 'offload'
        model_kwargs['offload_state_dict'] = True
        logger.info("Using device_map='auto' for GPU/NPU offloading")
    
    # Add quantization if requested
    if args.load_in_4bit:
        try:
            from transformers import BitsAndBytesConfig
            model_kwargs['quantization_config'] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=dtype,
                bnb_4bit_use_double_quant=True,
            )
            logger.info("Loading model in 4-bit quantization")
        except ImportError:
            logger.warning("bitsandbytes not installed - ignoring 4-bit quantization")
    elif args.load_in_8bit:
        model_kwargs['load_in_8bit'] = True
        logger.info("Loading model in 8-bit quantization")
    
    try:
        # Load tokenizer with trust_remote_code for custom model support
        # Try multiple loading strategies to handle different model formats
        logger.info(f"Loading tokenizer from: {model_path}")
        tokenizer = None
        tokenizer_errors = []
        
        # Strategy 1: Try with trust_remote_code and use_fast=False (most compatible)
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                model_path, 
                trust_remote_code=True,
                use_fast=False,
                local_files_only=True
            )
            logger.info("✓ Tokenizer loaded with use_fast=False")
        except Exception as e1:
            tokenizer_errors.append(f"use_fast=False: {e1}")
            
            # Strategy 2: Try with trust_remote_code and use_fast=True
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    model_path, 
                    trust_remote_code=True,
                    use_fast=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with use_fast=True")
            except Exception as e2:
                tokenizer_errors.append(f"use_fast=True: {e2}")
                
                # Strategy 3: Try LlamaTokenizer directly for LLaMA-based models
                try:
                    from transformers import LlamaTokenizer
                    tokenizer = LlamaTokenizer.from_pretrained(
                        model_path,
                        trust_remote_code=True,
                        local_files_only=True
                    )
                    logger.info("✓ Tokenizer loaded with LlamaTokenizer")
                except Exception as e3:
                    tokenizer_errors.append(f"LlamaTokenizer: {e3}")
                    
                    # Strategy 4: Try LlamaTokenizerFast
                    try:
                        from transformers import LlamaTokenizerFast
                        tokenizer = LlamaTokenizerFast.from_pretrained(
                            model_path,
                            trust_remote_code=True,
                            local_files_only=True
                        )
                        logger.info("✓ Tokenizer loaded with LlamaTokenizerFast")
                    except Exception as e4:
                        tokenizer_errors.append(f"LlamaTokenizerFast: {e4}")
        
        if tokenizer is None:
            logger.error("Failed to load tokenizer with all strategies:")
            for err in tokenizer_errors:
                logger.error(f"  - {err}")
            raise RuntimeError(f"Could not load tokenizer from {model_path}. Tried 4 strategies, all failed.")
        
        start_time = time.time()
        
        # Load model with optimizations
        logger.info(f"Loading OneSeek-7B-Zero with chained LoRA adapters...")
        logger.info("Loading checkpoint shards...")
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            **model_kwargs
        )
        
        load_time = time.time() - start_time
        
        # Move model to device if not using device_map
        if not args.auto_devices:
            model = model.to(DEVICE)
        
        # For OneSeek, try to load and apply LoRA adapters
        if model_name.startswith('oneseek'):
            # Determine which LoRA adapter to use
            adapter_suffix = ''
            if model_name == 'oneseek-mistral':
                adapter_suffix = 'mistral'
            elif model_name == 'oneseek-llama':
                adapter_suffix = 'llama'
            
            lora_weights = find_lora_weights(adapter_suffix)
            if lora_weights:
                lora_path = Path(lora_weights)
                
                # Check if it's a directory (PEFT format) or file (state_dict format)
                if lora_path.is_dir():
                    # PEFT format directory
                    try:
                        from peft import PeftModel
                        logger.info(f"Applying LoRA adapter: {lora_path.name}")
                        if (lora_path / 'adapter_config.json').exists():
                            # Apply adapter with same dtype
                            adapter_kwargs = {}
                            if args.auto_devices:
                                adapter_kwargs['device_map'] = 'auto'
                                adapter_kwargs['torch_dtype'] = dtype
                            model = PeftModel.from_pretrained(model, str(lora_path), **adapter_kwargs)
                            logger.info("✓ LoRA adapters applied successfully (PEFT format)")
                        else:
                            logger.warning("⚠ LoRA directory found but missing adapter_config.json")
                            logger.info("  Using base model without adapters")
                    except ImportError:
                        logger.warning("⚠ PEFT not installed - cannot apply LoRA adapters")
                        logger.info("  Install with: pip install peft")
                    except Exception as e:
                        logger.warning(f"⚠ Could not apply LoRA adapters: {e}")
                        logger.info("  Using base model without adapters")
                
                elif lora_path.is_file() and lora_path.suffix == '.pth':
                    # State dict format (.pth file)
                    try:
                        from peft import PeftModel, LoraConfig, get_peft_model
                        logger.info(f"Loading LoRA weights from {lora_weights}...")
                        
                        # Check if adapter_config.json exists in the same directory
                        adapter_dir = lora_path.parent.parent / 'lora_adapters'
                        
                        # Try to find matching PEFT adapter directory
                        peft_adapter_found = False
                        if adapter_dir.exists():
                            # Look for adapter directory that matches the model
                            for item in adapter_dir.iterdir():
                                if item.is_dir() and (item / 'adapter_config.json').exists():
                                    # Check if this adapter is for the same base model
                                    try:
                                        model = PeftModel.from_pretrained(model, str(item))
                                        logger.info(f"✓ LoRA adapters applied successfully from {item} (PEFT format)")
                                        peft_adapter_found = True
                                        break
                                    except:
                                        continue
                        
                        if not peft_adapter_found:
                            logger.warning("⚠ LoRA weights file found but PEFT adapter directory not available")
                            logger.info("  The .pth file contains full model state dict, not LoRA adapters")
                            logger.info("  Using base model without LoRA fine-tuning")
                            logger.info("  To get LoRA adapters: they are saved in lora_adapters/<model>-adapter/ directory")
                            
                    except ImportError:
                        logger.warning("⚠ PEFT not installed - cannot apply LoRA adapters")
                        logger.info("  Install with: pip install peft")
                    except Exception as e:
                        logger.warning(f"⚠ Could not apply LoRA: {e}")
                        logger.info("  Using base model")
            else:
                logger.info(f"ℹ No LoRA adapters found for {model_name} - using base model")
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
            # === IMPORTANT: Do NOT use .to(device) after PEFT adapters are loaded! ===
            # Using .to(device) after PeftModel.from_pretrained() breaks the PEFT internal
            # connections and destroys the adapter's effect. The model will "forget" its
            # fine-tuned personality and behave like the base model.
            # 
            # Instead, we rely on device_map="auto" to handle device placement during loading.
            # This is the ONLY way that works with PEFT + DirectML (Nov 2025).
            try:
                import torch_directml
                
                # Just verify device placement - DO NOT call .to() on PEFT models!
                cpu_tensors = 0
                gpu_tensors = 0
                try:
                    for name, param in model.named_parameters():
                        if param.device.type == 'cpu':
                            cpu_tensors += 1
                            if DEBUG_MODE and cpu_tensors <= 3:
                                logger.debug(f"→ Tensor on CPU: {name}")
                        else:
                            gpu_tensors += 1
                    
                    if gpu_tensors > 0 and cpu_tensors == 0:
                        logger.info(f"✓ ALL {gpu_tensors} tensors on DirectML GPU!")
                    elif gpu_tensors > cpu_tensors:
                        logger.info(f"✓ {gpu_tensors} tensors on GPU, {cpu_tensors} on CPU (auto-offloaded)")
                        logger.info("  This is normal with device_map='auto' - large layers may be on CPU")
                    else:
                        logger.warning(f"⚠ {cpu_tensors} tensors on CPU, {gpu_tensors} on GPU")
                        logger.info("  Consider enabling --auto-devices for GPU offloading")
                        
                except Exception as e:
                    logger.debug(f"→ Could not count tensors: {e}")
                
                logger.info(f"✓ {model_name} using DirectML acceleration")
                logger.info("  ⚠ PEFT model - NOT moving after adapter load (preserves fine-tuning)")
                
            except ImportError:
                logger.info(f"ℹ torch_directml not imported - using device_map for placement")
        
        # Cache models
        models[model_name] = model
        tokenizers[model_name] = tokenizer
        
        # Log detailed performance information
        logger.info("=" * 80)
        logger.info(f"OneSeek-7B-Zero loaded in {load_time:.1f} seconds")
        
        # Estimate inference speed (approximate)
        if DEVICE_TYPE == 'directml' and args.auto_devices:
            logger.info("Inference speed: ~25-38 tokens/second (expected on Ryzen AI Max 390)")
        
        logger.info("OneSeek-7B-Zero is now LIVE and CONTINUOUS")
        logger.info("=" * 80)
        logger.info(f"✓ {model_name} loaded successfully on {DEVICE_TYPE} ({dtype})")
        
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading {model_name}: {str(e)}")
        raise


async def dual_model_inference(text: str, max_length: int = 512, temperature: float = 0.7, top_p: float = 0.9):
    """
    Run inference using BOTH Mistral-7B and LLaMA-2 in parallel
    Combines their strengths: Mistral for speed, LLaMA for depth
    
    Returns combined response with metadata from both models
    """
    import time
    import asyncio
    
    async def run_single_inference(model_key: str, model, tokenizer, prompt: str):
        """Run inference on a single model"""
        start_time = time.time()
        
        # Tokenize input and sync to model's device
        inputs = tokenizer(prompt, return_tensors="pt", padding=True)
        inputs = sync_inputs_to_model_device(inputs, model)
        
        # Generate with explicit attention_mask
        with torch.no_grad():
            outputs = model.generate(
                input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the input prompt from response
        if response.startswith(prompt):
            response = response[len(prompt):].strip()
        
        latency = (time.time() - start_time) * 1000
        
        return {
            'model': model_key,
            'response': response,
            'latency_ms': latency,
            'tokens': len(outputs[0])
        }
    
    # Load both models if not already loaded
    if 'oneseek-mistral' not in models:
        logger.info("Loading Mistral-7B for dual-model inference...")
        available_models = find_all_base_models()
        if available_models and 'mistral' in available_models:
            load_model('oneseek-mistral', available_models['mistral'])
    
    if 'oneseek-llama' not in models:
        logger.info("Loading LLaMA-2 for dual-model inference...")
        available_models = find_all_base_models()
        if available_models and 'llama' in available_models:
            load_model('oneseek-llama', available_models['llama'])
    
    # Check if both models are loaded
    mistral_loaded = 'oneseek-mistral' in models
    llama_loaded = 'oneseek-llama' in models
    
    if not (mistral_loaded and llama_loaded):
        # Fallback to single model if both aren't available
        logger.warning("⚠ Dual-model mode requires both Mistral and LLaMA")
        logger.info(f"  Available: Mistral={mistral_loaded}, LLaMA={llama_loaded}")
        logger.info("  Falling back to single-model inference")
        
        # Use whichever is available
        if mistral_loaded:
            return await run_single_inference('oneseek-mistral', models['oneseek-mistral'], 
                                             tokenizers['oneseek-mistral'], text)
        elif llama_loaded:
            return await run_single_inference('oneseek-llama', models['oneseek-llama'], 
                                             tokenizers['oneseek-llama'], text)
        else:
            raise HTTPException(status_code=500, detail="No base models available")
    
    # Run both models in parallel (simulated async)
    logger.info("🔄 Dual-model inference: Mistral (fast) + LLaMA (deep)")
    
    # Run Mistral first (fast response)
    mistral_result = await run_single_inference('mistral', models['oneseek-mistral'], 
                                                 tokenizers['oneseek-mistral'], text)
    logger.info(f"  ✓ Mistral completed in {mistral_result['latency_ms']:.0f}ms")
    
    # Run LLaMA (deeper analysis)
    llama_result = await run_single_inference('llama', models['oneseek-llama'], 
                                               tokenizers['oneseek-llama'], text)
    logger.info(f"  ✓ LLaMA completed in {llama_result['latency_ms']:.0f}ms")
    
    # Combine results - use LLaMA as primary (deeper), note Mistral's speed
    combined = {
        'response': llama_result['response'],  # Use LLaMA's deeper analysis
        'model': 'OneSeek-7B-Zero.v1.1 (Dual: Mistral+LLaMA)',
        'tokens': llama_result['tokens'],
        'latency_ms': mistral_result['latency_ms'] + llama_result['latency_ms'],
        'mistral_latency_ms': mistral_result['latency_ms'],
        'llama_latency_ms': llama_result['latency_ms'],
        'mistral_response': mistral_result['response'],  # Include for comparison
    }
    
    logger.info(f"  ✓ Combined response (Mistral: {mistral_result['latency_ms']:.0f}ms + LLaMA: {llama_result['latency_ms']:.0f}ms)")
    
    return combined


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    logger.info("")
    logger.info("=" * 80)
    logger.info("ML Service for OneSeek - DNA v2 Certified - Starting...")
    logger.info("=" * 80)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Device Type: {DEVICE_TYPE}")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Models base directory: {get_models_base_dir()}")
    logger.info(f"Active model path: {ONESEEK_PATH}")
    logger.info(f"Rate limiting: {RATE_LIMIT_PER_MINUTE} requests/minute per IP on /infer endpoint")
    logger.info("=" * 80)
    logger.info("")
    
    # Verify model directory exists
    model_path = Path(ONESEEK_PATH)
    if not model_path.exists():
        logger.error(f"✗ Active model directory does not exist: {ONESEEK_PATH}")
        logger.error("This should not happen if symlink was created correctly.")
        logger.error("Check that the symlink target exists and is correct.")
        sys.exit(1)
    
    # Check if DNA v2 certified
    is_certified = 'oneseek-certified' in str(model_path) or 'OneSeek-7B-Zero.v' in model_path.name
    model_type = "DNA v2 CERTIFIED ✓" if is_certified else "Legacy (fallback)"
    
    logger.info(f"✓ Active model directory found: {model_path}")
    logger.info(f"  Model type: {model_type}")
    logger.info(f"  Ready to serve inference requests")
    logger.info("")
    
    yield
    
    # Shutdown (cleanup if needed)
    logger.info("Shutting down ML Service...")

# Initialize rate limiter (10 requests per minute per IP for /infer endpoint)
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI with lifespan
app = FastAPI(
    title="OneSeek ML Service - DNA v2 Certified",
    version="2.1.0",
    description="ML inference service with DNA v2 certified model support and rate limiting",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    """Health check and service information"""
    device_info = {
        "service": "OneSeek ML Service - DNA v2 Certified",
        "version": "2.1.0",
        "model_type": "DNA v2 Certified",
        "status": "running",
        "device": str(DEVICE),
        "device_type": DEVICE_TYPE,
        "models_loaded": list(models.keys()),
        "active_model_path": ONESEEK_PATH,
        "endpoints": {
            "/infer": "Primary inference endpoint (rate limited: 10 req/min/IP)",
            "/infer-legacy": "Legacy endpoint (deprecated - returns HTTP 410)",
            "/inference/oneseek": "Direct OneSeek inference",
            "/models/status": "Model loading status"
        }
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

@app.post("/infer", response_model=InferenceResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def infer(request: Request, inference_request: InferenceRequest):
    """
    Primary inference endpoint with rate limiting (configurable via RATE_LIMIT_PER_MINUTE).
    
    Routes to DNA v2 certified models with fallback to base models.
    This is the recommended endpoint for all inference requests.
    """
    start_time = time.time()
    
    try:
        # Determine if we're using certified model or fallback
        model_path = Path(ONESEEK_PATH)
        is_certified = 'oneseek-certified' in str(model_path) or 'OneSeek-7B-Zero.v' in model_path.name
        
        if DUAL_MODEL_MODE and not is_certified:
            # Use dual-model inference for legacy models
            logger.info("Using dual-model inference (legacy fallback)")
            result = await dual_model_inference(
                inference_request.text,
                max_length=inference_request.max_length,
                temperature=inference_request.temperature,
                top_p=inference_request.top_p
            )
            
            return InferenceResponse(
                response=result['response'],
                model=result['model'] + " (fallback)",
                tokens=result['tokens'],
                latency_ms=result['latency_ms']
            )
        else:
            # Single-model inference (certified or fallback)
            model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
            
            # Prepare input and sync to model's device
            inputs = tokenizer(inference_request.text, return_tensors="pt", padding=True)
            inputs = sync_inputs_to_model_device(inputs, model)
            
            # Generate with explicit attention_mask
            with torch.no_grad():
                outputs = model.generate(
                    input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                    attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                    max_length=inference_request.max_length,
                    temperature=inference_request.temperature,
                    top_p=inference_request.top_p,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode output
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Remove input from response
            if response_text.startswith(inference_request.text):
                response_text = response_text[len(inference_request.text):].strip()
            
            latency_ms = (time.time() - start_time) * 1000
            
            model_name = "OneSeek DNA v2 Certified" if is_certified else "OneSeek (base model fallback)"
            
            return InferenceResponse(
                response=response_text,
                model=model_name,
                tokens=len(outputs[0]),
                latency_ms=latency_ms
            )
        
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@app.post("/infer-legacy")
async def infer_legacy(request: InferenceRequest):
    """
    Legacy inference endpoint - DEPRECATED
    
    This endpoint is deprecated as of DNA v2 migration.
    Please migrate to the /infer endpoint.
    
    Returns HTTP 410 Gone with migration instructions.
    """
    return JSONResponse(
        status_code=410,
        content={
            "error": "Endpoint Deprecated",
            "detail": "This legacy endpoint has been deprecated as of DNA v2 migration.",
            "migration_guide": "ONESEEK_7B_ZERO_MIGRATION_GUIDE.md",
            "new_endpoint": "/infer",
            "instructions": [
                "Update your code to use the /infer endpoint instead",
                "The /infer endpoint supports DNA v2 certified models",
                "Rate limit: 10 requests per minute per IP address",
                "All legacy model references have been migrated to certified models"
            ],
            "documentation": "See INFERENCE_ROUTING_FIX.md for complete migration guide"
        }
    )

@app.post("/inference/oneseek", response_model=InferenceResponse)
async def oneseek_inference(request: InferenceRequest):
    """Generate response using OneSeek-7B-Zero.v1.1 with dual-model architecture"""
    import time
    start_time = time.time()
    
    # === DEBUG: Log inference start ===
    logger.info("=" * 60)
    logger.info("=== ONESEEK INFERENCE START ===")
    logger.debug(f"→ Input text: {request.text[:100]}..." if len(request.text) > 100 else f"→ Input text: {request.text}")
    logger.debug(f"→ Max length: {request.max_length}")
    logger.debug(f"→ Temperature: {request.temperature}")
    logger.debug(f"→ Top P: {request.top_p}")
    logger.debug(f"→ DUAL_MODEL_MODE: {DUAL_MODEL_MODE}")
    
    try:
        if DUAL_MODEL_MODE:
            # Use dual-model inference (Mistral + LLaMA)
            logger.debug("→ Using DUAL-model inference path")
            result = await dual_model_inference(
                request.text,
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p
            )
            
            return InferenceResponse(
                response=result['response'],
                model=result['model'],
                tokens=result['tokens'],
                latency_ms=result['latency_ms']
            )
        else:
            # Single-model fallback
            logger.debug("→ Using SINGLE-model inference path")
            logger.debug(f"→ Loading model from: {ONESEEK_PATH}")
            
            model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
            
            # === DEBUG: Log model info ===
            if hasattr(model, 'device'):
                logger.debug(f"→ Model device: {model.device}")
            if hasattr(model, 'dtype'):
                logger.debug(f"→ Model dtype: {model.dtype}")
            try:
                first_param_device = next(model.parameters()).device
                logger.debug(f"→ First param device: {first_param_device}")
            except:
                pass
            
            # Prepare input and sync to model's device
            logger.debug("→ Tokenizing input...")
            tokenize_start = time.time()
            inputs = tokenizer(request.text, return_tensors="pt", padding=True)
            tokenize_time = (time.time() - tokenize_start) * 1000
            logger.debug(f"→ Tokenization took: {tokenize_time:.1f}ms")
            
            # === DEBUG: Log input tensor info ===
            if hasattr(inputs, 'input_ids'):
                logger.debug(f"→ input_ids shape: {inputs.input_ids.shape}")
                logger.debug(f"→ input_ids device (before sync): {inputs.input_ids.device}")
                logger.debug(f"→ First 10 tokens: {inputs.input_ids[0][:10].tolist()}")
            elif isinstance(inputs, dict) and 'input_ids' in inputs:
                logger.debug(f"→ input_ids shape: {inputs['input_ids'].shape}")
                logger.debug(f"→ input_ids device (before sync): {inputs['input_ids'].device}")
                logger.debug(f"→ First 10 tokens: {inputs['input_ids'][0][:10].tolist()}")
            
            # Sync to model device
            logger.debug("→ Syncing inputs to model device...")
            inputs = sync_inputs_to_model_device(inputs, model)
            
            # === DEBUG: Log post-sync device ===
            if isinstance(inputs, dict) and 'input_ids' in inputs:
                logger.debug(f"→ input_ids device (after sync): {inputs['input_ids'].device}")
            elif hasattr(inputs, 'input_ids'):
                logger.debug(f"→ input_ids device (after sync): {inputs.input_ids.device}")
            
            # Generate with explicit attention_mask
            logger.info("→ Kallar model.generate()...")
            generate_start = time.time()
            
            with torch.no_grad():
                try:
                    outputs = model.generate(
                        input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                        attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                        max_length=request.max_length,
                        temperature=request.temperature,
                        top_p=request.top_p,
                        do_sample=True,
                        pad_token_id=tokenizer.eos_token_id
                    )
                except Exception as gen_error:
                    logger.error(f"→ model.generate() FAILED: {gen_error}")
                    raise gen_error
            
            generate_time = (time.time() - generate_start)
            logger.info(f"→ Generate klar! Tog: {generate_time:.2f} sekunder")
            
            # === DEBUG: Log output info ===
            logger.debug(f"→ Output shape: {outputs.shape}")
            logger.debug(f"→ Output tokens: {len(outputs[0])}")
            logger.debug(f"→ Första 10 output tokens: {outputs[0][:10].tolist()}")
            
            # Decode output
            logger.debug("→ Decoding output...")
            decode_start = time.time()
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            decode_time = (time.time() - decode_start) * 1000
            logger.debug(f"→ Decoding took: {decode_time:.1f}ms")
            
            # Remove input from response
            if response_text.startswith(request.text):
                response_text = response_text[len(request.text):].strip()
            
            latency_ms = (time.time() - start_time) * 1000
            
            # === DEBUG: Log response summary ===
            logger.debug(f"→ Response length: {len(response_text)} chars")
            logger.debug(f"→ Response preview: {response_text[:100]}..." if len(response_text) > 100 else f"→ Response: {response_text}")
            logger.info(f"=== ONESEEK INFERENCE COMPLETE ({latency_ms:.0f}ms) ===")
            logger.info("=" * 60)
            
            return InferenceResponse(
                response=response_text,
                model="OneSeek-7B-Zero.v1.1",
                tokens=len(outputs[0]),
                latency_ms=latency_ms
            )
        
    except Exception as e:
        logger.error(f"=== ONESEEK INFERENCE ERROR ===")
        logger.error(f"OneSeek-7B-Zero inference error: {str(e)}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inference/llama", response_model=InferenceResponse)
async def llama_inference(request: InferenceRequest):
    """Generate response using LLaMA-2 7B (legacy endpoint - redirects to OneSeek)"""
    import time
    start_time = time.time()
    
    # Legacy endpoint deprecated - use /inference/oneseek instead
    logger.warning("Legacy llama endpoint called - DEPRECATED. Use /inference/oneseek instead.")
    raise HTTPException(
        status_code=410,
        detail="This legacy endpoint has been removed. Please use /inference/oneseek for all inference requests. OneSeek-7B-Zero is the unified model for all inference."
    )

@app.post("/inference/mistral", response_model=InferenceResponse)
async def mistral_inference(request: InferenceRequest):
    """Generate response using Mistral 7B (DEPRECATED - use /inference/oneseek)"""
    import time
    start_time = time.time()
    
    # Legacy endpoint deprecated - use /inference/oneseek instead
    logger.warning("Legacy mistral endpoint called - DEPRECATED. Use /inference/oneseek instead.")
    raise HTTPException(
        status_code=410,
        detail="This legacy endpoint has been removed. Please use /inference/oneseek for all inference requests. OneSeek-7B-Zero is the unified model for all inference."
    )

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
    host = "0.0.0.0" if args.listen else "127.0.0.1"
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        timeout_keep_alive=args.timeout_keep_alive
    )
