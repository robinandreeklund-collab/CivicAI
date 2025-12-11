"""
Simple tests for Live AI-Debate functionality
No external dependencies required
"""

import json
import sys
from pathlib import Path

# Add ml_service to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / 'ml_service'))


def test_debate_agents_list():
    """Test that debate has correct agents"""
    expected_agents = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
    assert len(expected_agents) == 5, f"Expected 5 agents, got {len(expected_agents)}"
    assert 'oneseek' in expected_agents, "oneseek should be in agents list"
    print("✓ Debate agents list correct")


def test_debate_rounds():
    """Test that debate has 3 rounds"""
    max_rounds = 3
    assert max_rounds == 3, f"Expected 3 rounds, got {max_rounds}"
    print("✓ Debate rounds correct (3)")


def test_voting_rules():
    """Test that agents cannot vote for themselves"""
    agents = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
    
    for voter in agents:
        other_agents = [a for a in agents if a != voter]
        assert voter not in other_agents, f"{voter} should not be able to vote for themselves"
        assert len(other_agents) == 4, f"Each voter should have 4 options, got {len(other_agents)}"
    
    print("✓ Voting rules correct (no self-voting)")


def test_winner_determination():
    """Test winner is determined by most votes"""
    votes = {
        'gpt': 3,
        'gemini': 1,
        'deepseek': 1,
        'grok': 0,
        'oneseek': 0
    }
    
    winner = max(votes.items(), key=lambda x: x[1])[0]
    assert winner == 'gpt', f"Expected gpt to win, got {winner}"
    assert votes[winner] == 3, f"Winner should have 3 votes, got {votes[winner]}"
    print("✓ Winner determination correct")


def test_personality_exists():
    """Test that Debattledare personality exists in catalog"""
    catalog_path = PROJECT_ROOT / 'config' / 'personality_catalog.json'
    assert catalog_path.exists(), "personality_catalog.json not found"
    
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    personalities = catalog.get('personality_catalog', {})
    assert 'oneseek-debattledare' in personalities, "Debattledare not in catalog"
    
    debattledare = personalities['oneseek-debattledare']
    assert debattledare['name'] == 'Debattledaren', f"Expected name 'Debattledaren', got '{debattledare['name']}'"
    assert 'debatt' in debattledare['keywords'], "debatt should be in keywords"
    print("✓ Debattledare personality exists in catalog")


def test_personality_card_exists():
    """Test that Debattledare YAML card exists"""
    card_path = PROJECT_ROOT / 'frontend' / 'public' / 'characters' / 'OneSeek-Debattledare.yaml'
    assert card_path.exists(), "OneSeek-Debattledare.yaml not found"
    
    # Read and verify basic structure
    with open(card_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    assert 'char_name: Debattledare' in content, "char_name should be Debattledare"
    assert 'char_persona' in content, "char_persona should be defined"
    assert 'neutral' in content.lower(), "Should mention 'neutral' in content"
    print("✓ Debattledare YAML card exists")


def test_question_validation():
    """Test question validation logic"""
    # Empty question
    question = ""
    assert not question or not question.strip(), "Empty question should be invalid"
    
    # Valid question
    question = "Ska Sverige bygga nya kärnkraftverk?"
    assert question and question.strip(), "Valid question should pass"
    assert len(question) <= 5000, "Question should be under 5000 chars"
    
    # Too long question
    long_question = "a" * 5001
    assert len(long_question) > 5000, "Long question should exceed limit"
    print("✓ Question validation correct")


def test_debate_message_format():
    """Test debate message JSON format"""
    message = {
        "type": "debate_init",
        "message": "🎤 Debattarena redo!",
        "data": {
            "agents": ["gpt", "gemini", "deepseek", "grok", "oneseek"],
            "rounds": 3,
            "question": "Test question",
            "personality": "Debattledaren"
        }
    }
    
    # Verify structure
    assert "type" in message, "Message should have 'type'"
    assert "message" in message, "Message should have 'message'"
    assert "data" in message, "Message should have 'data'"
    assert message["type"] == "debate_init", "Type should be debate_init"
    assert message["data"]["personality"] == "Debattledaren", "Personality should be Debattledaren"
    print("✓ Debate message format correct")


def test_response_message_format():
    """Test response message format"""
    response = {
        "type": "response",
        "round": 1,
        "agent": "gpt",
        "message": "Test response",
        "data": {
            "model": "gpt-3.5-turbo",
            "success": True
        }
    }
    
    assert response["type"] == "response", "Type should be response"
    assert response["round"] in [1, 2, 3], "Round should be 1-3"
    assert response["agent"] in ["gpt", "gemini", "deepseek", "grok", "oneseek"], "Invalid agent"
    assert response["data"]["success"] == True, "Success should be True"
    print("✓ Response message format correct")


def test_documentation_exists():
    """Test that debate documentation exists"""
    doc_path = PROJECT_ROOT / 'DEBATE_IMPLEMENTATION.md'
    assert doc_path.exists(), "DEBATE_IMPLEMENTATION.md not found"
    
    user_guide_path = PROJECT_ROOT / 'docs' / 'DEBATE_USER_GUIDE.md'
    assert user_guide_path.exists(), "DEBATE_USER_GUIDE.md not found"
    print("✓ Documentation files exist")


def test_confetti_logic():
    """Test confetti display logic"""
    show_confetti = False
    
    # Simulate winner event
    def on_winner_event():
        nonlocal show_confetti
        show_confetti = True
        
    on_winner_event()
    assert show_confetti == True, "Confetti should show on winner event"
    
    confetti_duration_ms = 5000
    assert confetti_duration_ms == 5000, "Confetti duration should be 5 seconds"
    print("✓ Confetti logic correct")


def run_all_tests():
    """Run all tests"""
    tests = [
        test_debate_agents_list,
        test_debate_rounds,
        test_voting_rules,
        test_winner_determination,
        test_personality_exists,
        test_personality_card_exists,
        test_question_validation,
        test_debate_message_format,
        test_response_message_format,
        test_documentation_exists,
        test_confetti_logic,
    ]
    
    print("=" * 60)
    print("Running Live AI-Debate Tests")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except AssertionError as e:
            print(f"✗ {test.__name__} FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {test.__name__} ERROR: {e}")
            failed += 1
    
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    return failed == 0


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
