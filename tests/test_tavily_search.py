"""
Tests for Tavily Web Search API
Tests the dashboard-controlled real-time search trigger system

Note: Most tests require torch to be installed since they import from server.py.
In CI environments without GPU/torch, those tests will be skipped.
The TestTavilyConfigFileNoTorch class runs without torch dependencies.
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
class TestTavilyConfigLoading:
    """Test Tavily configuration loading"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_load_tavily_config_from_file(self, temp_config_dir):
        """Test loading triggers and blacklist from config file"""
        from server import load_tavily_config, TAVILY_CONFIG_FILE
        
        # Create a test config file
        test_file = temp_config_dir / "tavily_triggers.json"
        test_data = {
            "triggers": ["vad säger", "aktuell", "senaste"],
            "blacklist": ["vem är du", "vad heter du"]
        }
        test_file.write_text(json.dumps(test_data), encoding="utf-8")
        
        with patch('server.TAVILY_CONFIG_FILE', test_file):
            triggers, blacklist = load_tavily_config()
            assert triggers == ["vad säger", "aktuell", "senaste"]
            assert blacklist == ["vem är du", "vad heter du"]
    
    def test_load_tavily_config_default_when_missing(self, temp_config_dir):
        """Test that default config is returned when file is missing"""
        from server import load_tavily_config
        
        # Point to non-existent file
        missing_file = temp_config_dir / "missing.json"
        
        with patch('server.TAVILY_CONFIG_FILE', missing_file):
            triggers, blacklist = load_tavily_config()
            # Should return default triggers and blacklist
            assert isinstance(triggers, list)
            assert isinstance(blacklist, list)
            assert len(triggers) > 0
            assert len(blacklist) > 0
    
    def test_load_tavily_config_normalizes_triggers(self, temp_config_dir):
        """Test that triggers are normalized (lowercase, stripped)"""
        from server import load_tavily_config
        
        test_file = temp_config_dir / "mixed_case.json"
        test_data = {
            "triggers": ["  VAD SÄGER  ", "Aktuell", "SENASTE"],
            "blacklist": ["  VEM ÄR DU  "]
        }
        test_file.write_text(json.dumps(test_data), encoding="utf-8")
        
        with patch('server.TAVILY_CONFIG_FILE', test_file):
            triggers, blacklist = load_tavily_config()
            assert "vad säger" in triggers
            assert "aktuell" in triggers
            assert "vem är du" in blacklist


@requires_torch
class TestTavilyTriggerDetection:
    """Test Tavily trigger detection"""
    
    def test_check_tavily_trigger_detects_trigger(self):
        """Test that trigger words activate search"""
        from server import check_tavily_trigger
        
        with patch('server.TAVILY_TRIGGERS', ["vad säger", "aktuell", "senaste"]):
            with patch('server.TAVILY_BLACKLIST', ["vem är du"]):
                assert check_tavily_trigger("Vad säger den nya lagen?") == True
                assert check_tavily_trigger("Vad är aktuellt idag?") == True
    
    def test_check_tavily_trigger_blacklist_blocks(self):
        """Test that blacklist prevents search"""
        from server import check_tavily_trigger
        
        with patch('server.TAVILY_TRIGGERS', ["vad"]):
            with patch('server.TAVILY_BLACKLIST', ["vem är du", "vad heter du"]):
                # "vad" triggers, but "vem är du" blacklists
                assert check_tavily_trigger("Vem är du?") == False
                assert check_tavily_trigger("Vad heter du?") == False
                # This should trigger (has "vad" but not blacklisted)
                assert check_tavily_trigger("Vad är väderprognosen?") == True
    
    def test_check_tavily_trigger_case_insensitive(self):
        """Test that detection is case-insensitive"""
        from server import check_tavily_trigger
        
        with patch('server.TAVILY_TRIGGERS', ["senaste"]):
            with patch('server.TAVILY_BLACKLIST', []):
                assert check_tavily_trigger("SENASTE nyheterna") == True
                assert check_tavily_trigger("Senaste nyheterna") == True
                assert check_tavily_trigger("senaste nyheterna") == True


@requires_torch
class TestWeatherTriggerDetection:
    """Test weather trigger detection"""
    
    def test_check_weather_trigger_detects_weather(self):
        """Test that weather keywords are detected"""
        from server import check_weather_trigger
        
        assert check_weather_trigger("Hur blir vädret imorgon?") == True
        assert check_weather_trigger("Regnar det idag?") == True
        assert check_weather_trigger("Vad är temperaturen?") == True
        assert check_weather_trigger("Hur många grader är det?") == True
    
    def test_check_weather_trigger_no_match(self):
        """Test that non-weather questions return False"""
        from server import check_weather_trigger
        
        assert check_weather_trigger("Vem är du?") == False
        assert check_weather_trigger("Vad är klockan?") == False
        assert check_weather_trigger("Berätta om Sverige") == False


