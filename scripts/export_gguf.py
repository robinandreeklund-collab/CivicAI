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
    """
    Download the llama.cpp convert script and its dependencies from GitHub.
    
    The convert_hf_to_gguf.py script requires the gguf-py module from llama.cpp,
    so we need to download and set up both properly.
    """
    try:
        import urllib.request
        import zipfile
        import io
        
        # Create a local directory for llama.cpp scripts
        script_dir = Path(__file__).parent / 'llama_cpp_scripts'
        script_dir.mkdir(exist_ok=True)
        
        convert_path = script_dir / 'convert_hf_to_gguf.py'
        gguf_py_dir = script_dir / 'gguf-py'
        
        # Check if we need to download (cache for 1 day)
        needs_download = (
            not convert_path.exists() or 
            not gguf_py_dir.exists() or
            (datetime.now().timestamp() - convert_path.stat().st_mtime > 86400)
        )
        
        if needs_download:
            print(f"[GGUF Export] Downloading llama.cpp scripts from GitHub...")
            
            # Download the main convert script
            convert_url = 'https://raw.githubusercontent.com/ggerganov/llama.cpp/master/convert_hf_to_gguf.py'
            urllib.request.urlretrieve(convert_url, convert_path)
            print(f"[GGUF Export] Downloaded convert_hf_to_gguf.py")
            
            # Download gguf-py module as a zip
            gguf_zip_url = 'https://github.com/ggerganov/llama.cpp/archive/refs/heads/master.zip'
            print(f"[GGUF Export] Downloading gguf-py module...")
            
            try:
                # Download and extract just gguf-py
                with urllib.request.urlopen(gguf_zip_url, timeout=120) as response:
                    zip_data = io.BytesIO(response.read())
                
                with zipfile.ZipFile(zip_data, 'r') as zip_ref:
                    # Extract only gguf-py directory
                    for member in zip_ref.namelist():
                        if 'gguf-py/' in member:
                            # Extract to our script directory
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
                
                print(f"[GGUF Export] Downloaded gguf-py module")
                
                # Add gguf-py to Python path via a .pth file
                pth_file = script_dir / 'gguf_path.pth'
                with open(pth_file, 'w') as f:
                    f.write(str(gguf_py_dir) + '\n')
                    
            except Exception as e:
                print(f"[GGUF Export] Could not download gguf-py module: {e}")
                print(f"[GGUF Export] Will rely on pip gguf package instead")
        
        return convert_path if convert_path.exists() else None
    except Exception as e:
        print(f"[GGUF Export] Failed to download convert script: {e}")
        return None


def try_transformers_gguf_export(model_path: Path, output_path: Path, quantization: str):
    """
    Try to use transformers library's built-in GGUF export.
    Available in transformers >= 4.36.0
    """
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        # Check if GGUF export is available
        model = AutoModelForCausalLM.from_pretrained(str(model_path), trust_remote_code=True)
        
        if hasattr(model, 'save_pretrained') and 'gguf' in str(type(model.save_pretrained)):
            print(f"[GGUF Export] Using transformers GGUF export...")
            model.save_pretrained(str(output_path.parent), gguf_file=str(output_path))
            return {'success': True, 'output_path': str(output_path), 'method': 'transformers'}
        
        return None
    except Exception as e:
        print(f"[GGUF Export] Transformers GGUF export not available: {e}")
        return None


