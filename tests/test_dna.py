"""
Tests for DNA fingerprinting module
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from training import dna


def test_canonical_json():
    """Test canonical JSON serialization."""
    # Order should be consistent
    obj1 = {"b": 2, "a": 1}
    obj2 = {"a": 1, "b": 2}
    
    canonical1 = dna.canonical_json(obj1)
    canonical2 = dna.canonical_json(obj2)
    
    assert canonical1 == canonical2
    assert canonical1 == b'{"a":1,"b":2}'


def test_canonical_json_nested():
    """Test canonical JSON with nested objects."""
    obj = {
        "c": [3, 2, 1],
        "a": {"z": 26, "a": 1},
        "b": 2
    }
    
    canonical = dna.canonical_json(obj)
    # Should be sorted at all levels
    assert b'"a":{"a":1,"z":26}' in canonical
    assert b'"b":2' in canonical
    assert b'"c":[3,2,1]' in canonical  # Lists preserve order


def test_compute_sha256():
    """Test SHA-256 hashing."""
    data = b"hello world"
    hash_result = dna.compute_sha256(data)
    
    # Known SHA-256 of "hello world"
    expected = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
    assert hash_result == expected


def test_build_dna():
    """Test DNA fingerprint generation."""
    dna_string = dna.build_dna(
        model_name="OneSeek-7B-Zero",
        version="1.0",
        final_weights={"mistral-7b": 0.6, "llama-2": 0.4},
        dataset_categories=["CivicID", "SwedID"],
        timestamp="2025-11-21T12:00:00Z"
    )
    
    # Check format: ModelName.vVersion.WeightsHash.CategoriesHash.TimestampHash
    # e.g., OneSeek-7B-Zero.v1.0.abc123.def456.789xyz
    assert dna_string.startswith("OneSeek-7B-Zero.v1.0.")
    
    # Should have 6 parts: ModelName-with-hyphens + v + version + 3 hashes
    parts = dna_string.split('.')
    assert len(parts) == 6
    assert parts[0] == "OneSeek-7B-Zero"
    assert parts[1] == "v1"
    assert parts[2] == "0"
    
    # Last 3 parts should be 8-character hashes
    for i in range(3, 6):
        assert len(parts[i]) == 8
        assert all(c in '0123456789abcdef' for c in parts[i])


def test_build_dna_deterministic():
    """Test that DNA generation is deterministic."""
    params = {
        "model_name": "OneSeek-7B-Zero",
        "version": "1.0",
        "final_weights": {"mistral-7b": 0.6, "llama-2": 0.4},
        "dataset_categories": ["CivicID", "SwedID"],
        "timestamp": "2025-11-21T12:00:00Z"
    }
    
    dna1 = dna.build_dna(**params)
    dna2 = dna.build_dna(**params)
    
    assert dna1 == dna2


def test_build_dna_different_weights():
    """Test that different weights produce different DNA."""
    dna1 = dna.build_dna(
        "OneSeek-7B-Zero", "1.0",
        {"mistral-7b": 0.6, "llama-2": 0.4},
        ["CivicID"],
        "2025-11-21T12:00:00Z"
    )
    
    dna2 = dna.build_dna(
        "OneSeek-7B-Zero", "1.0",
        {"mistral-7b": 0.5, "llama-2": 0.5},
        ["CivicID"],
        "2025-11-21T12:00:00Z"
    )
    
    assert dna1 != dna2


def test_generate_immutable_hash():
    """Test immutable hash generation."""
    payload = {
        "event": "training",
        "model": "OneSeek-7B-Zero",
        "timestamp": "2025-11-21T12:00:00Z"
    }
    
    hash1 = dna.generate_immutable_hash(payload)
    hash2 = dna.generate_immutable_hash(payload)
    
    # Should be deterministic
    assert hash1 == hash2
    
    # Should be 64 character hex string
    assert len(hash1) == 64
    assert all(c in '0123456789abcdef' for c in hash1)


def test_generate_immutable_hash_different_order():
    """Test that key order doesn't affect hash."""
    payload1 = {"b": 2, "a": 1}
    payload2 = {"a": 1, "b": 2}
    
    hash1 = dna.generate_immutable_hash(payload1)
    hash2 = dna.generate_immutable_hash(payload2)
    
    assert hash1 == hash2


def test_generate_test_keypair(tmp_path):
    """Test test keypair generation."""
    try:
        import nacl.signing
    except ImportError:
        pytest.skip("pynacl not installed")
    
    # Generate keypair to temp directory
    private_key, public_key = dna.generate_test_keypair(str(tmp_path))
    
    # Check files were created
    assert (tmp_path / "test_private_key.bin").exists()
    assert (tmp_path / "test_public_key.txt").exists()
    
    # Public key should be 64 character hex string
    assert len(public_key) == 64
    assert all(c in '0123456789abcdef' for c in public_key)


def test_sign_and_verify(tmp_path):
    """Test signing and verification."""
    try:
        import nacl.signing
    except ImportError:
        pytest.skip("pynacl not installed")
    
    # Generate test keypair
    private_key, public_key = dna.generate_test_keypair(str(tmp_path))
    private_key_path = tmp_path / "test_private_key.bin"
    
    # Create test payload
    payload = b"test data"
    
    # Sign
    signature = dna.sign_payload(payload, str(private_key_path))
    
    # Signature should be hex string
    assert all(c in '0123456789abcdef' for c in signature)
    
    # Verify
    is_valid = dna.verify_signature(payload, signature, public_key)
    assert is_valid
    
    # Tampered payload should fail
    tampered_payload = b"test data modified"
    is_valid = dna.verify_signature(tampered_payload, signature, public_key)
    assert not is_valid


def test_get_public_key_hex(tmp_path):
    """Test extracting public key from private key."""
    try:
        import nacl.signing
    except ImportError:
        pytest.skip("pynacl not installed")
    
    # Generate keypair
    private_key, expected_public_key = dna.generate_test_keypair(str(tmp_path))
    private_key_path = tmp_path / "test_private_key.bin"
    
    # Extract public key
    public_key = dna.get_public_key_hex(str(private_key_path))
    
    assert public_key == expected_public_key


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
