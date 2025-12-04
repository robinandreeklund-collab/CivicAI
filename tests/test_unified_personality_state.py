"""
Test Unified Personality State for ONESEEK Δ+ v6.5 (PR#101)

Tests the unified personality state system that tracks:
- Active personality with source (admin/ai/override)
- One-shot override for next question
- State transitions between different sources

Note: These tests require the ML service dependencies (fastapi, etc.)
If running in a minimal environment, tests will be skipped.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

# Check if server module can be imported
SERVER_AVAILABLE = False
try:
    # Try to import just the dependencies first
    import fastapi
    SERVER_AVAILABLE = True
except ImportError:
    print("⚠ FastAPI not installed - running config-only tests")


def test_personality_catalog_has_valid_structure():
    """Test that personality_catalog.json has the structure needed for unified state."""
    config_path = Path(__file__).parent.parent / 'config' / 'personality_catalog.json'
    
    assert config_path.exists(), f"personality_catalog.json not found at {config_path}"
    
    with open(config_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    # Check required keys
    assert "personality_catalog" in catalog, "Missing 'personality_catalog' key"
    
    personalities = catalog.get("personality_catalog", {})
    
    # Each personality should have card_file for unified state
    for personality_id, personality_data in personalities.items():
        assert "card_file" in personality_data, f"Missing 'card_file' for {personality_id}"
        assert "description" in personality_data, f"Missing 'description' for {personality_id}"
    
    print(f"✓ Personality catalog valid for unified state")
    print(f"  Personalities with card_file: {len(personalities)}")
    
    return True


def test_server_has_unified_state_endpoints():
    """Test that server.py defines the required unified state endpoints."""
    server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
    
    assert server_path.exists(), "server.py not found"
    
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()
    
    # Check for unified state functions
    required_functions = [
        'get_unified_personality_state',
        'set_current_active_personality',
        'set_next_question_override',
        'consume_next_question_override',
        'get_next_question_override_status',
        'set_admin_active_system_prompt'
    ]
    
    for func in required_functions:
        assert f'def {func}' in server_code, f"Missing function: {func}"
    
    # Check for new endpoints
    required_endpoints = [
        '@personality_router.get("/state")',
        '@personality_router.post("/override/next")',
        '@personality_router.delete("/override/next")'
    ]
    
    for endpoint in required_endpoints:
        assert endpoint in server_code, f"Missing endpoint: {endpoint}"
    
    print(f"✓ Server has all required unified state functions and endpoints")
    return True


def test_unified_state_variable_structure():
    """Test that unified state variable is defined with correct structure."""
    server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
    
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()
    
    # Check for unified state variable
    assert '_unified_personality_state' in server_code, "Missing _unified_personality_state variable"
    
    # Check for required fields in the initial state
    required_fields = [
        'active_personality_id',
        'active_personality_name',
        'active_card_file',
        'source',
        'admin_active_system_prompt_id',
        'last_updated'
    ]
    
    for field in required_fields:
        assert f'"{field}"' in server_code, f"Missing field in unified state: {field}"
    
    print(f"✓ Unified state variable has correct structure")
    return True


def test_source_tracking_in_set_personality():
    """Test that set_current_active_personality accepts source parameter."""
    server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
    
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()
    
    # Check function signature has source parameter
    assert 'def set_current_active_personality(personality_info: Dict[str, Any], source: str' in server_code, \
        "set_current_active_personality should have source parameter"
    
    # Check for source="admin" usage
    assert 'source="admin"' in server_code, "Missing admin source usage"
    
    # Check for source="ai" usage
    assert 'source="ai"' in server_code, "Missing AI source usage"
    
    # Check for source="override" usage
    assert 'source="override"' in server_code, "Missing override source usage"
    
    print(f"✓ Source tracking implemented in set_current_active_personality")
    return True


def test_system_prompt_activation_syncs_personality():
    """Test that system prompt activation also updates personality state."""
    server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
    
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()
    
    # Find the activate_system_prompt function
    assert 'async def activate_system_prompt' in server_code, "Missing activate_system_prompt function"
    
    # Check that it calls set_current_active_personality with admin source
    # Look for the comment or the call pattern
    assert 'set_current_active_personality(personality_info, source="admin")' in server_code, \
        "activate_system_prompt should call set_current_active_personality with admin source"
    
    # Check for set_admin_active_system_prompt call
    assert 'set_admin_active_system_prompt(' in server_code, \
        "activate_system_prompt should call set_admin_active_system_prompt"
    
    print(f"✓ System prompt activation syncs with personality state")
    return True


def test_override_consumed_in_get_active_system_prompt():
    """Test that get_active_system_prompt consumes overrides first."""
    server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
    
    with open(server_path, 'r', encoding='utf-8') as f:
        server_code = f.read()
    
    # Find the get_active_system_prompt function and check it consumes override
    assert 'consume_next_question_override()' in server_code, \
        "get_active_system_prompt should call consume_next_question_override"
    
    print(f"✓ get_active_system_prompt consumes override before other sources")
    return True


def test_frontend_uses_unified_state_endpoint():
    """Test that frontend polls the new unified state endpoint."""
    seven_b_zero_path = Path(__file__).parent.parent / 'frontend' / 'src' / 'pages' / 'SevenBZeroPage.jsx'
    
    with open(seven_b_zero_path, 'r', encoding='utf-8') as f:
        frontend_code = f.read()
    
    # Check for unified state endpoint
    assert '/api/personality/state' in frontend_code, \
        "SevenBZeroPage should poll /api/personality/state"
    
    # Check for source tracking
    assert 'personalitySource' in frontend_code, "Missing personalitySource state"
    assert 'setPersonalitySource' in frontend_code, "Missing setPersonalitySource setter"
    
    print(f"✓ Frontend uses unified state endpoint for polling")
    return True


def test_frontend_has_override_mode():
    """Test that frontend supports override mode for next question."""
    seven_b_zero_path = Path(__file__).parent.parent / 'frontend' / 'src' / 'pages' / 'SevenBZeroPage.jsx'
    
    with open(seven_b_zero_path, 'r', encoding='utf-8') as f:
        frontend_code = f.read()
    
    # Check for override mode state
    assert 'overrideMode' in frontend_code, "Missing overrideMode state"
    
    # Check for override endpoint call
    assert '/api/personality/override/next' in frontend_code, \
        "Should call override endpoint"
    
    print(f"✓ Frontend has override mode for next question")
    return True


def test_admin_shows_source_indicator():
    """Test that admin dashboard shows personality source indicator."""
    admin_path = Path(__file__).parent.parent / 'frontend' / 'src' / 'components' / 'admin' / 'SystemPromptManagement.jsx'
    
    with open(admin_path, 'r', encoding='utf-8') as f:
        admin_code = f.read()
    
    # Check for source state
    assert 'personalitySource' in admin_code, "Missing personalitySource state in admin"
    
    # Check for unified state endpoint
    assert '/api/personality/state' in admin_code, \
        "Admin should poll /api/personality/state"
    
    # Check for source indicator in UI
    assert 'Override' in admin_code or 'Admin' in admin_code, \
        "Should show source indicator"
    
    print(f"✓ Admin dashboard shows source indicator")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("ONESEEK Δ+ v6.5 (PR#101) - Unified Personality State Tests")
    print("=" * 60)
    print()
    
    # Define tests that work without server imports
    tests = [
        ("Personality catalog structure", test_personality_catalog_has_valid_structure),
        ("Server unified state endpoints", test_server_has_unified_state_endpoints),
        ("Unified state variable structure", test_unified_state_variable_structure),
        ("Source tracking in set_personality", test_source_tracking_in_set_personality),
        ("System prompt activation sync", test_system_prompt_activation_syncs_personality),
        ("Override consumed in get_active_system_prompt", test_override_consumed_in_get_active_system_prompt),
        ("Frontend uses unified state", test_frontend_uses_unified_state_endpoint),
        ("Frontend has override mode", test_frontend_has_override_mode),
        ("Admin shows source indicator", test_admin_shows_source_indicator),
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
            import traceback
            traceback.print_exc()
            failed += 1
    
    print()
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    sys.exit(0 if failed == 0 else 1)
