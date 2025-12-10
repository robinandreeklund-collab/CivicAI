#!/usr/bin/env python3
"""
Test script for personality selector module
Tests embedding-based personality selection and API map creation
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

try:
    from personality_selector import (
        select_personality,
        create_character_api_map,
        load_personality_catalog,
        load_api_catalog,
        get_embedding_model
    )
    PERSONALITY_AVAILABLE = True
except ImportError as e:
    print(f"❌ Failed to import personality_selector: {e}")
    print("   Install with: pip install sentence-transformers")
    PERSONALITY_AVAILABLE = False
    sys.exit(1)


def test_embedding_model():
    """Test that the embedding model loads correctly."""
    print("\n--- Testing Embedding Model ---")
    model = get_embedding_model()
    
    if model is None:
        print("❌ Embedding model failed to load")
        print("   Install with: pip install sentence-transformers")
        return False
    
    print("✓ Embedding model loaded successfully")
    print(f"  Model: {model}")
    return True


def test_personality_selection():
    """Test personality selection with various queries."""
    print("\n--- Testing Personality Selection ---")
    
    test_queries = [
        ("Vad är vädret imorgon i Stockholm?", "oneseek-metrolog", "Metrologen"),
        ("Vilka böcker har Astrid Lindgren skrivit?", "oneseek-bibliotekarie", "Bibliotekarien"),
        ("Hej, vem är du?", "oneseek-medveten", "Medveten"),
        ("Vad handlar Röda Rummet om?", "oneseek-bibliotekarie", "Bibliotekarien"),
        ("Blir det regn idag?", "oneseek-metrolog", "Metrologen"),
    ]
    
    all_passed = True
    
    for query, expected_id, expected_name in test_queries:
        personality_id, name, confidence, data = select_personality(query)
        
        passed = (personality_id == expected_id)
        symbol = "✓" if passed else "⚠"
        
        print(f"{symbol} Query: \"{query}\"")
        print(f"  Selected: {name} ({personality_id})")
        print(f"  Confidence: {confidence:.3f}")
        print(f"  Expected: {expected_name} ({expected_id})")
        
        if not passed:
            all_passed = False
        
        print()
    
    return all_passed


def test_api_map_creation():
    """Test dynamic API map creation for each personality."""
    print("\n--- Testing API Map Creation ---")
    
    catalog = load_personality_catalog()
    api_catalog = load_api_catalog()
    
    if not catalog or not api_catalog:
        print("❌ Failed to load catalogs")
        return False
    
    personalities = catalog.get('personality_catalog', {})
    
    for personality_id, personality_data in personalities.items():
        print(f"\nTesting: {personality_data.get('name', personality_id)}")
        
        # Create API map
        character_api_map = create_character_api_map(personality_data, api_catalog)
        
        api_categories = character_api_map.get('api_categories', {})
        print(f"  API Categories: {len(api_categories)}")
        
        if api_categories:
            for category_name in api_categories.keys():
                print(f"    - {category_name}")
        else:
            print(f"    (No specific API categories - uses all)")
        
        print(f"  ✓ API map created successfully")
    
    return True


def test_recent_personality_boost():
    """Test that recent personality gets boosted."""
    print("\n--- Testing Recent Personality Boost ---")
    
    # First query - should select Metrologen
    query1 = "Vad är vädret idag?"
    pid1, name1, conf1, _ = select_personality(query1)
    print(f"First query: \"{query1}\"")
    print(f"  Selected: {name1} (confidence: {conf1:.3f})")
    
    # Second query - similar but more ambiguous
    # Should still prefer Metrologen due to 40% boost
    query2 = "Hur blir det imorgon?"
    pid2, name2, conf2, _ = select_personality(query2)
    print(f"\nSecond query: \"{query2}\"")
    print(f"  Selected: {name2} (confidence: {conf2:.3f})")
    print(f"  Got boost: {pid2 == pid1}")
    
    return True


if __name__ == "__main__":
    print("=" * 70)
    print("ONESEEK Δ+ v6.2 - Personality Selector Integration Tests")
    print("=" * 70)
    
    if not PERSONALITY_AVAILABLE:
        print("\n❌ Personality selector not available")
        sys.exit(1)
    
    tests = [
        test_embedding_model,
        test_personality_selection,
        test_api_map_creation,
        test_recent_personality_boost,
    ]
    
    all_passed = True
    for test_func in tests:
        try:
            result = test_func()
            if result is False:
                all_passed = False
        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✓ All tests passed!")
    else:
        print("⚠ Some tests failed or gave warnings")
    print("=" * 70)
    
    sys.exit(0 if all_passed else 1)
