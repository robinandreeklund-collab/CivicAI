"""
Tests for Socionomen chapter parsing, API selection, and follow-up options.

This module tests:
- Correct extraction of kapitel vs paragraf from user queries
- Preference for Riksdagen chapter-based APIs over legacy lagen.nu
- Follow-up schema structure for prejudikat search
- Token output limits for Socionomen responses
"""

import json
import pytest
import re
from pathlib import Path


class TestSocionomenAPIConfig:
    """Tests for Socionomen API catalog configuration."""
    
    def get_socionomen_catalog_path(self):
        """Get path to api_catalog_socionomen.json."""
        return Path(__file__).parent.parent / "config" / "api_catalog_socionomen.json"
    
    def test_socionomen_catalog_exists(self):
        """Test that api_catalog_socionomen.json exists."""
        catalog_path = self.get_socionomen_catalog_path()
        assert catalog_path.exists(), f"api_catalog_socionomen.json should exist at {catalog_path}"
    
    def test_socionomen_catalog_valid_json(self):
        """Test that api_catalog_socionomen.json contains valid JSON."""
        catalog_path = self.get_socionomen_catalog_path()
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        assert isinstance(data, dict), "api_catalog_socionomen.json should contain a JSON object"
    
    def test_chapter_based_apis_present(self):
        """Test that sol_ny_kapitel and sol_gammal_kapitel APIs are present."""
        catalog_path = self.get_socionomen_catalog_path()
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        api_names = [api['name'] for api in data.get('apis', [])]
        assert 'sol_ny_kapitel' in api_names, "sol_ny_kapitel API should be present"
        assert 'sol_gammal_kapitel' in api_names, "sol_gammal_kapitel API should be present"
    
    def test_chapter_based_apis_have_high_priority(self):
        """Test that chapter-based APIs have priority 0 and 1 (highest)."""
        catalog_path = self.get_socionomen_catalog_path()
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for api in data.get('apis', []):
            if api['name'] == 'sol_ny_kapitel':
                assert api['priority'] == 0, "sol_ny_kapitel should have priority 0"
            elif api['name'] == 'sol_gammal_kapitel':
                assert api['priority'] == 1, "sol_gammal_kapitel should have priority 1"
    
    def test_chapter_based_apis_use_browse_page_chapter_tool(self):
        """Test that chapter-based APIs use browse_page_chapter tool."""
        catalog_path = self.get_socionomen_catalog_path()
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for api in data.get('apis', []):
            if api['name'] in ['sol_ny_kapitel', 'sol_gammal_kapitel']:
                assert api['tool'] == 'browse_page_chapter', \
                    f"{api['name']} should use browse_page_chapter tool"
                assert api['method'] == 'BROWSE_CHAPTER', \
                    f"{api['name']} should have method BROWSE_CHAPTER"
    
    def test_kapitel_parameter_description_mentions_correct_extraction(self):
        """Test that kapitel parameter description mentions extracting first number."""
        catalog_path = self.get_socionomen_catalog_path()
        with open(catalog_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for api in data.get('apis', []):
            if api['name'] in ['sol_ny_kapitel', 'sol_gammal_kapitel']:
                kapitel_param = api.get('parameters', {}).get('kapitel', {})
                description = kapitel_param.get('description', '')
                
                # Check that description mentions "4 kap. 1 §" → kapitel='4'
                assert 'VIKTIGT' in description or 'första numret' in description.lower(), \
                    f"{api['name']} kapitel parameter should mention correct extraction"
                assert "4 kap. 1 §" in description or "X kap." in description, \
                    f"{api['name']} should have examples in description"


class TestSocionomenCharacterPrompt:
    """Tests for Socionomen character prompt instructions."""
    
    def get_socionomen_yaml_path(self):
        """Get path to OneSeek-Socionomen.yaml."""
        return Path(__file__).parent.parent / "frontend" / "public" / "characters" / "OneSeek-Socionomen.yaml"
    
    def test_socionomen_yaml_exists(self):
        """Test that OneSeek-Socionomen.yaml exists."""
        yaml_path = self.get_socionomen_yaml_path()
        assert yaml_path.exists(), f"OneSeek-Socionomen.yaml should exist at {yaml_path}"
    
    def test_parsing_instructions_present(self):
        """Test that YAML contains explicit parsing instructions for kapitel vs paragraf."""
        yaml_path = self.get_socionomen_yaml_path()
        with open(yaml_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for parsing instructions section
        assert "PARAGRAF- OCH KAPITELEXTRAKTION" in content, \
            "YAML should contain section on chapter/paragraph extraction"
        
        # Check for examples
        assert "4 kap. 1 §" in content, "YAML should contain example '4 kap. 1 §'"
        assert "11 kap 5 §" in content or "11 kap" in content, \
            "YAML should contain examples with different chapter numbers"
    
    def test_api_preference_instructions_present(self):
        """Test that YAML contains instructions to prefer Riksdagen APIs."""
        yaml_path = self.get_socionomen_yaml_path()
        with open(yaml_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for API preference instructions
        assert "sol_ny_kapitel" in content or "sol_gammal_kapitel" in content, \
            "YAML should mention chapter-based APIs"
        assert "FÖREDRA" in content or "INTE" in content, \
            "YAML should contain preference instructions"
    
    def test_follow_up_schema_present(self):
        """Test that YAML contains follow-up schema instructions."""
        yaml_path = self.get_socionomen_yaml_path()
        with open(yaml_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for follow-up schema section
        assert "FOLLOW-UP SCHEMA" in content or "follow_up_options" in content, \
            "YAML should contain follow-up schema instructions"
        
        # Check for required fields in follow-up schema
        assert "search_prejudikat" in content, \
            "YAML should mention search_prejudikat action"
        assert "decline_followup" in content, \
            "YAML should mention decline_followup action"
        assert '"id"' in content or "'id'" in content, \
            "YAML should show follow-up option ID field"
        assert '"action"' in content or "'action'" in content, \
            "YAML should show follow-up action field"
        assert '"parameters"' in content or "'parameters'" in content, \
            "YAML should show follow-up parameters field"
    
    def test_follow_up_examples_present(self):
        """Test that YAML contains complete examples of follow-up options."""
        yaml_path = self.get_socionomen_yaml_path()
        with open(yaml_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check that examples include the required structure
        assert "prej_yes" in content or "prej_no" in content, \
            "YAML should contain example follow-up option IDs"
        
        # Check for parameter examples
        assert '"paragraf"' in content or "'paragraf'" in content, \
            "YAML should show paragraf parameter in examples"
        assert '"lag_namn"' in content or "'lag_namn'" in content, \
            "YAML should show lag_namn parameter in examples"
        assert '"personality"' in content or "'personality'" in content, \
            "YAML should show personality parameter in examples"


class TestChapterExtractionPattern:
    """Tests for chapter extraction pattern matching."""
    
    def test_chapter_extraction_pattern_4_kap_1_para(self):
        """Test extraction pattern for '4 kap. 1 §'."""
        # This pattern should extract kapitel=4, paragraf=1
        text = "Citera 4 kap. 1 § i gamla SoL"
        
        # Pattern: (\d+)\s+kap\.?\s+(\d+\s*[a-z]?)?\s*§?
        pattern = r'(\d+)\s+kap\.?\s+(\d+\s*[a-z]?)?\s*§?'
        match = re.search(pattern, text)
        
        assert match is not None, "Pattern should match '4 kap. 1 §'"
        assert match.group(1) == '4', "First capture group should be '4' (kapitel)"
        assert match.group(2).strip() == '1', "Second capture group should be '1' (paragraf)"
    
    def test_chapter_extraction_pattern_11_kap_5_para(self):
        """Test extraction pattern for '11 kap 5 §' (no dot after kap)."""
        text = "Vad säger 11 kap 5 § i nya SoL?"
        
        pattern = r'(\d+)\s+kap\.?\s+(\d+\s*[a-z]?)?\s*§?'
        match = re.search(pattern, text)
        
        assert match is not None, "Pattern should match '11 kap 5 §'"
        assert match.group(1) == '11', "First capture group should be '11' (kapitel)"
        assert match.group(2).strip() == '5', "Second capture group should be '5' (paragraf)"
    
    def test_chapter_extraction_pattern_5_kap_no_para(self):
        """Test extraction pattern for '5 kap' (no paragraph)."""
        text = "Citera 5 kap SoL"
        
        pattern = r'(\d+)\s+kap\.?'
        match = re.search(pattern, text)
        
        assert match is not None, "Pattern should match '5 kap'"
        assert match.group(1) == '5', "First capture group should be '5' (kapitel)"
    
    def test_chapter_extraction_pattern_12_kap_3a_para(self):
        """Test extraction pattern for '12 kap. 3 a §' (lettered paragraph)."""
        text = "Vad säger 12 kap. 3 a § i gamla SoL?"
        
        pattern = r'(\d+)\s+kap\.?\s+(\d+\s*[a-z]?)?\s*§?'
        match = re.search(pattern, text)
        
        assert match is not None, "Pattern should match '12 kap. 3 a §'"
        assert match.group(1) == '12', "First capture group should be '12' (kapitel)"
        assert match.group(2) == '3 a', "Second capture group should be '3 a' (lettered paragraf)"


class TestTokenLimits:
    """Tests for token limits in chat services."""
    
    def test_frontend_chat_service_has_elevated_socionomen_limit(self):
        """Test that frontend chat service has higher token limit for Socionomen."""
        chat_service_path = Path(__file__).parent.parent / "frontend" / "src" / "services" / "chat.js"
        
        assert chat_service_path.exists(), "chat.js should exist"
        
        with open(chat_service_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check that Socionomen has elevated token limit
        assert 'socionomen' in content.lower(), "chat.js should reference socionomen"
        assert '1600' in content or '1200' in content or '2000' in content, \
            "chat.js should have elevated token limits (1200-2000)"
    
    def test_openai_service_has_increased_max_tokens(self):
        """Test that OpenAI service has increased max_tokens from 500."""
        openai_service_path = Path(__file__).parent.parent / "backend" / "services" / "openai.js"
        
        assert openai_service_path.exists(), "openai.js should exist"
        
        with open(openai_service_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for increased max_tokens (should be > 500, ideally 2000)
        assert 'max_tokens' in content, "openai.js should specify max_tokens"
        # Look for increased value
        max_tokens_match = re.search(r'max_tokens:\s*(\d+)', content)
        if max_tokens_match:
            max_tokens_value = int(max_tokens_match.group(1))
            assert max_tokens_value >= 1500, \
                f"OpenAI max_tokens should be >= 1500, found {max_tokens_value}"
    
    def test_mistral_service_has_increased_defaults(self):
        """Test that Mistral service has increased default maxTokens from 500."""
        mistral_service_path = Path(__file__).parent.parent / "backend" / "services" / "mistral.js"
        
        assert mistral_service_path.exists(), "mistral.js should exist"
        
        with open(mistral_service_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for increased maxTokens default
        assert 'maxTokens' in content, "mistral.js should specify maxTokens"
        # Look for increased value (should be 1500)
        max_tokens_matches = re.findall(r'maxTokens:\s*options\.maxTokens\s*\|\|\s*(\d+)', content)
        if max_tokens_matches:
            for value in max_tokens_matches:
                max_tokens_value = int(value)
                assert max_tokens_value >= 1200, \
                    f"Mistral maxTokens default should be >= 1200, found {max_tokens_value}"


class TestAPISelectorImprovements:
    """Tests for API selector code quality improvements."""
    
    def test_api_selector_has_helper_function(self):
        """Test that api_selector.py has URL formatting helper function."""
        api_selector_path = Path(__file__).parent.parent / "ml_service" / "api_selector.py"
        
        assert api_selector_path.exists(), "api_selector.py should exist"
        
        with open(api_selector_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert 'def format_url_with_params' in content, \
            "api_selector.py should have format_url_with_params helper function"
    
    def test_api_selector_uses_chapter_extraction_available_flag(self):
        """Test that api_selector.py uses CHAPTER_EXTRACTION_AVAILABLE flag."""
        api_selector_path = Path(__file__).parent.parent / "ml_service" / "api_selector.py"
        
        with open(api_selector_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        assert 'CHAPTER_EXTRACTION_AVAILABLE' in content, \
            "api_selector.py should use CHAPTER_EXTRACTION_AVAILABLE flag"
        
        # Should not use old flag name
        assert content.count('BROWSE_PAGE_WITH_BERT_AVAILABLE') <= 1, \
            "api_selector.py should minimize use of old BROWSE_PAGE_WITH_BERT_AVAILABLE flag"
    
    def test_api_integrations_has_deprecation_warning(self):
        """Test that browse_page_with_bert has DeprecationWarning."""
        api_integrations_path = Path(__file__).parent.parent / "ml_service" / "api_integrations.py"
        
        assert api_integrations_path.exists(), "api_integrations.py should exist"
        
        with open(api_integrations_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find browse_page_with_bert function
        assert 'def browse_page_with_bert' in content, \
            "api_integrations.py should have browse_page_with_bert function"
        
        # Check for DeprecationWarning
        assert 'DeprecationWarning' in content, \
            "browse_page_with_bert should emit DeprecationWarning"
        assert 'warnings.warn' in content, \
            "browse_page_with_bert should use warnings.warn for deprecation"
    
    def test_extract_chapter_docstring_mentions_lettered_paragraphs(self):
        """Test that extract_chapter_from_riksdagen docstring mentions lettered paragraphs."""
        api_integrations_path = Path(__file__).parent.parent / "ml_service" / "api_integrations.py"
        
        with open(api_integrations_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find extract_chapter_from_riksdagen function
        assert 'def extract_chapter_from_riksdagen' in content, \
            "api_integrations.py should have extract_chapter_from_riksdagen function"
        
        # Find its docstring (text after the function definition)
        func_index = content.index('def extract_chapter_from_riksdagen')
        docstring_section = content[func_index:func_index + 1500]
        
        # Check docstring mentions lettered paragraphs
        assert '1 a §' in docstring_section or 'lettered' in docstring_section.lower(), \
            "extract_chapter_from_riksdagen docstring should mention lettered paragraphs support"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
