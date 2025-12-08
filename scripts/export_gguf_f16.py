#!/usr/bin/env python3
"""
GGUF F16 Export Script (Step 1 of 2-step GGUF export)

Exports a HuggingFace model to GGUF format in F16 precision.
This is the first step before quantization to Q5 using llama-quantize.

Usage:
    python scripts/export_gguf_f16.py --src <model-path> --out <output-path>
    
Example:
    python scripts/export_gguf_f16.py --src models/oneseek-7b-zero/weights --out models/oneseek-7b-zero-f16.gguf

Requirements:
    - Python 3.8+
    - gguf package (pip install gguf)
    - Access to llama.cpp convert script
"""

import argparse
import json
import os
import sys
import subprocess
import urllib.request
import zipfile
import io
from pathlib import Path
from datetime import datetime


def setup_utf8_encoding():
    """Setup UTF-8 encoding on Windows to handle Unicode characters."""
    if sys.platform == 'win32':
        import codecs
        if sys.stdout.encoding != 'utf-8':
            sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
        if sys.stderr.encoding != 'utf-8':
            sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')


def ensure_gguf_package():
    """Ensure gguf package is installed."""
    try:
        import gguf
        print(f"[F16 Export] gguf package found: {gguf.__version__ if hasattr(gguf, '__version__') else 'installed'}")
        return True
    except ImportError:
        print("[F16 Export] Installing gguf package...")
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'gguf', '-q'],
            capture_output=True
        )
        return result.returncode == 0


def find_convert_script():
    """Find the convert_hf_to_gguf.py script."""
    # Check if script exists in llama.cpp installation
    possible_paths = [
        Path.home() / 'llama.cpp' / 'convert_hf_to_gguf.py',
        Path('./llama.cpp/convert_hf_to_gguf.py'),
        Path('../llama.cpp/convert_hf_to_gguf.py'),
    ]
    
    # Add Windows user paths
    username = os.environ.get('USERNAME', os.environ.get('USER', 'user'))
    if os.name == 'nt':
        possible_paths.extend([
            Path(f'C:/Users/{username}/llama.cpp/convert_hf_to_gguf.py'),
            Path(f'C:/Users/{username}/Documents/GitHub/llama.cpp/convert_hf_to_gguf.py'),
        ])
    
    for p in possible_paths:
        if p.exists():
            print(f"[F16 Export] Found convert script: {p}")
            return p
    
    # Check in scripts directory cache
    script_dir = Path(__file__).parent / 'llama_cpp_scripts'
    cached_script = script_dir / 'convert_hf_to_gguf.py'
    if cached_script.exists():
        print(f"[F16 Export] Found cached convert script: {cached_script}")
        return cached_script
    
    return None


def download_convert_script():
    """Download the llama.cpp convert script from GitHub."""
    try:
        script_dir = Path(__file__).parent / 'llama_cpp_scripts'
        script_dir.mkdir(exist_ok=True)
        
        convert_path = script_dir / 'convert_hf_to_gguf.py'
        gguf_py_dir = script_dir / 'gguf-py'
        
        print(f"[F16 Export] Downloading llama.cpp convert script...")
        
        # Download the main convert script
        convert_url = 'https://raw.githubusercontent.com/ggerganov/llama.cpp/master/convert_hf_to_gguf.py'
        urllib.request.urlretrieve(convert_url, convert_path)
        print(f"[F16 Export] Downloaded convert_hf_to_gguf.py")
        
        # Download gguf-py module
        print(f"[F16 Export] Downloading gguf-py module...")
        gguf_zip_url = 'https://github.com/ggerganov/llama.cpp/archive/refs/heads/master.zip'
        
        with urllib.request.urlopen(gguf_zip_url, timeout=120) as response:
            zip_data = io.BytesIO(response.read())
        
        with zipfile.ZipFile(zip_data, 'r') as zip_ref:
            # Extract only gguf-py directory
            for member in zip_ref.namelist():
                if 'gguf-py/' in member:
                    relative_path = member.split('gguf-py/', 1)
                    if len(relative_path) > 1 and relative_path[1]:
                        target_path = gguf_py_dir / relative_path[1]
                        if member.endswith('/'):
                            target_path.mkdir(parents=True, exist_ok=True)
                        else:
                            target_path.parent.mkdir(parents=True, exist_ok=True)
                            with zip_ref.open(member) as source:
                                with open(target_path, 'wb') as target:
                                    target.write(source.read())
        
        print(f"[F16 Export] Downloaded gguf-py module")
        return convert_path if convert_path.exists() else None
        
    except Exception as e:
        print(f"[F16 Export] Failed to download convert script: {e}")
        return None


