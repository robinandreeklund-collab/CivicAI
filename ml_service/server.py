"""
ML Inference Service for OneSeek-7B-Zero
FastAPI server for OneSeek-7B-Zero model inference using -CURRENT symlink
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
import sys

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model paths - use absolute paths relative to project root
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

def get_active_model_path():
    """
    Get the active OneSeek model path via -CURRENT symlink ONLY.
    No fallbacks to old models. If the symlink doesn't exist, fail clearly.
    
    The symlink now points to DNA-based directories like:
    models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
    
    Priority order:
    1. Environment variable ONESEEK_MODEL_PATH (for manual override)
    2. Production -CURRENT symlink (configurable via PRODUCTION_MODELS_PATH, defaults to /app/models)
    3. Local -CURRENT symlink (models/oneseek-certified/OneSeek-7B-Zero-CURRENT)
    
    If none exist, the service will NOT start.
    """
    # Check environment variable first (manual override)
    env_path = os.getenv('ONESEEK_MODEL_PATH')
    if env_path:
        env_path_obj = Path(env_path)
        if env_path_obj.exists():
            logger.info(f"✓ Using OneSeek model from ONESEEK_MODEL_PATH: {env_path}")
            return str(env_path_obj.resolve())
        else:
            logger.error(f"✗ ONESEEK_MODEL_PATH set but path doesn't exist: {env_path}")
            sys.exit(1)
    
    # Check production -CURRENT symlink
    production_models_path = os.getenv('PRODUCTION_MODELS_PATH', '/app/models')
    production_current = Path(production_models_path) / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT'
    if production_current.exists() or production_current.is_symlink():
        try:
            resolved_path = production_current.resolve()
            if resolved_path.exists():
                logger.info(f"✓ Using production CURRENT symlink: {production_current}")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve production symlink: {e}")
    
    # Check local -CURRENT symlink
    local_current = PROJECT_ROOT / 'models' / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT'
    if local_current.exists() or local_current.is_symlink():
        try:
            resolved_path = local_current.resolve()
            if resolved_path.exists():
                logger.info(f"✓ Using local CURRENT symlink: {local_current}")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve local symlink: {e}")
    
    # Check for marker file (Windows fallback when symlinks require admin)
    local_current_marker = PROJECT_ROOT / 'models' / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT.txt'
    if local_current_marker.exists():
        try:
            with open(local_current_marker, 'r', encoding='utf-8') as f:
                target_path = f.read().strip()
            target_path_obj = Path(target_path)
            if target_path_obj.exists():
                logger.info(f"✓ Using local CURRENT marker file: {local_current_marker}")
                logger.info(f"  → Points to: {target_path}")
                return str(target_path_obj.resolve())
        except Exception as e:
            logger.error(f"✗ Error reading marker file: {e}")
    
    # NO FALLBACKS - Fail clearly
    logger.error("")
    logger.error("=" * 80)
    logger.error("✗ ACTIVE MODEL NOT FOUND")
    logger.error("=" * 80)
    logger.error("")
    logger.error("No active model symlink found. You must set a model as active first.")
    logger.error("")
    logger.error("How to fix:")
    logger.error("  1. Go to Admin Dashboard → Models tab")
    logger.error("  2. Click 'Set as Active' on a trained model version")
    logger.error("  3. Restart this service")
    logger.error("")
    logger.error("Checked locations:")
    logger.error(f"  - Environment variable ONESEEK_MODEL_PATH: {env_path or 'Not set'}")
    logger.error(f"  - Production symlink: {production_current} (Not found)")
    logger.error(f"  - Local symlink: {local_current} (Not found)")
    logger.error("")
    logger.error("=" * 80)
    logger.error("")
    sys.exit(1)

# Get model path (REQUIRED - will exit if not found)
ONESEEK_PATH = get_active_model_path()

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

# Dual-model configuration for OneSeek-7B-Zero
DUAL_MODEL_MODE = True  # Use both Mistral and LLaMA in parallel

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
        
        # Look for adapter directories matching pattern
        for item in base_path.iterdir():
            if item.is_dir() and '-adapter' in item.name:
                # Check for PEFT format
                if (item / 'adapter_config.json').exists():
                    logger.info(f"Found PEFT LoRA adapter in certified directory: {item}")
                    return str(item)
        
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
    if model_name in models:
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
                        logger.info(f"Applying LoRA adapters from {lora_weights}...")
                        if (lora_path / 'adapter_config.json').exists():
                            model = PeftModel.from_pretrained(model, str(lora_path))
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
        
        # Tokenize input
        inputs = tokenizer(prompt, return_tensors="pt").to(DEVICE)
        
        # Generate
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
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
    logger.info("ML Service for OneSeek-7B-Zero - Starting...")
    logger.info("=" * 80)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Device Type: {DEVICE_TYPE}")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Active model path: {ONESEEK_PATH}")
    logger.info("=" * 80)
    logger.info("")
    
    # Verify model directory exists
    model_path = Path(ONESEEK_PATH)
    if not model_path.exists():
        logger.error(f"✗ Active model directory does not exist: {ONESEEK_PATH}")
        logger.error("This should not happen if symlink was created correctly.")
        logger.error("Check that the symlink target exists and is correct.")
        sys.exit(1)
    
    logger.info(f"✓ Active model directory found: {model_path}")
    logger.info(f"  Ready to serve queries via OQT Dashboard")
    logger.info("")
    
    yield
    
    # Shutdown (cleanup if needed)
    logger.info("Shutting down ML Service...")

# Initialize FastAPI with lifespan
app = FastAPI(
    title="OneSeek-7B-Zero ML Service",
    version="2.0.0",
    description="ML inference service using active model via -CURRENT symlink",
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
    """Generate response using OneSeek-7B-Zero.v1.1 with dual-model architecture"""
    import time
    start_time = time.time()
    
    try:
        if DUAL_MODEL_MODE:
            # Use dual-model inference (Mistral + LLaMA)
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
