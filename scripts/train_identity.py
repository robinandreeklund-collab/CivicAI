#!/usr/bin/env python3
"""
Quick Start: Train OneSeek-7B-Zero with Identity Dataset

This script provides a simple way to start training OneSeek-7B-Zero
with the identity dataset to teach the model its OpenSeek AI-agent identity.

Usage:
    python scripts/train_identity.py

Note: This is a simplified training script for identity learning.
      For production training, see ml/training/train_language_model.py
"""

import json
import os
import sys
from pathlib import Path

# Add ml directory to path
ml_dir = Path(__file__).parent.parent / 'ml'
sys.path.insert(0, str(ml_dir / 'training'))
sys.path.insert(0, str(ml_dir / 'pipelines'))

def print_banner():
    """Print welcome banner"""
    print("\n" + "=" * 70)
    print("  OneSeek-7B-Zero Identity Training - Quick Start")
    print("=" * 70)
    print("\nThis script will train OneSeek-7B-Zero on the identity dataset")
    print("to teach the model its role as a transparent AI agent.\n")

def check_dataset():
    """Check if identity dataset exists"""
    # Check if DATASET_PATH environment variable is set
    dataset_path_env = os.environ.get('DATASET_PATH')
    
    if dataset_path_env:
        dataset_path = Path(dataset_path_env)
        print(f"[DATASET] Using dataset from environment variable: {dataset_path}")
    else:
        # Fallback to default location
        dataset_path = Path(__file__).parent.parent / 'datasets' / 'oneseek_identity_v1.jsonl'
        print(f"[DATASET] Using default dataset: {dataset_path}")
    
    if not dataset_path.exists():
        print("[ERROR] Dataset not found!")
        print(f"   Expected location: {dataset_path}")
        print("\nPlease ensure the dataset file exists.")
        return None
    
    # Count examples
    try:
        with open(dataset_path, 'r', encoding='utf-8') as f:
            examples = [json.loads(line) for line in f if line.strip()]
    except Exception as e:
        print(f"[ERROR] Failed to read dataset: {e}")
        return None
    
    print(f"[SUCCESS] Found dataset: {len(examples)} examples")
    print(f"   Location: {dataset_path}")
    
    return dataset_path, examples

def convert_to_training_format(examples):
    """Convert JSONL instruction format to training format"""
    training_data = []
    
    for example in examples:
        training_data.append({
            'id': f"identity_{len(training_data)}",
            'question': example['instruction'],
            'responses': [{
                'model': 'OneSeek-Identity',
                'response_text': example['output']
            }],
            'analysis': {
                'consensus_score': 1.0,
                'topics': ['identity', 'transparency']
            },
            'quality': {
                'valid': True,
                'quality_score': 1.0,
                'issues': []
            },
            'provenance': {
                'source': 'identity_training',
                'dataset': 'oneseek_identity_v1'
            }
        })
    
    return training_data

def prepare_training_data(examples):
    """Prepare training data and save to prepared format"""
    print("\n[PREPARE] Preparing training data...")
    
    # Convert to training format
    training_data = convert_to_training_format(examples)
    
    # Create data directory
    data_dir = Path(__file__).parent.parent / 'ml' / 'data' / 'prepared'
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Split into train/validation (90/10 split for identity data)
    split_point = int(len(training_data) * 0.9)
    train_data = training_data[:split_point]
    val_data = training_data[split_point:]
    
    # Save datasets
    train_file = data_dir / 'train.json'
    val_file = data_dir / 'validation.json'
    test_file = data_dir / 'test.json'  # Empty for identity training
    
    with open(train_file, 'w', encoding='utf-8') as f:
        json.dump(train_data, f, indent=2, ensure_ascii=False)
    
    with open(val_file, 'w', encoding='utf-8') as f:
        json.dump(val_data, f, indent=2, ensure_ascii=False)
    
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)
    
    print(f"[SUCCESS] Training data prepared:")
    print(f"   - Training samples: {len(train_data)}")
    print(f"   - Validation samples: {len(val_data)}")
    print(f"   - Saved to: {data_dir}")
    
    return data_dir

