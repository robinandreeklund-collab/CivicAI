#!/usr/bin/env python3
"""
Model Download Script for OQT-1.0
Downloads Mistral 7B and LLaMA-2 7B models from HuggingFace
"""

import os
import sys
from pathlib import Path
from huggingface_hub import snapshot_download, login
import argparse

# Model configurations
MODELS = {
    'mistral': {
        'repo_id': 'mistralai/Mistral-7B-Instruct-v0.2',
        'local_dir': 'models/mistral-7b-instruct',
        'size_gb': 14,
        'requires_auth': False,
    },
    'llama': {
        'repo_id': 'meta-llama/Llama-2-7b-chat-hf',
        'local_dir': 'models/llama-2-7b-chat',
        'size_gb': 13,
        'requires_auth': True,
    }
}

def check_disk_space(required_gb):
    """Check if enough disk space is available"""
    stat = os.statvfs('.')
    available_gb = (stat.f_bavail * stat.f_frsize) / (1024**3)
    return available_gb >= required_gb

def download_model(model_name, token=None):
    """Download a specific model"""
    config = MODELS[model_name]
    
    print(f"\n{'='*60}")
    print(f"Downloading {model_name.upper()}")
    print(f"Repository: {config['repo_id']}")
    print(f"Size: ~{config['size_gb']}GB")
    print(f"Destination: {config['local_dir']}")
    print(f"{'='*60}\n")
    
    # Check disk space
    if not check_disk_space(config['size_gb'] + 5):  # +5GB buffer
        print(f"❌ Error: Not enough disk space. Need at least {config['size_gb'] + 5}GB")
        return False
    
    # Handle authentication for LLaMA
    if config['requires_auth']:
        if not token:
            print("⚠️  This model requires HuggingFace authentication.")
            print("Please visit: https://huggingface.co/meta-llama/Llama-2-7b-chat-hf")
            print("1. Request access to the model")
            print("2. Generate a token at: https://huggingface.co/settings/tokens")
            print("3. Run: huggingface-cli login")
            print("\nOr provide token with: --token YOUR_TOKEN")
            return False
        else:
            login(token=token)
    
    # Create local directory
    local_path = Path(config['local_dir'])
    local_path.mkdir(parents=True, exist_ok=True)
    
    try:
        # Download model
        print(f"📥 Downloading {model_name}... (this may take a while)")
        snapshot_download(
            repo_id=config['repo_id'],
            local_dir=str(local_path),
            local_dir_use_symlinks=False,
            resume_download=True,
        )
        print(f"✅ {model_name.upper()} downloaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error downloading {model_name}: {str(e)}")
        return False

def verify_models():
    """Verify that models are downloaded correctly"""
    print("\n" + "="*60)
    print("Verifying Models")
    print("="*60 + "\n")
    
    all_ok = True
    for model_name, config in MODELS.items():
        local_path = Path(config['local_dir'])
        
        # Check if directory exists
        if not local_path.exists():
            print(f"❌ {model_name.upper()}: Not found")
            all_ok = False
            continue
        
        # Check for essential files
        required_files = ['config.json', 'tokenizer.json']
        missing_files = [f for f in required_files if not (local_path / f).exists()]
        
        if missing_files:
            print(f"⚠️  {model_name.upper()}: Missing files - {', '.join(missing_files)}")
            all_ok = False
        else:
            # Get directory size
            total_size = sum(f.stat().st_size for f in local_path.rglob('*') if f.is_file())
            size_gb = total_size / (1024**3)
            print(f"✅ {model_name.upper()}: OK ({size_gb:.2f}GB)")
    
    return all_ok

def main():
    parser = argparse.ArgumentParser(description='Download OQT-1.0 models')
    parser.add_argument('--model', choices=['mistral', 'llama', 'all'], default='all',
                      help='Which model(s) to download')
    parser.add_argument('--token', type=str, help='HuggingFace token for LLaMA access')
    parser.add_argument('--verify-only', action='store_true',
                      help='Only verify existing models')
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("OQT-1.0 Model Download Script")
    print("="*60)
    
    if args.verify_only:
        success = verify_models()
        sys.exit(0 if success else 1)
    
    # Determine which models to download
    models_to_download = []
    if args.model == 'all':
        models_to_download = ['mistral', 'llama']
    else:
        models_to_download = [args.model]
    
    # Check total disk space needed
    total_size = sum(MODELS[m]['size_gb'] for m in models_to_download)
    print(f"\nTotal space required: ~{total_size}GB")
    
    if not check_disk_space(total_size + 10):  # +10GB buffer
        print(f"❌ Error: Not enough disk space. Need at least {total_size + 10}GB")
        sys.exit(1)
    
    # Download models
    results = {}
    for model_name in models_to_download:
        results[model_name] = download_model(model_name, args.token)
    
    # Verify downloads
    print("\n" + "="*60)
    print("Download Summary")
    print("="*60)
    
    for model_name, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"{model_name.upper()}: {status}")
    
    # Final verification
    if all(results.values()):
        print("\n📦 Verifying downloaded models...")
        if verify_models():
            print("\n🎉 All models downloaded and verified successfully!")
            print("\nNext steps:")
            print("1. Configure .env file with model paths")
            print("2. Run: python scripts/setup_firebase.py")
            print("3. Start services: npm run dev")
            sys.exit(0)
        else:
            print("\n⚠️  Some models may be incomplete. Please re-run the script.")
            sys.exit(1)
    else:
        print("\n❌ Some downloads failed. Please check errors above and retry.")
        sys.exit(1)

if __name__ == '__main__':
    main()
