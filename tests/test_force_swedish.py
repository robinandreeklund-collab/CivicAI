"""
Tests for Force-Svenska (Force-Swedish) API
Tests the dashboard-controlled Swedish language trigger system

Note: Most tests require torch to be installed since they import from server.py.
In CI environments without GPU/torch, those tests will be skipped.
The TestForceSvenskaConfigFileNoTorch class runs without torch dependencies.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import json
import tempfile
import shutil

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))

# Check if torch is available
torch_available = False
try:
    import torch
    torch_available = True
except ImportError:
    pass

# Create a skip marker for tests that require torch
requires_torch = pytest.mark.skipif(not torch_available, reason="torch not installed")


@requires_torch
class TestForceSvenskaLoading:
    """Test Force-Svenska configuration loading"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_load_force_swedish_from_file(self, temp_config_dir):
        """Test loading triggers from config file"""
        from server import load_force_swedish, FORCE_SVENSKA_FILE
        
        # Create a test config file
        test_file = temp_config_dir / "force_swedish.json"
        test_triggers = ["hej", "tjena", "läget"]
        test_file.write_text(json.dumps({"triggers": test_triggers}), encoding="utf-8")
        
        with patch('server.FORCE_SVENSKA_FILE', test_file):
            result = load_force_swedish()
            assert result == test_triggers
    
    def test_load_force_swedish_default_when_missing(self, temp_config_dir):
        """Test that default triggers are returned when file is missing"""
        from server import load_force_swedish
        
        # Point to non-existent file
        missing_file = temp_config_dir / "missing.json"
        
        with patch('server.FORCE_SVENSKA_FILE', missing_file):
            result = load_force_swedish()
            # Should return default triggers
            assert isinstance(result, list)
            assert len(result) > 0
            assert "hej" in result
    
    def test_load_force_swedish_handles_invalid_json(self, temp_config_dir):
        """Test that invalid JSON falls back to defaults"""
        from server import load_force_swedish
        
        test_file = temp_config_dir / "invalid.json"
        test_file.write_text("{ invalid json }", encoding="utf-8")
        
        with patch('server.FORCE_SVENSKA_FILE', test_file):
            result = load_force_swedish()
            # Should return default triggers
            assert isinstance(result, list)
            assert len(result) > 0
    
    def test_load_force_swedish_handles_missing_triggers_key(self, temp_config_dir):
        """Test that missing 'triggers' key falls back to defaults"""
        from server import load_force_swedish
        
        test_file = temp_config_dir / "no_triggers.json"
        test_file.write_text(json.dumps({"other": "data"}), encoding="utf-8")
        
        with patch('server.FORCE_SVENSKA_FILE', test_file):
            result = load_force_swedish()
            # Should return default triggers
            assert isinstance(result, list)
            assert len(result) > 0
    
    def test_load_force_swedish_normalizes_triggers(self, temp_config_dir):
        """Test that triggers are normalized (lowercase, stripped)"""
        from server import load_force_swedish
        
        test_file = temp_config_dir / "mixed_case.json"
        test_triggers = ["  HEJ  ", "Tjena", "LÄGET"]
        test_file.write_text(json.dumps({"triggers": test_triggers}), encoding="utf-8")
        
        with patch('server.FORCE_SVENSKA_FILE', test_file):
            result = load_force_swedish()
            assert "hej" in result
            assert "tjena" in result
            assert "läget" in result


