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
    """Find llama.cpp installation."""
    # Check common locations
    possible_paths = [
        Path.home() / 'llama.cpp',
        Path('/opt/llama.cpp'),
        Path('./llama.cpp'),
        Path('../llama.cpp'),
        Path('C:/llama.cpp'),
        Path('C:/Users') / os.environ.get('USERNAME', 'user') / 'llama.cpp',
    ]
    
    for p in possible_paths:
        if p.exists() and (p / 'convert_hf_to_gguf.py').exists():
            return p
        # Also check for older convert.py
        if p.exists() and (p / 'convert.py').exists():
            return p
    
    return None


def download_convert_script():
    """Download the llama.cpp convert script from GitHub."""
    try:
        import urllib.request
        
        # Create a local directory for llama.cpp scripts
        script_dir = Path(__file__).parent / 'llama_cpp_scripts'
        script_dir.mkdir(exist_ok=True)
        
        # Download convert_hf_to_gguf.py
        convert_url = 'https://raw.githubusercontent.com/ggerganov/llama.cpp/master/convert_hf_to_gguf.py'
        convert_path = script_dir / 'convert_hf_to_gguf.py'
        
        if not convert_path.exists():
            print(f"[GGUF Export] Downloading convert script from GitHub...")
            urllib.request.urlretrieve(convert_url, convert_path)
            print(f"[GGUF Export] Downloaded to {convert_path}")
        
        return convert_path if convert_path.exists() else None
    except Exception as e:
        print(f"[GGUF Export] Failed to download convert script: {e}")
        return None


def ensure_gguf_package():
    """Ensure gguf package is installed."""
    try:
        import gguf
        return True
    except ImportError:
        print("[GGUF Export] Installing gguf package...")
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'gguf', '-q'],
            capture_output=True
        )
        return result.returncode == 0


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
    
    # Find llama.cpp local installation
    llama_cpp_path = find_llama_cpp()
    
    if llama_cpp_path:
        print(f"[GGUF Export] Found llama.cpp at: {llama_cpp_path}")
        return convert_with_llama_cpp(model_path, output_path, quantization, llama_cpp_path)
    
    # Try to download and use the convert script
    print("[GGUF Export] llama.cpp not found locally, trying to download convert script...")
    
    # Ensure gguf package is installed
    if not ensure_gguf_package():
        print("[GGUF Export] Could not install gguf package")
    
    convert_script = download_convert_script()
    
    if convert_script and convert_script.exists():
        print(f"[GGUF Export] Using downloaded script: {convert_script}")
        return convert_with_script(model_path, output_path, quantization, convert_script)
    
    # Last resort: provide manual instructions
    return {
        'success': False,
        'error': 'llama.cpp not found and could not download convert script',
        'instructions': get_manual_instructions(model_path, output_path, quantization),
    }


def convert_with_llama_cpp(model_path: Path, output_path: Path, quantization: str, llama_cpp_path: Path):
    """Convert using local llama.cpp installation."""
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
        f16_output = output_path.parent / f"{output_path.stem}.f16.gguf"
        
        print(f"[GGUF Export] Step 1: Converting to F16 GGUF...")
        convert_cmd = [
            sys.executable, str(convert_script),
            str(model_path),
            '--outtype', 'f16',
            '--outfile', str(f16_output),
        ]
        
        result = subprocess.run(convert_cmd, capture_output=True, text=True, timeout=3600)
        if result.returncode != 0:
            return {
                'success': False,
                'error': f'F16 conversion failed: {result.stderr}',
                'stdout': result.stdout,
            }
        
        if not f16_output.exists():
            return {
                'success': False,
                'error': 'F16 GGUF file was not created',
            }
        
        print(f"[GGUF Export] F16 GGUF created: {f16_output} ({f16_output.stat().st_size / 1024 / 1024:.1f} MB)")
        
        # Find quantize binary
        quantize_bin = find_quantize_binary(llama_cpp_path)
        
        if quantize_bin:
            print(f"[GGUF Export] Step 2: Quantizing to {quantization}...")
            return run_quantization(f16_output, output_path, quantization, quantize_bin)
        else:
            # No quantize binary, rename f16 to final output
            print("[GGUF Export] Quantize binary not found, using F16 output")
            shutil.move(str(f16_output), str(output_path))
            return {
                'success': True,
                'output_path': str(output_path),
                'quantization': 'f16',
                'size_bytes': output_path.stat().st_size,
                'note': f'Converted to F16. For {quantization} quantization, compile llama.cpp and use the quantize binary.',
            }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Conversion timed out after 1 hour',
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
        }


