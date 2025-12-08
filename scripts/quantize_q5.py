#!/usr/bin/env python3
"""
GGUF Q5 Quantization Script (Step 2 of 2-step GGUF export)

Quantizes an F16 GGUF file to Q5 using llama-quantize binary from llama.cpp.
This is the second step after F16 export.

Usage:
    python scripts/quantize_q5.py --src <f16-gguf> --out <output-q5-gguf>
    
Example:
    python scripts/quantize_q5.py --src models/oneseek-7b-zero-f16.gguf --out models/oneseek-7b-zero-q5.gguf --type Q5_K_M

Environment Variables:
    LLAMA_QUANTIZE_PATH - Path to llama-quantize binary (overrides default search)

Windows Default Path:
    C:\\Users\\robin\\Documents\\GitHub\\CivicAI\\llama.cpp-bin-cuda\\llama-quantize.exe

Requirements:
    - llama-quantize binary from llama.cpp (pre-built or compiled)
    - F16 GGUF file from export_gguf_f16.py
"""

import argparse
import json
import os
import sys
import subprocess
import shutil
from pathlib import Path


def find_quantize_binary():
    """
    Find the llama-quantize binary.
    
    Search order:
    1. LLAMA_QUANTIZE_PATH environment variable
    2. Windows: C:\\Users\\robin\\Documents\\GitHub\\CivicAI\\llama.cpp-bin-cuda\\llama-quantize.exe
    3. System PATH
    4. Common local paths (./llama.cpp-bin-cuda/, ./llama.cpp/)
    """
    # Check environment variable
    env_path = os.environ.get('LLAMA_QUANTIZE_PATH')
    if env_path:
        env_bin = Path(env_path)
        if env_bin.exists():
            print(f"[Q5 Quantize] Using llama-quantize from LLAMA_QUANTIZE_PATH: {env_bin}")
            return env_bin
        else:
            print(f"[Q5 Quantize] Warning: LLAMA_QUANTIZE_PATH set but file not found: {env_path}")
    
    # Windows default path
    if os.name == 'nt':
        username = os.environ.get('USERNAME', 'user')
        windows_default = Path(f'C:/Users/{username}/Documents/GitHub/CivicAI/llama.cpp-bin-cuda/llama-quantize.exe')
        if windows_default.exists():
            print(f"[Q5 Quantize] Using llama-quantize from default Windows path: {windows_default}")
            return windows_default
    
    # Check system PATH
    quantize_in_path = shutil.which('llama-quantize') or shutil.which('quantize')
    if quantize_in_path:
        print(f"[Q5 Quantize] Found llama-quantize in PATH: {quantize_in_path}")
        return Path(quantize_in_path)
    
    # Check common local paths
    possible_paths = [
        Path('./llama.cpp-bin-cuda/llama-quantize.exe'),
        Path('./llama.cpp-bin-cuda/llama-quantize'),
        Path('./llama.cpp/build/bin/llama-quantize.exe'),
        Path('./llama.cpp/build/bin/llama-quantize'),
        Path('./llama.cpp/llama-quantize'),
        Path('../llama.cpp-bin-cuda/llama-quantize.exe'),
        Path('../llama.cpp-bin-cuda/llama-quantize'),
        Path('../llama.cpp/build/bin/llama-quantize'),
        Path(Path.home() / 'llama.cpp' / 'build' / 'bin' / 'llama-quantize'),
    ]
    
    for p in possible_paths:
        if p.exists():
            print(f"[Q5 Quantize] Found llama-quantize: {p}")
            return p
    
    return None


