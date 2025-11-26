#!/usr/bin/env python3
"""
GGUF Export Script for OneSeek Models

Automatically exports merged models to GGUF format with specified quantization.
Uses llama.cpp for conversion and quantization.

Usage:
    python scripts/export_gguf.py --model-path <path> --output <path> --quantization Q5_K_M
"""

import argparse
import json
import os
import sys
import subprocess
import shutil
from pathlib import Path
from datetime import datetime

# Quantization types supported
QUANTIZATION_TYPES = {
    'Q5_K_M': 'Medium quality, good balance',
    'Q6_K': 'High quality, larger size',
    'Q8_0': 'Best quality, largest size',
}

def find_llama_cpp():
    """Find llama.cpp installation or download it."""
    # Check common locations
    possible_paths = [
        Path.home() / 'llama.cpp',
        Path('/opt/llama.cpp'),
        Path('./llama.cpp'),
        Path('../llama.cpp'),
    ]
    
    for p in possible_paths:
        if p.exists() and (p / 'convert_hf_to_gguf.py').exists():
            return p
        # Also check for older convert.py
        if p.exists() and (p / 'convert.py').exists():
            return p
    
    return None

def convert_to_gguf(model_path: Path, output_path: Path, quantization: str = 'Q5_K_M'):
    """
    Convert a HuggingFace model to GGUF format.
    
    Args:
        model_path: Path to the merged model directory
        output_path: Path for the output GGUF file
        quantization: Quantization type (Q5_K_M, Q6_K, Q8_0)
    
    Returns:
        dict with success status and details
    """
    print(f"[GGUF Export] Starting conversion...")
    print(f"  Model: {model_path}")
    print(f"  Output: {output_path}")
    print(f"  Quantization: {quantization}")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Find llama.cpp
    llama_cpp_path = find_llama_cpp()
    
    if llama_cpp_path:
        print(f"[GGUF Export] Found llama.cpp at: {llama_cpp_path}")
        return convert_with_llama_cpp(model_path, output_path, quantization, llama_cpp_path)
    else:
        print("[GGUF Export] llama.cpp not found, trying transformers library...")
        return convert_with_transformers(model_path, output_path, quantization)

