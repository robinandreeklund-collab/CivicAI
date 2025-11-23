"""
Tests for certified model structure helpers
"""

import pytest
import sys
import tempfile
import shutil
import json
from pathlib import Path
from datetime import datetime

# Add ml/training to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml' / 'training'))

from certified_structure import (
    generate_directory_name,
    create_certified_model_directory,
    save_certified_metadata,
    update_current_symlink,
    add_to_ledger,
    calculate_short_hash,
    extract_datasets_from_filename
)


def test_generate_directory_name():
    """Test DNA-based directory name generation."""
    name = generate_directory_name(
        version="1.0",
        language="sv",
        datasets=["CivicID", "SwedID"],
        training_data_hash="141521ad",
        model_weights_hash="90cdf6f1"
    )
    
    expected = "OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1"
    assert name == expected


def test_generate_directory_name_single_dataset():
    """Test directory name with single dataset."""
    name = generate_directory_name(
        version="1.0",
        language="en",
        datasets=["Identity"],
        training_data_hash="8f3a1c9d",
        model_weights_hash="a1b2c3d4"
    )
    
    expected = "OneSeek-7B-Zero.v1.0.en.dsIdentity.8f3a1c9d.a1b2c3d4"
    assert name == expected


def test_generate_directory_name_no_datasets():
    """Test directory name with no datasets (uses default)."""
    name = generate_directory_name(
        version="1.0",
        language="sv",
        datasets=[],
        training_data_hash="12345678",
        model_weights_hash="abcdef12"
    )
    
    expected = "OneSeek-7B-Zero.v1.0.sv.dsDefault.12345678.abcdef12"
    assert name == expected


def test_calculate_short_hash():
    """Test short hash calculation."""
    data = "test data"
    hash_result = calculate_short_hash(data, length=8)
    
    # Should be 8 characters
    assert len(hash_result) == 8
    # Should be hex
    assert all(c in "0123456789abcdef" for c in hash_result)
    
    # Same data should produce same hash
    hash_result2 = calculate_short_hash(data, length=8)
    assert hash_result == hash_result2


def test_calculate_short_hash_different_lengths():
    """Test short hash with different lengths."""
    data = "test data"
    
    hash_8 = calculate_short_hash(data, length=8)
    hash_16 = calculate_short_hash(data, length=16)
    
    assert len(hash_8) == 8
    assert len(hash_16) == 16
    # Shorter hash should be prefix of longer hash (from same SHA256)
    assert hash_16.startswith(hash_8)


def test_extract_datasets_from_filename():
    """Test dataset extraction from filenames."""
    # Test various filename formats
    assert extract_datasets_from_filename("CivicID_SwedID_combined.jsonl") == ["CivicID", "SwedID"]
    assert extract_datasets_from_filename("Identity-dataset.json") == ["Identity"]
    assert extract_datasets_from_filename("civic+swed+identity.jsonl") == ["civic", "swed", "identity"]
    assert extract_datasets_from_filename("training_data.jsonl") == ["data"]
    assert extract_datasets_from_filename("test.json") == ["test"]


def test_create_certified_model_directory():
    """Test certified directory creation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        certified_dir = Path(tmpdir)
        directory_name = "OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1"
        
        model_dir = create_certified_model_directory(certified_dir, directory_name)
        
        assert model_dir.exists()
        assert model_dir.is_dir()
        assert model_dir.name == directory_name


def test_save_certified_metadata():
    """Test metadata.json creation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        model_dir = Path(tmpdir)
        
        save_certified_metadata(
            model_dir=model_dir,
            version="1.0",
            dna="OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1",
            base_model="KB-Llama-3.1-8B-Swedish",
            language="sv",
            datasets=["CivicID", "SwedID"],
            training_type="dna-v2",
            samples_processed=50000,
            metrics={"loss": 0.245, "accuracy": 0.89},
            training_data_hash="141521ad",
            model_weights_hash="90cdf6f1"
        )
        
        metadata_file = model_dir / 'metadata.json'
        assert metadata_file.exists()
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        assert metadata['version'] == "OneSeek-7B-Zero.v1.0"
        assert metadata['dna'] == "OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1"
        assert metadata['baseModel'] == "KB-Llama-3.1-8B-Swedish"
        assert metadata['language'] == "sv"
        assert metadata['datasets'] == ["CivicID", "SwedID"]
        assert metadata['trainingType'] == "dna-v2"
        assert metadata['samplesProcessed'] == 50000
        assert metadata['metrics']['loss'] == 0.245
        assert metadata['hashes']['trainingData'] == "141521ad"
        assert metadata['hashes']['modelWeights'] == "90cdf6f1"


