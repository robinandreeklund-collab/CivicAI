"""
Tests for Swedish Open Data APIs feature
Tests the dashboard-controlled public data sources functionality

Note: Most tests require torch to be installed since they import from server.py.
In CI environments without GPU/torch, those tests will be skipped.
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
class TestOpenDataApisLoading:
    """Test Open Data APIs configuration loading"""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    def test_load_open_data_apis_from_file(self, temp_config_dir):
        """Test loading APIs from config file"""
        from server import load_open_data_apis, OPEN_DATA_CONFIG_FILE
        
        test_file = temp_config_dir / "open_data_apis.json"
        test_apis = {
            "apis": [
                {
                    "id": "test_api",
                    "name": "Test API",
                    "enabled": True,
                    "triggers": ["test", "example"]
                }
            ]
        }
        test_file.write_text(json.dumps(test_apis), encoding="utf-8")
        
        with patch('server.OPEN_DATA_CONFIG_FILE', test_file):
            result = load_open_data_apis()
            assert len(result) == 1
            assert result[0]["id"] == "test_api"
    
    def test_load_open_data_apis_default_when_missing(self, temp_config_dir):
        """Test that default APIs are returned when file is missing"""
        from server import load_open_data_apis
        
        missing_file = temp_config_dir / "missing.json"
        
        with patch('server.OPEN_DATA_CONFIG_FILE', missing_file):
            result = load_open_data_apis()
            assert isinstance(result, list)
            assert len(result) > 0


@requires_torch
class TestOpenDataTriggerDetection:
    """Test Open Data API trigger detection"""
    
    def test_check_open_data_trigger_detects_api(self):
        """Test that API triggers are detected"""
        from server import check_open_data_trigger
        
        test_apis = [
            {"id": "scb", "name": "SCB", "enabled": True, "triggers": ["befolkning", "statistik"]},
            {"id": "riksdagen", "name": "Riksdagen", "enabled": True, "triggers": ["votering"]}
        ]
        
        with patch('server.OPEN_DATA_APIS', test_apis):
            result = check_open_data_trigger("Hur stor är befolkningen i Stockholm?")
            assert result is not None
            assert result["id"] == "scb"
    
    def test_check_open_data_trigger_respects_enabled(self):
        """Test that disabled APIs are not triggered"""
        from server import check_open_data_trigger
        
        test_apis = [
            {"id": "scb", "name": "SCB", "enabled": False, "triggers": ["befolkning"]}
        ]
        
        with patch('server.OPEN_DATA_APIS', test_apis):
            result = check_open_data_trigger("Hur stor är befolkningen?")
            assert result is None
    
    def test_check_open_data_trigger_returns_none_for_no_match(self):
        """Test that None is returned when no triggers match"""
        from server import check_open_data_trigger
        
        test_apis = [
            {"id": "scb", "name": "SCB", "enabled": True, "triggers": ["befolkning"]}
        ]
        
        with patch('server.OPEN_DATA_APIS', test_apis):
            result = check_open_data_trigger("Vad är klockan?")
            assert result is None


@requires_torch
class TestFetchOpenData:
    """Test Open Data fetching functions"""
    
    def test_fetch_open_data_returns_fallback_on_error(self):
        """Test that fallback message is returned on API error"""
        from server import fetch_open_data
        
        api = {
            "id": "unknown_api",
            "name": "Unknown",
            "fallback_message": "Test fallback message"
        }
        
        result = fetch_open_data(api, "test query")
        assert result == "Test fallback message"
    
    def test_fetch_trafikverket_returns_info(self):
        """Test that trafikverket returns helpful info"""
        from server import fetch_trafikverket_data
        
        result = fetch_trafikverket_data("E4 trafik")
        assert result is not None
        assert "trafik" in result.lower() or "trafikverket" in result.lower()


# Tests that don't require torch - these will run in CI
class TestOpenDataConfigFileNoTorch:
    """Test config file existence and content without importing server.py"""
    
    def test_config_file_exists(self):
        """Test that the config file exists"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        assert config_file.exists(), f"Config file should exist at {config_file}"
    
    def test_config_file_valid_json(self):
        """Test that the config file is valid JSON"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert isinstance(data, dict)
    
    def test_config_file_has_apis_key(self):
        """Test that the config file has an 'apis' key"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        assert "apis" in data
        assert isinstance(data["apis"], list)
    
    def test_config_file_has_required_apis(self):
        """Test that the config file contains required APIs"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        
        api_ids = [api["id"] for api in data["apis"]]
        # Check for some expected APIs
        assert "scb" in api_ids
        assert "krisinformation" in api_ids
        assert "riksdagen" in api_ids
    
    def test_config_file_apis_have_required_fields(self):
        """Test that each API has required fields"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        
        required_fields = ["id", "name", "triggers", "enabled"]
        for api in data["apis"]:
            for field in required_fields:
                assert field in api, f"API {api.get('id', 'unknown')} missing field: {field}"
    
    def test_config_file_apis_have_triggers(self):
        """Test that each API has at least one trigger"""
        config_file = Path(__file__).parent.parent / "config" / "open_data_apis.json"
        content = config_file.read_text(encoding="utf-8")
        data = json.loads(content)
        
        for api in data["apis"]:
            triggers = api.get("triggers", [])
            assert len(triggers) > 0, f"API {api.get('id', 'unknown')} has no triggers"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
