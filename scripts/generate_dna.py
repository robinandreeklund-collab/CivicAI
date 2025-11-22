#!/usr/bin/env python3
"""
DNA Generation Script for OneSeek-7B-Zero
Generates DNA fingerprints with language and category information

Format: v{VERSION}.{LANG}.{CATEGORIES}.{WEIGHTS_HASH}.{TIMESTAMP_HASH}
Example: v1.237.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a
"""

import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path


def extract_language(dataset_name):
    """
    Extract language code from dataset filename
    
    Args:
        dataset_name: Dataset filename or path
    
    Returns:
        str: Language code (en, sv, no, etc.)
    """
    name_lower = dataset_name.lower()
    
    # Language mappings
    language_map = {
        'swedish': 'sv',
        'svenska': 'sv',
        'svensk': 'sv',
        'swed': 'sv',
        'norwegian': 'no',
        'norsk': 'no',
        'danish': 'da',
        'dansk': 'da',
        'finnish': 'fi',
        'suomi': 'fi',
        'english': 'en',
        'eng': 'en',
    }
    
    # Check for language indicators
    for key, code in language_map.items():
        if key in name_lower:
            return code
    
    # Default to English
    return 'en'


def extract_categories(dataset_names):
    """
    Extract dataset categories from filenames
    
    Args:
        dataset_names: List of dataset filenames
    
    Returns:
        str: Sorted category string (e.g., 'dsCivicID-SwedID')
    """
    categories = set()
    
    # Category mappings with 'ds' prefix for dataset-specific
    category_map = {
        'civic': 'CivicID',
        'civicid': 'CivicID',
        'civic_id': 'CivicID',
        'identity': 'Identity',
        'swedish': 'SwedID',
        'swed': 'SwedID',
        'sv': 'SwedID',
        'swedid': 'SwedID',
        'privacy': 'Privacy',
        'gdpr': 'Privacy',
        'nordic': 'Nordic',
        'scandinavian': 'Nordic',
        'fairness': 'Fairness',
        'bias': 'Fairness',
        'transparency': 'Transparency',
        'ethics': 'Ethics',
        'multilingual': 'Multilingual',
        'qa': 'QA',
        'question': 'QA',
        'instruction': 'Instruction',
        'chat': 'Conversational',
        'conversation': 'Conversational',
    }
    
    for dataset_name in dataset_names:
        # Split on common delimiters
        tokens = dataset_name.lower().replace('.', '_').replace('-', '_').split('_')
        
        for token in tokens:
            if token in category_map:
                categories.add(category_map[token])
    
    # Sort categories and join with 'ds' prefix
    if categories:
        sorted_cats = sorted(categories)
        return 'ds' + '-'.join(sorted_cats)
    else:
        return 'dsGeneral'


def hash_data(data, length=8):
    """
    Generate truncated hash of data
    
    Args:
        data: Data to hash (string or dict)
        length: Number of characters to return
    
    Returns:
        str: Truncated hex hash
    """
    if isinstance(data, dict):
        data = json.dumps(data, sort_keys=True)
    elif not isinstance(data, str):
        data = str(data)
    
    return hashlib.sha256(data.encode()).hexdigest()[:length]


def generate_dna(version, dataset_names, weights=None, timestamp=None):
    """
    Generate DNA fingerprint with language and categories
    
    Args:
        version: Version number (e.g., "1.237")
        dataset_names: List of dataset filenames
        weights: Dict of model weights (optional)
        timestamp: ISO timestamp (optional, defaults to now)
    
    Returns:
        str: DNA fingerprint
    """
    # Extract language from first dataset
    language = extract_language(dataset_names[0]) if dataset_names else 'en'
    
    # Extract categories
    categories = extract_categories(dataset_names)
    
    # Hash weights
    weights_hash = hash_data(weights or {})
    
    # Hash timestamp
    ts = timestamp or datetime.now().isoformat()
    timestamp_hash = hash_data(ts)
    
    # Build DNA string
    dna = f"v{version}.{language}.{categories}.{weights_hash}.{timestamp_hash}"
    
    return dna


def main():
    """Command-line interface for DNA generation"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate DNA fingerprint for OneSeek-7B-Zero')
    parser.add_argument('--version', type=str, required=True, help='Model version (e.g., 1.237)')
    parser.add_argument('--datasets', nargs='+', required=True, help='Dataset filenames')
    parser.add_argument('--weights', type=str, help='JSON string of model weights')
    parser.add_argument('--timestamp', type=str, help='ISO timestamp (optional)')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Parse weights if provided
    weights = None
    if args.weights:
        try:
            weights = json.loads(args.weights)
        except json.JSONDecodeError as e:
            print(f"Error parsing weights JSON: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Generate DNA
    dna = generate_dna(args.version, args.datasets, weights, args.timestamp)
    
    if args.verbose:
        print(f"DNA Fingerprint Generation", file=sys.stderr)
        print(f"Version: {args.version}", file=sys.stderr)
        print(f"Datasets: {', '.join(args.datasets)}", file=sys.stderr)
        print(f"Language: {extract_language(args.datasets[0])}", file=sys.stderr)
        print(f"Categories: {extract_categories(args.datasets)}", file=sys.stderr)
        print(f"Weights: {weights}", file=sys.stderr)
        print(f"---", file=sys.stderr)
    
    # Output DNA
    print(dna)
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