def verify_quantize_binary(quantize_bin: Path):
    """Verify that the llama-quantize binary works."""
    try:
        result = subprocess.run(
            [str(quantize_bin), '--help'],
            capture_output=True,
            text=True,
            timeout=10
        )
        # llama-quantize may return non-zero even for --help, check output instead
        if 'usage' in result.stdout.lower() or 'usage' in result.stderr.lower():
            print(f"[Q5 Quantize] Binary verification successful")
            return True
        else:
            print(f"[Q5 Quantize] Warning: Binary may not be working correctly")
            print(f"[Q5 Quantize] stdout: {result.stdout[:200]}")
            print(f"[Q5 Quantize] stderr: {result.stderr[:200]}")
            return True  # Still try to use it
    except Exception as e:
        print(f"[Q5 Quantize] Warning: Could not verify binary: {e}")
        return False


def quantize_to_q5(f16_path: Path, output_path: Path, quantization_type: str, quantize_bin: Path):
    """
    Quantize F16 GGUF to Q5.
    
    Args:
        f16_path: Path to F16 GGUF file
        output_path: Path for output quantized GGUF file
        quantization_type: Type of quantization (Q5_0, Q5_K, Q5_K_M, Q5_K_S)
        quantize_bin: Path to llama-quantize binary
    
    Returns:
        dict with success status and details
    """
    print(f"[Q5 Quantize] Starting quantization...")
    print(f"  Input (F16): {f16_path}")
    print(f"  Output: {output_path}")
    print(f"  Type: {quantization_type}")
    print(f"  Binary: {quantize_bin}")
    
    # Validate inputs
    if not f16_path.exists():
        return {
            'success': False,
            'error': f'Input F16 GGUF file not found: {f16_path}'
        }
    
    # Get input file size
    input_size = f16_path.stat().st_size
    input_size_mb = input_size / (1024 * 1024)
    input_size_gb = input_size_mb / 1024
    
    print(f"[Q5 Quantize] Input file size: {input_size_gb:.2f} GB ({input_size_mb:.1f} MB)")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Verify binary
    if not verify_quantize_binary(quantize_bin):
        print(f"[Q5 Quantize] Warning: Binary verification failed, attempting anyway...")
    
    # Run quantization
    try:
        quantize_cmd = [
            str(quantize_bin),
            str(f16_path),
            str(output_path),
            quantization_type,
        ]
        
        print(f"[Q5 Quantize] Running: {' '.join(quantize_cmd)}")
        print(f"[Q5 Quantize] This may take several minutes...")
        
        result = subprocess.run(
            quantize_cmd,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
            if not error_msg:
                error_msg = f'llama-quantize exited with code {result.returncode}'
            
            print(f"[Q5 Quantize] Quantization failed!")
            print(f"[Q5 Quantize] Error: {error_msg}")
            
            return {
                'success': False,
                'error': f'Quantization failed: {error_msg}',
                'instructions': [
                    'Troubleshooting:',
                    '  1. Check that llama-quantize binary is correct version',
                    '  2. Verify F16 GGUF file is not corrupted',
                    '  3. Ensure enough disk space for output file',
                    '  4. Try different quantization type (Q5_K_M, Q5_K_S, Q5_0)',
                    '',
                    'On Windows with CUDA issues, try CPU/AVX2 build instead:',
                    '  Download from: https://github.com/ggerganov/llama.cpp/releases',
                    '  Set LLAMA_QUANTIZE_PATH to the AVX2 binary',
                ]
            }
        
        # Verify output exists
        if not output_path.exists():
            return {
                'success': False,
                'error': 'Output file was not created'
            }
        
        # Get output file size
        output_size = output_path.stat().st_size
        output_size_mb = output_size / (1024 * 1024)
        output_size_gb = output_size_mb / 1024
        
        # Calculate reduction
        reduction_percent = ((input_size - output_size) / input_size) * 100
        
        print(f"[Q5 Quantize] ✓ Quantization successful!")
        print(f"[Q5 Quantize]   Input size: {input_size_gb:.2f} GB")
        print(f"[Q5 Quantize]   Output size: {output_size_gb:.2f} GB")
        print(f"[Q5 Quantize]   Reduction: {reduction_percent:.1f}%")
        
        return {
            'success': True,
            'output_path': str(output_path),
            'input_size_bytes': input_size,
            'output_size_bytes': output_size,
            'input_size_gb': input_size_gb,
            'output_size_gb': output_size_gb,
            'reduction_percent': reduction_percent,
            'quantization_type': quantization_type,
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Quantization timed out after 1 hour'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Quantization error: {str(e)}'
        }


def main():
    parser = argparse.ArgumentParser(
        description='Quantize F16 GGUF to Q5 using llama-quantize (Step 2 of 2)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Quantization Types:
  Q5_K_M - Q5 K-quant, medium (default, recommended)
  Q5_K_S - Q5 K-quant, small
  Q5_K   - Q5 K-quant (alias for Q5_K_M)
  Q5_0   - Q5 standard quantization

Environment Variables:
  LLAMA_QUANTIZE_PATH - Override default binary path
  
Examples:
  # Default Q5_K_M quantization
  python scripts/quantize_q5.py --src models/model_f16.gguf --out models/model_q5.gguf
  
  # Specific quantization type
  python scripts/quantize_q5.py --src model_f16.gguf --out model_q5.gguf --type Q5_K_S
  
  # With custom binary path (Windows)
  set LLAMA_QUANTIZE_PATH=C:\\path\\to\\llama-quantize.exe
  python scripts/quantize_q5.py --src model_f16.gguf --out model_q5.gguf
  
  # With custom binary path (Linux/macOS)
  export LLAMA_QUANTIZE_PATH=/path/to/llama-quantize
  python scripts/quantize_q5.py --src model_f16.gguf --out model_q5.gguf
        """
    )
    
    parser.add_argument('--src', required=True, help='Source F16 GGUF file')
    parser.add_argument('--out', required=True, help='Output Q5 GGUF file path')
    parser.add_argument('--type', default='Q5_K_M', 
                       choices=['Q5_0', 'Q5_K', 'Q5_K_M', 'Q5_K_S'],
                       help='Quantization type (default: Q5_K_M)')
    parser.add_argument('--json-output', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    f16_path = Path(args.src)
    output_path = Path(args.out)
    
    # Find llama-quantize binary
    quantize_bin = find_quantize_binary()
    
    if not quantize_bin:
        result = {
            'success': False,
            'error': 'llama-quantize binary not found',
            'instructions': [
                'llama-quantize binary is required for Q5 quantization.',
                '',
                'Windows users:',
                f'  1. Download pre-built llama.cpp CUDA binaries',
                f'  2. Extract to %USERPROFILE%\\Documents\\GitHub\\CivicAI\\llama.cpp-bin-cuda\\',
                f'  3. Or set LLAMA_QUANTIZE_PATH environment variable to binary location',
                '',
                'Linux/macOS users:',
                '  1. Install from package manager or build from source:',
                '     git clone https://github.com/ggerganov/llama.cpp',
                '     cd llama.cpp && make',
                '  2. Add llama-quantize to PATH, or',
                '  3. Set LLAMA_QUANTIZE_PATH environment variable',
                '',
                'Download pre-built binaries:',
                '  https://github.com/ggerganov/llama.cpp/releases',
            ]
        }
    else:
        result = quantize_to_q5(f16_path, output_path, args.type, quantize_bin)
    
    if args.json_output:
        print(json.dumps(result))
    else:
        print("\n" + "="*60)
        if result['success']:
            print("✓ Q5 QUANTIZATION SUCCESSFUL")
            print("="*60)
            print(f"Output file: {result['output_path']}")
            print(f"Input size: {result['input_size_gb']:.2f} GB")
            print(f"Output size: {result['output_size_gb']:.2f} GB")
            print(f"Reduction: {result['reduction_percent']:.1f}%")
            print(f"Type: {result['quantization_type']}")
            print("\nYour quantized GGUF model is ready to use!")
        else:
            print("✗ Q5 QUANTIZATION FAILED")
            print("="*60)
            print(f"Error: {result['error']}")
            if result.get('instructions'):
                print("\nInstructions:")
                for instruction in result['instructions']:
                    print(f"  {instruction}")
        print("="*60)
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
