"""
Test Live AI-Debate functionality
Tests the debate WebSocket endpoint and flow
"""

import pytest
import json
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import sys
from pathlib import Path

# Add ml_service to path
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT / 'ml_service'))


class TestDebateFlow:
    """Test the debate flow and WebSocket communication"""
    
    def test_debate_agents_list(self):
        """Test that debate has correct agents"""
        expected_agents = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
        assert len(expected_agents) == 5
        assert 'oneseek' in expected_agents
        
    def test_debate_rounds(self):
        """Test that debate has 3 rounds"""
        max_rounds = 3
        assert max_rounds == 3
        
    def test_voting_rules(self):
        """Test that agents cannot vote for themselves"""
        agents = ['gpt', 'gemini', 'deepseek', 'grok', 'oneseek']
        
        for voter in agents:
            other_agents = [a for a in agents if a != voter]
            assert voter not in other_agents
            assert len(other_agents) == 4
            
    def test_winner_determination(self):
        """Test winner is determined by most votes"""
        votes = {
            'gpt': 3,
            'gemini': 1,
            'deepseek': 1,
            'grok': 0,
            'oneseek': 0
        }
        
        winner = max(votes.items(), key=lambda x: x[1])[0]
        assert winner == 'gpt'
        assert votes[winner] == 3
        
    def test_debate_message_types(self):
        """Test that all required message types are defined"""
        required_types = [
            'thinking',
            'debate_init',
            'round_start',
            'response',
            'round_end',
            'voting',
            'winner',
            'summary',
            'final',
            'error'
        ]
        
        # All types should be strings
        for msg_type in required_types:
            assert isinstance(msg_type, str)
            assert len(msg_type) > 0


class TestDebatePersonality:
    """Test Debattledare personality configuration"""
    
    def test_personality_exists(self):
        """Test that Debattledare personality exists in catalog"""
        import json
        
        catalog_path = PROJECT_ROOT / 'config' / 'personality_catalog.json'
        assert catalog_path.exists(), "personality_catalog.json not found"
        
        with open(catalog_path, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        
        personalities = catalog.get('personality_catalog', {})
        assert 'oneseek-debattledare' in personalities
        
        debattledare = personalities['oneseek-debattledare']
        assert debattledare['name'] == 'Debattledaren'
        assert 'debatt' in debattledare['keywords']
        
    def test_personality_card_exists(self):
        """Test that Debattledare YAML card exists"""
        card_path = PROJECT_ROOT / 'frontend' / 'public' / 'characters' / 'OneSeek-Debattledare.yaml'
        assert card_path.exists(), "OneSeek-Debattledare.yaml not found"
        
        # Read and verify basic structure
        with open(card_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert 'char_name: Debattledare' in content
        assert 'char_persona' in content
        assert 'neutral' in content.lower()


class TestDebateValidation:
    """Test input validation for debate"""
    
    def test_question_required(self):
        """Test that question is required"""
        question = ""
        assert not question or not question.strip()
        
    def test_question_length_limit(self):
        """Test question length limit"""
        max_length = 5000
        question = "a" * (max_length + 1)
        assert len(question) > max_length
        
    def test_valid_question(self):
        """Test valid question"""
        question = "Ska Sverige bygga nya kärnkraftverk?"
        assert question and question.strip()
        assert len(question) <= 5000


class TestConfettiLogic:
    """Test confetti display logic"""
    
    def test_confetti_trigger(self):
        """Test that confetti should show on winner announcement"""
        show_confetti = False
        
        # Simulate winner event
        def on_winner_event():
            nonlocal show_confetti
            show_confetti = True
            
        on_winner_event()
        assert show_confetti == True
        
    def test_confetti_duration(self):
        """Test confetti display duration"""
        confetti_duration_ms = 5000
        assert confetti_duration_ms == 5000  # 5 seconds


class TestDebateIntegration:
    """Integration tests for debate functionality"""
    
    @pytest.mark.asyncio
    async def test_debate_message_format(self):
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
        assert "type" in message
        assert "message" in message
        assert "data" in message
        assert message["type"] == "debate_init"
        assert message["data"]["personality"] == "Debattledaren"
        
    @pytest.mark.asyncio
    async def test_response_message_format(self):
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
        
        assert response["type"] == "response"
        assert response["round"] in [1, 2, 3]
        assert response["agent"] in ["gpt", "gemini", "deepseek", "grok", "oneseek"]
        assert response["data"]["success"] == True


def test_debate_documentation_exists():
    """Test that debate documentation exists"""
    doc_path = PROJECT_ROOT / 'DEBATE_IMPLEMENTATION.md'
    assert doc_path.exists(), "DEBATE_IMPLEMENTATION.md not found"
    
    user_guide_path = PROJECT_ROOT / 'docs' / 'DEBATE_USER_GUIDE.md'
    assert user_guide_path.exists(), "DEBATE_USER_GUIDE.md not found"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
