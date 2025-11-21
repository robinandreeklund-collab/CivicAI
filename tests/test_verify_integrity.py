"""
Tests for verify_integrity script
"""

import pytest
import json
import sys
from pathlib import Path

# Add models/oneseek-certified to path for importing verify_integrity
sys.path.insert(0, str(Path(__file__).parent.parent / 'models' / 'oneseek-certified'))

# Add src to path for DNA functions
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import verify_integrity
from training import dna


def create_test_certified_model(output_dir: Path, include_signature=True, tamper_dna=False):
    """Helper to create a test certified model directory."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create DNA data
    original_dna = "OneSeek-7B-Zero.v1.0.abc123.def456.789xyz"
    tampered_dna = "OneSeek-7B-Zero.v1.0.TAMPERED.def456.789xyz"
    
    # DNA file gets tampered DNA if requested, ledger gets original
    dna_file_string = tampered_dna if tamper_dna else original_dna
    ledger_dna_string = original_dna  # Ledger always has original
    
    dna_data = {
        "dna": dna_file_string,
        "model": "OneSeek-7B-Zero",
        "version": "1.0",
        "final_weights": {"mistral-7b": 0.6, "llama-2": 0.4},
        "dataset_categories": ["CivicID", "SwedID"],
        "timestamp": "2025-11-21T12:00:00Z"
    }
    
    # Create ledger payload with original DNA
    ledger_payload = {
        "event": "training",
        "model": "OneSeek-7B-Zero",
        "version": "1.0",
        "dna": ledger_dna_string,
        "dataset_hashes": [],
        "final_weights": {"mistral-7b": 0.6, "llama-2": 0.4},
        "training_config": {"epochs": 5},
        "timestamp": "2025-11-21T12:00:00Z",
    }
    
    # Generate immutable hash
    immutable_hash = dna.generate_immutable_hash(ledger_payload)
    ledger_payload["immutable_hash"] = immutable_hash
    
    # Add signature if requested
    if include_signature:
        try:
            # Generate test keypair
            private_key, public_key = dna.generate_test_keypair(str(output_dir))
            private_key_path = output_dir / "test_private_key.bin"
            
            # Sign
            payload_bytes = dna.canonical_json(ledger_payload)
            signature = dna.sign_payload(payload_bytes, str(private_key_path))
            
            ledger_payload["signature"] = signature
            ledger_payload["signer_public_key"] = public_key
        except ImportError:
            # pynacl not installed, skip signing
            ledger_payload["signature"] = None
            ledger_payload["signer_public_key"] = None
    else:
        ledger_payload["signature"] = None
        ledger_payload["signer_public_key"] = None
    
    # Write files
    with open(output_dir / "oneseek_dna.json", 'w') as f:
        json.dump(dna_data, f, indent=2)
    
    with open(output_dir / "ledger_proof.json", 'w') as f:
        json.dump(ledger_payload, f, indent=2)
    
    with open(output_dir / "adapter_model.bin", 'wb') as f:
        f.write(b"PLACEHOLDER_MODEL_WEIGHTS")


def test_verify_integrity_valid_model(tmp_path):
    """Test verification of a valid model."""
    model_dir = tmp_path / "test-model"
    create_test_certified_model(model_dir, include_signature=True)
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # DNA should be valid
    assert results["dna"] == "VALID"
    
    # Ledger should be synced or unverified (if pynacl not installed)
    assert results["ledger"] in ["SYNCED", "UNVERIFIED", "UNSIGNED"]
    
    # Datasets unknown (no datasets in test)
    assert results["datasets"] == "UNKNOWN"


def test_verify_integrity_missing_files(tmp_path):
    """Test verification with missing files."""
    model_dir = tmp_path / "test-model"
    model_dir.mkdir()
    
    # Only create DNA file
    dna_data = {"dna": "test"}
    with open(model_dir / "oneseek_dna.json", 'w') as f:
        json.dump(dna_data, f)
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # Should fail with error about missing ledger proof
    assert "error" in results["details"]
    assert "Ledger proof not found" in results["details"]["error"]


def test_verify_integrity_dna_mismatch(tmp_path):
    """Test verification with mismatched DNA."""
    model_dir = tmp_path / "test-model"
    create_test_certified_model(model_dir, tamper_dna=True)
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # DNA should be invalid
    assert results["dna"] == "INVALID"
    assert "dna_mismatch" in results["details"]


def test_verify_integrity_unsigned_model(tmp_path):
    """Test verification of unsigned model."""
    model_dir = tmp_path / "test-model"
    create_test_certified_model(model_dir, include_signature=False)
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # DNA should be valid
    assert results["dna"] == "VALID"
    
    # Ledger should be unsigned
    assert results["ledger"] == "UNSIGNED"


def test_verify_integrity_with_datasets(tmp_path):
    """Test verification with dataset hashes."""
    model_dir = tmp_path / "test-model"
    model_dir.mkdir(parents=True)
    
    # Create test dataset
    dataset_file = tmp_path / "test_dataset.jsonl"
    dataset_content = b'{"instruction": "test", "output": "test"}'
    dataset_file.write_bytes(dataset_content)
    dataset_hash = verify_integrity.compute_sha256(dataset_content)
    
    # Create model with dataset hash
    dna_string = "OneSeek-7B-Zero.v1.0.abc123.def456.789xyz"
    
    dna_data = {
        "dna": dna_string,
        "model": "OneSeek-7B-Zero",
        "version": "1.0",
    }
    
    ledger_payload = {
        "event": "training",
        "model": "OneSeek-7B-Zero",
        "dna": dna_string,
        "dataset_hashes": [
            {
                "path": str(dataset_file),
                "hash": dataset_hash
            }
        ],
        "immutable_hash": "test_hash",
        "timestamp": "2025-11-21T12:00:00Z",
    }
    
    with open(model_dir / "oneseek_dna.json", 'w') as f:
        json.dump(dna_data, f)
    
    with open(model_dir / "ledger_proof.json", 'w') as f:
        json.dump(ledger_payload, f)
    
    with open(model_dir / "adapter_model.bin", 'wb') as f:
        f.write(b"PLACEHOLDER")
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # Datasets should be unchanged
    assert results["datasets"] == "UNCHANGED"
    assert results["details"]["datasets_verified"] == 1


def test_verify_integrity_modified_dataset(tmp_path):
    """Test verification with modified dataset."""
    model_dir = tmp_path / "test-model"
    model_dir.mkdir(parents=True)
    
    # Create dataset
    dataset_file = tmp_path / "test_dataset.jsonl"
    original_content = b'{"instruction": "test", "output": "test"}'
    dataset_file.write_bytes(original_content)
    original_hash = verify_integrity.compute_sha256(original_content)
    
    # Create model files
    dna_string = "OneSeek-7B-Zero.v1.0.abc123.def456.789xyz"
    
    dna_data = {"dna": dna_string}
    ledger_payload = {
        "event": "training",
        "dna": dna_string,
        "dataset_hashes": [{
            "path": str(dataset_file),
            "hash": original_hash
        }],
        "immutable_hash": "test_hash",
    }
    
    with open(model_dir / "oneseek_dna.json", 'w') as f:
        json.dump(dna_data, f)
    
    with open(model_dir / "ledger_proof.json", 'w') as f:
        json.dump(ledger_payload, f)
    
    with open(model_dir / "adapter_model.bin", 'wb') as f:
        f.write(b"PLACEHOLDER")
    
    # Modify dataset
    dataset_file.write_bytes(b'{"instruction": "modified", "output": "modified"}')
    
    results = verify_integrity.verify_model_integrity(str(model_dir))
    
    # Datasets should be modified
    assert results["datasets"] == "MODIFIED"
    assert "modified_datasets" in results["details"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
