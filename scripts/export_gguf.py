#!/usr/bin/env python3
"""
GGUF Export Script for OneSeek Models

Automatically exports merged models to GGUF format with specified quantization.
Uses llama-cpp-python or llama.cpp for conversion and quantization.

Usage:
    python scripts/export_gguf.py --model-path <path> --output <path> --quantization Q5_K_M

Requirements:
    pip install llama-cpp-python --upgrade
    
    # For GPU acceleration (recommended for RTX 2080 Ti):
    pip uninstall llama-cpp-python -y
    CMAKE_ARGS="-DLLAMA_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir
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


def ensure_llama_cpp_python():
    """Ensure llama-cpp-python is installed."""
    try:
        import llama_cpp
        print(f"[GGUF Export] llama-cpp-python version: {llama_cpp.__version__ if hasattr(llama_cpp, '__version__') else 'installed'}")
        return True
    except ImportError:
        print("[GGUF Export] llama-cpp-python not found, attempting to install...")
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'install', 'llama-cpp-python', '--upgrade', '-q'],
                capture_output=True,
                text=True,
                timeout=300
            )
            if result.returncode == 0:
                print("[GGUF Export] llama-cpp-python installed successfully")
                return True
            else:
                print(f"[GGUF Export] Failed to install: {result.stderr}")
                return False
        except Exception as e:
            print(f"[GGUF Export] Installation error: {e}")
            return False


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


def find_llama_cpp():
    """Find llama.cpp installation."""
    # Check common locations
    possible_paths = [
        Path.home() / 'llama.cpp',
        Path('/opt/llama.cpp'),
        Path('./llama.cpp'),
        Path('../llama.cpp'),
        Path('C:/llama.cpp'),
    ]
    
    # Add Windows user paths
    username = os.environ.get('USERNAME', os.environ.get('USER', 'user'))
    possible_paths.append(Path(f'C:/Users/{username}/llama.cpp'))
    possible_paths.append(Path(f'/home/{username}/llama.cpp'))
    
    for p in possible_paths:
        if p.exists() and (p / 'convert_hf_to_gguf.py').exists():
            return p
    
    return None


def find_convert_script():
    """Find the convert script from llama-cpp-python or llama.cpp."""
    # First check if llama-cpp-python has the convert script
    try:
        import llama_cpp
        llama_cpp_path = Path(llama_cpp.__file__).parent
        
        # Check various possible locations within the package
        possible_scripts = [
            llama_cpp_path / 'convert_hf_to_gguf.py',
            llama_cpp_path / 'scripts' / 'convert_hf_to_gguf.py',
            llama_cpp_path.parent / 'convert_hf_to_gguf.py',
        ]
        
        for script in possible_scripts:
            if script.exists():
                return script
    except ImportError:
        pass
    
    # Check site-packages for convert script
    try:
        import site
        for site_dir in site.getsitepackages():
            convert_path = Path(site_dir) / 'llama_cpp' / 'convert_hf_to_gguf.py'
            if convert_path.exists():
                return convert_path
    except:
        pass
    
    # Check local llama.cpp installation
    llama_cpp_dir = find_llama_cpp()
    if llama_cpp_dir:
        convert_script = llama_cpp_dir / 'convert_hf_to_gguf.py'
        if convert_script.exists():
            return convert_script
    
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
        
        if not convert_path.exists() or (datetime.now().timestamp() - convert_path.stat().st_mtime > 86400):
            print(f"[GGUF Export] Downloading convert script from GitHub...")
            urllib.request.urlretrieve(convert_url, convert_path)
            print(f"[GGUF Export] Downloaded to {convert_path}")
        
        return convert_path if convert_path.exists() else None
    except Exception as e:
        print(f"[GGUF Export] Failed to download convert script: {e}")
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
    
    # Ensure required packages are installed
    ensure_llama_cpp_python()
    ensure_gguf_package()
    
    # Find or download the convert script
    convert_script = find_convert_script()
    
    if not convert_script:
        print("[GGUF Export] Convert script not found locally, downloading from GitHub...")
        convert_script = download_convert_script()
    
    if not convert_script or not convert_script.exists():
        return {
            'success': False,
            'error': 'Could not find or download convert script',
            'instructions': get_manual_instructions(model_path, output_path, quantization),
        }
    
    print(f"[GGUF Export] Using convert script: {convert_script}")
    
    # Find llama.cpp for quantization binary
    llama_cpp_dir = find_llama_cpp()
    quantize_bin = find_quantize_binary(llama_cpp_dir) if llama_cpp_dir else None
    
    # Convert to f16 first
    f16_output = output_path.parent / f"{output_path.stem.replace(f'.{quantization}', '')}.f16.gguf"
    
    print(f"[GGUF Export] Step 1: Converting to F16 GGUF...")
    convert_result = run_convert_script(convert_script, model_path, f16_output)
    
    if not convert_result.get('success'):
        return convert_result
    
    if not f16_output.exists():
        return {
            'success': False,
            'error': 'F16 GGUF file was not created',
        }
    
    f16_size = f16_output.stat().st_size / (1024 * 1024)
    print(f"[GGUF Export] F16 GGUF created: {f16_output} ({f16_size:.1f} MB)")
    
    # Try to quantize if binary available
    if quantize_bin:
        print(f"[GGUF Export] Step 2: Quantizing to {quantization}...")
        return run_quantization(f16_output, output_path, quantization, quantize_bin)
    else:
        # No quantize binary - rename f16 to final name
        print(f"[GGUF Export] Quantize binary not found, using F16 output")
        final_output = output_path.parent / f"{output_path.stem.replace(f'.{quantization}', '')}.f16.gguf"
        
        # If output path differs, move the file
        if str(final_output) != str(f16_output):
            shutil.move(str(f16_output), str(final_output))
        
        return {
            'success': True,
            'output_path': str(final_output),
            'quantization': 'f16',
            'size_bytes': final_output.stat().st_size,
            'note': f'Created F16 GGUF. For {quantization} quantization, install llama.cpp and run: llama-quantize "{final_output}" "{output_path}" {quantization}',
        }


def run_convert_script(convert_script: Path, model_path: Path, output_path: Path):
    """Run the convert script to create F16 GGUF."""
    try:
        convert_cmd = [
            sys.executable, str(convert_script),
            str(model_path),
            '--outtype', 'f16',
            '--outfile', str(output_path),
        ]
        
        print(f"[GGUF Export] Running: {' '.join(convert_cmd)}")
        
        result = subprocess.run(
            convert_cmd,
            capture_output=True,
            text=True,
            timeout=3600,  # 1 hour timeout
            cwd=str(model_path.parent),
        )
        
        if result.returncode != 0:
            print(f"[GGUF Export] Convert stderr: {result.stderr}")
            print(f"[GGUF Export] Convert stdout: {result.stdout}")
            return {
                'success': False,
                'error': f'Conversion failed: {result.stderr[:500] if result.stderr else result.stdout[:500]}',
            }
        
        return {'success': True}
        
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


def find_quantize_binary(llama_cpp_path: Path):
    """Find the quantize binary in llama.cpp installation."""
    if not llama_cpp_path:
        return None
        
    possible_paths = [
        llama_cpp_path / 'llama-quantize',
        llama_cpp_path / 'quantize',
        llama_cpp_path / 'build' / 'bin' / 'llama-quantize',
        llama_cpp_path / 'build' / 'bin' / 'quantize',
        llama_cpp_path / 'build' / 'bin' / 'Release' / 'llama-quantize.exe',
        llama_cpp_path / 'build' / 'bin' / 'Release' / 'quantize.exe',
        llama_cpp_path / 'build' / 'llama-quantize',
        llama_cpp_path / 'build' / 'quantize',
    ]
    
    for p in possible_paths:
        if p.exists():
            print(f"[GGUF Export] Found quantize binary: {p}")
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
        
        print(f"[GGUF Export] Running: {' '.join(quantize_cmd)}")
        
        result = subprocess.run(quantize_cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode != 0:
            # If quantization fails, keep the f16 version
            print(f"[GGUF Export] Quantization failed: {result.stderr}")
            return {
                'success': True,
                'output_path': str(f16_path),
                'quantization': 'f16',
                'size_bytes': f16_path.stat().st_size,
                'warning': f'Quantization failed, using F16: {result.stderr[:200]}',
            }
        
        # Clean up intermediate f16 file
        if f16_path.exists() and output_path.exists() and str(f16_path) != str(output_path):
            f16_path.unlink()
        
        if not output_path.exists():
            return {
                'success': False,
                'error': 'Quantized file was not created',
            }
        
        size_mb = output_path.stat().st_size / (1024 * 1024)
        print(f"[GGUF Export] ✅ Quantized GGUF created: {output_path} ({size_mb:.1f} MB)")
        
        return {
            'success': True,
            'output_path': str(output_path),
            'quantization': quantization,
            'size_bytes': output_path.stat().st_size,
        }
        
    except Exception as e:
        # If anything fails, try to return f16
        if f16_path.exists():
            return {
                'success': True,
                'output_path': str(f16_path),
                'quantization': 'f16',
                'size_bytes': f16_path.stat().st_size,
                'warning': f'Quantization error, using F16: {str(e)}',
            }
        return {
            'success': False,
            'error': str(e),
        }


def get_manual_instructions(model_path: Path, output_path: Path, quantization: str):
    """Get manual instructions for GGUF conversion."""
    return [
        '1. Install llama-cpp-python: pip install llama-cpp-python --upgrade',
        '   For GPU acceleration: CMAKE_ARGS="-DLLAMA_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir',
        '2. Or clone llama.cpp: git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make',
        f'3. Convert: python convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
        f'4. Quantize: llama-quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
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
