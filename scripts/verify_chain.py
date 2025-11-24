#!/usr/bin/env python3
"""
Verify Chain Script

Provides failsafe verification of the adapter chain, checking for:
- File integrity
- Compatibility between adapters
- Size calculations
- Metadata consistency
"""

import argparse
import json
import hashlib
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

def parse_args():
    parser = argparse.ArgumentParser(description='Verify LoRA adapter chain integrity')
    parser.add_argument('--base-model', required=True, help='Base model name')
    parser.add_argument('--adapters', nargs='*', default=[], help='List of adapter run IDs to verify')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    return parser.parse_args()

def hash_file(filepath):
    """Calculate SHA256 hash of a file"""
    sha256 = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        return None

def get_directory_size(dirpath):
    """Calculate total size of directory in bytes"""
    total = 0
    try:
        for entry in os.scandir(dirpath):
            if entry.is_file(follow_symlinks=False):
                total += entry.stat().size
            elif entry.is_dir(follow_symlinks=False):
                total += get_directory_size(entry.path)
    except (OSError, PermissionError):
        pass
    return total

def verify_adapter(adapter_path, verbose=False):
    """Verify a single adapter"""
    adapter_path = Path(adapter_path)
    
    if not adapter_path.exists():
        return {
            'valid': False,
            'error': 'Adapter directory does not exist'
        }
    
    # Check for required files
    required_files = ['adapter_config.json']
    model_file = adapter_path / 'adapter_model.safetensors'
    if not model_file.exists():
        model_file = adapter_path / 'adapter_model.bin'
    
    if not model_file.exists():
        return {
            'valid': False,
            'error': 'Missing adapter model file (adapter_model.safetensors or .bin)'
        }
    
    config_file = adapter_path / 'adapter_config.json'
    if not config_file.exists():
        return {
            'valid': False,
            'error': 'Missing adapter_config.json'
        }
    
    # Read config
    try:
        with open(config_file) as f:
            config = json.load(f)
    except Exception as e:
        return {
            'valid': False,
            'error': f'Failed to read adapter_config.json: {e}'
        }
    
    # Calculate size
    size_bytes = get_directory_size(adapter_path)
    size_mb = size_bytes / (1024 * 1024)
    
    # Calculate file hashes if verbose
    hashes = {}
    if verbose:
        for file in adapter_path.iterdir():
            if file.is_file():
                hashes[file.name] = hash_file(file)
    
    return {
        'valid': True,
        'config': config,
        'size_mb': size_mb,
        'size_gb': size_mb / 1024,
        'base_model': config.get('base_model_name_or_path', 'unknown'),
        'rank': config.get('r', 'unknown'),
        'alpha': config.get('lora_alpha', 'unknown'),
        'hashes': hashes if verbose else None
    }

def verify_chain(base_model, adapters, verbose=False):
    """Verify entire adapter chain"""
    project_root = Path(__file__).parent.parent
    certified_dir = project_root / 'models' / 'oneseek-certified'
    
    print(f"=== Adapter Chain Verification ===")
    print(f"Base Model: {base_model}")
    print(f"Adapters: {len(adapters)}")
    print()
    
    results = {
        'baseModel': base_model,
        'adapterCount': len(adapters),
        'valid': True,
        'issues': [],
        'adapters': {},
        'totalSize': 0,
        'verifiedAt': datetime.now(timezone.utc).isoformat()
    }
    
    # Verify each adapter
    for adapter in adapters:
        adapter_path = certified_dir / adapter
        print(f"Verifying adapter: {adapter}")
        
        verify_result = verify_adapter(adapter_path, verbose)
        results['adapters'][adapter] = verify_result
        
        if not verify_result['valid']:
            results['valid'] = False
            results['issues'].append(f"Adapter {adapter}: {verify_result['error']}")
            print(f"  ❌ FAILED: {verify_result['error']}")
        else:
            results['totalSize'] += verify_result['size_gb']
            print(f"  ✅ Valid - {verify_result['size_mb']:.1f} MB, rank={verify_result['rank']}")
            
            # Check base model compatibility
            adapter_base = verify_result['base_model'].lower()
            if base_model.lower() not in adapter_base and adapter_base not in base_model.lower():
                warning = f"Adapter {adapter} configured for '{verify_result['base_model']}' but chain uses '{base_model}'"
                results['issues'].append(warning)
                print(f"  ⚠️  WARNING: {warning}")
    
    # Print summary
    print()
    print(f"=== Verification Summary ===")
    print(f"Status: {'✅ VALID' if results['valid'] else '❌ INVALID'}")
    print(f"Total adapter size: {results['totalSize']:.2f} GB")
    print(f"Issues found: {len(results['issues'])}")
    
    if results['issues']:
        print()
        print("Issues:")
        for issue in results['issues']:
            print(f"  - {issue}")
    
    return results

def main():
    args = parse_args()
    
    results = verify_chain(args.base_model, args.adapters, args.verbose)
    
    # Exit with error code if verification failed
    sys.exit(0 if results['valid'] else 1)

if __name__ == '__main__':
    main()