@requires_torch
class TestTimeContextInjection:
    """Test time and date context injection"""
    
    def test_inject_time_context_format(self):
        """Test that time context has correct format"""
        from server import inject_time_context
        
        result = inject_time_context()
        
        # Should contain key elements
        assert "Idag är det" in result
        assert "Klockan är" in result
        assert "(svensk tid)" in result
        
        # Should have year
        assert "202" in result  # Year 2020s
    
    def test_inject_time_context_returns_string(self):
        """Test that time context returns a non-empty string"""
        from server import inject_time_context
        
        result = inject_time_context()
        assert isinstance(result, str)
        assert len(result) > 20  # Should be a reasonable length


@requires_torch
class TestTavilyEndpoints:
    """Test FastAPI endpoints for Tavily triggers"""
    
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
        temp_file = Path(temp_dir) / "tavily_triggers.json"
        temp_file.write_text(json.dumps({
            "triggers": ["vad säger", "aktuell"],
            "blacklist": ["vem är du"]
        }), encoding="utf-8")
        yield temp_file
        shutil.rmtree(temp_dir)
    
    def test_get_tavily_triggers_endpoint(self, client, temp_config_file):
        """Test GET /api/tavily-triggers"""
        with patch('server.TAVILY_CONFIG_FILE', temp_config_file):
            with patch('server.TAVILY_TRIGGERS', ["vad säger", "aktuell"]):
                with patch('server.TAVILY_BLACKLIST', ["vem är du"]):
                    response = client.get("/api/tavily-triggers")
                    assert response.status_code == 200
                    data = response.json()
                    assert "triggers" in data
                    assert "blacklist" in data
                    assert "trigger_count" in data
                    assert "blacklist_count" in data
    
    def test_post_tavily_triggers_endpoint(self, client, temp_config_file):
        """Test POST /api/tavily-triggers"""
        with patch('server.TAVILY_CONFIG_FILE', temp_config_file):
            response = client.post(
                "/api/tavily-triggers",
                json={
                    "triggers": "senaste, aktuell, ny lag",
                    "blacklist": "vem är du, vad heter du"
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "saved"
            assert data["trigger_count"] == 3
            assert data["blacklist_count"] == 2


@requires_torch
class TestFormatTavilySources:
    """Test Tavily source formatting"""
    
    def test_format_tavily_sources_with_results(self):
        """Test formatting sources from Tavily results"""
        from server import format_tavily_sources
        
        mock_data = {
            "results": [
                {"title": "Test Article 1", "url": "https://example.com/1"},
                {"title": "Test Article 2", "url": "https://example.com/2"}
            ]
        }
        
        result = format_tavily_sources(mock_data)
        
        assert "Källor:" in result
        assert "Test Article 1" in result
        assert "Test Article 2" in result
    
    def test_format_tavily_sources_empty(self):
        """Test formatting with no results"""
        from server import format_tavily_sources
        
        assert format_tavily_sources(None) == ""
        assert format_tavily_sources({}) == ""
        assert format_tavily_sources({"results": []}) == ""
    
    def test_format_tavily_sources_truncates_long_titles(self):
        """Test that long titles are truncated"""
        from server import format_tavily_sources
        
        mock_data = {
            "results": [
                {
                    "title": "This is a very long title that should be truncated because it exceeds seventy characters in total length",
                    "url": "https://example.com/long"
                }
            ]
        }
        
        result = format_tavily_sources(mock_data)
        # Should be truncated to 70 chars
        assert len(result.split("\n")[1].split("]")[0]) <= 100


# Tests that don't require torch - these will run in CI
class TestTavilyConfigFileNoTorch:
    """Test config file existence and content without importing server.py"""
    
    def test_config_file_exists(self):
        """Test that the config file exists"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        assert config_file.exists(), f"Config file should exist at {config_file}"
    
    def test_config_file_valid_json(self):
        """Test that the config file is valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data, dict)
    
    def test_config_file_has_triggers_key(self):
        """Test that the config file has a 'triggers' key"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "triggers" in data
    
    def test_config_file_has_blacklist_key(self):
        """Test that the config file has a 'blacklist' key"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "blacklist" in data
    
    def test_config_file_triggers_is_list(self):
        """Test that triggers is a list"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data["triggers"], list)
        assert isinstance(data["blacklist"], list)
    
    def test_config_file_has_default_triggers(self):
        """Test that the config file contains some default triggers"""
        config_file = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert len(data["triggers"]) > 0
        assert len(data["blacklist"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
