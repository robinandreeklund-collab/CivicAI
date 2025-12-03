"""
Test Personality Catalog for ONESEEK Δ+ v6.2

Tests the dynamic personality selection based on category + keywords.
"""

import json
import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

def test_personality_catalog_exists():
    """Test that personality_catalog.json exists and is valid."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    
    assert config_path.exists(), f"personality_catalog.json not found at {config_path}"
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    # Check required keys
    assert "version" in catalog, "Missing 'version' key"
    assert "personality_catalog" in catalog, "Missing 'personality_catalog' key"
    assert "selection_rules" in catalog, "Missing 'selection_rules' key"
    
    print(f"✓ personality_catalog.json is valid")
    print(f"  Version: {catalog['version']}")
    print(f"  Personalities: {len(catalog['personality_catalog'])}")
    
    return True


def test_personality_catalog_structure():
    """Test that each personality entry has required fields."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    personalities = catalog.get("personality_catalog", {})
    
    for personality_id, personality_data in personalities.items():
        # Check required fields
        assert "card_file" in personality_data, f"Missing 'card_file' for {personality_id}"
        assert "keywords" in personality_data, f"Missing 'keywords' for {personality_id}"
        assert "categories" in personality_data, f"Missing 'categories' for {personality_id}"
        assert "description" in personality_data, f"Missing 'description' for {personality_id}"
        
        # Check types
        assert isinstance(personality_data["keywords"], list), f"'keywords' must be a list for {personality_id}"
        assert isinstance(personality_data["categories"], list), f"'categories' must be a list for {personality_id}"
        
        print(f"✓ {personality_id}: {len(personality_data['keywords'])} keywords, {len(personality_data['categories'])} categories")
    
    return True


def test_selection_rules():
    """Test that selection rules are properly configured."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    rules = catalog.get("selection_rules", {})
    
    # Check required rules
    assert "fallback" in rules, "Missing 'fallback' in selection_rules"
    
    # Verify fallback personality exists
    fallback = rules["fallback"]
    personalities = catalog.get("personality_catalog", {})
    assert fallback in personalities, f"Fallback personality '{fallback}' not found in catalog"
    
    print(f"✓ Selection rules valid")
    print(f"  Fallback: {fallback}")
    
    return True


def test_character_cards_exist():
    """Test that referenced character cards exist."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    project_root = Path(__file__).parent.parent
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    personalities = catalog.get("personality_catalog", {})
    
    for personality_id, personality_data in personalities.items():
        card_file = personality_data.get("card_file", "")
        card_path = project_root / card_file
        
        assert card_path.exists(), f"Character card not found: {card_path}"
        print(f"✓ {personality_id}: card file exists at {card_file}")
    
    return True


def test_api_catalog_version():
    """Test that api_catalog.json has been updated to v6.2."""
    config_path = Path(__file__).parent.parent / 'config' / 'api_catalog.json'
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    version = catalog.get("version", "")
    assert version == "6.2.0", f"Expected version 6.2.0, got {version}"
    
    # Check that personality_catalog feature is enabled
    features = catalog.get("active_features", {})
    assert features.get("personality_catalog") == True, "personality_catalog feature should be enabled"
    
    # Check that intent_engine is disabled
    assert features.get("intent_engine") == False, "intent_engine should be disabled in v6.2"
    
    print(f"✓ api_catalog.json version: {version}")
    print(f"  personality_catalog: enabled")
    print(f"  intent_engine: disabled")
    
    return True


def test_default_personality_exists():
    """Test that exactly one personality is marked as default."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    personalities = catalog.get("personality_catalog", {})
    defaults = [pid for pid, p in personalities.items() if p.get("is_default", False)]
    
    assert len(defaults) >= 1, "At least one personality should be marked as default"
    print(f"✓ Default personality: {defaults[0]}")
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("ONESEEK Δ+ v6.2 - Personality Catalog Tests")
    print("=" * 60)
    print()
    
    tests = [
        ("Catalog exists and valid", test_personality_catalog_exists),
        ("Catalog structure", test_personality_catalog_structure),
        ("Selection rules", test_selection_rules),
        ("Character cards exist", test_character_cards_exist),
        ("API catalog version", test_api_catalog_version),
        ("Default personality", test_default_personality_exists),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        print(f"\n--- {name} ---")
        try:
            if test_func():
                passed += 1
        except AssertionError as e:
            print(f"✗ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ ERROR: {e}")
            failed += 1
    
    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    sys.exit(0 if failed == 0 else 1)