def test_save_certified_metadata_with_status():
    """Test metadata.json creation with status and finalized_at."""
    with tempfile.TemporaryDirectory() as tmpdir:
        model_dir = Path(tmpdir)
        finalized_at = "2025-11-23T18:00:00Z"
        
        save_certified_metadata(
            model_dir=model_dir,
            version="1.0",
            dna="OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1",
            base_model="KB-Llama-3.1-8B-Swedish",
            language="sv",
            datasets=["CivicID", "SwedID"],
            training_type="dna-v2",
            samples_processed=50000,
            metrics={"loss": 6.4572, "accuracy": 0.850, "fairness": 0.900, "bias_score": 0.15},
            training_data_hash="141521ad",
            model_weights_hash="90cdf6f1",
            status="completed",
            finalized_at=finalized_at
        )
        
        metadata_file = model_dir / 'metadata.json'
        assert metadata_file.exists()
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        assert metadata['version'] == "OneSeek-7B-Zero.v1.0"
        assert metadata['status'] == "completed"
        assert metadata['finalizedAt'] == finalized_at
        assert metadata['metrics']['loss'] == 6.4572
        assert metadata['metrics']['accuracy'] == 0.850
        assert metadata['metrics']['fairness'] == 0.900
        assert metadata['metrics']['bias_score'] == 0.15


def test_add_to_ledger():
    """Test ledger_proof.json creation and updates."""
    with tempfile.TemporaryDirectory() as tmpdir:
        certified_dir = Path(tmpdir)
        
        # Add first entry
        add_to_ledger(
            certified_models_dir=certified_dir,
            directory_name="OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1",
            dna="OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1",
            created_at="2025-11-23T01:00:00Z",
            immutable_hash="sha256:abc123..."
        )
        
        ledger_file = certified_dir / 'ledger_proof.json'
        assert ledger_file.exists()
        
        with open(ledger_file, 'r', encoding='utf-8') as f:
            ledger = json.load(f)
        
        assert 'models' in ledger
        assert len(ledger['models']) == 1
        assert ledger['models'][0]['directory'] == "OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1"
        assert ledger['models'][0]['dna'] == "OneSeek-7B-Zero.v1.0.141521ad.90cdf6f1"
        
        # Add second entry
        add_to_ledger(
            certified_models_dir=certified_dir,
            directory_name="OneSeek-7B-Zero.v1.1.en.dsIdentity.8f3a1c9d.a1b2c3d4",
            dna="OneSeek-7B-Zero.v1.1.8f3a1c9d.a1b2c3d4",
            created_at="2025-11-23T02:00:00Z",
            immutable_hash="sha256:def456..."
        )
        
        with open(ledger_file, 'r', encoding='utf-8') as f:
            ledger = json.load(f)
        
        assert len(ledger['models']) == 2
        assert ledger['models'][1]['directory'] == "OneSeek-7B-Zero.v1.1.en.dsIdentity.8f3a1c9d.a1b2c3d4"


def test_update_current_symlink():
    """Test symlink/marker file creation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        certified_dir = Path(tmpdir)
        target_directory = "OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1"
        
        # Create target directory
        target_path = certified_dir / target_directory
        target_path.mkdir(parents=True)
        
        # Create symlink
        update_current_symlink(certified_dir, target_directory)
        
        symlink_path = certified_dir / 'OneSeek-7B-Zero-CURRENT'
        marker_path = Path(str(symlink_path) + '.txt')
        
        # Should have either symlink or marker file
        has_symlink = symlink_path.exists() or symlink_path.is_symlink()
        has_marker = marker_path.exists()
        
        assert has_symlink or has_marker, "Should create either symlink or marker file"
        
        if has_symlink:
            # Verify symlink points to correct target
            resolved = symlink_path.resolve()
            assert resolved == target_path.resolve()
        elif has_marker:
            # Verify marker contains correct path
            with open(marker_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            assert target_directory in content or str(target_path) in content


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