def convert_with_llama_cpp(model_path: Path, output_path: Path, quantization: str, llama_cpp_path: Path):
    """Convert using llama.cpp tools."""
    try:
        # Determine which convert script to use
        convert_script = llama_cpp_path / 'convert_hf_to_gguf.py'
        if not convert_script.exists():
            convert_script = llama_cpp_path / 'convert.py'
        
        if not convert_script.exists():
            return {
                'success': False,
                'error': 'llama.cpp convert script not found',
            }
        
        # First convert to f16 GGUF
        f16_output = output_path.with_suffix('.f16.gguf')
        
        print(f"[GGUF Export] Step 1: Converting to F16 GGUF...")
        convert_cmd = [
            sys.executable, str(convert_script),
            str(model_path),
            '--outtype', 'f16',
            '--outfile', str(f16_output),
        ]
        
        result = subprocess.run(convert_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            return {
                'success': False,
                'error': f'F16 conversion failed: {result.stderr}',
                'stdout': result.stdout,
            }
        
        print(f"[GGUF Export] Step 2: Quantizing to {quantization}...")
        
        # Find quantize binary
        quantize_bin = llama_cpp_path / 'quantize'
        if not quantize_bin.exists():
            quantize_bin = llama_cpp_path / 'build' / 'bin' / 'quantize'
        if not quantize_bin.exists():
            # On Windows
            quantize_bin = llama_cpp_path / 'build' / 'bin' / 'Release' / 'quantize.exe'
        
        if quantize_bin.exists():
            quantize_cmd = [
                str(quantize_bin),
                str(f16_output),
                str(output_path),
                quantization,
            ]
            
            result = subprocess.run(quantize_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                # If quantization fails, keep the f16 version
                shutil.move(str(f16_output), str(output_path))
                return {
                    'success': True,
                    'warning': f'Quantization failed, using F16: {result.stderr}',
                    'output_path': str(output_path),
                    'quantization': 'f16',
                }
            
            # Clean up intermediate file
            if f16_output.exists():
                f16_output.unlink()
        else:
            # No quantize binary, keep f16
            shutil.move(str(f16_output), str(output_path))
            return {
                'success': True,
                'warning': 'Quantize binary not found, using F16',
                'output_path': str(output_path),
                'quantization': 'f16',
            }
        
        return {
            'success': True,
            'output_path': str(output_path),
            'quantization': quantization,
            'size_bytes': output_path.stat().st_size if output_path.exists() else 0,
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }

def convert_with_transformers(model_path: Path, output_path: Path, quantization: str):
    """
    Convert using transformers and gguf libraries directly.
    This is a fallback when llama.cpp is not available.
    """
    try:
        # Try to import required libraries
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
        except ImportError:
            return {
                'success': False,
                'error': 'transformers library not installed. Run: pip install transformers',
                'instructions': [
                    '1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
                    '2. Build: cd llama.cpp && make',
                    f'3. Convert: python llama.cpp/convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
                    f'4. Quantize: ./llama.cpp/quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
                ],
            }
        
        # Check if gguf library is available
        try:
            import gguf
        except ImportError:
            # Try to use transformers' built-in GGUF support (newer versions)
            pass
        
        print("[GGUF Export] Loading model with transformers...")
        
        # Load the model
        model = AutoModelForCausalLM.from_pretrained(
            str(model_path),
            torch_dtype='auto',
            device_map='cpu',  # Load on CPU for conversion
        )
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        
        # Try to save as GGUF using transformers (if supported)
        try:
            # This is for newer transformers versions that support GGUF export
            model.save_pretrained(str(output_path.parent), safe_serialization=True)
            
            # The actual GGUF conversion still needs llama.cpp
            return {
                'success': False,
                'error': 'Direct GGUF export not supported. Please install llama.cpp.',
                'instructions': [
                    '1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
                    '2. Build: cd llama.cpp && make',
                    f'3. Convert: python llama.cpp/convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
                    f'4. Quantize: ./llama.cpp/quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
                ],
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'GGUF conversion not available: {str(e)}',
                'instructions': [
                    '1. Install llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
                    '2. Build: cd llama.cpp && make',
                    f'3. Convert: python llama.cpp/convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
                    f'4. Quantize: ./llama.cpp/quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
                ],
            }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }

def main():
    parser = argparse.ArgumentParser(description='Export OneSeek model to GGUF format')
    parser.add_argument('--model-path', required=True, help='Path to the merged model directory')
    parser.add_argument('--output', required=True, help='Output GGUF file path')
    parser.add_argument('--quantization', default='Q5_K_M', choices=list(QUANTIZATION_TYPES.keys()),
                       help='Quantization type (default: Q5_K_M)')
    parser.add_argument('--json-output', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    model_path = Path(args.model_path)
    output_path = Path(args.output)
    
    if not model_path.exists():
        result = {'success': False, 'error': f'Model path does not exist: {model_path}'}
    else:
        result = convert_to_gguf(model_path, output_path, args.quantization)
    
    if args.json_output:
        print(json.dumps(result))
    else:
        if result.get('success'):
            print(f"\n✅ GGUF export successful!")
            print(f"   Output: {result.get('output_path')}")
            print(f"   Quantization: {result.get('quantization')}")
            if result.get('size_bytes'):
                size_mb = result['size_bytes'] / (1024 * 1024)
                print(f"   Size: {size_mb:.1f} MB")
            if result.get('warning'):
                print(f"   ⚠️  Warning: {result.get('warning')}")
        else:
            print(f"\n❌ GGUF export failed: {result.get('error')}")
            if result.get('instructions'):
                print("\nManual steps required:")
                for instruction in result['instructions']:
                    print(f"   {instruction}")
    
    return 0 if result.get('success') else 1

if __name__ == '__main__':
    sys.exit(main())
