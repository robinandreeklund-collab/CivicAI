#!/usr/bin/env python3
"""
Micro-Training Script for OneSeek-7B-Zero
Two-stage micro-training on every interaction:
- Stage 1: Train on raw AI responses
- Stage 2: Train on analyzed data (consensus, bias, fairness)

Language-aware: Trains correct model based on detected language
"""

import argparse
import json
import sys
import os
from pathlib import Path
from datetime import datetime
import hashlib

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Try to import adaptive weighting
try:
    from scripts.adaptive_weighting import calculate_adaptive_weights, get_weight_multipliers
    ADAPTIVE_WEIGHTING_AVAILABLE = True
except ImportError:
    ADAPTIVE_WEIGHTING_AVAILABLE = False
    print("[Warning] adaptive_weighting module not available", file=sys.stderr)

def check_auto_stop(loss_history, threshold=0.001, patience=2):
    """
    Check if training should auto-stop based on loss stability
    
    Args:
        loss_history: List of recent loss values
        threshold: Minimum loss change threshold
        patience: Number of epochs to wait before stopping
    
    Returns:
        tuple: (should_stop, reason)
    """
    if len(loss_history) < patience + 1:
        return False, "Not enough history"
    
    # Check last 'patience' epochs
    recent_losses = loss_history[-(patience + 1):]
    
    # Calculate loss changes
    changes = [abs(recent_losses[i] - recent_losses[i-1]) for i in range(1, len(recent_losses))]
    
    # Check if all changes are below threshold
    if all(change < threshold for change in changes):
        avg_change = sum(changes) / len(changes)
        return True, f"Loss stable (avg change={avg_change:.6f} < {threshold})"
    
    return False, "Loss still improving"


def write_live_metrics(model_dir, metrics):
    """
    Write live training metrics to JSON file for real-time monitoring
    
    Args:
        model_dir: Path to model directory
        metrics: Dict of current metrics
    """
    metrics_file = model_dir / 'live_metrics.json'
    
    # Add timestamp
    metrics['updated_at'] = datetime.now().isoformat()
    
    # Write atomically (write to temp, then rename)
    temp_file = metrics_file.with_suffix('.tmp')
    with open(temp_file, 'w') as f:
        json.dump(metrics, f, indent=2)
    
    temp_file.rename(metrics_file)


def update_adaptive_weights(model_dir, val_losses, current_weights=None):
    """
    Update model weights based on validation losses using adaptive weighting
    
    Args:
        model_dir: Path to model directory
        val_losses: Dict of {model_name: validation_loss}
        current_weights: Current weights (optional)
    
    Returns:
        dict: New weights and adjustment info
    """
    if not ADAPTIVE_WEIGHTING_AVAILABLE:
        return {'weights': current_weights or {}, 'adjustments': {}}
    
    # Calculate new weights
    new_weights, adjustment_info = calculate_adaptive_weights(
        val_losses,
        current_weights,
        best_bonus=0.5,  # Best model gets +50% (up to 2.0x total)
        worst_penalty=0.4  # Worst model gets -40%
    )
    
    # Get multipliers for display
    multipliers = get_weight_multipliers(new_weights)
    
    # Save weights to file
    weights_file = model_dir / 'adaptive_weights.json'
    with open(weights_file, 'w') as f:
        json.dump({
            'weights': new_weights,
            'multipliers': multipliers,
            'adjustments': adjustment_info,
            'updated_at': datetime.now().isoformat()
        }, f, indent=2)
    
    return {
        'weights': new_weights,
        'multipliers': multipliers,
        'adjustments': adjustment_info
    }
    """Generate hash for data provenance"""
    if isinstance(data, dict):
        data = json.dumps(data, sort_keys=True)
    elif isinstance(data, str):
        pass
    else:
        data = str(data)
    return hashlib.sha256(data.encode()).hexdigest()

