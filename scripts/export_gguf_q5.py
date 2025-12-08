#!/usr/bin/env python3
"""
Combined GGUF Q5 Export Script (2-step process)

Performs complete export from HuggingFace model to Q5 quantized GGUF:
  Step 1: Convert HF model to F16 GGUF
  Step 2: Quantize F16 GGUF to Q5

Usage:
    python scripts/export_gguf_q5.py --src <model-path> --out <output-q5-gguf>
    
Example:
    python scripts/export_gguf_q5.py --src models/oneseek-7b-zero/weights --out models/oneseek-7b-zero-q5.gguf

This script combines export_gguf_f16.py and quantize_q5.py for convenience.
"""

import argparse
import json
import sys
import tempfile
import os
from pathlib import Path

# Import the two-step functions
sys.path.insert(0, os.path.dirname(__file__))

from export_gguf_f16 import convert_to_f16_gguf, setup_utf8_encoding
from quantize_q5 import find_quantize_binary, quantize_to_q5


def export_gguf_q5(model_path: Path, output_path: Path, quantization_type: str = 'Q5_K_M', 
                   keep_f16: bool = False):
    """
    Complete 2-step export from HF model to Q5 GGUF.
    
    Args:
        model_path: Path to HuggingFace model directory
        output_path: Path for output Q5 GGUF file
        quantization_type: Type of Q5 quantization (Q5_K_M, Q5_K_S, Q5_0)
        keep_f16: If True, keep intermediate F16 file
    
    Returns:
        dict with success status and details
    """
    print("="*60)
    print("TWO-STEP GGUF Q5 EXPORT")
    print("="*60)
    print(f"Source: {model_path}")
    print(f"Output: {output_path}")
    print(f"Quantization: {quantization_type}")
    print("="*60)
    
    # Determine F16 intermediate path
    if keep_f16:
        f16_path = output_path.parent / f"{output_path.stem}_f16.gguf"
    else:
        # Use temp directory for F16 file
        temp_dir = Path(tempfile.gettempdir()) / 'gguf_export'
        temp_dir.mkdir(exist_ok=True)
        f16_path = temp_dir / f"{output_path.stem}_f16.gguf"
    
    print(f"\n[Step 1/2] Converting to F16 GGUF...")
    print(f"Intermediate F16 file: {f16_path}")
    print("-" * 60)
    
    # Step 1: Convert to F16
    f16_result = convert_to_f16_gguf(model_path, f16_path)
    
    if not f16_result['success']:
        return {
            'success': False,
            'error': f"Step 1 failed: {f16_result['error']}",
            'step': 1,
            'details': f16_result
        }
    
    print(f"\n✓ Step 1 complete: F16 GGUF created ({f16_result['size_gb']:.2f} GB)")
    
    # Step 2: Quantize to Q5
    print(f"\n[Step 2/2] Quantizing to {quantization_type}...")
    print("-" * 60)
    
    # Find llama-quantize binary
    quantize_bin = find_quantize_binary()
    
    if not quantize_bin:
        # Clean up F16 if not keeping
        if not keep_f16 and f16_path.exists():
            try:
                f16_path.unlink()
                print(f"Cleaned up intermediate F16 file")
            except:
                pass
        
        return {
            'success': False,
            'error': 'llama-quantize binary not found',
            'step': 2,
            'instructions': [
                'llama-quantize binary is required for Q5 quantization.',
                '',
                'Windows: Set LLAMA_QUANTIZE_PATH or place binary at:',
                '  %USERPROFILE%\\Documents\\GitHub\\CivicAI\\llama.cpp-bin-cuda\\llama-quantize.exe',
                '',
                'Linux/macOS: Install llama.cpp and add to PATH or set LLAMA_QUANTIZE_PATH',
                '',
                'Download: https://github.com/ggerganov/llama.cpp/releases',
            ]
        }
    
    q5_result = quantize_to_q5(f16_path, output_path, quantization_type, quantize_bin)
    
    # Clean up F16 if not keeping and quantization succeeded
    if not keep_f16 and f16_path.exists():
        try:
            if q5_result['success']:
                f16_path.unlink()
                print(f"\nCleaned up intermediate F16 file: {f16_path}")
            else:
                print(f"\nKeeping F16 file due to quantization failure: {f16_path}")
        except Exception as e:
            print(f"\nWarning: Could not delete F16 file: {e}")
    
    if not q5_result['success']:
        return {
            'success': False,
            'error': f"Step 2 failed: {q5_result['error']}",
            'step': 2,
            'details': q5_result,
            'f16_path': str(f16_path) if f16_path.exists() else None,
        }
    
    print(f"\n✓ Step 2 complete: Q5 GGUF created ({q5_result['output_size_gb']:.2f} GB)")
    
    # Success
    return {
        'success': True,
        'output_path': str(output_path),
        'quantization_type': quantization_type,
        'f16_size_gb': f16_result['size_gb'],
        'q5_size_gb': q5_result['output_size_gb'],
        'reduction_percent': q5_result['reduction_percent'],
        'f16_kept': keep_f16,
        'f16_path': str(f16_path) if keep_f16 and f16_path.exists() else None,
    }


