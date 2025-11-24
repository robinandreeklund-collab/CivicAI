#!/usr/bin/env python3
"""
Merge Adapters Script

Merges multiple LoRA adapters into the base model without requiring
an external base model download. Uses the existing model structure.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

def parse_args():
    parser = argparse.ArgumentParser(description='Merge LoRA adapters into base model')
    parser.add_argument('--base-model', required=True, help='Base model name')
    parser.add_argument('--adapters', required=True, nargs='+', help='List of adapter run IDs to merge')
    parser.add_argument('--output', required=True, help='Output directory for merged model')
    parser.add_argument('--output-name', default='merged', help='Name for the merged model')
    return parser.parse_args()

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

def merge_adapters(base_model, adapters, output_dir, output_name):
    """Merge adapters using PEFT library"""
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
        import torch
    except ImportError:
        print("ERROR: Required libraries not found. Install with:")
        print("  pip install transformers peft torch")
        return False
    
    project_root = Path(__file__).parent.parent
    models_dir = project_root / 'models'
    certified_dir = models_dir / 'oneseek-certified'
    
    # Verify adapters
    if not verify_adapters_exist(certified_dir, adapters):
        return False
    
    print(f"[MERGE] Loading base model: {base_model}")
    
    # Determine base model path - try to find it locally
    base_model_candidates = [
        models_dir / base_model,
        models_dir / 'base' / base_model,
        base_model  # Fallback to HuggingFace model ID
    ]
    
    base_model_path = None
    for candidate in base_model_candidates:
        if Path(candidate).exists():
            base_model_path = str(candidate)
            break
    
    if not base_model_path:
        # Use HuggingFace model ID
        print(f"[MERGE] Base model not found locally, using HuggingFace: {base_model}")
        base_model_path = base_model
    
    # Load base model
    try:
        model = AutoModelForCausalLM.from_pretrained(
            base_model_path,
            torch_dtype=torch.float16,
            device_map='auto'
        )
        tokenizer = AutoTokenizer.from_pretrained(base_model_path)
    except Exception as e:
        print(f"ERROR: Failed to load base model: {e}")
        return False
    
    # Apply adapters sequentially
    for i, adapter in enumerate(adapters, 1):
        adapter_path = certified_dir / adapter
        print(f"[MERGE] Applying adapter {i}/{len(adapters)}: {adapter}")
        
        try:
            model = PeftModel.from_pretrained(model, str(adapter_path))
            # Merge adapter into base model
            model = model.merge_and_unload()
            print(f"[MERGE] Adapter {adapter} merged successfully")
        except Exception as e:
            print(f"ERROR: Failed to merge adapter {adapter}: {e}")
            return False
    
    # Save merged model
    output_path = Path(output_dir) / output_name
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"[MERGE] Saving merged model to: {output_path}")
    model.save_pretrained(str(output_path))
    tokenizer.save_pretrained(str(output_path))
    
    # Save merge metadata
    metadata = {
        'baseModel': base_model,
        'adapters': adapters,
        'mergedAt': datetime.now(timezone.utc).isoformat(),
        'outputName': output_name
    }
    
    metadata_path = output_path / 'merge_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[MERGE] Merge completed successfully!")
    print(f"[MERGE] Merged {len(adapters)} adapters into {output_name}")
    
    return True

def main():
    args = parse_args()
    
    print(f"=== LoRA Adapter Merge ===")
    print(f"Base Model: {args.base_model}")
    print(f"Adapters: {', '.join(args.adapters)}")
    print(f"Output: {args.output}/{args.output_name}")
    print()
    
    success = merge_adapters(
        args.base_model,
        args.adapters,
        args.output,
        args.output_name
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