def stage1_train_raw_responses(question, raw_responses, language='en', model_name=None):
    """
    Stage 1: Train on raw AI service responses
    
    Args:
        question: User question
        raw_responses: List of {model, response} from AI services
        language: Detected language code ('sv' or 'en')
        model_name: Override model name
    
    Returns:
        dict with training results
    """
    print(f"[Stage 1] Training on raw responses (language: {language})")
    print(f"[Stage 1] Question: {question}")
    print(f"[Stage 1] Raw responses: {len(raw_responses)}")
    
    # Determine model to train
    if not model_name:
        model_name = f"OneSeek-7B-Zero-{language}"
    
    model_dir = PROJECT_ROOT / 'models' / 'oneseek-7b-zero' / model_name
    
    # Create model directory if it doesn't exist
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Simulate training (in production, would use actual transformers training)
    # For now, we collect the data and prepare it for future training
    training_sample = {
        'question': question,
        'responses': raw_responses,
        'language': language,
        'timestamp': datetime.now().isoformat(),
        'stage': 'raw_responses',
    }
    
    # Save training sample
    samples_dir = model_dir / 'training_samples'
    samples_dir.mkdir(exist_ok=True)
    
    sample_file = samples_dir / f"stage1_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.json"
    with open(sample_file, 'w', encoding='utf-8') as f:
        json.dump(training_sample, f, indent=2, ensure_ascii=False)
    
    # Count total samples
    total_samples = len(list(samples_dir.glob('stage1_*.json')))
    
    result = {
        'stage': 1,
        'method': 'raw_response_training',
        'model': model_name,
        'language': language,
        'samples_processed': len(raw_responses),
        'total_samples': total_samples,
        'sample_file': str(sample_file.name),
        'data_hash': hash_data(training_sample),
        'updated': True,
        'timestamp': datetime.now().isoformat(),
    }
    
    print(f"[Stage 1] ✓ Saved training sample: {sample_file.name}")
    print(f"[Stage 1] ✓ Total stage 1 samples: {total_samples}")
    
    return result

def stage2_train_analyzed_data(question, analyzed_data, language='en', model_name=None):
    """
    Stage 2: Train on analyzed/processed data (consensus, bias, fairness)
    
    Args:
        question: User question
        analyzed_data: dict with consensus, bias, fairness, metaSummary
        language: Detected language code ('sv' or 'en')
        model_name: Override model name
    
    Returns:
        dict with training results
    """
    print(f"[Stage 2] Training on analyzed data (language: {language})")
    print(f"[Stage 2] Question: {question}")
    print(f"[Stage 2] Analyzed metrics: {list(analyzed_data.keys())}")
    
    # Determine model to train
    if not model_name:
        model_name = f"OneSeek-7B-Zero-{language}"
    
    model_dir = PROJECT_ROOT / 'models' / 'oneseek-7b-zero' / model_name
    
    # Create model directory if it doesn't exist
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Prepare analyzed training sample
    training_sample = {
        'question': question,
        'consensus': analyzed_data.get('consensus'),
        'bias': analyzed_data.get('bias'),
        'fairness': analyzed_data.get('fairness'),
        'meta_summary': analyzed_data.get('metaSummary'),
        'language': language,
        'timestamp': datetime.now().isoformat(),
        'stage': 'analyzed_data',
    }
    
    # Save training sample
    samples_dir = model_dir / 'training_samples'
    samples_dir.mkdir(exist_ok=True)
    
    sample_file = samples_dir / f"stage2_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.json"
    with open(sample_file, 'w', encoding='utf-8') as f:
        json.dump(training_sample, f, indent=2, ensure_ascii=False)
    
    # Count total samples
    total_samples = len(list(samples_dir.glob('stage2_*.json')))
    
    # Update model metrics (simulated)
    metrics = {
        'consensus': analyzed_data.get('consensus', 0.5),
        'bias': analyzed_data.get('bias', 0.1),
        'fairness': analyzed_data.get('fairness', 0.9),
    }
    
    result = {
        'stage': 2,
        'method': 'analyzed_data_training',
        'model': model_name,
        'language': language,
        'metrics_updated': True,
        'metrics': metrics,
        'total_samples': total_samples,
        'sample_file': str(sample_file.name),
        'data_hash': hash_data(training_sample),
        'timestamp': datetime.now().isoformat(),
    }
    
    print(f"[Stage 2] ✓ Saved training sample: {sample_file.name}")
    print(f"[Stage 2] ✓ Total stage 2 samples: {total_samples}")
    print(f"[Stage 2] ✓ Updated metrics: consensus={metrics['consensus']:.3f}, bias={metrics['bias']:.3f}, fairness={metrics['fairness']:.3f}")
    
    return result

