#!/usr/bin/env python3
"""
Helper functions for OneSeek Certified Model Structure

Handles creation and management of certified model directories with DNA-based naming.
"""

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


def generate_directory_name(
    version: str,
    language: str,
    datasets: List[str],
    training_data_hash: str,
    model_weights_hash: str
) -> str:
    """
    Generate a DNA-based directory name for a certified model.
    
    Format: OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{HASH1}.{HASH2}
    
    Args:
        version: Model version (e.g., "1.0")
        language: Language code (e.g., "sv", "en", "ensv")
        datasets: List of dataset names (e.g., ["CivicID", "SwedID"])
        training_data_hash: Short hash of training data (8 chars)
        model_weights_hash: Short hash of model weights (8 chars)
    
    Returns:
        Directory name string
    
    Example:
        >>> generate_directory_name("1.0", "sv", ["CivicID", "SwedID"], "141521ad", "90cdf6f1")
        'OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1'
    """
    datasets_str = "ds" + "-".join(datasets) if datasets else "dsDefault"
    
    return f"OneSeek-7B-Zero.v{version}.{language}.{datasets_str}.{training_data_hash}.{model_weights_hash}"


def create_certified_model_directory(
    certified_models_dir: Path,
    directory_name: str
) -> Path:
    """
    Create a certified model directory.
    
    Args:
        certified_models_dir: Path to oneseek-certified directory
        directory_name: DNA-based directory name
    
    Returns:
        Path to created directory
    """
    model_dir = certified_models_dir / directory_name
    model_dir.mkdir(parents=True, exist_ok=True)
    return model_dir


def save_certified_metadata(
    model_dir: Path,
    version: str,
    dna: str,
    base_model: str,
    language: str,
    datasets: List[str],
    training_type: str,
    samples_processed: int,
    metrics: Dict,
    training_data_hash: str,
    model_weights_hash: str
) -> None:
    """
    Save metadata.json for a certified model.
    
    Args:
        model_dir: Path to model directory
        version: Model version
        dna: DNA fingerprint
        base_model: Base model name
        language: Language code
        datasets: List of dataset names
        training_type: Type of training
        samples_processed: Number of samples
        metrics: Training metrics dict
        training_data_hash: Hash of training data
        model_weights_hash: Hash of model weights
    """
    metadata = {
        "version": f"OneSeek-7B-Zero.v{version}",
        "dna": dna,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "baseModel": base_model,
        "language": language,
        "datasets": datasets,
        "trainingType": training_type,
        "samplesProcessed": samples_processed,
        "metrics": metrics,
        "hashes": {
            "trainingData": training_data_hash,
            "modelWeights": model_weights_hash
        }
    }
    
    metadata_file = model_dir / 'metadata.json'
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)


def update_current_symlink(
    certified_models_dir: Path,
    target_directory: str
) -> None:
    """
    Update the OneSeek-7B-Zero-CURRENT symlink to point to the specified directory.
    
    Args:
        certified_models_dir: Path to oneseek-certified directory
        target_directory: DNA-based directory name to link to
    """
    symlink_path = certified_models_dir / 'OneSeek-7B-Zero-CURRENT'
    target_path = certified_models_dir / target_directory
    
    # Remove existing symlink/marker file
    if symlink_path.exists() or symlink_path.is_symlink():
        symlink_path.unlink()
    
    marker_file = Path(str(symlink_path) + '.txt')
    if marker_file.exists():
        marker_file.unlink()
    
    # Create new symlink (or marker file on Windows if symlink fails)
    try:
        if os.name == 'nt':  # Windows
            # Try junction first (doesn't require admin)
            os.symlink(str(target_path), str(symlink_path), target_is_directory=True)
        else:
            # Unix: use relative symlink
            relative_target = os.path.relpath(target_path, certified_models_dir)
            symlink_path.symlink_to(relative_target)
        
        print(f"[SYMLINK] Created: OneSeek-7B-Zero-CURRENT -> {target_directory}")
        
    except (OSError, PermissionError) as e:
        # Fallback to marker file
        print(f"[SYMLINK] Could not create symlink ({e}), using marker file")
        with open(marker_file, 'w', encoding='utf-8') as f:
            f.write(str(target_path))
        print(f"[SYMLINK] Created marker file: OneSeek-7B-Zero-CURRENT.txt")


def add_to_ledger(
    certified_models_dir: Path,
    directory_name: str,
    dna: str,
    created_at: str,
    immutable_hash: str
) -> None:
    """
    Add an entry to the ledger_proof.json file.
    
    Args:
        certified_models_dir: Path to oneseek-certified directory
        directory_name: DNA-based directory name
        dna: DNA fingerprint
        created_at: ISO timestamp
        immutable_hash: Immutable hash of model
    """
    ledger_file = certified_models_dir / 'ledger_proof.json'
    
    # Read existing ledger or create new one
    if ledger_file.exists():
        with open(ledger_file, 'r', encoding='utf-8') as f:
            ledger = json.load(f)
    else:
        ledger = {"models": []}
    
    # Add new entry
    entry = {
        "directory": directory_name,
        "createdAt": created_at,
        "dna": dna,
        "certifiedBy": "training-system",
        "immutableHash": immutable_hash
    }
    
    ledger["models"].append(entry)
    
    # Save ledger
    with open(ledger_file, 'w', encoding='utf-8') as f:
        json.dump(ledger, f, indent=2, ensure_ascii=False)
    
    print(f"[LEDGER] Added entry for {directory_name}")


def calculate_short_hash(data: str, length: int = 8) -> str:
    """
    Calculate a short hash from data.
    
    Args:
        data: Data to hash
        length: Length of hash to return (default 8)
    
    Returns:
        Hex hash string
    """
    full_hash = hashlib.sha256(data.encode()).hexdigest()
    return full_hash[:length]


def extract_datasets_from_filename(filename: str) -> List[str]:
    """
    Extract dataset names from a filename.
    
    Args:
        filename: Dataset filename
    
    Returns:
        List of dataset names
    
    Example:
        >>> extract_datasets_from_filename("CivicID_SwedID_combined.jsonl")
        ['CivicID', 'SwedID']
    """
    # Remove extension
    name = Path(filename).stem
    
    # Split on common separators
    parts = name.replace('-', '_').replace('+', '_').split('_')
    
    # Filter out common words
    exclude = {'combined', 'merged', 'dataset', 'train', 'test', 'val', 'validation'}
    datasets = [p for p in parts if p.lower() not in exclude and len(p) > 1]
    
    return datasets[:3] if datasets else ['Default']  # Limit to 3 datasets