def main():
    # Setup UTF-8 encoding when run as main script
    setup_utf8_encoding()
    
    parser = argparse.ArgumentParser(
        description='Export HuggingFace model to Q5 GGUF (2-step process)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script performs a complete 2-step export:
  1. Convert HuggingFace model to F16 GGUF (~14 GB for 7B model)
  2. Quantize F16 GGUF to Q5 (~6-7 GB for 7B model)

The intermediate F16 file is automatically deleted unless --keep-f16 is specified.

Quantization Types:
  Q5_K_M - Q5 K-quant, medium (default, best balance)
  Q5_K_S - Q5 K-quant, small (smaller size)
  Q5_K   - Q5 K-quant (alias for Q5_K_M)
  Q5_0   - Q5 standard (older format)

Requirements:
  - Python 3.8+
  - gguf package (auto-installed)
  - llama.cpp convert script (auto-downloaded)
  - llama-quantize binary (must be available)

Examples:
  # Basic usage
  python scripts/export_gguf_q5.py --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf
  
  # Specify quantization type
  python scripts/export_gguf_q5.py --src ./model --out output/model_q5.gguf --type Q5_K_S
  
  # Keep intermediate F16 file
  python scripts/export_gguf_q5.py --src ./model --out model_q5.gguf --keep-f16
        """
    )
    
    parser.add_argument('--src', required=True, help='Source HuggingFace model directory')
    parser.add_argument('--out', required=True, help='Output Q5 GGUF file path')
    parser.add_argument('--type', default='Q5_K_M',
                       choices=['Q5_0', 'Q5_K', 'Q5_K_M', 'Q5_K_S'],
                       help='Quantization type (default: Q5_K_M)')
    parser.add_argument('--keep-f16', action='store_true',
                       help='Keep intermediate F16 GGUF file')
    parser.add_argument('--json-output', action='store_true',
                       help='Output result as JSON')
    
    args = parser.parse_args()
    
    model_path = Path(args.src)
    output_path = Path(args.out)
    
    result = export_gguf_q5(model_path, output_path, args.type, args.keep_f16)
    
    if args.json_output:
        print(json.dumps(result))
    else:
        print("\n" + "="*60)
        if result['success']:
            print("✓ Q5 GGUF EXPORT COMPLETE")
            print("="*60)
            print(f"Output file: {result['output_path']}")
            print(f"F16 size: {result['f16_size_gb']:.2f} GB")
            print(f"Q5 size: {result['q5_size_gb']:.2f} GB")
            print(f"Reduction: {result['reduction_percent']:.1f}%")
            print(f"Type: {result['quantization_type']}")
            if result['f16_kept']:
                print(f"F16 file kept: {result['f16_path']}")
            print("\n✓ Your Q5 GGUF model is ready to use!")
        else:
            print("✗ Q5 GGUF EXPORT FAILED")
            print("="*60)
            print(f"Failed at: Step {result.get('step', 'unknown')}")
            print(f"Error: {result['error']}")
            if result.get('instructions'):
                print("\nInstructions:")
                for instruction in result['instructions']:
                    print(f"  {instruction}")
            if result.get('f16_path'):
                print(f"\nIntermediate F16 file: {result['f16_path']}")
        print("="*60)
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