def check_dna_update_needed(model_name):
    """
    Check if DNA update is needed (every 50 questions)
    
    Args:
        model_name: Name of the model
    
    Returns:
        bool: True if DNA update needed
    """
    model_dir = PROJECT_ROOT / 'models' / 'oneseek-7b-zero' / model_name
    samples_dir = model_dir / 'training_samples'
    
    if not samples_dir.exists():
        return False
    
    # Count total samples (both stage 1 and stage 2)
    total_samples = len(list(samples_dir.glob('stage1_*.json'))) + len(list(samples_dir.glob('stage2_*.json')))
    
    # Check last DNA update
    dna_marker_file = model_dir / 'last_dna_update.json'
    
    if not dna_marker_file.exists():
        # First DNA update after 50 samples
        if total_samples >= 50:
            return True
        return False
    
    with open(dna_marker_file, 'r') as f:
        last_update = json.load(f)
    
    samples_since_update = total_samples - last_update.get('total_samples', 0)
    
    return samples_since_update >= 50

def update_dna_fingerprint(model_name):
    """
    Update DNA fingerprint with certified version (every 50 questions)
    
    Args:
        model_name: Name of the model
    
    Returns:
        dict with DNA update results
    """
    print(f"[DNA Update] Creating certified version for {model_name}")
    
    model_dir = PROJECT_ROOT / 'models' / 'oneseek-7b-zero' / model_name
    samples_dir = model_dir / 'training_samples'
    
    # Count samples
    stage1_samples = list(samples_dir.glob('stage1_*.json'))
    stage2_samples = list(samples_dir.glob('stage2_*.json'))
    total_samples = len(stage1_samples) + len(stage2_samples)
    
    # Create DNA fingerprint from datasets + weights
    dna_data = {
        'model': model_name,
        'total_samples': total_samples,
        'stage1_samples': len(stage1_samples),
        'stage2_samples': len(stage2_samples),
        'timestamp': datetime.now().isoformat(),
    }
    
    # Hash the DNA data
    dna_hash = hash_data(dna_data)
    
    # Save DNA marker
    dna_marker_file = model_dir / 'last_dna_update.json'
    dna_update = {
        'total_samples': total_samples,
        'dna_hash': dna_hash,
        'timestamp': datetime.now().isoformat(),
    }
    
    with open(dna_marker_file, 'w') as f:
        json.dump(dna_update, f, indent=2)
    
    print(f"[DNA Update] ✓ DNA fingerprint updated: {dna_hash[:16]}...")
    print(f"[DNA Update] ✓ Total samples: {total_samples}")
    
    return {
        'dna_updated': True,
        'dna_hash': dna_hash,
        'total_samples': total_samples,
        'timestamp': datetime.now().isoformat(),
    }

def main():
    parser = argparse.ArgumentParser(description='Micro-train OneSeek-7B-Zero on new data')
    parser.add_argument('--stage', type=int, choices=[1, 2], required=True, help='Training stage (1=raw, 2=analyzed)')
    parser.add_argument('--question', type=str, required=True, help='User question')
    parser.add_argument('--language', type=str, default='en', help='Detected language code')
    parser.add_argument('--model', type=str, help='Override model name')
    parser.add_argument('--data', type=str, required=True, help='JSON data file or JSON string')
    parser.add_argument('--check-dna', action='store_true', help='Check if DNA update is needed')
    
    args = parser.parse_args()
    
    # Load data
    try:
        if os.path.isfile(args.data):
            with open(args.data, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(args.data)
    except Exception as e:
        print(f"Error loading data: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Determine model name
    model_name = args.model or f"OneSeek-7B-Zero-{args.language}"
    
    # Execute training stage
    if args.stage == 1:
        result = stage1_train_raw_responses(args.question, data, args.language, model_name)
    else:
        result = stage2_train_analyzed_data(args.question, data, args.language, model_name)
    
    # Check if DNA update is needed
    if args.check_dna:
        if check_dna_update_needed(model_name):
            dna_result = update_dna_fingerprint(model_name)
            result['dna_update'] = dna_result
        else:
            result['dna_update'] = {'needed': False}
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
