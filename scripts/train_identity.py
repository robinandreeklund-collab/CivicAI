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
    dataset_path = Path(__file__).parent.parent / 'datasets' / 'oneseek_identity_v1.jsonl'
    
    if not dataset_path.exists():
        print("❌ ERROR: Identity dataset not found!")
        print(f"   Expected location: {dataset_path}")
        print("\nPlease ensure datasets/oneseek_identity_v1.jsonl exists.")
        return None
    
    # Count examples
    with open(dataset_path, 'r', encoding='utf-8') as f:
        examples = [json.loads(line) for line in f if line.strip()]
    
    print(f"✅ Found identity dataset: {len(examples)} examples")
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
    print("\n📦 Preparing training data...")
    
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
    
    print(f"✅ Training data prepared:")
    print(f"   - Training samples: {len(train_data)}")
    print(f"   - Validation samples: {len(val_data)}")
    print(f"   - Saved to: {data_dir}")
    
    return data_dir

def run_training(data_dir):
    """Run the training pipeline"""
    print("\n🚀 Starting training...")
    print("\nNOTE: This is a simulated training run.")
    print("For actual PyTorch training, you'll need to:")
    print("  1. Download base models (Mistral 7B, LLaMA-2)")
    print("  2. Install PyTorch and transformers")
    print("  3. Configure GPU/CPU")
    print("\nFor now, we'll run the training pipeline to demonstrate the process.\n")
    
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
        
        # Run training for identity version 1.0
        print("\nTraining OneSeek-7B-Zero on identity dataset...")
        trainer.train(version='1.0')
        
        print("\n" + "=" * 70)
        print("✅ Training completed successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Training error: {e}")
        print("\nFor detailed training setup, see README.md section:")
        print("'Training OneSeek-7B-Zero: Step-by-Step Guide'")
        return False
    
    return True

def show_next_steps():
    """Show what to do after training"""
    print("\n📋 Next Steps:")
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
    print_banner()
    
    # Step 1: Check dataset
    result = check_dataset()
    if not result:
        return
    
    dataset_path, examples = result
    
    # Step 2: Prepare training data
    data_dir = prepare_training_data(examples)
    
    # Step 3: Run training
    success = run_training(data_dir)
    
    # Step 4: Show next steps
    if success:
        show_next_steps()

if __name__ == '__main__':
    main()
