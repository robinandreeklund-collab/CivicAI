#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DNA v2 Training Script with Real PyTorch Integration

This script integrates DNA Fingerprint v2 with real PyTorch LoRA training,
combining the old train_identity.py workflow with the new DNA v2 features.

Usage:
    python scripts/train_dna_v2.py --dataset datasets/my_data.jsonl --epochs 10
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Set stdout to UTF-8 encoding to handle Unicode characters on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add directories to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / 'src'))
sys.path.insert(0, str(project_root / 'ml' / 'training'))
sys.path.insert(0, str(project_root / 'ml' / 'pipelines'))

from training.dna import build_dna, sign_payload, generate_immutable_hash
from training.dataset_parser import extract_categories_from_filenames
from ledger.ledger_client import InMemoryLedgerClient, HttpLedgerClient


def extract_language_from_filename(filename: str) -> str:
    """
    Extract language code from dataset filename.
    
    Args:
        filename: Dataset filename or path
    
    Returns:
        str: Language code (en, sv, no, da, fi)
    """
    name_lower = filename.lower()
    
    # Language mappings
    language_map = {
        'swedish': 'sv',
        'svenska': 'sv',
        'svensk': 'sv',
        'swed': 'sv',
        'norwegian': 'no',
        'norsk': 'no',
        'danish': 'da',
        'dansk': 'da',
        'finnish': 'fi',
        'suomi': 'fi',
        'english': 'en',
        'eng': 'en',
    }
    
    # Check for language indicators
    for key, code in language_map.items():
        if key in name_lower:
            return code
    
    # Default to English
    return 'en'


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Train OneSeek-7B-Zero with DNA v2 and real PyTorch training'
    )
    
    parser.add_argument('--dataset', required=True, help='Path to training dataset (JSONL format)')
    parser.add_argument('--epochs', type=int, default=3, help='Number of training epochs')
    parser.add_argument('--learning-rate', type=float, default=0.0001, help='Learning rate')
    parser.add_argument('--batch-size', type=int, default=8, help='Batch size')
    parser.add_argument('--auto-stop-threshold', type=float, default=0.001, help='Auto-stop threshold')
    parser.add_argument('--auto-stop-patience', type=int, default=3, help='Auto-stop patience (epochs)')
    parser.add_argument('--seed', type=int, default=42, help='Random seed for reproducibility')
    parser.add_argument('--base-models', nargs='+', help='Specific base models to use')
    parser.add_argument('--output-dir', help='Output directory for certified models')
    
    return parser.parse_args()