def convert_to_gguf(model_path: Path, output_path: Path, quantization: str = 'Q5_K_M'):
    """
    Convert a HuggingFace model to GGUF format with direct quantization.
    
    Uses 1-step conversion: HF -> quantized GGUF directly.
    This is 5-10x faster than the 2-step process (HF -> F16 -> quantized)
    and avoids creating a large intermediate F16 file (~14GB).
    
    Args:
        model_path: Path to the merged model directory
        output_path: Path for the output GGUF file
        quantization: Quantization type (Q5_K_M, Q6_K, Q8_0)
    
    Returns:
        dict with success status and details
    """
    print(f"[GGUF Export] Starting 1-step direct conversion...")
    print(f"  Model: {model_path}")
    print(f"  Output: {output_path}")
    print(f"  Quantization: {quantization}")
    print(f"  Method: Direct HF -> {quantization} (no intermediate F16)")
    
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Clean up any leftover intermediate files from previous runs
    cleanup_intermediate_files(output_path.parent, output_path.stem)
    
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
    
    # Map quantization types to llama.cpp outtype format
    # The convert script supports these directly: f32, f16, bf16, q8_0, tq1_0, tq2_0, auto
    # Q5_K_M and Q6_K are NOT supported directly - they require llama-quantize binary
    outtype_map = {
        'Q5_K_M': 'q5_k_m',
        'Q6_K': 'q6_k',
        'Q8_0': 'q8_0',
        'F16': 'f16',
    }
    
    outtype = outtype_map.get(quantization, 'q5_k_m')
    
    # Q8_0 is directly supported by the convert script - use it directly
    if quantization == 'Q8_0':
        print(f"[GGUF Export] Q8_0 is directly supported by convert script - using 1-step conversion...")
        q8_result = run_convert_script_direct(convert_script, model_path, output_path, 'q8_0')
        
        if q8_result.get('success') and output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            print(f"[GGUF Export] [OK] Q8_0 conversion successful: {output_path} ({size_mb:.1f} MB)")
            
            return {
                'success': True,
                'output_path': str(output_path),
                'quantization': 'Q8_0',
                'size_bytes': output_path.stat().st_size,
                'method': '1-step direct Q8_0',
            }
    
    # For Q5_K_M and Q6_K, we need to use llama-quantize binary
    # First try direct conversion (some versions might support it)
    print(f"[GGUF Export] Converting directly to {quantization} (1-step)...")
    convert_result = run_convert_script_direct(convert_script, model_path, output_path, outtype)
    
    if convert_result.get('success') and output_path.exists():
        size_mb = output_path.stat().st_size / (1024 * 1024)
        size_gb = size_mb / 1024
        
        # Verify the output is actually quantized (Q5_K_M ~6.5GB for 7B model, F16 ~14GB)
        # If size > 10GB, it's likely F16 was created instead of quantized
        if quantization in ['Q5_K_M', 'Q6_K'] and size_gb > 10:
            print(f"[GGUF Export] [WARNING] Output file is {size_gb:.1f} GB - too large for {quantization}")
            print(f"[GGUF Export] Expected ~6-8 GB for Q5_K_M/Q6_K. This appears to be F16.")
            print(f"[GGUF Export] Deleting and falling back to 2-step method...")
            try:
                output_path.unlink()
            except:
                pass
            # Continue to fallback below
        else:
            print(f"[GGUF Export] [OK] Direct conversion successful: {output_path} ({size_mb:.1f} MB)")
            
            # Clean up any intermediate files that might have been created
            cleanup_intermediate_files(output_path.parent, output_path.stem)
            
            return {
                'success': True,
                'output_path': str(output_path),
                'quantization': quantization,
                'size_bytes': output_path.stat().st_size,
                'method': '1-step direct conversion',
            }
    
    # Fallback to 2-step if direct conversion fails (for older llama.cpp versions)
    print(f"[GGUF Export] Direct conversion failed, falling back to 2-step method...")
    
    # Find llama.cpp for quantization binary (this may auto-download for Windows)
    llama_cpp_dir = find_llama_cpp()
    quantize_bin = find_quantize_binary(llama_cpp_dir)
    
    if quantize_bin:
        # Convert to f16 first
        f16_output = output_path.parent / f"{output_path.stem.replace(f'.{quantization}', '')}.f16.gguf"
        
        print(f"[GGUF Export] Step 1/2: Converting to F16 GGUF...")
        convert_result = run_convert_script(convert_script, model_path, f16_output)
        
        if not convert_result.get('success'):
            # F16 conversion failed - fall back to Q8_0
            print(f"[GGUF Export] F16 conversion failed, trying Q8_0 fallback...")
        elif not f16_output.exists():
            print(f"[GGUF Export] F16 GGUF file was not created, trying Q8_0 fallback...")
        else:
            f16_size = f16_output.stat().st_size / (1024 * 1024)
            print(f"[GGUF Export] F16 GGUF created: {f16_output} ({f16_size:.1f} MB)")
            
            # Quantize to target format
            print(f"[GGUF Export] Step 2/2: Quantizing to {quantization}...")
            result = run_quantization(f16_output, output_path, quantization, quantize_bin)
            
            if result.get('success') and output_path.exists():
                # Clean up F16 intermediate file after successful quantization
                print(f"[GGUF Export] Cleaning up intermediate F16 file...")
                try:
                    f16_output.unlink()
                except Exception as e:
                    print(f"[GGUF Export] Warning: Could not delete F16 file: {e}")
                
                return result
            
            # Quantization failed - clean up F16 and fall through to Q8_0 fallback
            print(f"[GGUF Export] Quantization with llama-quantize failed, trying Q8_0 fallback...")
            if f16_output.exists():
                try:
                    f16_output.unlink()
                    print(f"[GGUF Export] Cleaned up F16 intermediate file")
                except:
                    pass
    
    # If we got here, either:
    # 1. No quantize binary found
    # 2. 2-step quantization failed
    # Fall back to Q8_0 which is ALWAYS supported by the convert script
    
    print(f"[GGUF Export] [INFO] Falling back to Q8_0 quantization (natively supported by convert script)")
    print(f"[GGUF Export] Q8_0 is ~7.5GB for 7B model (slightly larger than Q5_K_M's ~6.5GB)")
    print(f"[GGUF Export] Q8_0 provides excellent quality - very close to full precision.")
    
    # Create the Q8_0 output path with correct filename
    # Replace the original quantization type (e.g., Q5_K_M) with Q8_0 in the filename
    q8_output_path = Path(str(output_path).replace(f'.{quantization}.', '.Q8_0.'))
    if q8_output_path == output_path:
        # If the replacement didn't work (e.g., quantization not in filename), just change extension
        q8_output_path = output_path.parent / f"{output_path.stem.rsplit('.', 1)[0]}.Q8_0.gguf"
    
    print(f"[GGUF Export] Q8_0 output path: {q8_output_path}")
    
    # Try Q8_0 which IS supported natively
    q8_result = run_convert_script_direct(convert_script, model_path, q8_output_path, 'q8_0')
    
    if q8_result.get('success') and q8_output_path.exists():
        size_mb = q8_output_path.stat().st_size / (1024 * 1024)
        print(f"[GGUF Export] [OK] Q8_0 conversion successful: {q8_output_path} ({size_mb:.1f} MB)")
        
        return {
            'success': True,
            'output_path': str(q8_output_path),
            'quantization': 'Q8_0',
            'requested_quantization': quantization,
            'size_bytes': q8_output_path.stat().st_size,
            'method': '1-step Q8_0 fallback',
            'note': f'Used Q8_0 instead of {quantization} (external llama-quantize failed or unavailable). Q8_0 provides excellent quality with ~15% larger file size.',
        }
    
    # Q8_0 also failed - this is a real error
    print(f"[GGUF Export] [ERROR] Even Q8_0 fallback failed!")
    
    return {
        'success': False,
        'error': f'All conversion methods failed. Could not create {quantization} or Q8_0 quantization.',
        'instructions': [
            'Conversion failed with all methods:',
            f'  - Direct {quantization}: Not supported by this convert script version',
            '  - 2-step with llama-quantize: Binary not working or not found',
            '  - Q8_0 fallback: Also failed',
            '',
            'Please try:',
            '  1. Delete scripts/llama_cpp_scripts folder and run export again',
            '  2. Make sure you have enough disk space (~15GB for conversion)',
            '  3. Check that your model files are not corrupted',
            '',
            'Manual conversion:',
            f'  python convert_hf_to_gguf.py "{model_path}" --outtype q8_0 --outfile "{q8_output_path}"',
        ],
    }