def convert_to_f16_gguf(model_path: Path, output_path: Path):
    """
    Convert a HuggingFace model to F16 GGUF format.
    
    Args:
        model_path: Path to the HuggingFace model directory
        output_path: Path for the output F16 GGUF file
    
    Returns:
        dict with success status and details
    """
    print(f"[F16 Export] Starting F16 GGUF export...")
    print(f"  Source: {model_path}")
    print(f"  Output: {output_path}")
    
    # Validate inputs
    if not model_path.exists():
        return {
            'success': False,
            'error': f'Model path does not exist: {model_path}'
        }
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Ensure required packages
    if not ensure_gguf_package():
        return {
            'success': False,
            'error': 'Failed to install gguf package'
        }
    
    # Find or download convert script
    convert_script = find_convert_script()
    if not convert_script:
        print("[F16 Export] Convert script not found, downloading...")
        convert_script = download_convert_script()
    
    if not convert_script or not convert_script.exists():
        return {
            'success': False,
            'error': 'Could not find or download convert_hf_to_gguf.py',
            'instructions': [
                'Manual steps:',
                '1. Clone llama.cpp: git clone https://github.com/ggerganov/llama.cpp',
                '2. Run conversion:',
                f'   python llama.cpp/convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path}"',
            ]
        }
    
    print(f"[F16 Export] Using convert script: {convert_script}")
    
    # Run conversion
    try:
        convert_cmd = [
            sys.executable,
            str(convert_script),
            str(model_path),
            '--outtype', 'f16',
            '--outfile', str(output_path),
        ]
        
        print(f"[F16 Export] Running: {' '.join(convert_cmd)}")
        
        # Set up environment with gguf-py in path
        env = os.environ.copy()
        gguf_py_dir = Path(__file__).parent / 'llama_cpp_scripts' / 'gguf-py'
        if gguf_py_dir.exists():
            existing_path = env.get('PYTHONPATH', '')
            env['PYTHONPATH'] = f"{gguf_py_dir}{os.pathsep}{existing_path}" if existing_path else str(gguf_py_dir)
        
        result = subprocess.run(
            convert_cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace',  # Replace characters that can't be encoded
            timeout=3600,  # 1 hour timeout
            env=env,
        )
        
        if result.returncode != 0:
            print(f"[F16 Export] Conversion failed!")
            print(f"[F16 Export] stderr: {result.stderr}")
            print(f"[F16 Export] stdout: {result.stdout}")
            return {
                'success': False,
                'error': f'Conversion failed: {result.stderr[:500] if result.stderr else result.stdout[:500]}'
            }
        
        # Verify output exists
        if not output_path.exists():
            return {
                'success': False,
                'error': 'Output file was not created'
            }
        
        # Get file size
        size_bytes = output_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        size_gb = size_mb / 1024
        
        print(f"[F16 Export] ✓ Conversion successful!")
        print(f"[F16 Export]   Output: {output_path}")
        print(f"[F16 Export]   Size: {size_gb:.2f} GB ({size_mb:.1f} MB)")
        
        return {
            'success': True,
            'output_path': str(output_path),
            'size_bytes': size_bytes,
            'size_mb': size_mb,
            'size_gb': size_gb,
        }
        
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Conversion timed out after 1 hour'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Conversion error: {str(e)}'
        }


def main():
    # Setup UTF-8 encoding when run as main script
    setup_utf8_encoding()
    
    parser = argparse.ArgumentParser(
        description='Export HuggingFace model to F16 GGUF format (Step 1 of 2)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/export_gguf_f16.py --src models/oneseek-7b-zero/weights --out models/oneseek-7b-zero-f16.gguf
  python scripts/export_gguf_f16.py --src ./merged_model --out output/model_f16.gguf

Next step:
  After F16 export, quantize to Q5 using:
  python scripts/quantize_q5.py --src <f16-gguf> --out <q5-gguf>
        """
    )
    
    parser.add_argument('--src', required=True, help='Source HuggingFace model directory')
    parser.add_argument('--out', required=True, help='Output F16 GGUF file path')
    parser.add_argument('--json-output', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    model_path = Path(args.src)
    output_path = Path(args.out)
    
    result = convert_to_f16_gguf(model_path, output_path)
    
    if args.json_output:
        print(json.dumps(result))
    else:
        print("\n" + "="*60)
        if result['success']:
            print("✓ F16 GGUF EXPORT SUCCESSFUL")
            print("="*60)
            print(f"Output file: {result['output_path']}")
            print(f"Size: {result['size_gb']:.2f} GB")
            print("\nNext step: Quantize to Q5")
            print(f"  python scripts/quantize_q5.py --src \"{result['output_path']}\" --out \"<output_q5.gguf>\"")
        else:
            print("✗ F16 GGUF EXPORT FAILED")
            print("="*60)
            print(f"Error: {result['error']}")
            if result.get('instructions'):
                print("\nManual steps:")
                for instruction in result['instructions']:
                    print(f"  {instruction}")
        print("="*60)
    
    return 0 if result['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