@requires_torch
class TestForceSvenskaDetection:
    """Test Force-Svenska trigger detection"""
    
    def test_check_force_svenska_detects_trigger(self):
        """Test that trigger words are detected"""
        from server import check_force_svenska, FORCE_SVENSKA_TRIGGERS
        
        # Ensure we have some triggers loaded
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej", "vad", "vem"]):
            assert check_force_svenska("Hej, hur mår du?") == True
            assert check_force_svenska("vad heter du?") == True
            assert check_force_svenska("VEM ÄR DU?") == True
    
    def test_check_force_svenska_no_trigger(self):
        """Test that non-trigger messages return False"""
        from server import check_force_svenska
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej", "vad", "vem"]):
            assert check_force_svenska("Hello, how are you?") == False
            assert check_force_svenska("What is your name?") == False
    
    def test_check_force_svenska_case_insensitive(self):
        """Test that detection is case-insensitive"""
        from server import check_force_svenska
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej"]):
            assert check_force_svenska("HEJ") == True
            assert check_force_svenska("Hej") == True
            assert check_force_svenska("hej") == True
    
    def test_check_force_svenska_empty_triggers(self):
        """Test behavior with empty trigger list"""
        from server import check_force_svenska
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', []):
            assert check_force_svenska("hej") == False
            assert check_force_svenska("anything") == False
    
    def test_check_force_svenska_multi_word_triggers(self):
        """Test detection of multi-word triggers"""
        from server import check_force_svenska
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["kan du", "vad gör du"]):
            assert check_force_svenska("Kan du hjälpa mig?") == True
            assert check_force_svenska("vad gör du nu?") == True
            assert check_force_svenska("kan jag hjälpa?") == False


@requires_torch
class TestIsSwedishLangDetect:
    """Test Swedish language detection using langdetect"""
    
    def test_is_swedish_detects_swedish_text(self):
        """Test that Swedish sentences are detected"""
        from server import is_swedish, LANGDETECT_AVAILABLE
        
        # Only test if langdetect is available
        if LANGDETECT_AVAILABLE:
            # Longer Swedish sentences should be detected accurately
            assert is_swedish("Hej, hur mår du idag?") == True
            assert is_swedish("Vad gör du just nu?") == True
            assert is_swedish("Jag tycker om att läsa böcker") == True
    
    def test_is_swedish_rejects_english_text(self):
        """Test that English sentences are not detected as Swedish"""
        from server import is_swedish, LANGDETECT_AVAILABLE
        
        if LANGDETECT_AVAILABLE:
            assert is_swedish("Hello, how are you today?") == False
            assert is_swedish("What is the weather like?") == False
            assert is_swedish("I like to read books") == False
    
    def test_is_swedish_fallback_for_short_text(self):
        """Test that fallback works for very short texts"""
        from server import is_swedish
        
        # Short texts may fail langdetect but fallback to triggers
        assert is_swedish("hej") == True
        assert is_swedish("tack") == True
        assert is_swedish("vad") == True
    
    def test_is_swedish_handles_empty_input(self):
        """Test that empty input returns False"""
        from server import is_swedish
        
        assert is_swedish("") == False
        assert is_swedish("   ") == False


@requires_torch
class TestForceSvenskaApply:
    """Test applying Force-Svenska to messages"""
    
    def test_apply_force_svenska_adds_instruction(self):
        """Test that Swedish instruction is prepended when trigger detected"""
        from server import apply_force_svenska
        
        messages = [{"role": "user", "content": "Hej, vad gör du?"}]
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej"]):
            result = apply_force_svenska(messages)
            assert len(result) == 2
            assert result[0]["role"] == "system"
            assert "svenska" in result[0]["content"].lower()
    
    def test_apply_force_svenska_no_instruction_without_trigger(self):
        """Test that no instruction is added without trigger"""
        from server import apply_force_svenska
        
        messages = [{"role": "user", "content": "Hello there"}]
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej"]):
            result = apply_force_svenska(messages)
            assert len(result) == 1
            assert result == messages
    
    def test_apply_force_svenska_empty_messages(self):
        """Test handling of empty message list"""
        from server import apply_force_svenska
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej"]):
            result = apply_force_svenska([])
            assert result == []
    
    def test_apply_force_svenska_preserves_original_messages(self):
        """Test that original messages are preserved"""
        from server import apply_force_svenska
        
        messages = [
            {"role": "system", "content": "You are helpful"},
            {"role": "user", "content": "Hej!"}
        ]
        
        with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej"]):
            result = apply_force_svenska(messages)
            # Original messages should still be there
            assert messages[0] in result
            assert messages[1] in result