def convert_with_script(model_path: Path, output_path: Path, quantization: str, convert_script: Path):
    """Convert using downloaded convert script."""
    try:
        # Convert to f16 (quantization needs the binary which we don't have)
        f16_output = output_path.parent / f"{output_path.stem}.f16.gguf"
        
        print(f"[GGUF Export] Converting to F16 GGUF using downloaded script...")
        convert_cmd = [
            sys.executable, str(convert_script),
            str(model_path),
            '--outtype', 'f16',
            '--outfile', str(f16_output),
        ]
        
        result = subprocess.run(convert_cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode != 0:
            print(f"[GGUF Export] Script failed with stderr: {result.stderr}")
            print(f"[GGUF Export] Script stdout: {result.stdout}")
            return {
                'success': False,
                'error': f'Conversion failed: {result.stderr[:500]}',
                'instructions': get_manual_instructions(model_path, output_path, quantization),
            }
        
        if not f16_output.exists():
            return {
                'success': False,
                'error': 'GGUF file was not created',
                'instructions': get_manual_instructions(model_path, output_path, quantization),
            }
        
        # Rename f16 to final output (can't quantize without binary)
        final_output = output_path.parent / f"{output_path.stem}.gguf"
        shutil.move(str(f16_output), str(final_output))
        
        size_bytes = final_output.stat().st_size
        print(f"[GGUF Export] ✅ GGUF created: {final_output} ({size_bytes / 1024 / 1024:.1f} MB)")
        
        return {
            'success': True,
            'output_path': str(final_output),
            'quantization': 'f16',
            'size_bytes': size_bytes,
            'note': f'Created F16 GGUF. For {quantization} quantization, compile llama.cpp quantize binary.',
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Conversion timed out after 1 hour',
        }
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc(),
        }


def find_quantize_binary(llama_cpp_path: Path):
    """Find the quantize binary in llama.cpp installation."""
    possible_paths = [
        llama_cpp_path / 'quantize',
        llama_cpp_path / 'build' / 'bin' / 'quantize',
        llama_cpp_path / 'build' / 'bin' / 'Release' / 'quantize.exe',
        llama_cpp_path / 'build' / 'quantize',
        llama_cpp_path / 'llama-quantize',
        llama_cpp_path / 'build' / 'bin' / 'llama-quantize',
    ]
    
    for p in possible_paths:
        if p.exists():
            return p
    
    return None


def run_quantization(f16_path: Path, output_path: Path, quantization: str, quantize_bin: Path):
    """Run quantization on F16 GGUF file."""
    try:
        quantize_cmd = [
            str(quantize_bin),
            str(f16_path),
            str(output_path),
            quantization,
        ]
        
        result = subprocess.run(quantize_cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode != 0:
            # If quantization fails, keep the f16 version
            print(f"[GGUF Export] Quantization failed: {result.stderr}")
            shutil.move(str(f16_path), str(output_path))
            return {
                'success': True,
                'output_path': str(output_path),
                'quantization': 'f16',
                'size_bytes': output_path.stat().st_size,
                'warning': f'Quantization failed, using F16: {result.stderr[:200]}',
            }
        
        # Clean up intermediate f16 file
        if f16_path.exists():
            f16_path.unlink()
        
        if not output_path.exists():
            return {
                'success': False,
                'error': 'Quantized file was not created',
            }
        
        return {
            'success': True,
            'output_path': str(output_path),
            'quantization': quantization,
            'size_bytes': output_path.stat().st_size,
        }
        
    except Exception as e:
        # If anything fails, try to keep f16
        if f16_path.exists():
            shutil.move(str(f16_path), str(output_path))
            return {
                'success': True,
                'output_path': str(output_path),
                'quantization': 'f16',
                'size_bytes': output_path.stat().st_size,
                'warning': f'Quantization error, using F16: {str(e)}',
            }
        return {
            'success': False,
            'error': str(e),
        }


def get_manual_instructions(model_path: Path, output_path: Path, quantization: str):
    """Get manual instructions for GGUF conversion."""
    return [
        '1. Clone llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
        '2. Build: cd llama.cpp && make',
        f'3. Convert: python llama.cpp/convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
        f'4. Quantize: ./llama.cpp/llama-quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
    ]


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
            if result.get('note'):
                print(f"   ℹ️  Note: {result.get('note')}")
        else:
            print(f"\n❌ GGUF export failed: {result.get('error')}")
            if result.get('instructions'):
                print("\nManual steps required:")
                for instruction in result['instructions']:
                    print(f"   {instruction}")
    
    return 0 if result.get('success') else 1


if __name__ == '__main__':
    sys.exit(main())
