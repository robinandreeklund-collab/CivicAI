#!/usr/bin/env python3
"""
Test script for pytorch_trainer.py dynamic model discovery
Tests the logic without requiring PyTorch to be installed.
"""

import sys
from pathlib import Path


def normalize_model_name(name: str) -> str:
    """
    Normalize model name to a consistent key format.
    (Copied from pytorch_trainer.py for testing)
    """
    return name.lower().replace('.', '-').replace('_', '-')


def remove_separators(text: str) -> str:
    """Remove all separator characters (-, _) from text for fuzzy matching"""
    return text.replace('-', '').replace('_', '')


def test_normalize_model_name():
    """Test model name normalization"""
    print("\n[TEST] Testing normalize_model_name()...")
    
    test_cases = [
        ('Mistral-7B-Instruct', 'mistral-7b-instruct'),
        ('KB-Llama-3.1-8B-Swedish', 'kb-llama-3-1-8b-swedish'),
        ('llama-2-7b-chat', 'llama-2-7b-chat'),
        ('Qwen-2.5-7B', 'qwen-2-5-7b'),
        ('gemma_2_9b', 'gemma-2-9b'),
    ]
    
    passed = 0
    failed = 0
    
    for input_name, expected in test_cases:
        result = normalize_model_name(input_name)
        if result == expected:
            print(f"  ✓ {input_name} -> {result}")
            passed += 1
        else:
            print(f"  ✗ {input_name} -> {result} (expected {expected})")
            failed += 1
    
    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0


def test_model_matching():
    """Test fuzzy model name matching"""
    print("\n[TEST] Testing model matching logic...")
    
    # Simulate available models
    available_models = {
        'mistral-7b-instruct': Path('/models/mistral-7b-instruct'),
        'llama-2-7b': Path('/models/llama-2-7b'),
        'kb-llama-3-1-8b-swedish': Path('/models/kb-llama-3.1-8b-swedish'),
    }
    
    # Test selections from admin panel
    test_selections = [
        ('Mistral-7B-Instruct', 'mistral-7b-instruct'),
        ('KB-Llama-3.1-8B-Swedish', 'kb-llama-3-1-8b-swedish'),
        ('llama-2', 'llama-2-7b'),
        ('mistral', 'mistral-7b-instruct'),
    ]
    
    passed = 0
    failed = 0
    
    for selection, expected_match in test_selections:
        normalized_selection = normalize_model_name(selection)
        matched = None
        
        for avail_key, avail_path in available_models.items():
            avail_normalized = normalize_model_name(avail_key)
            
            # Try matching (same logic as in pytorch_trainer.py)
            if normalized_selection == avail_normalized:
                matched = avail_key
                break
            
            if normalized_selection in avail_normalized or avail_normalized in normalized_selection:
                matched = avail_key
                break
            
            # Remove all separators and try again
            selection_nosep = remove_separators(normalized_selection)
            avail_nosep = remove_separators(avail_normalized)
            if selection_nosep in avail_nosep or avail_nosep in selection_nosep:
                matched = avail_key
                break
        
        if matched == expected_match:
            print(f"  ✓ '{selection}' -> matched '{matched}'")
            passed += 1
        else:
            print(f"  ✗ '{selection}' -> matched '{matched}' (expected '{expected_match}')")
            failed += 1
    
    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0


def test_base_models_directory():
    """Test that base models directory structure is correct"""
    print("\n[TEST] Checking base models directory structure...")
    
    project_root = Path(__file__).parent.parent.parent
    base_models_dir = project_root / 'models' / 'oneseek-7b-zero' / 'base_models'
    
    print(f"  Checking: {base_models_dir}")
    
    if not base_models_dir.exists():
        print(f"  ⚠ Base models directory does not exist (expected for fresh clone)")
        return True
    
    # Check for model subdirectories
    subdirs = [d for d in base_models_dir.iterdir() if d.is_dir()]
    
    if subdirs:
        print(f"  Found {len(subdirs)} subdirectories:")
        for subdir in subdirs:
            print(f"    - {subdir.name}")
        print("  ✓ Directory structure looks good")
    else:
        print("  ⚠ No model subdirectories found (expected for fresh clone)")
    
    return True


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("PyTorch Trainer Dynamic Model Discovery Tests")
    print("=" * 70)
    
    tests = [
        ("Model name normalization", test_normalize_model_name),
        ("Model matching", test_model_matching),
        ("Base models directory", test_base_models_directory),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n[ERROR] {test_name} failed with exception: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\n  Total: {passed}/{total} tests passed")
    
    return all(r for _, r in results)


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