def cleanup_intermediate_files(directory: Path, stem: str):
    """Clean up any intermediate files from previous conversion attempts."""
    try:
        # Look for F16 intermediate files
        for f16_file in directory.glob(f"*{stem}*.f16.gguf"):
            print(f"[GGUF Export] Removing intermediate file: {f16_file}")
            f16_file.unlink()
        
        # Look for .bin files that shouldn't be there
        for bin_file in directory.glob(f"*{stem}*.bin"):
            print(f"[GGUF Export] Removing stray bin file: {bin_file}")
            bin_file.unlink()
    except Exception as e:
        print(f"[GGUF Export] Warning during cleanup: {e}")


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
            timeout=3600,  # 1 hour timeout
            cwd=str(model_path.parent),
            env=env,
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


def run_convert_script_direct(convert_script: Path, model_path: Path, output_path: Path, outtype: str):
    """
    Run the convert script with direct quantization (1-step).
    
    This skips the F16 intermediate step and converts directly to the target quantization.
    Much faster (5-10x) and doesn't create a ~14GB intermediate file.
    
    Args:
        convert_script: Path to convert_hf_to_gguf.py
        model_path: Path to the HuggingFace model
        output_path: Path for the output GGUF file
        outtype: Target output type (e.g., 'q5_k_m', 'q6_k', 'q8_0')
    """
    try:
        convert_cmd = [
            sys.executable, str(convert_script),
            str(model_path),
            '--outtype', outtype,
            '--outfile', str(output_path),
        ]
        
        print(f"[GGUF Export] Running 1-step conversion: {' '.join(convert_cmd)}")
        
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
            timeout=3600,  # 1 hour timeout
            cwd=str(model_path.parent),
            env=env,
        )
        
        if result.returncode != 0:
            print(f"[GGUF Export] Direct conversion stderr: {result.stderr}")
            print(f"[GGUF Export] Direct conversion stdout: {result.stdout}")
            
            # Check if the error is because the outtype isn't supported
            if 'outtype' in result.stderr.lower() or 'invalid' in result.stderr.lower():
                print(f"[GGUF Export] Direct quantization not supported by this version of convert script")
                return {
                    'success': False,
                    'error': 'Direct quantization not supported, falling back to 2-step',
                    'fallback_required': True,
                }
            
            return {
                'success': False,
                'error': f'Conversion failed: {result.stderr[:500] if result.stderr else result.stdout[:500]}',
            }
        
        # Verify the output file was created
        if not output_path.exists():
            return {
                'success': False,
                'error': 'Output file was not created',
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


def find_quantize_binary(llama_cpp_path: Path = None, force_redownload: bool = False):
    """Find the quantize binary in llama.cpp installation or download it."""
    # First check PATH
    quantize_in_path = shutil.which('llama-quantize') or shutil.which('quantize')
    if quantize_in_path:
        print(f"[GGUF Export] Found quantize binary in PATH: {quantize_in_path}")
        return Path(quantize_in_path)
    
    # Check local cache
    script_dir = Path(__file__).parent / 'llama_cpp_scripts'
    cached_quantize = script_dir / ('llama-quantize.exe' if os.name == 'nt' else 'llama-quantize')
    version_file = script_dir / 'quantize_version.txt'
    
    # Check if we need to re-download (e.g., CUDA version failed, try AVX2)
    if cached_quantize.exists() and not force_redownload:
        # Check if this is a CUDA build that might have failed before
        if version_file.exists():
            version_info = version_file.read_text().strip()
            if 'cuda' in version_info.lower():
                print(f"[GGUF Export] Found cached CUDA quantize binary, but CUDA builds may have compatibility issues")
                print(f"[GGUF Export] If quantization fails, delete {script_dir} and run again to get AVX2 build")
        
        print(f"[GGUF Export] Found cached quantize binary: {cached_quantize}")
        return cached_quantize
    
    if llama_cpp_path:
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
    
    # Try to download pre-built binary for Windows
    if os.name == 'nt':
        # Delete old binary if force_redownload
        if force_redownload and cached_quantize.exists():
            try:
                cached_quantize.unlink()
                print(f"[GGUF Export] Deleted old quantize binary for re-download")
            except:
                pass
        
        downloaded = download_quantize_binary()
        if downloaded:
            return downloaded
    
    return None


def download_quantize_binary():
    """Download pre-built llama-quantize binary for Windows."""
    try:
        import urllib.request
        import zipfile
        import io
        
        script_dir = Path(__file__).parent / 'llama_cpp_scripts'
        script_dir.mkdir(exist_ok=True)
        
        print(f"[GGUF Export] Downloading pre-built llama-quantize for Windows...")
        
        # Get latest release info
        api_url = 'https://api.github.com/repos/ggerganov/llama.cpp/releases/latest'
        
        try:
            with urllib.request.urlopen(api_url, timeout=30) as response:
                release_info = json.loads(response.read().decode())
        except Exception as e:
            print(f"[GGUF Export] Could not fetch release info: {e}")
            return None
        
        # Find Windows binaries - prefer AVX2 (more compatible) over CUDA
        cuda_asset = None
        avx2_asset = None
        noavx_asset = None
        
        for asset in release_info.get('assets', []):
            name = asset.get('name', '').lower()
            if 'win' in name and name.endswith('.zip'):
                if 'noavx' in name:
                    noavx_asset = asset
                elif 'avx2' in name:
                    avx2_asset = asset
                elif 'cuda' in name:
                    cuda_asset = asset
        
        # Prefer AVX2 (CPU, most compatible), then noavx, then CUDA (may have version issues)
        download_asset = avx2_asset or noavx_asset or cuda_asset
        
        if not download_asset:
            print(f"[GGUF Export] No suitable Windows binary found in release")
            return None
        
        download_url = download_asset.get('browser_download_url')
        asset_name = download_asset.get('name')
        print(f"[GGUF Export] Downloading {asset_name}...")
        print(f"[GGUF Export] (Using CPU/AVX2 build for better compatibility)")
        
        # Download and extract
        with urllib.request.urlopen(download_url, timeout=300) as response:
            zip_data = io.BytesIO(response.read())
        
        with zipfile.ZipFile(zip_data, 'r') as zip_ref:
            for member in zip_ref.namelist():
                if 'llama-quantize' in member.lower() and member.endswith('.exe'):
                    # Extract the quantize binary
                    target_path = script_dir / 'llama-quantize.exe'
                    with zip_ref.open(member) as source:
                        with open(target_path, 'wb') as target:
                            target.write(source.read())
                    
                    # Save version info for debugging
                    version_file = script_dir / 'quantize_version.txt'
                    version_file.write_text(f"Downloaded: {asset_name}\nURL: {download_url}\n")
                    
                    print(f"[GGUF Export] Downloaded llama-quantize to: {target_path}")
                    return target_path
        
        print(f"[GGUF Export] llama-quantize.exe not found in downloaded archive")
        return None
        
    except Exception as e:
        print(f"[GGUF Export] Failed to download quantize binary: {e}")
        return None


def run_quantization(f16_path: Path, output_path: Path, quantization: str, quantize_bin: Path):
    """Run quantization on F16 GGUF file."""
    try:
        # First verify the quantize binary works
        print(f"[GGUF Export] Verifying llama-quantize binary...")
        try:
            test_result = subprocess.run(
                [str(quantize_bin), '--help'],
                capture_output=True,
                text=True,
                timeout=30
            )
            if test_result.returncode != 0 and 'usage' not in test_result.stdout.lower() and 'usage' not in test_result.stderr.lower():
                print(f"[GGUF Export] [WARNING] llama-quantize may not be working correctly")
                print(f"[GGUF Export] stdout: {test_result.stdout[:200]}")
                print(f"[GGUF Export] stderr: {test_result.stderr[:200]}")
        except Exception as e:
            print(f"[GGUF Export] [WARNING] Could not verify llama-quantize: {e}")
        
        quantize_cmd = [
            str(quantize_bin),
            str(f16_path),
            str(output_path),
            quantization,
        ]
        
        print(f"[GGUF Export] Running: {' '.join(quantize_cmd)}")
        
        result = subprocess.run(quantize_cmd, capture_output=True, text=True, timeout=3600)
        
        if result.returncode != 0:
            # Quantization failed - this is an error, not success
            error_msg = result.stderr.strip() if result.stderr else result.stdout.strip()
            if not error_msg:
                error_msg = f'llama-quantize exited with code {result.returncode}'
            
            print(f"[GGUF Export] [ERROR] Quantization failed: {error_msg}")
            
            # Check for common errors
            if 'dll' in error_msg.lower() or 'cuda' in error_msg.lower():
                print(f"[GGUF Export] This may be a CUDA/DLL compatibility issue.")
                print(f"[GGUF Export] Try downloading a different llama.cpp build (AVX2 instead of CUDA).")
            
            # Clean up the F16 intermediate file since we can't use it
            if f16_path.exists():
                try:
                    print(f"[GGUF Export] Cleaning up F16 intermediate file...")
                    f16_path.unlink()
                except Exception as e:
                    print(f"[GGUF Export] Could not delete F16 file: {e}")
            
            return {
                'success': False,
                'error': f'Quantization to {quantization} failed: {error_msg}',
                'instructions': [
                    'The llama-quantize binary failed to quantize the model.',
                    'Possible causes:',
                    '  - CUDA version mismatch (try AVX2 build instead)',
                    '  - Missing DLL dependencies',
                    '  - Corrupted download',
                    '',
                    'Try these solutions:',
                    '  1. Delete scripts/llama_cpp_scripts folder and run export again',
                    '  2. Download llama.cpp manually from: https://github.com/ggerganov/llama.cpp/releases',
                    '  3. Use the AVX2 build instead of CUDA if you have compatibility issues',
                ],
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
        print(f"[GGUF Export] [OK] Quantized GGUF created: {output_path} ({size_mb:.1f} MB)")
        
        return {
            'success': True,
            'output_path': str(output_path),
            'quantization': quantization,
            'size_bytes': output_path.stat().st_size,
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"[GGUF Export] [ERROR] Quantization exception: {error_msg}")
        
        # Clean up F16 file on error
        if f16_path.exists():
            try:
                f16_path.unlink()
            except:
                pass
        
        return {
            'success': False,
            'error': f'Quantization error: {error_msg}',
        }


def get_manual_instructions(model_path: Path, output_path: Path, quantization: str):
    """Get manual instructions for GGUF conversion."""
    outtype_map = {'Q5_K_M': 'q5_k_m', 'Q6_K': 'q6_k', 'Q8_0': 'q8_0'}
    outtype = outtype_map.get(quantization, 'q5_k_m')
    
    return [
        '1. Install llama-cpp-python: pip install llama-cpp-python --upgrade',
        '   For GPU acceleration: CMAKE_ARGS="-DLLAMA_CUDA=on" pip install llama-cpp-python --force-reinstall --no-cache-dir',
        '2. Or clone llama.cpp: git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make',
        '',
        '   Option A - 1-step direct conversion (RECOMMENDED, faster, no intermediate file):',
        f'   python convert_hf_to_gguf.py "{model_path}" --outtype {outtype} --outfile "{output_path}"',
        '',
        '   Option B - 2-step conversion (fallback if direct fails):',
        f'   python convert_hf_to_gguf.py "{model_path}" --outtype f16 --outfile "{output_path.with_suffix(".f16.gguf")}"',
        f'   llama-quantize "{output_path.with_suffix(".f16.gguf")}" "{output_path}" {quantization}',
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
            print(f"\n[OK] GGUF export successful!")
            print(f"   Output: {result.get('output_path')}")
            print(f"   Quantization: {result.get('quantization')}")
            if result.get('size_bytes'):
                size_mb = result['size_bytes'] / (1024 * 1024)
                print(f"   Size: {size_mb:.1f} MB")
            if result.get('warning'):
                print(f"   [WARNING] {result.get('warning')}")
            if result.get('note'):
                print(f"   [INFO] {result.get('note')}")
        else:
            print(f"\n[ERROR] GGUF export failed: {result.get('error')}")
            if result.get('instructions'):
                print("\nManual steps required:")
                for instruction in result['instructions']:
                    print(f"   {instruction}")
    
    return 0 if result.get('success') else 1


if __name__ == '__main__':
    sys.exit(main())
