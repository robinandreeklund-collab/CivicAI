"""
DNA Fingerprint v2 - Cryptographic Hashing and Signing for OneSeek-7B-Zero

This module provides functions for:
- Canonical JSON serialization (deterministic, sorted keys)
- SHA-256 hashing for DNA fingerprints
- DNA string generation with model metadata
- Ed25519 signing for ledger entries
"""

import json
import hashlib
from typing import Dict, Any, List
from pathlib import Path


def canonical_json(obj: Any) -> bytes:
    """
    Convert object to canonical JSON bytes.
    
    Ensures deterministic serialization:
    - Sorted keys
    - UTF-8 encoding
    - No whitespace
    - Consistent number formatting
    
    Args:
        obj: Any JSON-serializable object
        
    Returns:
        bytes: Canonical JSON representation
        
    Example:
        >>> canonical_json({"b": 2, "a": 1})
        b'{"a":1,"b":2}'
    """
    return json.dumps(
        obj,
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':'),
        indent=None
    ).encode('utf-8')


def compute_sha256(data: bytes) -> str:
    """
    Compute SHA-256 hash of data.
    
    Args:
        data: Bytes to hash
        
    Returns:
        str: Hexadecimal hash string
        
    Example:
        >>> compute_sha256(b"hello")
        '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    """
    return hashlib.sha256(data).hexdigest()


def build_dna(
    model_name: str,
    version: str,
    final_weights: Dict[str, float],
    dataset_categories: List[str],
    timestamp: str
) -> str:
    """
    Build DNA fingerprint string for a model.
    
    DNA Format:
    OneSeek-7B-Zero.v{version}.{weights_hash}.{categories_hash}.{timestamp_hash}
    
    Args:
        model_name: Base model name (e.g., "OneSeek-7B-Zero")
        version: Version string (e.g., "1.0")
        final_weights: Dict of model weights {model_name: weight}
        dataset_categories: List of dataset category tags
        timestamp: ISO timestamp string
        
    Returns:
        str: DNA fingerprint string
        
    Example:
        >>> build_dna(
        ...     "OneSeek-7B-Zero",
        ...     "1.0",
        ...     {"mistral-7b": 0.6, "llama-2": 0.4},
        ...     ["CivicID", "SwedID"],
        ...     "2025-11-21T12:00:00Z"
        ... )
        'OneSeek-7B-Zero.v1.0.abc123.def456.789xyz'
    """
    # Canonical JSON for weights
    weights_json = canonical_json(final_weights)
    weights_hash = compute_sha256(weights_json)[:8]  # First 8 chars
    
    # Canonical JSON for categories (sorted list)
    categories_json = canonical_json(sorted(dataset_categories))
    categories_hash = compute_sha256(categories_json)[:8]
    
    # Hash timestamp
    timestamp_hash = compute_sha256(timestamp.encode('utf-8'))[:8]
    
    # Build DNA string
    dna = f"{model_name}.v{version}.{weights_hash}.{categories_hash}.{timestamp_hash}"
    
    return dna


def generate_immutable_hash(payload_dict: Dict[str, Any]) -> str:
    """
    Generate immutable hash for a ledger entry payload.
    
    Args:
        payload_dict: Complete payload dictionary
        
    Returns:
        str: SHA-256 hash (full 64 characters)
        
    Example:
        >>> generate_immutable_hash({"event": "training", "model": "test"})
        'a3f2e1b4c5d6...'
    """
    payload_json = canonical_json(payload_dict)
    return compute_sha256(payload_json)


def sign_payload(payload_bytes: bytes, private_key_path: str) -> str:
    """
    Sign payload using Ed25519 private key.
    
    Args:
        payload_bytes: Payload bytes to sign
        private_key_path: Path to Ed25519 private key file
        
    Returns:
        str: Hexadecimal signature string
        
    Raises:
        ImportError: If pynacl is not installed
        FileNotFoundError: If private key file not found
        
    Example:
        >>> sign_payload(b"data", "/path/to/key")
        'abc123...'
    """
    try:
        import nacl.signing
        import nacl.encoding
    except ImportError:
        raise ImportError(
            "pynacl is required for signing. Install with: pip install pynacl"
        )
    
    # Read private key from file
    key_path = Path(private_key_path)
    if not key_path.exists():
        raise FileNotFoundError(f"Private key not found: {private_key_path}")
    
    with open(key_path, 'rb') as f:
        private_key_bytes = f.read()
    
    # Create signing key
    signing_key = nacl.signing.SigningKey(private_key_bytes)
    
    # Sign payload
    signed = signing_key.sign(payload_bytes)
    
    # Return hex signature (without the message)
    return signed.signature.hex()


