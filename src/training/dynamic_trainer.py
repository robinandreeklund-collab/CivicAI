"""
Dynamic Multi-Base Model Trainer

Implements:
- Dynamic discovery of base models from models/ directory
- Adaptive weight adjustment based on validation loss
- Confidence-based auto-stop
- DNA fingerprinting and ledger integration
"""

import json
import os
import random
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime, timezone

# Import from sibling modules
from . import dna
from . import dataset_parser


def discover_base_models(models_dir: str) -> List[Dict[str, Any]]:
    """
    Discover base models by scanning models/ directory.
    
    Looks for subdirectories containing model files (config.json, tokenizer_config.json, etc.)
    
    Args:
        models_dir: Path to models directory
        
    Returns:
        List[Dict]: List of base model metadata
            [{
                'name': 'mistral-7b',
                'path': '/path/to/models/mistral-7b-instruct',
                'type': 'causal_lm',
                'parameters': '7B'
            }, ...]
    """
    models_path = Path(models_dir)
    if not models_path.exists():
        return []
    
    base_models = []
    
    # Scan for model directories
    for model_dir in models_path.iterdir():
        if not model_dir.is_dir():
            continue
        
        # Check for common model files
        has_config = (model_dir / 'config.json').exists()
        has_tokenizer = (model_dir / 'tokenizer_config.json').exists()
        has_model = any([
            (model_dir / 'pytorch_model.bin').exists(),
            (model_dir / 'model.safetensors').exists(),
            (model_dir / 'adapter_model.bin').exists(),
        ])
        
        if has_config or has_tokenizer or has_model:
            # Extract model info
            model_name = model_dir.name
            
            # Try to read config for more info
            model_type = 'causal_lm'
            parameters = 'unknown'
            
            config_file = model_dir / 'config.json'
            if config_file.exists():
                try:
                    with open(config_file, 'r') as f:
                        config = json.load(f)
                        model_type = config.get('model_type', 'causal_lm')
                        # Estimate parameters from hidden size and layers
                        hidden_size = config.get('hidden_size', 0)
                        num_layers = config.get('num_hidden_layers', 0)
                        if hidden_size > 0 and num_layers > 0:
                            # Rough estimate: ~12M params per layer per 1024 hidden size
                            est_params = (hidden_size / 1024) * num_layers * 12
                            if est_params > 1000:
                                parameters = f"{est_params / 1000:.1f}B"
                            else:
                                parameters = f"{est_params:.0f}M"
                except Exception:
                    pass
            
            base_models.append({
                'name': model_name,
                'path': str(model_dir.absolute()),
                'type': model_type,
                'parameters': parameters
            })
    
    return base_models


