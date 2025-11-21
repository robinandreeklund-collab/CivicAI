"""
OneSeek Training Package

Modules:
- dna: DNA fingerprinting and cryptographic signing
- dataset_parser: Dataset category extraction
- dynamic_trainer: Adaptive multi-model training
"""

from .dna import (
    canonical_json,
    compute_sha256,
    build_dna,
    generate_immutable_hash,
    sign_payload,
    get_public_key_hex,
    verify_signature,
    generate_test_keypair
)

from .dataset_parser import (
    extract_categories_from_filenames,
    validate_categories,
    get_all_canonical_categories
)

from .dynamic_trainer import (
    discover_base_models,
    run_adaptive_training
)

__all__ = [
    # DNA functions
    'canonical_json',
    'compute_sha256',
    'build_dna',
    'generate_immutable_hash',
    'sign_payload',
    'get_public_key_hex',
    'verify_signature',
    'generate_test_keypair',
    
    # Dataset parser functions
    'extract_categories_from_filenames',
    'validate_categories',
    'get_all_canonical_categories',
    
    # Trainer functions
    'discover_base_models',
    'run_adaptive_training',
]