@requires_torch
class TestForceSvenskaEndpoints:
    """Test FastAPI endpoints for Force-Svenska"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from server import app
        from fastapi.testclient import TestClient
        return TestClient(app)
    
    @pytest.fixture
    def temp_config_file(self):
        """Create a temporary config file for testing"""
        temp_dir = tempfile.mkdtemp()
        temp_file = Path(temp_dir) / "force_swedish.json"
        temp_file.write_text(json.dumps({"triggers": ["hej", "vad"]}), encoding="utf-8")
        yield temp_file
        shutil.rmtree(temp_dir)
    
    def test_get_force_swedish_endpoint(self, client, temp_config_file):
        """Test GET /api/force-swedish"""
        with patch('server.FORCE_SVENSKA_FILE', temp_config_file):
            with patch('server.FORCE_SVENSKA_TRIGGERS', ["hej", "vad"]):
                response = client.get("/api/force-swedish")
                assert response.status_code == 200
                data = response.json()
                assert "triggers" in data
                assert "count" in data
                assert data["count"] == 2
    
    def test_post_force_swedish_endpoint(self, client, temp_config_file):
        """Test POST /api/force-swedish with comma-separated string"""
        with patch('server.FORCE_SVENSKA_FILE', temp_config_file):
            response = client.post(
                "/api/force-swedish",
                json={"triggers": "hej, tjena, läget"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "saved"
            assert data["count"] == 3
            assert "hej" in data["triggers"]
            assert "tjena" in data["triggers"]
            assert "läget" in data["triggers"]
    
    def test_post_force_swedish_with_list(self, client, temp_config_file):
        """Test POST /api/force-swedish with list input"""
        with patch('server.FORCE_SVENSKA_FILE', temp_config_file):
            response = client.post(
                "/api/force-swedish",
                json={"triggers": ["hej", "tjena", "läget"]}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 3
    
    def test_post_force_swedish_empty(self, client, temp_config_file):
        """Test POST /api/force-swedish with empty triggers"""
        with patch('server.FORCE_SVENSKA_FILE', temp_config_file):
            response = client.post(
                "/api/force-swedish",
                json={"triggers": ""}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["count"] == 0
            assert data["triggers"] == []
    
    def test_post_force_swedish_normalizes(self, client, temp_config_file):
        """Test that POST normalizes triggers (lowercase, stripped)"""
        with patch('server.FORCE_SVENSKA_FILE', temp_config_file):
            response = client.post(
                "/api/force-swedish",
                json={"triggers": "  HEJ  , TJENA  ,  Läget  "}
            )
            assert response.status_code == 200
            data = response.json()
            assert "hej" in data["triggers"]
            assert "tjena" in data["triggers"]
            assert "läget" in data["triggers"]


@requires_torch
class TestForceSvenskaConfigFile:
    """Test the config file location and default content"""
    
    def test_default_config_file_exists(self):
        """Test that the default config file is created in the right location"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        assert config_file.exists(), f"Default config file should exist at {config_file}"
    
    def test_default_config_file_valid_json(self):
        """Test that the default config file contains valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        if config_file.exists():
            content = config_file.read_text(encoding="utf-8")
            data = json.loads(content)
            assert "triggers" in data
            assert isinstance(data["triggers"], list)
    
    def test_default_config_file_has_triggers(self):
        """Test that the default config file has some triggers"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        if config_file.exists():
            content = config_file.read_text(encoding="utf-8")
            data = json.loads(content)
            assert len(data["triggers"]) > 0


# Tests that don't require torch - these will run in CI
class TestForceSvenskaConfigFileNoTorch:
    """Test config file existence and content without importing server.py"""
    
    def test_config_file_exists(self):
        """Test that the config file exists"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        assert config_file.exists(), f"Config file should exist at {config_file}"
    
    def test_config_file_valid_json(self):
        """Test that the config file is valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data, dict)
    
    def test_config_file_has_triggers_key(self):
        """Test that the config file has a 'triggers' key"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "triggers" in data
    
    def test_config_file_triggers_is_list(self):
        """Test that triggers is a list"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data["triggers"], list)
    
    def test_config_file_has_default_triggers(self):
        """Test that the config file contains some default triggers"""
        config_file = Path(__file__).parent.parent / "config" / "force_swedish.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert len(data["triggers"]) > 0
        # Check for some expected default triggers
        assert "hej" in data["triggers"]
        assert "vad" in data["triggers"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
