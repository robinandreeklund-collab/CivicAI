"""
Tests for adaptive weighting functionality
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from training.dynamic_trainer import discover_base_models, run_adaptive_training
from ledger.ledger_client import InMemoryLedgerClient


def test_discover_base_models(tmp_path):
    """Test base model discovery."""
    # Create mock model directories
    model1 = tmp_path / "mistral-7b-instruct"
    model1.mkdir()
    (model1 / "config.json").write_text('{"model_type": "causal_lm", "hidden_size": 4096, "num_hidden_layers": 32}')
    
    model2 = tmp_path / "llama-2-7b-chat"
    model2.mkdir()
    (model2 / "tokenizer_config.json").write_text('{}')
    
    # Not a model (no config files)
    not_model = tmp_path / "some_dir"
    not_model.mkdir()
    
    # Discover models
    models = discover_base_models(str(tmp_path))
    
    # Should find 2 models
    assert len(models) == 2
    
    # Check model info
    model_names = {m['name'] for m in models}
    assert 'mistral-7b-instruct' in model_names
    assert 'llama-2-7b-chat' in model_names


def test_adaptive_weighting_simulation():
    """Test adaptive weight adjustment logic."""
    # Simulate per-model losses
    per_model_loss = {
        'model_a': 0.5,
        'model_b': 0.3,  # Best
        'model_c': 0.7,  # Worst
    }
    
    # Initial equal weights
    weights = {
        'model_a': 1/3,
        'model_b': 1/3,
        'model_c': 1/3,
    }
    
    # Find best and worst
    best_model = min(per_model_loss, key=per_model_loss.get)
    worst_model = max(per_model_loss, key=per_model_loss.get)
    
    assert best_model == 'model_b'
    assert worst_model == 'model_c'
    
    # Adjust weights (simplified)
    for model_name in weights:
        if model_name == best_model:
            weights[model_name] *= 1.3  # +30%
        elif model_name == worst_model:
            weights[model_name] *= 0.6  # -40%
    
    # Normalize
    total = sum(weights.values())
    weights = {k: v / total for k, v in weights.items()}
    
    # Best should have higher weight, worst should have lower
    assert weights['model_b'] > weights['model_a']
    assert weights['model_c'] < weights['model_a']
    
    # Weights should sum to 1
    assert abs(sum(weights.values()) - 1.0) < 0.001


def test_run_adaptive_training_basic(tmp_path):
    """Test basic adaptive training execution."""
    # Create minimal test setup
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    
    # Create a test model
    model1 = models_dir / "test-model-1"
    model1.mkdir()
    (model1 / "config.json").write_text('{"model_type": "causal_lm"}')
    
    # Create test dataset
    dataset_file = tmp_path / "test_civic_data.jsonl"
    dataset_file.write_text('{"instruction": "test", "output": "test"}')
    
    # Setup config
    config = {
        'models_dir': str(models_dir),
        'dataset_paths': [str(dataset_file)],
        'epochs': 3,
        'learning_rate': 0.0001,
        'auto_stop_threshold': 0.001,
        'auto_stop_patience': 2,
        'output_dir': str(tmp_path / "output"),
        'seed': 42,
        'ledger_client': InMemoryLedgerClient()
    }
    
    # Run training
    result = run_adaptive_training(config)
    
    # Check results
    assert 'final_weights' in result
    assert 'training_history' in result
    assert 'ledger_entry' in result
    assert 'dna' in result
    assert 'output_path' in result
    
    # Check DNA format
    assert result['dna'].startswith('OneSeek-7B-Zero.v')
    
    # Check weights sum to 1
    total_weight = sum(result['final_weights'].values())
    assert abs(total_weight - 1.0) < 0.001
    
    # Check training history
    assert len(result['training_history']) > 0
    assert len(result['training_history']) <= 3  # Max 3 epochs


def test_auto_stop_mechanism():
    """Test auto-stop logic."""
    loss_history = [0.5, 0.48, 0.479, 0.478, 0.477]
    threshold = 0.001
    patience = 3
    
    # Check last 3 losses
    recent_losses = loss_history[-patience:]
    loss_change = max(recent_losses) - min(recent_losses)
    
    # Change is 0.002, should not stop yet
    assert loss_change > threshold
    
    # Add more converged losses
    loss_history.extend([0.4765, 0.4764, 0.4763])
    recent_losses = loss_history[-patience:]
    loss_change = max(recent_losses) - min(recent_losses)
    
    # Change is ~0.0002, should stop
    assert loss_change < threshold


def test_run_adaptive_training_with_multiple_models(tmp_path):
    """Test training with multiple base models."""
    # Create models directory
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    
    # Create multiple test models
    for i in range(3):
        model = models_dir / f"model-{i}"
        model.mkdir()
        (model / "config.json").write_text('{"model_type": "causal_lm"}')
    
    # Create test dataset
    dataset_file = tmp_path / "fairness_swedish_data.jsonl"
    dataset_file.write_text('{"instruction": "test", "output": "test"}')
    
    # Setup config
    config = {
        'models_dir': str(models_dir),
        'dataset_paths': [str(dataset_file)],
        'epochs': 5,
        'output_dir': str(tmp_path / "output"),
        'seed': 42,
        'ledger_client': InMemoryLedgerClient()
    }
    
    # Run training
    result = run_adaptive_training(config)
    
    # Should have 3 models in final weights
    assert len(result['final_weights']) == 3
    
    # Check all models have positive weights
    assert all(w > 0 for w in result['final_weights'].values())
    
    # Weights should be different (adaptive adjustment)
    weights_list = list(result['final_weights'].values())
    assert not all(w == weights_list[0] for w in weights_list), \
        "Weights should differ due to adaptive adjustment"


def test_dataset_hashing_in_ledger(tmp_path):
    """Test that dataset hashes are included in ledger entry."""
    # Create models directory
    models_dir = tmp_path / "models"
    models_dir.mkdir()
    
    model = models_dir / "test-model"
    model.mkdir()
    (model / "config.json").write_text('{}')
    
    # Create test datasets
    dataset1 = tmp_path / "dataset1.jsonl"
    dataset1.write_text('{"instruction": "q1", "output": "a1"}')
    
    dataset2 = tmp_path / "dataset2.jsonl"
    dataset2.write_text('{"instruction": "q2", "output": "a2"}')
    
    # Setup config
    config = {
        'models_dir': str(models_dir),
        'dataset_paths': [str(dataset1), str(dataset2)],
        'epochs': 2,
        'output_dir': str(tmp_path / "output"),
        'ledger_client': InMemoryLedgerClient()
    }
    
    # Run training
    result = run_adaptive_training(config)
    
    # Check ledger entry has dataset hashes
    ledger_entry = result['ledger_entry']
    assert 'dataset_hashes' in ledger_entry
    assert len(ledger_entry['dataset_hashes']) == 2
    
    # Each should have path and hash
    for ds_hash in ledger_entry['dataset_hashes']:
        assert 'path' in ds_hash
        assert 'hash' in ds_hash
        assert len(ds_hash['hash']) == 64  # SHA-256


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
