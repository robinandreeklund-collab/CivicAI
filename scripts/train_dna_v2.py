#!/usr/bin/env python3
"""
DNA v2 Training Script for Admin Panel Integration

This script wraps the run_adaptive_training function for use with the admin panel.
It accepts command-line arguments and environment variables for configuration.

Usage:
    python scripts/train_dna_v2.py --dataset datasets/my_data.jsonl --epochs 10

Environment Variables:
    MODELS_DIR: Base models directory (default: models)
    LEDGER_URL: HTTP ledger service URL (optional)
    LEDGER_PRIVATE_KEY_PATH: Path to Ed25519 private key
    OUTPUT_DIR: Output directory for certified models
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add src to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / 'src'))

from training.dynamic_trainer import run_adaptive_training
from ledger.ledger_client import InMemoryLedgerClient, HttpLedgerClient


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Train OneSeek-7B-Zero with DNA v2'
    )
    
    parser.add_argument(
        '--dataset',
        required=True,
        help='Path to training dataset (JSONL format)'
    )
    
    parser.add_argument(
        '--epochs',
        type=int,
        default=10,
        help='Number of training epochs (default: 10)'
    )
    
    parser.add_argument(
        '--batch-size',
        type=int,
        default=8,
        help='Batch size (default: 8)'
    )
    
    parser.add_argument(
        '--learning-rate',
        type=float,
        default=0.0001,
        help='Learning rate (default: 0.0001)'
    )
    
    parser.add_argument(
        '--auto-stop-threshold',
        type=float,
        default=0.001,
        help='Auto-stop threshold for loss change (default: 0.001)'
    )
    
    parser.add_argument(
        '--auto-stop-patience',
        type=int,
        default=3,
        help='Auto-stop patience in epochs (default: 3)'
    )
    
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility (default: 42)'
    )
    
    parser.add_argument(
        '--output-dir',
        help='Output directory for certified model (optional, auto-generated if not provided)'
    )
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Get configuration from environment variables
    models_dir = os.environ.get('MODELS_DIR', 'models')
    ledger_url = os.environ.get('LEDGER_URL')
    private_key_path = os.environ.get('LEDGER_PRIVATE_KEY_PATH')
    
    # Resolve paths relative to project root
    models_dir = str(project_root / models_dir)
    dataset_path = str(project_root / args.dataset)
    
    # Generate output directory if not provided
    if args.output_dir:
        output_dir = str(project_root / args.output_dir)
    else:
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        output_dir = str(project_root / 'models' / 'oneseek-certified' / f'run-{timestamp}')
    
    # Create ledger client
    if ledger_url:
        print(f"Using HTTP ledger: {ledger_url}")
        ledger_client = HttpLedgerClient(ledger_url)
    else:
        print("Using in-memory ledger (development mode)")
        ledger_client = InMemoryLedgerClient()
    
    # Prepare configuration
    config = {
        'models_dir': models_dir,
        'dataset_paths': [dataset_path],
        'epochs': args.epochs,
        'learning_rate': args.learning_rate,
        'auto_stop_threshold': args.auto_stop_threshold,
        'auto_stop_patience': args.auto_stop_patience,
        'output_dir': output_dir,
        'private_key_path': private_key_path,
        'ledger_client': ledger_client,
        'seed': args.seed
    }
    
    # Print configuration
    print("\n" + "="*70)
    print("  OneSeek-7B-Zero DNA v2 Training")
    print("="*70)
    print(f"\nDataset: {dataset_path}")
    print(f"Models directory: {models_dir}")
    print(f"Epochs: {args.epochs}")
    print(f"Learning rate: {args.learning_rate}")
    print(f"Batch size: {args.batch_size}")
    print(f"Auto-stop: threshold={args.auto_stop_threshold}, patience={args.auto_stop_patience}")
    print(f"Seed: {args.seed}")
    print(f"Output: {output_dir}")
    if private_key_path:
        print(f"Signing: Enabled (key: {private_key_path})")
    else:
        print("Signing: Disabled (no private key)")
    print()
    
    # Run training
    try:
        result = run_adaptive_training(config)
        
        # Print results
        print("\n" + "="*70)
        print("  Training Complete!")
        print("="*70)
        print(f"\nDNA: {result['dna']}")
        print(f"Immutable Hash: {result['immutable_hash'][:16]}...")
        print(f"Output: {result['output_path']}")
        print(f"\nFinal Weights:")
        for model_name, weight in result['final_weights'].items():
            print(f"  {model_name}: {weight:.3f}")
        
        # Save results to JSON for admin panel to parse
        results_file = Path(output_dir) / 'training_results.json'
        with open(results_file, 'w') as f:
            json.dump({
                'dna': result['dna'],
                'immutable_hash': result['immutable_hash'],
                'output_path': result['output_path'],
                'final_weights': result['final_weights'],
                'training_history': result['training_history'],
                'ledger_entry': result['ledger_entry']
            }, f, indent=2)
        
        print(f"\nResults saved to: {results_file}")
        print("\n✅ Training completed successfully!")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