def run_training(data_dir):
    """Run the training pipeline"""
    print("\n[TRAINING] Starting training...")
    
    # Get training parameters from environment variables
    epochs = int(os.environ.get('EPOCHS', 3))
    batch_size = int(os.environ.get('BATCH_SIZE', 8))
    learning_rate = float(os.environ.get('LEARNING_RATE', 0.0001))
    
    print(f"\n[CONFIG] Training parameters:")
    print(f"   - Epochs: {epochs}")
    print(f"   - Batch size: {batch_size}")
    print(f"   - Learning rate: {learning_rate}")
    
    # Check if PyTorch is available
    try:
        import torch
        print(f"\n[SUCCESS] PyTorch detected: {torch.__version__}")
        print(f"   CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"   GPU: {torch.cuda.get_device_name(0)}")
        
        # Check for transformers
        try:
            import transformers
            print(f"[SUCCESS] Transformers detected: {transformers.__version__}")
        except ImportError:
            print("[WARNING] Transformers not found. Install with: pip install transformers")
        
        # Check for PEFT
        try:
            import peft
            print(f"[SUCCESS] PEFT detected: {peft.__version__}")
        except ImportError:
            print("[WARNING] PEFT not found. Install with: pip install peft")
        
        print("\n[INFO] Will attempt PyTorch training with LoRA/PEFT if base models are available.")
        print("   If base models not found, will fall back to simulation.\n")
        
    except ImportError:
        print("\n[WARNING] PyTorch not found. Will use simulation mode.")
        print("   Install PyTorch with: pip install torch transformers peft\n")
    
    try:
        # Import training module
        from train_language_model import OneSeekTrainer
        
        # Setup paths
        model_dir = Path(__file__).parent.parent / 'models' / 'oneseek-7b-zero' / 'weights'
        ledger_dir = Path(__file__).parent.parent / 'ml' / 'ledger'
        
        # Create trainer
        trainer = OneSeekTrainer(
            data_dir=str(data_dir),
            model_dir=str(model_dir),
            ledger_dir=str(ledger_dir)
        )
        
        # Update training config with parameters from environment
        print(f"\n[CONFIG] Updating training configuration:")
        print(f"   - Epochs: {trainer.config['epochs']} -> {epochs}")
        print(f"   - Batch size: {trainer.config['batch_size']} -> {batch_size}")
        print(f"   - Learning rate: {trainer.config['learning_rate']} -> {learning_rate}")
        
        trainer.config['epochs'] = epochs
        trainer.config['batch_size'] = batch_size
        trainer.config['learning_rate'] = learning_rate
        
        # Run training for identity version 1.0
        print("\nTraining OneSeek-7B-Zero on identity dataset...")
        trainer.train(version='1.0')
        
        print("\n" + "=" * 70)
        print("[SUCCESS] Training completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n[ERROR] Training error: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Traceback: {traceback.format_exc()}")
        print("\nFor detailed training setup, see README.md section:")
        print("'Training OneSeek-7B-Zero: Step-by-Step Guide'")
        return False
    
    return True

def show_next_steps():
    """Show what to do after training"""
    print("\n[NEXT STEPS]:")
    print("\n1. **Verify model files:**")
    print("   Check models/oneseek-7b-zero/weights/ for:")
    print("   - oneseek-7b-zero-v1.0.json (metadata)")
    print("   - oneseek-7b-zero-v1.0.pth (weights - requires PyTorch)")
    
    print("\n2. **Check transparency ledger:**")
    print("   View ml/ledger/ for training provenance")
    
    print("\n3. **For actual PyTorch training:**")
    print("   Follow the complete guide in README.md")
    print("   Section: 'Training OneSeek-7B-Zero: Step-by-Step Guide'")
    
    print("\n4. **Test the trained model:**")
    print("   Query the model through the OQT Dashboard:")
    print("   http://localhost:3000/oqt-dashboard")
    
    print("\n5. **Extend the dataset:**")
    print("   Add more examples to datasets/oneseek_identity_v1.jsonl")
    print("   Recommended: 100-500 examples total")
    print()

def main():
    """Main entry point"""
    try:
        print_banner()
        
        # Step 1: Check dataset
        print("\n[DEBUG] Checking dataset...")
        result = check_dataset()
        if not result:
            print("[DEBUG] Dataset check failed")
            return
        
        dataset_path, examples = result
        print(f"[DEBUG] Dataset loaded: {len(examples)} examples")
        
        # Step 2: Prepare training data
        print("\n[DEBUG] Preparing training data...")
        data_dir = prepare_training_data(examples)
        print(f"[DEBUG] Training data prepared at: {data_dir}")
        
        # Step 3: Run training
        print("\n[DEBUG] Starting training...")
        success = run_training(data_dir)
        print(f"[DEBUG] Training completed: {success}")
        
        # Step 4: Show next steps
        if success:
            show_next_steps()
            
    except Exception as e:
        print(f"\n[ERROR] ERROR in main(): {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print(f"   Full traceback:\n{traceback.format_exc()}")
        raise  # Re-raise to be caught by outer handler

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n[FATAL] FATAL ERROR: {e}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        print("\n" + "=" * 70)
        print("FULL TRACEBACK:")
        print("=" * 70)
        traceback.print_exc()
        print("=" * 70)
        sys.exit(1)