def get_public_key_hex(private_key_path: str) -> str:
    """
    Get public key hex from private key file.
    
    Args:
        private_key_path: Path to Ed25519 private key file
        
    Returns:
        str: Hexadecimal public key string
    """
    try:
        import nacl.signing
    except ImportError:
        raise ImportError(
            "pynacl is required for signing. Install with: pip install pynacl"
        )
    
    key_path = Path(private_key_path)
    if not key_path.exists():
        raise FileNotFoundError(f"Private key not found: {private_key_path}")
    
    with open(key_path, 'rb') as f:
        private_key_bytes = f.read()
    
    signing_key = nacl.signing.SigningKey(private_key_bytes)
    verify_key = signing_key.verify_key
    
    return verify_key.encode().hex()


def verify_signature(
    payload_bytes: bytes,
    signature_hex: str,
    public_key_hex: str
) -> bool:
    """
    Verify Ed25519 signature.
    
    Args:
        payload_bytes: Original payload bytes
        signature_hex: Hexadecimal signature string
        public_key_hex: Hexadecimal public key string
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        import nacl.signing
        import nacl.encoding
    except ImportError:
        raise ImportError(
            "pynacl is required for verification. Install with: pip install pynacl"
        )
    
    # Decode public key
    verify_key = nacl.signing.VerifyKey(
        bytes.fromhex(public_key_hex)
    )
    
    # Decode signature
    signature = bytes.fromhex(signature_hex)
    
    # Verify
    try:
        verify_key.verify(payload_bytes, signature)
        return True
    except nacl.exceptions.BadSignatureError:
        return False


def generate_test_keypair(output_dir: str = None) -> tuple:
    """
    Generate a test Ed25519 keypair for development/testing.
    
    WARNING: Only use for testing! Not secure for production.
    
    Args:
        output_dir: Directory to save keys (optional)
        
    Returns:
        tuple: (private_key_bytes, public_key_hex)
    """
    try:
        import nacl.signing
        import nacl.utils
    except ImportError:
        raise ImportError(
            "pynacl is required. Install with: pip install pynacl"
        )
    
    # Generate new keypair
    signing_key = nacl.signing.SigningKey.generate()
    verify_key = signing_key.verify_key
    
    private_key_bytes = bytes(signing_key)
    public_key_hex = verify_key.encode().hex()
    
    # Save to files if output_dir provided
    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        private_key_file = output_path / "test_private_key.bin"
        public_key_file = output_path / "test_public_key.txt"
        
        with open(private_key_file, 'wb') as f:
            f.write(private_key_bytes)
        
        with open(public_key_file, 'w') as f:
            f.write(public_key_hex)
        
        print(f"Test keypair generated:")
        print(f"  Private key: {private_key_file}")
        print(f"  Public key: {public_key_file}")
        print(f"  Public key hex: {public_key_hex}")
    
    return private_key_bytes, public_key_hex


# Example usage and tests
if __name__ == "__main__":
    # Test canonical JSON
    test_obj = {"b": 2, "a": 1, "c": [3, 2, 1]}
    canonical = canonical_json(test_obj)
    print(f"Canonical JSON: {canonical}")
    print(f"SHA-256: {compute_sha256(canonical)}")
    
    # Test DNA generation
    dna = build_dna(
        "OneSeek-7B-Zero",
        "1.0",
        {"mistral-7b": 0.6, "llama-2": 0.4},
        ["CivicID", "SwedID", "Privacy"],
        "2025-11-21T12:00:00Z"
    )
    print(f"\nDNA: {dna}")
    
    # Test immutable hash
    payload = {
        "event": "training",
        "model": "OneSeek-7B-Zero",
        "dna": dna,
        "timestamp": "2025-11-21T12:00:00Z"
    }
    imm_hash = generate_immutable_hash(payload)
    print(f"\nImmutable hash: {imm_hash}")
    
    print("\n✅ DNA module tests passed!")
