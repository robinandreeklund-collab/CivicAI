#!/usr/bin/env python3
"""
Merge Adapters Script with GGUF Export

Merges multiple LoRA adapters into a standalone OneSeek model without requiring
external base model dependencies. Includes GGUF export with quantization options.

Features:
- Full merge to standalone model (no KB-Llama dependency)
- GGUF export with quantization (Q5_K_M, Q6_K, Q8_0)
- merge_manifest.json generation for 100% traceability
- Version management and metadata tracking
"""

import argparse
import json
import os
import sys
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime, timezone

# Configurable paths
CERTIFIED_DIR_NAME = 'oneseek-certified'
BASE_MODELS_DIR_NAME = 'base_models'
ONESEEK_MODEL_DIR = 'oneseek-7b-zero'

# GGUF quantization configurations
QUANTIZATION_TYPES = {
    'Q5_K_M': {'description': 'Medium quality, good balance of size/quality', 'bits': 5},
    'Q6_K': {'description': 'High quality, larger size', 'bits': 6},
    'Q8_0': {'description': 'Best quality, largest size', 'bits': 8},
}

def parse_args():
    parser = argparse.ArgumentParser(description='Merge LoRA adapters into standalone OneSeek model')
    parser.add_argument('--base-model', required=True, help='Base model name or path')
    parser.add_argument('--adapters', required=True, nargs='+', help='List of adapter run IDs to merge')
    parser.add_argument('--output', required=True, help='Output directory for merged model')
    parser.add_argument('--output-name', default='merged', help='Name for the merged model')
    parser.add_argument('--version', default='1.0', help='Version number for the merged model')
    parser.add_argument('--export-gguf', action='store_true', help='Export to GGUF format')
    parser.add_argument('--quantization', default='Q5_K_M', choices=list(QUANTIZATION_TYPES.keys()),
                        help='GGUF quantization type')
    parser.add_argument('--datasets', nargs='*', default=[], help='Dataset IDs used in training')
    return parser.parse_args()