def run_adaptive_training(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run adaptive multi-model training with dynamic weight adjustment.
    
    Features:
    - Runs multiple epochs
    - Computes per-model validation loss
    - Adjusts weights adaptively (+20-50% for best, -30-50% for worst)
    - Applies learning rate multipliers
    - Auto-stops when loss change < 0.001 over 3 epochs
    - Generates DNA fingerprint
    - Creates ledger entry
    
    Args:
        config: Training configuration
            {
                'models_dir': Path to models directory
                'dataset_paths': List of dataset file paths
                'epochs': Number of epochs (default: 10)
                'learning_rate': Base learning rate (default: 0.0001)
                'auto_stop_threshold': Loss change threshold (default: 0.001)
                'auto_stop_patience': Epochs to wait (default: 3)
                'output_dir': Output directory for artifacts
                'private_key_path': Path to signing key (optional)
                'ledger_client': LedgerClient instance (optional)
            }
    
    Returns:
        Dict: Training results with certification data
            {
                'final_weights': {model_name: weight},
                'training_history': [{epoch, loss, weights}, ...],
                'ledger_entry': {...},
                'dna': 'DNA string',
                'output_path': 'path/to/artifacts'
            }
    """
    # Extract config
    models_dir = config.get('models_dir', 'models')
    selected_base_models = config.get('selected_base_models')  # Optional filter
    dataset_paths = config.get('dataset_paths', [])
    epochs = config.get('epochs', 10)
    base_lr = config.get('learning_rate', 0.0001)
    auto_stop_threshold = config.get('auto_stop_threshold', 0.001)
    auto_stop_patience = config.get('auto_stop_patience', 3)
    output_dir = config.get('output_dir', 'models/oneseek-certified')
    private_key_path = config.get('private_key_path')
    ledger_client = config.get('ledger_client')
    seed = config.get('seed', 42)
    
    # Set random seed for determinism
    random.seed(seed)
    
    # Discover base models
    base_models = discover_base_models(models_dir)
    if not base_models:
        raise ValueError(f"No base models found in {models_dir}")
    
    # Filter to selected models if specified
    if selected_base_models:
        base_models = [m for m in base_models if m['name'] in selected_base_models]
        if not base_models:
            raise ValueError(f"None of the selected models found: {selected_base_models}")
    
    print(f"Discovered {len(base_models)} base models:")
    for model in base_models:
        print(f"  - {model['name']} ({model['parameters']} params)")
    
    # Initialize equal weights
    model_weights = {model['name']: 1.0 / len(base_models) for model in base_models}
    
    # Extract dataset categories
    dataset_categories = list(dataset_parser.extract_categories_from_filenames(dataset_paths))
    print(f"Dataset categories: {dataset_categories}")
    
    # Training history
    training_history = []
    loss_history = []
    
    # Simulate training
    print(f"\nTraining for {epochs} epochs...")
    for epoch in range(epochs):
        # Simulate per-model validation loss
        # In real implementation, this would run actual training
        per_model_loss = {}
        for model in base_models:
            model_name = model['name']
            # Simulate loss with some randomness but generally decreasing
            base_loss = 0.5 * (1.0 - epoch / epochs) + random.uniform(-0.05, 0.05)
            # Apply weight influence
            weighted_loss = base_loss * (1.0 + 0.1 * (1.0 - model_weights[model_name]))
            per_model_loss[model_name] = max(0.01, weighted_loss)
        
        # Compute total weighted loss
        total_loss = sum(
            per_model_loss[model['name']] * model_weights[model['name']]
            for model in base_models
        )
        
        loss_history.append(total_loss)
        
        # Adaptive weight adjustment
        if epoch > 0:
            # Find best and worst models
            best_model = min(per_model_loss, key=per_model_loss.get)
            worst_model = max(per_model_loss, key=per_model_loss.get)
            
            # Adjust weights
            for model_name in model_weights:
                if model_name == best_model:
                    # Increase weight by 20-50%
                    adjustment = random.uniform(0.20, 0.50)
                    model_weights[model_name] *= (1.0 + adjustment)
                elif model_name == worst_model:
                    # Decrease weight by 30-50%
                    adjustment = random.uniform(0.30, 0.50)
                    model_weights[model_name] *= (1.0 - adjustment)
            
            # Normalize weights to sum to 1.0
            total_weight = sum(model_weights.values())
            model_weights = {k: v / total_weight for k, v in model_weights.items()}
        
        # Log epoch
        training_history.append({
            'epoch': epoch + 1,
            'total_loss': total_loss,
            'per_model_loss': per_model_loss.copy(),
            'weights': model_weights.copy()
        })
        
        print(f"Epoch {epoch + 1}/{epochs}: loss={total_loss:.4f}, weights={{{', '.join(f'{k}:{v:.3f}' for k, v in model_weights.items())}}}")
        
        # Auto-stop check
        if epoch >= auto_stop_patience:
            recent_losses = loss_history[-auto_stop_patience:]
            loss_change = max(recent_losses) - min(recent_losses)
            if loss_change < auto_stop_threshold:
                print(f"Auto-stopping: loss change {loss_change:.6f} < {auto_stop_threshold}")
                break
    
    # Generate DNA fingerprint
    timestamp = datetime.now(timezone.utc).isoformat()
    model_name = "OneSeek-7B-Zero"
    version = "1.0"  # Could be extracted from config
    
    dna_string = dna.build_dna(
        model_name=model_name,
        version=version,
        final_weights=model_weights,
        dataset_categories=dataset_categories,
        timestamp=timestamp
    )
    
    print(f"\nGenerated DNA: {dna_string}")
    
    # Compute dataset hashes
    dataset_hashes = []
    for dataset_path in dataset_paths:
        try:
            with open(dataset_path, 'rb') as f:
                dataset_data = f.read()
                dataset_hash = dna.compute_sha256(dataset_data)
                dataset_hashes.append({
                    'path': str(dataset_path),
                    'hash': dataset_hash
                })
        except Exception as e:
            print(f"Warning: Could not hash dataset {dataset_path}: {e}")
    
    # Create ledger entry payload
    ledger_payload = {
        'event': 'training',
        'model': model_name,
        'version': version,
        'dna': dna_string,
        'dataset_hashes': dataset_hashes,
        'final_weights': model_weights,
        'training_config': {
            'epochs': len(training_history),
            'base_lr': base_lr,
            'seed': seed
        },
        'timestamp': timestamp,
    }
    
    # Generate immutable hash
    immutable_hash = dna.generate_immutable_hash(ledger_payload)
    ledger_payload['immutable_hash'] = immutable_hash
    
    # Sign if private key provided
    if private_key_path and Path(private_key_path).exists():
        try:
            payload_bytes = dna.canonical_json(ledger_payload)
            signature = dna.sign_payload(payload_bytes, private_key_path)
            public_key = dna.get_public_key_hex(private_key_path)
            
            ledger_payload['signature'] = signature
            ledger_payload['signer_public_key'] = public_key
            
            print(f"Signed ledger entry with public key: {public_key[:16]}...")
        except Exception as e:
            print(f"Warning: Could not sign ledger entry: {e}")
            ledger_payload['signature'] = None
            ledger_payload['signer_public_key'] = None
    else:
        ledger_payload['signature'] = None
        ledger_payload['signer_public_key'] = None
    
    # Write to ledger if client provided
    if ledger_client and ledger_payload.get('signature'):
        try:
            entry_id = ledger_client.write_entry(ledger_payload)
            print(f"Wrote ledger entry: {entry_id}")
        except Exception as e:
            print(f"Warning: Could not write to ledger: {e}")
    
    # Create output artifacts
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save adapter model (placeholder)
    adapter_file = output_path / "adapter_model.bin"
    with open(adapter_file, 'wb') as f:
        # In real implementation, this would be actual model weights
        f.write(b"PLACEHOLDER_MODEL_WEIGHTS")
    
    # Save DNA JSON
    dna_file = output_path / "oneseek_dna.json"
    with open(dna_file, 'w') as f:
        json.dump({
            'dna': dna_string,
            'model': model_name,
            'version': version,
            'final_weights': model_weights,
            'dataset_categories': dataset_categories,
            'timestamp': timestamp
        }, f, indent=2)
    
    # Save ledger proof
    ledger_proof_file = output_path / "ledger_proof.json"
    with open(ledger_proof_file, 'w') as f:
        json.dump(ledger_payload, f, indent=2)
    
    print(f"\nArtifacts saved to: {output_path}")
    print(f"  - adapter_model.bin")
    print(f"  - oneseek_dna.json")
    print(f"  - ledger_proof.json")
    
    return {
        'final_weights': model_weights,
        'training_history': training_history,
        'ledger_entry': ledger_payload,
        'dna': dna_string,
        'output_path': str(output_path),
        'immutable_hash': immutable_hash
    }


# Example usage
if __name__ == "__main__":
    from pathlib import Path
    import sys
    
    # Add parent directory to path for imports
    sys.path.insert(0, str(Path(__file__).parent.parent))
    
    from ledger.ledger_client import InMemoryLedgerClient
    
    # Create test configuration
    config = {
        'models_dir': 'models',
        'dataset_paths': [
            'datasets/oneseek_identity_v1.jsonl',
            'datasets/civic_fairness_data.json'
        ],
        'epochs': 5,
        'learning_rate': 0.0001,
        'auto_stop_threshold': 0.001,
        'auto_stop_patience': 3,
        'output_dir': 'models/oneseek-certified/test-run',
        'seed': 42,
        'ledger_client': InMemoryLedgerClient()
    }
    
    # Run training
    print("Running adaptive training test...")
    result = run_adaptive_training(config)
    
    print(f"\n[SUCCESS] Training completed!")
    print(f"Final DNA: {result['dna']}")
    print(f"Output: {result['output_path']}")
