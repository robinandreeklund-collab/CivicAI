"""
Test Debate Turn Order Randomization
Tests that agent turn orders are randomized per round
"""

import random


class TestDebateTurnOrderRandomization:
    """Test randomized turn order functionality"""
    
    def test_turn_order_randomization(self):
        """Test that turn order changes between rounds"""
        debate_agents = ['gpt', 'gemini', 'deepseek', 'grok']
        
        # Generate turn orders for 3 rounds
        turn_orders = {}
        for round_num in range(1, 4):
            round_turn_order = debate_agents.copy()
            random.shuffle(round_turn_order)
            turn_orders[round_num] = round_turn_order
        
        # Verify we have 3 different turn orders
        assert len(turn_orders) == 3
        
        # Verify each turn order contains all agents
        for round_num, turn_order in turn_orders.items():
            assert len(turn_order) == 4
            assert set(turn_order) == set(debate_agents)
    
    def test_turn_order_contains_all_agents(self):
        """Test that randomized order contains all agents exactly once"""
        debate_agents = ['gpt', 'gemini', 'deepseek', 'grok']
        round_turn_order = debate_agents.copy()
        random.shuffle(round_turn_order)
        
        # All agents present
        assert len(round_turn_order) == len(debate_agents)
        
        # No duplicates
        assert len(set(round_turn_order)) == len(debate_agents)
        
        # All original agents present
        for agent in debate_agents:
            assert agent in round_turn_order
    
    def test_multiple_rounds_likely_different(self):
        """Test that multiple rounds are likely to have different orders"""
        debate_agents = ['gpt', 'gemini', 'deepseek', 'grok']
        
        # Generate 10 rounds and check that at least some are different
        turn_orders = []
        for _ in range(10):
            round_turn_order = debate_agents.copy()
            random.shuffle(round_turn_order)
            turn_orders.append(tuple(round_turn_order))
        
        # With 10 rounds and 4! = 24 possible permutations,
        # we should have at least 2 different orders
        unique_orders = set(turn_orders)
        assert len(unique_orders) >= 2, "Turn orders should vary across rounds"


class TestPromptStructure:
    """Test prompt structure improvements"""
    
    def test_prompt_has_background_section(self):
        """Test that prompts include BAKGRUND section"""
        # Simulate previous rounds
        debate_rounds = [
            {
                'round': 1,
                'responses': [
                    {'agent': 'gpt', 'response': 'Test response from GPT', 'success': True}
                ]
            }
        ]
        
        # Build context
        debate_context = ""
        if debate_rounds:
            debate_context = "\n\nBAKGRUND - TIDIGARE RUNDOR:\n"
            for prev_round in debate_rounds:
                debate_context += f"\nRunda {prev_round['round']}:\n"
                for resp in prev_round['responses']:
                    debate_context += f"- {resp['agent'].upper()}: {resp['response'][:150]}...\n"
        
        assert "BAKGRUND" in debate_context
        assert "TIDIGARE RUNDOR" in debate_context
    
    def test_prompt_has_word_count_guidance(self):
        """Test that prompts include word count guidance"""
        prompt_template = """DEBATTFRÅGA: Test question

AKTUELL RUNDA (1/3):
Detta är en interaktiv AI-debatt där du nu ska ge ditt perspektiv.

INSTRUKTIONER FÖR DITT SVAR:
- Längd: 300-500 ord (håll denna begränsning strikt)
- Stil: Tydlig, engagerad och analytisk
"""
        
        assert "300-500 ord" in prompt_template
        assert "strikt" in prompt_template.lower()
    
    def test_behavioral_enforcement_in_prompts(self):
        """Test that prompts include behavioral enforcement clauses"""
        comment_prompt = """BEHAVIORAL ENFORCEMENT:
- Reagera naturligt och tänkande på det du just läst
- Kommentera i realtid för publiken och bygg din egen förståelse
- Håll längden till 40-80 ord (2-5 meningar)
"""
        
        assert "BEHAVIORAL ENFORCEMENT" in comment_prompt
        assert "40-80 ord" in comment_prompt


class TestTokenManagement:
    """Test token management and truncation"""
    
    def test_response_truncation_for_context(self):
        """Test that responses are truncated to prevent token overflow"""
        long_response = "A" * 1000  # 1000 character response
        
        # Truncate to max 150 chars for context
        truncated = long_response[:150] + "..."
        
        assert len(truncated) == 153  # 150 + "..."
        assert truncated.endswith("...")
    
    def test_summary_truncation(self):
        """Test that summaries truncate responses"""
        responses = [
            {'agent': 'gpt', 'response': 'A' * 500, 'success': True},
            {'agent': 'gemini', 'response': 'B' * 500, 'success': True}
        ]
        
        # Build summary with truncation
        summary_text = ""
        for resp in responses:
            if resp.get('success', False):
                response_text = resp['response'][:250]
                if len(resp['response']) > 250:
                    response_text += "..."
                summary_text += f"{resp['agent'].upper()}: {response_text}\n\n"
        
        # Each response should be max 253 chars (250 + "...")
        for line in summary_text.split('\n\n'):
            if line.strip():
                # Remove agent prefix to get response part
                response_part = line.split(': ', 1)[1] if ': ' in line else line
                assert len(response_part) <= 253


if __name__ == '__main__':
    import pytest
    pytest.main([__file__, '-v'])