def convert_to_training_format(dataset_path: Path):
    """Convert JSONL dataset to training format expected by OneSeekTrainer"""
    examples = []
    with open(dataset_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                examples.append(json.loads(line))
    
    training_data = []
    for idx, example in enumerate(examples):
        training_data.append({
            'id': f"dna_v2_{idx}",
            'question': example.get('instruction', example.get('question', '')),
            'responses': [{
                'model': 'OneSeek-DNA-v2',
                'response_text': example.get('output', example.get('response', ''))
            }],
            'analysis': {
                'consensus_score': 1.0,
                'topics': ['dna-v2-training']
            },
            'quality': {
                'valid': True,
                'quality_score': 1.0,
                'issues': []
            },
            'provenance': {
                'source': 'dna_v2_training',
                'dataset': dataset_path.name
            }
        })
    
    return training_data, examples


def prepare_training_data(training_data):
    """Prepare training data in the format expected by OneSeekTrainer"""
    # Create data directory
    data_dir = project_root / 'ml' / 'data' / 'prepared' / 'dna_v2'
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Split into train/validation (90/10 split)
    split_point = int(len(training_data) * 0.9)
    train_data = training_data[:split_point]
    val_data = training_data[split_point:]
    
    # Save datasets
    train_file = data_dir / 'train.json'
    val_file = data_dir / 'validation.json'
    test_file = data_dir / 'test.json'
    
    with open(train_file, 'w', encoding='utf-8') as f:
        json.dump(train_data, f, indent=2, ensure_ascii=False)
    
    with open(val_file, 'w', encoding='utf-8') as f:
        json.dump(val_data, f, indent=2, ensure_ascii=False)
    
    with open(test_file, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)
    
    print(f"[PREPARE] Training data prepared:")
    print(f"   - Training samples: {len(train_data)}")
    print(f"   - Validation samples: {len(val_data)}")
    print(f"   - Saved to: {data_dir}")
    
    return data_dir


def run_real_training(args, data_dir, dataset_path):
    """Run real PyTorch training using OneSeekTrainer"""
    try:
        from train_language_model import OneSeekTrainer
        
        # Setup paths
        model_dir = project_root / 'models' / 'oneseek-7b-zero' / 'weights'
        ledger_dir = project_root / 'ml' / 'ledger'
        
        model_dir.mkdir(parents=True, exist_ok=True)
        ledger_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n{'=' * 70}")
        print("OneSeek-7B-Zero DNA v2 Training")
        print(f"{'=' * 70}\n")
        
        # Create trainer
        trainer = OneSeekTrainer(
            data_dir=str(data_dir),
            model_dir=str(model_dir),
            ledger_dir=str(ledger_dir),
            language='en',
            external_model=None
        )
        
        # Update training config with DNA v2 parameters
        trainer.config['epochs'] = args.epochs
        trainer.config['batch_size'] = args.batch_size
        trainer.config['learning_rate'] = args.learning_rate
        
        print(f"[CONFIG] Training parameters:")
        print(f"   - Dataset: {dataset_path.name}")
        print(f"   - Epochs: {args.epochs}")
        print(f"   - Batch size: {args.batch_size}")
        print(f"   - Learning rate: {args.learning_rate}")
        print(f"   - Auto-stop: threshold={args.auto_stop_threshold}, patience={args.auto_stop_patience}")
        print(f"   - Seed: {args.seed}")
        
        # Get run_id from environment (passed from backend) or generate if not provided
        timestamp = datetime.now()
        run_id = os.environ.get('RUN_ID')
        if not run_id:
            run_id = timestamp.strftime('run-%Y%m%d-%H%M%S')
        
        print(f"[INFO] run_id={run_id}")
        
        # Generate DNA version string
        version = f"1.0"  # DNA v2 format
        
        # Create certified output directory early for live metrics
        output_dir = args.output_dir or str(project_root / 'models' / 'oneseek-certified')
        certified_dir = Path(output_dir) / run_id
        certified_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n[INFO] Created run directory: {certified_dir}")
        
        # Train the model (this calls real PyTorch training)
        print(f"\n[TRAINING] Starting real PyTorch training...")
        datasets = trainer.load_training_data()
        
        # Train with strict mode - no simulation allowed
        # Pass run_id for live metrics
        results = trainer.train_model(datasets, version, run_id)
        
        # CRITICAL: Check if training actually succeeded (not simulation)
        # DNA v2 MUST NOT create fake model files - only real trained models are allowed
        if results is None:
            print(f"\n{'=' * 70}")
            print(f"[ERROR] Training failed - results is None")
            print(f"{'=' * 70}")
            print(f"\n[ERROR] DNA v2 training ABORTED - no fake files will be created")
            print(f"[ERROR] Please check:")
            print(f"   1. PEFT installed in venv: {project_root / 'backend' / 'python_services' / 'venv'}")
            print(f"   2. PyTorch installed in venv")
            print(f"   3. Transformers installed in venv")
            print(f"   4. Base models exist in /models/")
            print(f"   5. Training script has access to venv Python")
            raise RuntimeError("Training failed - results is None. No fake files will be created.")
        
        if results.get('simulated', False):
            error_msg = results.get('error', 'Unknown error')
            print(f"\n{'=' * 70}")
            print(f"[ERROR] Training fell back to simulation - this is NOT allowed")
            print(f"[ERROR] Reason: {error_msg}")
            print(f"{'=' * 70}")
            print(f"\n[CRITICAL] DNA v2 training ABORTED - no fake files will be created")
            print(f"[CRITICAL] Simulation is disabled to prevent fake model files")
            print(f"\n[FIX] Please ensure:")
            print(f"   1. PEFT is installed: pip install peft")
            print(f"   2. PyTorch is installed: pip install torch")  
            print(f"   3. Transformers is installed: pip install transformers")
            print(f"   4. Base models exist in /models/ directory")
            print(f"   5. Script is running in venv: {project_root / 'backend' / 'python_services' / 'venv'}")
            print(f"\n[DEBUG] Current Python: {sys.executable}")
            print(f"[DEBUG] Can import PEFT: {results.get('peft_available', False)}")
            print(f"[DEBUG] Can import PyTorch: {results.get('torch_available', False)}")
            raise RuntimeError(f"Training fell back to simulation: {error_msg}. Simulation is NOT allowed - no fake files will be created.")
        
        # Extract categories from dataset
        categories = extract_categories_from_filenames([str(dataset_path)])
        
        # Extract language from dataset filename
        language = extract_language_from_filename(dataset_path.name)
        
        # Calculate final weights from base models (or use equal weights if not specified)
        # Base models come from admin panel selection via --base-models argument
        if args.base_models:
            # Use selected base models from admin panel
            num_models = len(args.base_models)
            final_weights = {model: 1.0 / num_models for model in args.base_models}
        else:
            # Fallback to default if no base models specified
            final_weights = {'default': 1.0}
        
        # Build DNA fingerprint with language
        dna = build_dna(
            model_name='OneSeek-7B-Zero',
            version=version,
            final_weights=final_weights,
            dataset_categories=categories,
            timestamp=timestamp,
            language=language
        )
        
        print(f"\n[SUCCESS] Training completed!")
        print(f"   DNA: {dna}")
        print(f"   Model saved to: {model_dir}")
        
        # certified_dir already created earlier for live metrics
        # (run_id and certified_dir were created before training started)
        
        # Save DNA metadata with atomic write
        dna_metadata = {
            'dna': dna,
            'model_name': 'OneSeek-7B-Zero',
            'version': version,
            'timestamp': timestamp.isoformat(),
            'final_weights': final_weights,
            'categories': list(categories),
            'immutable_hash': generate_immutable_hash({
                'dna': dna,
                'version': version,
                'weights': final_weights,
                'categories': list(categories)
            })
        }
        
        # Atomic write pattern: write to .tmp, then rename
        dna_file = certified_dir / 'oneseek_dna.json'
        dna_temp = certified_dir / 'oneseek_dna.json.tmp'
        with open(dna_temp, 'w') as f:
            json.dump(dna_metadata, f, indent=2)
        dna_temp.replace(dna_file)
        
        # Save training results with atomic write
        training_results = {
            'dna': dna,
            'version': version,
            'dataset': str(dataset_path),
            'samples': len(datasets.get('train', [])),
            'epochs': args.epochs,
            'final_loss': results.get('metrics', {}).get('training_loss', 0.0),
            'metrics': results.get('metrics', {}),
            'fairness_metrics': results.get('fairness_metrics', {}),
            'timestamp': timestamp.isoformat(),
            'duration_seconds': 0  # Will be calculated
        }
        
        results_file = certified_dir / 'training_results.json'
        results_temp = certified_dir / 'training_results.json.tmp'
        with open(results_temp, 'w') as f:
            json.dump(training_results, f, indent=2)
        results_temp.replace(results_file)
        
        # Create ledger entry with atomic write
        ledger_entry = {
            'event': 'dna_v2_training_completed',
            'model': 'OneSeek-7B-Zero',
            'dna': dna,
            'version': version,
            'dataset_hashes': [],
            'final_weights': final_weights,
            'immutable_hash': dna_metadata['immutable_hash'],
            'timestamp': timestamp.isoformat(),
            'signer_public_key': 'dev_mode',
            'signature': 'dev_mode'
        }
        
        ledger_file = certified_dir / 'ledger_proof.json'
        ledger_temp = certified_dir / 'ledger_proof.json.tmp'
        with open(ledger_temp, 'w') as f:
            json.dump(ledger_entry, f, indent=2)
        ledger_temp.replace(ledger_file)
        
        print(f"\n[CERTIFIED] Model certified and saved to: {certified_dir}")
        print(f"   - DNA metadata: oneseek_dna.json")
        print(f"   - Training results: training_results.json")
        print(f"   - Ledger proof: ledger_proof.json")
        print(f"   - Model weights: {model_dir}/oneseek-7b-zero-v{version}.pth")
        
        return {
            'success': True,
            'dna': dna,
            'certified_dir': str(certified_dir),
            'results': results
        }
        
    except Exception as e:
        print(f"\n{'=' * 70}")
        print(f"[ERROR] Training failed: {e}")
        print(f"{'=' * 70}")
        print(f"\n[CRITICAL] No files created - training must succeed to create certified models")
        print(f"[CRITICAL] DNA v2 will NOT create fake files")
        import traceback
        traceback.print_exc()
        # Re-raise to ensure proper error handling - do NOT return success=False
        # because that can lead to fake success messages
        raise


def main():
    """Main entry point"""
    args = parse_args()
    
    # Read base models from environment variable if not provided via command line
    if not args.base_models and os.environ.get('BASE_MODELS'):
        # BASE_MODELS is comma-separated list from admin panel
        args.base_models = [m.strip() for m in os.environ.get('BASE_MODELS').split(',') if m.strip()]
    
    print("\n" + "=" * 70)
    print("OneSeek-7B-Zero DNA v2 Training")
    print("=" * 70)
    
    # Load and prepare dataset
    dataset_path = Path(args.dataset)
    if not dataset_path.exists():
        print(f"\n[ERROR] Dataset not found: {dataset_path}")
        return 1
    
    print(f"\n[DATASET] Loading dataset: {dataset_path}")
    training_data, original_examples = convert_to_training_format(dataset_path)
    print(f"[SUCCESS] Loaded {len(original_examples)} examples")
    
    # Prepare training data in OneSeekTrainer format
    data_dir = prepare_training_data(training_data)
    
    # Run real training
    result = run_real_training(args, data_dir, dataset_path)
    
    if result['success']:
        print("\n" + "=" * 70)
        print("[SUCCESS] DNA v2 Training completed successfully!")
        print(f"DNA: {result['dna']}")
        print(f"Certified output: {result['certified_dir']}")
        print("=" * 70 + "\n")
        return 0
    else:
        print("\n" + "=" * 70)
        print("[ERROR] Training failed")
        print("=" * 70 + "\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