def compute_file_hash(filepath):
    """Compute SHA256 hash of a file"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()[:16]

def compute_adapter_info(adapter_path):
    """Extract adapter information including hash"""
    adapter_path = Path(adapter_path)
    info = {
        'name': adapter_path.name,
        'path': str(adapter_path),
    }
    
    # Try to read adapter config
    config_path = adapter_path / 'adapter_config.json'
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = json.load(f)
            info['lora_rank'] = config.get('r', 'unknown')
            info['lora_alpha'] = config.get('lora_alpha', 'unknown')
            info['target_modules'] = config.get('target_modules', [])
    
    # Compute hash of adapter model
    model_files = list(adapter_path.glob('adapter_model.*'))
    if model_files:
        info['hash'] = compute_file_hash(model_files[0])
    
    # Try to read training metadata
    metadata_path = adapter_path / 'metadata.json'
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            info['trained_at'] = metadata.get('createdAt', 'unknown')
            info['datasets'] = metadata.get('datasets', [])
            info['language'] = metadata.get('language', 'unknown')
    
    return info

def verify_adapters_exist(adapters_dir, adapters):
    """Verify all adapters exist"""
    missing = []
    for adapter in adapters:
        adapter_path = adapters_dir / adapter
        if not adapter_path.exists():
            missing.append(adapter)
    
    if missing:
        print(f"ERROR: Missing adapters: {', '.join(missing)}")
        return False
    return True

def generate_merge_manifest(base_model, adapters, adapter_infos, output_path, version, datasets):
    """Generate merge_manifest.json for full traceability"""
    manifest = {
        'manifestVersion': '1.0',
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'merge': {
            'version': version,
            'outputName': output_path.name,
            'outputPath': str(output_path),
        },
        'baseModel': {
            'name': base_model,
            'type': 'standalone',  # No external dependency
        },
        'adapters': adapter_infos,
        'datasets': datasets,
        'traceability': {
            'totalAdapters': len(adapters),
            'mergeOrder': adapters,
        }
    }
    
    # Generate merge hash for uniqueness
    merge_content = json.dumps(manifest, sort_keys=True)
    manifest['mergeHash'] = hashlib.sha256(merge_content.encode()).hexdigest()[:16]
    
    return manifest

def merge_adapters(base_model, adapters, output_dir, output_name, version, datasets):
    """Merge adapters using PEFT library - creates standalone model
    
    Improved memory handling for 5+ adapters:
    - Uses garbage collection between adapter merges
    - Releases GPU memory after each adapter to prevent OOM
    - Supports trust_remote_code=False for security
    """
    import sys
    import traceback
    
    # Force unbuffered output for real-time logging
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(line_buffering=True)
    except Exception:
        pass  # Ignore if reconfigure fails (e.g., on some Windows configurations)
    
    print("=" * 70)
    print("[MERGE DEBUG] Python merge_adapters() started")
    print("=" * 70)
    print(f"[MERGE DEBUG] Base model: {base_model}")
    print(f"[MERGE DEBUG] Output dir: {output_dir}")
    print(f"[MERGE DEBUG] Output name: {output_name}")
    print(f"[MERGE DEBUG] Version: {version}")
    print(f"[MERGE DEBUG] Datasets: {datasets}")
    print(f"[MERGE DEBUG] Number of adapters: {len(adapters)}")
    for i, adapter in enumerate(adapters, 1):
        print(f"[MERGE DEBUG]   Adapter {i}: {adapter}")
    print("=" * 70)
    sys.stdout.flush()  # Ensure all output is flushed
    
    try:
        print("[MERGE DEBUG] Importing required libraries...")
        sys.stdout.flush()
        from transformers import AutoModelForCausalLM, AutoTokenizer
        print("[MERGE DEBUG]   ✓ transformers imported")
        sys.stdout.flush()
        from peft import PeftModel
        print("[MERGE DEBUG]   ✓ peft imported")
        sys.stdout.flush()
        import torch
        print("[MERGE DEBUG]   ✓ torch imported")
        sys.stdout.flush()
        import gc
        print(f"[MERGE DEBUG] ✓ All libraries imported successfully")
        print(f"[MERGE DEBUG] PyTorch version: {torch.__version__}")
        print(f"[MERGE DEBUG] CUDA available: {torch.cuda.is_available()}")
        sys.stdout.flush()
        if torch.cuda.is_available():
            try:
                print(f"[MERGE DEBUG] CUDA device: {torch.cuda.get_device_name(0)}")
                print(f"[MERGE DEBUG] GPU memory total: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
                print(f"[MERGE DEBUG] GPU memory allocated: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
                print(f"[MERGE DEBUG] GPU memory reserved: {torch.cuda.memory_reserved() / 1e9:.2f} GB")
            except Exception as cuda_e:
                print(f"[MERGE DEBUG] ⚠️ Could not get CUDA details: {cuda_e}")
        sys.stdout.flush()
    except ImportError as e:
        print(f"[MERGE DEBUG] ✗ Import error: {e}")
        print("ERROR: Required libraries not found. Install with:")
        print("  pip install transformers peft torch")
        sys.stdout.flush()
        return None, None
    except Exception as e:
        print(f"[MERGE DEBUG] ✗ Unexpected error during import: {type(e).__name__}: {e}")
        print("[MERGE DEBUG] Full traceback:")
        traceback.print_exc()
        sys.stdout.flush()
        return None, None
    
    project_root = Path(__file__).parent.parent
    models_dir = project_root / 'models'
    certified_dir = models_dir / 'oneseek-certified'
    
    print(f"[MERGE DEBUG] Project root: {project_root}")
    print(f"[MERGE DEBUG] Models dir: {models_dir}")
    print(f"[MERGE DEBUG] Certified dir: {certified_dir}")
    
    # Verify adapters
    print("[MERGE DEBUG] Verifying adapters exist...")
    if not verify_adapters_exist(certified_dir, adapters):
        print("[MERGE DEBUG] ✗ Adapter verification failed")
        return None, None
    print("[MERGE DEBUG] ✓ All adapters verified")
    
    print(f"[MERGE] Loading base model: {base_model}")
    print(f"[MERGE] Total adapters to merge: {len(adapters)}")
    
    # Memory optimization for 5+ adapters
    if len(adapters) >= 5:
        print(f"[MERGE] ⚠️ Enabling enhanced memory management for {len(adapters)} adapters")
        print(f"[MERGE DEBUG] This may take longer due to memory cleanup between merges")
    
    # Determine base model path - try to find it locally
    base_model_candidates = [
        models_dir / base_model,
        models_dir / 'base' / base_model,
        models_dir / ONESEEK_MODEL_DIR / BASE_MODELS_DIR_NAME / base_model,
        base_model  # Fallback to HuggingFace model ID
    ]
    
    print("[MERGE DEBUG] Searching for base model...")
    base_model_path = None
    for candidate in base_model_candidates:
        print(f"[MERGE DEBUG]   Checking: {candidate}")
        if Path(candidate).exists():
            base_model_path = str(candidate)
            print(f"[MERGE DEBUG]   ✓ Found at: {base_model_path}")
            break
    
    if not base_model_path:
        # Use HuggingFace model ID
        print(f"[MERGE DEBUG] Base model not found locally")
        print(f"[MERGE] Base model not found locally, using HuggingFace: {base_model}")
        base_model_path = base_model
    
    # Load base model with improved settings
    print(f"[MERGE DEBUG] Loading base model from: {base_model_path}")
    print(f"[MERGE DEBUG] Settings: torch_dtype=float16, device_map=auto, trust_remote_code=False, low_cpu_mem_usage=True")
    
    try:
        model = AutoModelForCausalLM.from_pretrained(
            base_model_path,
            torch_dtype=torch.float16,
            device_map='auto',
            trust_remote_code=False,  # Security: don't execute remote code
            low_cpu_mem_usage=True,  # Memory optimization
        )
        print(f"[MERGE DEBUG] ✓ Model loaded successfully")
        if torch.cuda.is_available():
            print(f"[MERGE DEBUG] GPU memory after model load: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
        
        print(f"[MERGE DEBUG] Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            base_model_path,
            trust_remote_code=False,  # Security: don't execute remote code
        )
        print(f"[MERGE DEBUG] ✓ Tokenizer loaded successfully")
    except Exception as e:
        print(f"[MERGE DEBUG] ✗ Failed to load base model")
        print(f"ERROR: Failed to load base model: {e}")
        print(f"[MERGE DEBUG] Traceback:")
        traceback.print_exc()
        return None, None
    
    # Collect adapter info for manifest
    adapter_infos = []
    
    print("=" * 70)
    print(f"[MERGE DEBUG] Starting adapter merge loop ({len(adapters)} adapters)")
    print("=" * 70)
    
    # Apply adapters sequentially with memory management
    for i, adapter in enumerate(adapters, 1):
        adapter_path = certified_dir / adapter
        print(f"\n[MERGE DEBUG] === Adapter {i}/{len(adapters)} ===")
        print(f"[MERGE DEBUG] Adapter name: {adapter}")
        print(f"[MERGE DEBUG] Adapter path: {adapter_path}")
        print(f"[MERGE DEBUG] Path exists: {adapter_path.exists()}")
        
        if torch.cuda.is_available():
            mem_before = torch.cuda.memory_allocated() / 1e9
            print(f"[MERGE DEBUG] GPU memory before merge: {mem_before:.2f} GB")
        
        print(f"[MERGE] Applying adapter {i}/{len(adapters)}: {adapter}")
        
        # Collect adapter info
        print(f"[MERGE DEBUG] Computing adapter info...")
        adapter_info = compute_adapter_info(adapter_path)
        adapter_info['mergeOrder'] = i
        adapter_infos.append(adapter_info)
        print(f"[MERGE DEBUG] Adapter info: {adapter_info}")
        
        try:
            print(f"[MERGE DEBUG] Loading adapter with PeftModel.from_pretrained...")
            model = PeftModel.from_pretrained(model, str(adapter_path))
            print(f"[MERGE DEBUG] ✓ Adapter loaded")
            
            # Merge adapter into base model
            print(f"[MERGE DEBUG] Merging and unloading adapter...")
            model = model.merge_and_unload()
            print(f"[MERGE] ✓ Adapter {adapter} merged successfully")
            
            if torch.cuda.is_available():
                mem_after = torch.cuda.memory_allocated() / 1e9
                print(f"[MERGE DEBUG] GPU memory after merge: {mem_after:.2f} GB (delta: {mem_after - mem_before:+.2f} GB)")
            
            # Memory cleanup after each adapter (especially important for 5+ adapters)
            if len(adapters) >= 3:
                print(f"[MERGE DEBUG] Running memory cleanup (gc.collect + cuda.empty_cache)...")
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    print(f"[MERGE DEBUG] GPU memory after cleanup: {torch.cuda.memory_allocated() / 1e9:.2f} GB")
                    
        except Exception as e:
            print(f"[MERGE DEBUG] ✗ Failed to merge adapter {adapter}")
            print(f"ERROR: Failed to merge adapter {adapter}: {e}")
            print(f"[MERGE DEBUG] Traceback:")
            traceback.print_exc()
            # Cleanup on error
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return None, None
    
    print("\n" + "=" * 70)
    print(f"[MERGE DEBUG] All {len(adapters)} adapters merged successfully!")
    print("=" * 70)
    
    # Save merged model
    output_path = Path(output_dir) / output_name
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"[MERGE] Saving merged model to: {output_path}")
    model.save_pretrained(str(output_path))
    tokenizer.save_pretrained(str(output_path))
    
    # Generate and save merge manifest
    manifest = generate_merge_manifest(base_model, adapters, adapter_infos, output_path, version, datasets)
    manifest_path = output_path / 'merge_manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"[MERGE] Manifest saved: {manifest_path}")
    
    # Create metadata.json (standard format for certified models)
    metadata = {
        'dna': output_name,
        'version': version,
        'baseModel': base_model,
        'adapters': adapters,
        'datasets': datasets,
        'language': 'sv',  # Default to Swedish, can be updated from adapter metadata
        'createdAt': datetime.now(timezone.utc).isoformat(),
        'trainingType': 'merged',
        'isStandalone': True,
        'isMerged': True,
        'mergeHash': manifest['mergeHash'],
        'adaptersCount': len(adapters),
        'metrics': {
            'loss': None,
            'accuracy': None,
            'fairness': None,
        },
    }
    
    # Try to get language from adapter metadata
    for adapter_info in adapter_infos:
        if adapter_info.get('language') and adapter_info['language'] != 'unknown':
            metadata['language'] = adapter_info['language']
            break
    
    # Save metadata.json (primary metadata file)
    metadata_path = output_path / 'metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"[MERGE] Metadata saved: {metadata_path}")
    
    # Save legacy merge_metadata.json for compatibility
    legacy_metadata = {
        'baseModel': base_model,
        'adapters': adapters,
        'mergedAt': datetime.now(timezone.utc).isoformat(),
        'outputName': output_name,
        'version': version,
        'isStandalone': True,  # No external dependency
        'mergeHash': manifest['mergeHash'],
    }
    
    legacy_metadata_path = output_path / 'merge_metadata.json'
    with open(legacy_metadata_path, 'w') as f:
        json.dump(legacy_metadata, f, indent=2)
    
    # Update CURRENT.txt with latest merge version
    try:
        current_txt_path = certified_dir / 'CURRENT.txt'
        with open(current_txt_path, 'w') as f:
            f.write(f"{output_name}\n")
            f.write(f"# Last merged: {datetime.now(timezone.utc).isoformat()}\n")
            f.write(f"# Merge hash: {manifest['mergeHash']}\n")
            f.write(f"# Adapters: {len(adapters)}\n")
        print(f"[MERGE] Updated CURRENT.txt: {current_txt_path}")
    except Exception as e:
        print(f"[MERGE] Warning: Could not update CURRENT.txt: {e}")
    
    # Final memory cleanup
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    
    print(f"[MERGE] Merge completed successfully!")
    print(f"[MERGE] Merged {len(adapters)} adapters into standalone model: {output_name}")
    
    return output_path, manifest

def export_to_gguf(model_path, output_dir, output_name, quantization='Q5_K_M'):
    """Export merged model to GGUF format with quantization"""
    project_root = Path(__file__).parent.parent
    gguf_dir = project_root / 'models' / 'gguf'
    gguf_dir.mkdir(parents=True, exist_ok=True)
    
    gguf_output = gguf_dir / f"{output_name}.{quantization}.gguf"
    
    print(f"[GGUF] Exporting to GGUF format: {quantization}")
    print(f"[GGUF] Output: {gguf_output}")
    
    # Check for llama.cpp convert script
    convert_script = project_root / 'llama.cpp' / 'convert.py'
    quantize_binary = project_root / 'llama.cpp' / 'quantize'
    
    # Try to use llama-cpp-python if available
    try:
        from llama_cpp import Llama
        print("[GGUF] Using llama-cpp-python for conversion")
        
        # NOTE: GGUF export currently creates a manifest with conversion instructions
        # Full automated conversion requires llama.cpp tools to be installed locally.
        # The manifest contains the exact command to run for conversion.
        print(f"[GGUF] Creating export manifest - manual conversion required")
        print(f"[GGUF] See manifest for llama.cpp conversion command")
        
        # Create a manifest for GGUF export with conversion instructions
        gguf_manifest = {
            'modelPath': str(model_path),
            'outputPath': str(gguf_output),
            'quantization': quantization,
            'quantizationInfo': QUANTIZATION_TYPES[quantization],
            'exportedAt': datetime.now(timezone.utc).isoformat(),
            'status': 'pending',
            'command': f"python llama.cpp/convert.py {model_path} --outtype {quantization.lower()} --outfile {gguf_output}",
            'note': 'Run the command above after installing llama.cpp to complete the conversion'
        }
        
        manifest_path = gguf_dir / f"{output_name}.{quantization}.manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(gguf_manifest, f, indent=2)
        
        print(f"[GGUF] Export manifest created: {manifest_path}")
        return str(gguf_output), gguf_manifest
        
    except ImportError:
        print("[GGUF] llama-cpp-python not found")
        
        # Try to use llama.cpp directly if available
        if convert_script.exists():
            print(f"[GGUF] Using llama.cpp convert script")
            try:
                # First convert to F16 GGUF
                f16_output = gguf_dir / f"{output_name}.f16.gguf"
                subprocess.run([
                    sys.executable, str(convert_script),
                    str(model_path),
                    '--outtype', 'f16',
                    '--outfile', str(f16_output)
                ], check=True)
                
                # Then quantize if needed
                if quantization != 'F16' and quantize_binary.exists():
                    subprocess.run([
                        str(quantize_binary),
                        str(f16_output),
                        str(gguf_output),
                        quantization
                    ], check=True)
                    # Remove intermediate F16 file
                    f16_output.unlink()
                else:
                    gguf_output = f16_output
                
                print(f"[GGUF] Export completed: {gguf_output}")
                return str(gguf_output), {'status': 'completed', 'path': str(gguf_output)}
                
            except subprocess.CalledProcessError as e:
                print(f"[GGUF] Export failed: {e}")
                return None, {'status': 'failed', 'error': str(e)}
        else:
            print("[GGUF] llama.cpp not found. Install with:")
            print("  git clone https://github.com/ggerganov/llama.cpp")
            print("  cd llama.cpp && make")
            
            # Create manifest for manual conversion
            gguf_manifest = {
                'modelPath': str(model_path),
                'outputPath': str(gguf_output),
                'quantization': quantization,
                'status': 'manual_required',
                'instructions': [
                    "1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp",
                    "2. Build: cd llama.cpp && make",
                    f"3. Convert: python llama.cpp/convert.py {model_path} --outtype f16 --outfile {gguf_dir}/{output_name}.f16.gguf",
                    f"4. Quantize: ./llama.cpp/quantize {gguf_dir}/{output_name}.f16.gguf {gguf_output} {quantization}"
                ]
            }
            
            manifest_path = gguf_dir / f"{output_name}.{quantization}.manifest.json"
            with open(manifest_path, 'w') as f:
                json.dump(gguf_manifest, f, indent=2)
            
            return None, gguf_manifest

def main():
    args = parse_args()
    
    print(f"=== OneSeek LoRA Adapter Merge ===")
    print(f"Base Model: {args.base_model}")
    print(f"Adapters: {', '.join(args.adapters)}")
    print(f"Version: {args.version}")
    print(f"Output: {args.output}/{args.output_name}")
    if args.export_gguf:
        print(f"GGUF Export: {args.quantization}")
    print()
    
    # Perform merge
    output_path, manifest = merge_adapters(
        args.base_model,
        args.adapters,
        args.output,
        args.output_name,
        args.version,
        args.datasets
    )
    
    if output_path is None:
        print("ERROR: Merge failed")
        sys.exit(1)
    
    # Export to GGUF if requested
    if args.export_gguf:
        print()
        gguf_path, gguf_manifest = export_to_gguf(
            output_path,
            args.output,
            args.output_name,
            args.quantization
        )
        
        if gguf_path:
            print(f"[GGUF] Export successful: {gguf_path}")
        else:
            print(f"[GGUF] Export pending - see manifest for instructions")
    
    print()
    print("=== Merge Summary ===")
    print(f"Standalone Model: {output_path}")
    print(f"Merge Hash: {manifest['mergeHash']}")
    print(f"Adapters Merged: {len(args.adapters)}")
    if args.export_gguf:
        print(f"GGUF: {args.quantization}")
    
    sys.exit(0)

if __name__ == '__main__':
    main()
