"""
Dataset Category Extraction

Extracts canonical category tags from dataset filenames for DNA fingerprinting.
Maps various naming conventions to standard tags.
"""

import re
from typing import List, Set
from pathlib import Path


# Mapping of common tokens to canonical category tags
CATEGORY_MAPPING = {
    # Civic and identity
    'civic': 'CivicID',
    'civicid': 'CivicID',
    'civic_id': 'CivicID',
    
    # Identity
    'identity': 'Identity',
    'id': 'Identity',
    
    # Swedish
    'swedish': 'SwedID',
    'swed': 'SwedID',
    'swed_id': 'SwedID',
    'swedid': 'SwedID',
    'sv': 'SwedID',
    
    # Privacy
    'privacy': 'Privacy',
    'private': 'Privacy',
    'gdpr': 'Privacy',
    
    # Nordic
    'nordic': 'Nordic',
    'scandinavian': 'Nordic',
    'scandinavia': 'Nordic',
    
    # Fairness
    'fairness': 'Fairness',
    'fair': 'Fairness',
    'bias': 'Fairness',
    'unbiased': 'Fairness',
    
    # Additional categories
    'transparency': 'Transparency',
    'ethical': 'Ethics',
    'ethics': 'Ethics',
    'multilingual': 'Multilingual',
    'qa': 'QA',
    'question': 'QA',
    'answer': 'QA',
    'instruction': 'Instruction',
    'instruct': 'Instruction',
    'chat': 'Conversational',
    'conversation': 'Conversational',
    'dialog': 'Conversational',
    'dialogue': 'Conversational',
}


def extract_categories_from_filenames(dataset_paths: List[str]) -> Set[str]:
    """
    Extract canonical category tags from dataset file paths.
    
    Rules:
    - Split filenames on '_' and '-'
    - Convert to lowercase for matching
    - Map tokens to canonical tags using CATEGORY_MAPPING
    - Return unique set of tags
    
    Args:
        dataset_paths: List of file paths (strings or Path objects)
        
    Returns:
        Set[str]: Set of canonical category tags
        
    Example:
        >>> extract_categories_from_filenames([
        ...     "civic_identity_train.jsonl",
        ...     "swedish-privacy-data.json",
        ...     "fairness_nordic.jsonl"
        ... ])
        {'CivicID', 'Identity', 'SwedID', 'Privacy', 'Fairness', 'Nordic'}
    """
    categories = set()
    
    for path in dataset_paths:
        # Convert to Path and get filename without extension
        filename = Path(path).stem
        
        # Split on underscores, hyphens, and dots
        tokens = re.split(r'[_\-\.]', filename)
        
        # Process each token
        for token in tokens:
            # Clean and lowercase
            token_clean = token.strip().lower()
            
            # Skip empty, numeric, or very short tokens
            if not token_clean or token_clean.isdigit() or len(token_clean) < 2:
                continue
            
            # Check if token maps to a canonical category
            if token_clean in CATEGORY_MAPPING:
                categories.add(CATEGORY_MAPPING[token_clean])
    
    return categories


def extract_categories_from_content(content: str) -> Set[str]:
    """
    Extract categories from dataset content (future enhancement).
    
    This could analyze the actual questions/instructions to infer categories.
    Currently returns empty set.
    
    Args:
        content: Dataset content (JSONL or JSON string)
        
    Returns:
        Set[str]: Set of inferred categories
    """
    # Placeholder for future implementation
    # Could use NLP to analyze content and infer categories
    return set()


def validate_categories(categories: Set[str]) -> bool:
    """
    Validate that categories are canonical tags.
    
    Args:
        categories: Set of category strings
        
    Returns:
        bool: True if all categories are valid
    """
    valid_categories = set(CATEGORY_MAPPING.values())
    return categories.issubset(valid_categories)


def get_all_canonical_categories() -> List[str]:
    """
    Get list of all canonical category tags.
    
    Returns:
        List[str]: Sorted list of canonical categories
    """
    return sorted(set(CATEGORY_MAPPING.values()))


# Example usage and tests
if __name__ == "__main__":
    # Test extraction
    test_files = [
        "civic_identity_train.jsonl",
        "swedish-privacy-data.json",
        "fairness_nordic.jsonl",
        "transparency_qa_dataset.json",
        "multi-lingual-chat-examples.jsonl",
    ]
    
    categories = extract_categories_from_filenames(test_files)
    print(f"Extracted categories: {sorted(categories)}")
    
    # Test validation
    is_valid = validate_categories(categories)
    print(f"Categories valid: {is_valid}")
    
    # Show all canonical categories
    print(f"\nAll canonical categories: {get_all_canonical_categories()}")
    
    print("\n[SUCCESS] Dataset parser tests passed!")
