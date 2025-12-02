"""
Tests for Python code generation feature (python_kod intent and /code/python endpoint).

Tests verify:
1. Intent rules JSON structure and python_kod intent
2. Python gold dataset validity
3. Endpoint Pydantic models (without importing torch-dependent server.py)
"""

import pytest
import json
from pathlib import Path


class TestPythonKodIntent:
    """Test python_kod intent configuration in intent_rules.json"""
    
    @pytest.fixture
    def intent_rules(self):
        """Load intent rules from config file"""
        config_file = Path(__file__).parent.parent / 'ml_service' / 'intent_rules.json'
        with open(config_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def test_intent_rules_json_valid(self, intent_rules):
        """Test that intent_rules.json is valid JSON"""
        assert isinstance(intent_rules, dict)
        assert 'intents' in intent_rules
    
    def test_python_kod_intent_exists(self, intent_rules):
        """Test that python_kod intent exists"""
        intents = intent_rules.get('intents', {})
        assert 'python_kod' in intents, "python_kod intent should exist in intent_rules.json"
    
    def test_python_kod_intent_has_required_fields(self, intent_rules):
        """Test that python_kod intent has all required fields"""
        python_kod = intent_rules['intents']['python_kod']
        
        required_fields = ['keywords', 'weight', 'priority', 'min_confidence', 
                          'force_api', 'api', 'response_template']
        
        for field in required_fields:
            assert field in python_kod, f"python_kod intent should have '{field}' field"
    
    def test_python_kod_intent_keywords(self, intent_rules):
        """Test that python_kod intent has expected keywords"""
        python_kod = intent_rules['intents']['python_kod']
        keywords = python_kod.get('keywords', [])
        
        expected_keywords = ['python', 'kod', 'skriv kod', 'program']
        for kw in expected_keywords:
            assert kw in keywords, f"python_kod should have keyword '{kw}'"
    
    def test_python_kod_intent_api_is_code_generator(self, intent_rules):
        """Test that python_kod intent uses code_generator API"""
        python_kod = intent_rules['intents']['python_kod']
        assert python_kod.get('api') == 'code_generator'
    
    def test_python_kod_intent_response_template(self, intent_rules):
        """Test that python_kod intent has correct response template"""
        python_kod = intent_rules['intents']['python_kod']
        template = python_kod.get('response_template', '')
        assert 'python' in template.lower()
        assert '{code}' in template


class TestPythonGoldDataset:
    """Test python_gold.jsonl dataset validity"""
    
    @pytest.fixture
    def dataset_path(self):
        """Return path to python_gold.jsonl"""
        return Path(__file__).parent.parent / 'datasets' / 'python_gold.jsonl'
    
    def test_dataset_exists(self, dataset_path):
        """Test that python_gold.jsonl exists"""
        assert dataset_path.exists(), f"Dataset should exist at {dataset_path}"
    
    def test_dataset_has_50_entries(self, dataset_path):
        """Test that dataset has exactly 50 entries"""
        with open(dataset_path, 'r', encoding='utf-8') as f:
            lines = [line for line in f.readlines() if line.strip()]
        assert len(lines) == 50, f"Dataset should have 50 entries, got {len(lines)}"
    
    def test_all_entries_valid_json(self, dataset_path):
        """Test that all entries are valid JSON"""
        with open(dataset_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                if not line.strip():
                    continue
                try:
                    json.loads(line)
                except json.JSONDecodeError as e:
                    pytest.fail(f"Line {i} is not valid JSON: {e}")
    
    def test_all_entries_have_required_fields(self, dataset_path):
        """Test that all entries have 'question' and 'answer' fields"""
        with open(dataset_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                if not line.strip():
                    continue
                data = json.loads(line)
                assert 'question' in data, f"Line {i} missing 'question' field"
                assert 'answer' in data, f"Line {i} missing 'answer' field"
    
    def test_all_python_code_syntactically_valid(self, dataset_path):
        """Test that all Python code in answers is syntactically valid"""
        import ast
        
        with open(dataset_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                if not line.strip():
                    continue
                data = json.loads(line)
                code = data.get('answer', '')
                try:
                    ast.parse(code)
                except SyntaxError as e:
                    pytest.fail(f"Line {i} has invalid Python syntax: {e}")
    
    def test_questions_are_in_swedish(self, dataset_path):
        """Test that questions contain Swedish-looking text"""
        swedish_indicators = ['ä', 'ö', 'å', 'en', 'ett', 'som', 'skriv', 'skapa', 'för']
        
        with open(dataset_path, 'r', encoding='utf-8') as f:
            swedish_count = 0
            total = 0
            for line in f:
                if not line.strip():
                    continue
                data = json.loads(line)
                question = data.get('question', '').lower()
                total += 1
                if any(ind in question for ind in swedish_indicators):
                    swedish_count += 1
        
        # At least 80% should look Swedish
        assert swedish_count / total >= 0.8, "Most questions should be in Swedish"
    
    def test_no_trailing_comma_in_json(self, dataset_path):
        """Test that there are no trailing commas in JSON entries"""
        with open(dataset_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # JSONL should not have any lines that end with comma before closing brace
        lines = content.strip().split('\n')
        for i, line in enumerate(lines, 1):
            if line.strip():
                # Check for trailing comma before closing brace
                assert not line.strip().endswith(',}'), f"Line {i} has trailing comma"


class TestPydanticModels:
    """Test that Pydantic models are properly defined (check server.py content)"""
    
    @pytest.fixture
    def server_content(self):
        """Load server.py content"""
        server_path = Path(__file__).parent.parent / 'ml_service' / 'server.py'
        with open(server_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def test_python_code_request_model_exists(self, server_content):
        """Test that PythonCodeRequest model is defined"""
        assert 'class PythonCodeRequest(BaseModel)' in server_content
    
    def test_python_code_response_model_exists(self, server_content):
        """Test that PythonCodeResponse model is defined"""
        assert 'class PythonCodeResponse(BaseModel)' in server_content
    
    def test_python_code_endpoint_exists(self, server_content):
        """Test that /code/python endpoint is defined"""
        assert '@app.post("/code/python"' in server_content
    
    def test_endpoint_uses_pydantic_request(self, server_content):
        """Test that endpoint uses PythonCodeRequest"""
        # Should have the function signature with PythonCodeRequest parameter
        assert 'async def generate_python_code(req: PythonCodeRequest)' in server_content
    
    def test_endpoint_returns_correct_response_model(self, server_content):
        """Test that endpoint returns PythonCodeResponse"""
        assert 'response_model=PythonCodeResponse' in server_content


class TestIntentKeywordMatching:
    """Test that Python-related questions would match the python_kod intent"""
    
    @pytest.fixture
    def keywords(self):
        """Load keywords from python_kod intent"""
        config_file = Path(__file__).parent.parent / 'ml_service' / 'intent_rules.json'
        with open(config_file, 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return [kw.lower() for kw in rules['intents']['python_kod']['keywords']]
    
    def test_python_question_matches(self, keywords):
        """Test that 'Skriv Python-kod' matches keywords"""
        question = "Skriv Python-kod för att sortera en lista".lower()
        assert any(kw in question for kw in keywords)
    
    def test_code_question_matches(self, keywords):
        """Test that 'Hjälp med kod' matches keywords"""
        question = "Hjälp med kod för att läsa en fil".lower()
        assert any(kw in question for kw in keywords)
    
    def test_function_question_matches(self, keywords):
        """Test that 'funktion' matches keywords"""
        question = "Skapa en funktion som beräknar fakultet".lower()
        assert any(kw in question for kw in keywords)
    
    def test_loop_question_matches(self, keywords):
        """Test that 'loop' matches keywords"""
        question = "Hur skriver man en loop i Python".lower()
        assert any(kw in question for kw in keywords)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
