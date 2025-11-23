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

# Default fallback model key when no specific model information is available
DEFAULT_MODEL_KEY = 'unknown-model'


def extract_language_from_filename(filename: str) -> str:
    """
    Extract language code from dataset filename.
    Uses priority matching to handle multi-language filenames.
    
    Args:
        filename: Dataset filename or path
    
    Returns:
        str: Language code (en, sv, no, da, fi)
    """
    name_lower = filename.lower()
    
    # Language mappings in priority order (most specific first)
    language_patterns = [
        ('svenska', 'sv'),
        ('swedish', 'sv'),
        ('svensk', 'sv'),
        ('swed', 'sv'),
        ('norwegian', 'no'),
        ('norsk', 'no'),
        ('danish', 'da'),
        ('dansk', 'da'),
        ('finnish', 'fi'),
        ('suomi', 'fi'),
        ('english', 'en'),
        ('eng', 'en'),
    ]
    
    # Find all matching languages
    matches = []
    for pattern, code in language_patterns:
        if pattern in name_lower:
            matches.append((pattern, code, name_lower.index(pattern)))
    
    # If multiple matches, use the one that appears first in filename
    if matches:
        # Sort by position in filename (earliest first)
        matches.sort(key=lambda x: x[2])
        return matches[0][1]
    
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
    parser.add_argument('--language', help='Language code for DNA fingerprint (sv, en, ensv, etc.)')
    
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
        from ml.training.certified_structure import (
            generate_directory_name,
            create_certified_model_directory,
            save_certified_metadata,
            update_current_symlink,
            add_to_ledger,
            calculate_short_hash,
            extract_datasets_from_filename
        )
        
        # Setup paths - use temporary directory for training, then move to certified location
        temp_model_dir = project_root / 'models' / 'oneseek-7b-zero' / 'weights'
        ledger_dir = project_root / 'ml' / 'ledger'
        
        temp_model_dir.mkdir(parents=True, exist_ok=True)
        ledger_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n{'=' * 70}")
        print("OneSeek-7B-Zero DNA v2 Training")
        print(f"{'=' * 70}\n")
        
        # Determine language: use command-line arg if provided, otherwise extract from filename
        if args.language:
            training_language = args.language
            print(f"[LANGUAGE] Using language from command-line: {training_language}")
        else:
            training_language = extract_language_from_filename(dataset_path.name)
            print(f"[LANGUAGE] Detected language from filename: {training_language}")
        
        # Create trainer
        trainer = OneSeekTrainer(
            data_dir=str(data_dir),
            model_dir=str(temp_model_dir),
            ledger_dir=str(ledger_dir),
            language=training_language,
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
        
        # Create temporary run directory for live metrics during training
        output_dir = args.output_dir or str(project_root / 'models' / 'oneseek-certified')
        temp_run_dir = Path(output_dir) / run_id
        temp_run_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n[INFO] Created temporary run directory for live metrics: {temp_run_dir}")
        
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
        
        # Extract dataset names for DNA naming
        dataset_names = extract_datasets_from_filename(dataset_path.name)
        
        # Determine language: use command-line arg if provided, otherwise extract from filename
        if args.language:
            language = args.language
            print(f"[DNA] Using language from command-line: {language}")
        else:
            language = extract_language_from_filename(dataset_path.name)
            print(f"[DNA] Detected language from filename: {language}")
        
        # Get base models from multiple sources (in priority order):
        # 1. Command-line argument --base-models
        # 2. Environment variable BASE_MODELS (set by admin.js)
        # 3. Actual trained models from results
        base_models_list = None
        
        if args.base_models:
            base_models_list = args.base_models
            print(f"[DNA] Using base models from command-line: {base_models_list}")
        elif 'BASE_MODELS' in os.environ:
            base_models_env = os.environ.get('BASE_MODELS', '')
            if base_models_env:
                base_models_list = [m.strip() for m in base_models_env.split(',') if m.strip()]
                print(f"[DNA] Using base models from environment: {base_models_list}")
        
        # Get actual trained models from results (most accurate)
        trained_models_info = results.get('trained_models', {})
        if trained_models_info:
            # Use actual trained model names from the training results
            trained_model_names = list(trained_models_info.keys())
            print(f"[DNA] Actual trained models: {trained_model_names}")
            
            # Calculate final weights from actual training results
            # Use equal weights for now (can be enhanced with actual training weights later)
            num_models = len(trained_model_names)
            final_weights = {model: 1.0 / num_models for model in trained_model_names}
            base_model_name = trained_model_names[0]  # Use first model for metadata
        elif base_models_list:
            # Fallback to base models list if training results don't have model info
            num_models = len(base_models_list)
            final_weights = {model: 1.0 / num_models for model in base_models_list}
            base_model_name = base_models_list[0]
        else:
            # Last resort fallback
            final_weights = {DEFAULT_MODEL_KEY: 1.0}
            base_model_name = DEFAULT_MODEL_KEY
            print(f"[WARNING] No base model information available, using '{DEFAULT_MODEL_KEY}' as fallback")
        
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
        print(f"   Temporary model files saved to: {temp_model_dir}")
        
        # Calculate hashes for DNA-based directory naming
        # Hash of training data
        training_data_str = json.dumps({
            'dataset': dataset_path.name,
            'samples': len(datasets.get('train', [])),
            'categories': list(categories)
        }, sort_keys=True)
        training_data_hash = calculate_short_hash(training_data_str, length=8)
        
        # Hash of model weights (use final loss as proxy for now)
        weights_data_str = json.dumps({
            'final_loss': results.get('metrics', {}).get('training_loss', 0.0),
            'dna': dna,
            'timestamp': timestamp.isoformat()
        }, sort_keys=True)
        model_weights_hash = calculate_short_hash(weights_data_str, length=8)
        
        # Generate DNA-based directory name
        certified_models_dir = Path(output_dir)
        directory_name = generate_directory_name(
            version=version,
            language=language,
            datasets=dataset_names,
            training_data_hash=training_data_hash,
            model_weights_hash=model_weights_hash
        )
        
        print(f"\n[CERTIFIED] Creating certified model directory: {directory_name}")
        
        # Create certified model directory
        certified_dir = create_certified_model_directory(
            certified_models_dir=certified_models_dir,
            directory_name=directory_name
        )
        
        # Copy trained model files to certified directory
        print(f"[CERTIFIED] Copying model files to certified directory...")
        import shutil
        
        # Copy LoRA adapters if they exist
        lora_adapters_dir = temp_model_dir.parent / 'lora_adapters'
        if lora_adapters_dir.exists():
            for adapter_dir in lora_adapters_dir.iterdir():
                if adapter_dir.is_dir():
                    dest_dir = certified_dir / adapter_dir.name
                    if dest_dir.exists():
                        shutil.rmtree(dest_dir)
                    shutil.copytree(adapter_dir, dest_dir)
                    print(f"   Copied: {adapter_dir.name}/")
        
        # Copy weight files
        for weight_file in temp_model_dir.glob('*.pth'):
            shutil.copy2(weight_file, certified_dir / weight_file.name)
            print(f"   Copied: {weight_file.name}")
        
        # Move temporary run files to certified directory
        if temp_run_dir.exists() and temp_run_dir != certified_dir:
            for item in temp_run_dir.iterdir():
                if item.is_file():
                    dest = certified_dir / item.name
                    if dest.exists():
                        dest.unlink()
                    shutil.move(str(item), str(dest))
                    print(f"   Moved: {item.name}")
            # Remove temp directory
            shutil.rmtree(temp_run_dir)
        
        # Save certified metadata
        save_certified_metadata(
            model_dir=certified_dir,
            version=version,
            dna=dna,
            base_model=base_model_name,
            language=language,
            datasets=dataset_names,
            training_type='dna-v2',
            samples_processed=len(datasets.get('train', [])),
            metrics=results.get('metrics', {}),
            training_data_hash=training_data_hash,
            model_weights_hash=model_weights_hash
        )
        
        # Save training results with atomic write
        training_results = {
            'dna': dna,
            'version': version,
            'baseModels': list(final_weights.keys()),  # Actual base models used
            'dataset': str(dataset_path),
            'samples': len(datasets.get('train', [])),
            'epochs': args.epochs,
            'final_loss': results.get('metrics', {}).get('training_loss', 0.0),
            'metrics': results.get('metrics', {}),
            'fairness_metrics': results.get('fairness_metrics', {}),
            'trained_models': list(trained_models_info.keys()) if trained_models_info else [],
            'timestamp': timestamp.isoformat(),
            'duration_seconds': 0  # Will be calculated
        }
        
        results_file = certified_dir / 'training_results.json'
        results_temp = certified_dir / 'training_results.json.tmp'
        with open(results_temp, 'w') as f:
            json.dump(training_results, f, indent=2)
        results_temp.replace(results_file)
        
        # Calculate immutable hash
        immutable_hash = generate_immutable_hash({
            'dna': dna,
            'version': version,
            'weights': final_weights,
            'categories': list(categories)
        })
        
        # Add to ledger proof
        add_to_ledger(
            certified_models_dir=certified_models_dir,
            directory_name=directory_name,
            dna=dna,
            created_at=timestamp.isoformat() + 'Z',
            immutable_hash=f"sha256:{immutable_hash}"
        )
        
        # Update symlink to point to this new model
        print(f"\n[SYMLINK] Updating OneSeek-7B-Zero-CURRENT symlink...")
        update_current_symlink(
            certified_models_dir=certified_models_dir,
            target_directory=directory_name
        )
        
        print(f"\n[CERTIFIED] Model certified and saved to: {certified_dir}")
        print(f"[CERTIFIED] Directory name: {directory_name}")
        print(f"   - Metadata: metadata.json")
        print(f"   - Training results: training_results.json")
        print(f"   - Ledger proof: updated in {certified_models_dir / 'ledger_proof.json'}")
        print(f"   - Model weights: *.pth files")
        print(f"   - LoRA adapters: *-adapter/ directories")
        if final_weights:
            print(f"   - Base models: {', '.join(final_weights.keys())}")
        print(f"\n[SYMLINK] OneSeek-7B-Zero-CURRENT → {directory_name}")
        
        return {
            'success': True,
            'dna': dna,
            'certified_dir': str(certified_dir),
            'directory_name': directory_name,
            'training_data_hash': training_data_hash,
            'model_weights_hash': model_weights_hash,
            'symlink_updated': True,
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
    
    if result and result.get('success'):
        print("\n" + "=" * 70)
        print("[SUCCESS] DNA v2 Training completed successfully!")
        print(f"DNA: {result['dna']}")
        print(f"Directory: {result.get('directory_name', 'N/A')}")
        print(f"Certified output: {result['certified_dir']}")
        print(f"Symlink: OneSeek-7B-Zero-CURRENT → {result.get('directory_name', 'N/A')}")
        print("=" * 70 + "\n")
        return 0
    else:
        print("\n" + "=" * 70)
        print("[ERROR] Training failed")
        print("=" * 70 + "\n")
        return 1


if __name__ == '__main__':
    sys.exit(main())
