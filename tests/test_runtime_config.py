"""
Tests for Runtime Configuration Module
Tests local/RunPod environment switching configuration.
"""

import json
import os
import pytest
from pathlib import Path
import tempfile
import shutil


class TestRuntimeConfig:
    """Tests for runtime configuration module."""
    
    @pytest.fixture
    def temp_config_dir(self):
        """Create a temporary config directory for testing."""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def config_manager(self, temp_config_dir):
        """Create a config manager with temporary storage."""
        # Import here to avoid issues
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from config.runtime_config import ConfigManager
        
        config_file = temp_config_dir / "runtime_settings.json"
        return ConfigManager(config_file)
    
    def test_default_config_is_local(self, config_manager):
        """Test that default configuration is local mode."""
        config = config_manager.get_config()
        assert config.mode == "local"
        assert config.runpod_api_key is None
        assert config.runpod_endpoint_url is None
    
    def test_set_mode_local(self, config_manager):
        """Test setting mode to local."""
        success, error = config_manager.set_mode("local")
        assert success is True
        assert error is None
        
        config = config_manager.get_config()
        assert config.mode == "local"
    
    def test_set_mode_runpod(self, config_manager):
        """Test setting mode to runpod without credentials fails."""
        # First set credentials
        success, error = config_manager.set_runpod_credentials(
            "test_api_key",
            "https://api.runpod.ai/v2/test"
        )
        assert success is True
        
        # Now can set mode to runpod
        success, error = config_manager.set_mode("runpod")
        assert success is True
        assert error is None
        
        config = config_manager.get_config()
        assert config.mode == "runpod"
    
    def test_set_mode_invalid(self, config_manager):
        """Test setting invalid mode fails."""
        success, error = config_manager.update_config(mode="invalid")
        assert success is False
        assert "Invalid mode" in error
    
    def test_set_runpod_credentials(self, config_manager):
        """Test setting RunPod credentials."""
        api_key = "test_api_key_12345"
        endpoint_url = "https://api.runpod.ai/v2/my-endpoint"
        
        success, error = config_manager.set_runpod_credentials(api_key, endpoint_url)
        assert success is True
        assert error is None
        
        config = config_manager.get_config()
        assert config.runpod_api_key == api_key
        assert config.runpod_endpoint_url == endpoint_url
    
    def test_validate_runpod_requires_api_key(self, config_manager):
        """Test that RunPod mode requires API key."""
        success, error = config_manager.update_config(
            mode="runpod",
            runpod_endpoint_url="https://api.runpod.ai/v2/test"
        )
        assert success is False
        assert "API key is required" in error
    
    def test_validate_runpod_requires_endpoint_url(self, config_manager):
        """Test that RunPod mode requires endpoint URL."""
        success, error = config_manager.update_config(
            mode="runpod",
            runpod_api_key="test_key"
        )
        assert success is False
        assert "endpoint URL is required" in error
    
    def test_validate_endpoint_url_format(self, config_manager):
        """Test that endpoint URL must start with http:// or https://."""
        success, error = config_manager.update_config(
            runpod_endpoint_url="invalid-url"
        )
        assert success is False
        assert "must start with http://" in error
    
    def test_config_persistence(self, config_manager, temp_config_dir):
        """Test that configuration persists to file."""
        # Set some values
        config_manager.set_runpod_credentials(
            "test_key",
            "https://api.runpod.ai/v2/test"
        )
        config_manager.set_mode("runpod")
        
        # Create new manager with same file
        from config.runtime_config import ConfigManager
        config_file = temp_config_dir / "runtime_settings.json"
        new_manager = ConfigManager(config_file)
        
        # Should load persisted values
        config = new_manager.get_config()
        assert config.mode == "runpod"
        assert config.runpod_api_key == "test_key"
        assert config.runpod_endpoint_url == "https://api.runpod.ai/v2/test"
    
    def test_display_info_masks_api_key(self, config_manager):
        """Test that display info masks sensitive API key."""
        config_manager.set_runpod_credentials(
            "very_secret_api_key_1234567890",
            "https://api.runpod.ai/v2/test"
        )
        
        display_info = config_manager.get_display_info()
        api_key = display_info.get("runpod_api_key", "")
        
        # Should be masked
        assert "very_secret" not in api_key
        assert "..." in api_key
    
    def test_is_runpod_mode(self, config_manager):
        """Test is_runpod_mode helper."""
        config_manager.set_mode("local")
        assert config_manager.is_runpod_mode() is False
        assert config_manager.is_local_mode() is True
        
        # Set credentials first
        config_manager.set_runpod_credentials(
            "test_key",
            "https://api.runpod.ai/v2/test"
        )
        
        config_manager.set_mode("runpod")
        assert config_manager.is_runpod_mode() is True
        assert config_manager.is_local_mode() is False
    
    def test_timeout_validation(self, config_manager):
        """Test that timeout must be positive."""
        success, error = config_manager.update_config(runpod_timeout=0)
        assert success is False
        assert "at least 1 second" in error
        
        success, error = config_manager.update_config(runpod_timeout=300)
        assert success is True
    
    def test_max_retries_validation(self, config_manager):
        """Test that max retries must be non-negative."""
        success, error = config_manager.update_config(runpod_max_retries=-1)
        assert success is False
        assert "non-negative" in error
        
        success, error = config_manager.update_config(runpod_max_retries=5)
        assert success is True


class TestRuntimeConfigFile:
    """Tests for runtime_settings.json configuration file."""
    
    def test_example_config_exists(self):
        """Test that example configuration file exists."""
        config_path = Path(__file__).parent.parent / "config" / "runtime_settings.json.example"
        assert config_path.exists(), "runtime_settings.json.example should exist"
    
    def test_example_config_valid_json(self):
        """Test that example config contains valid JSON."""
        config_path = Path(__file__).parent.parent / "config" / "runtime_settings.json.example"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        assert isinstance(data, dict), "Example config should be a JSON object"
    
    def test_example_config_has_required_fields(self):
        """Test that example config has all required fields."""
        config_path = Path(__file__).parent.parent / "config" / "runtime_settings.json.example"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        required_fields = ["mode", "runpod_api_key", "runpod_endpoint_url", "runpod_timeout", "runpod_max_retries"]
        for field in required_fields:
            assert field in data, f"Example config should have '{field}' field"
    
    def test_example_config_default_mode_is_local(self):
        """Test that example config defaults to local mode."""
        config_path = Path(__file__).parent.parent / "config" / "runtime_settings.json.example"
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        assert data["mode"] == "local", "Example config should default to local mode"


class TestGlobalHelpers:
    """Tests for global helper functions."""
    
    def test_get_config_manager_singleton(self):
        """Test that get_config_manager returns singleton instance."""
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from config.runtime_config import get_config_manager
        
        manager1 = get_config_manager()
        manager2 = get_config_manager()
        
        assert manager1 is manager2, "Should return same instance"
    
    def test_get_runtime_config(self):
        """Test get_runtime_config helper function."""
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from config.runtime_config import get_runtime_config
        
        config = get_runtime_config()
        assert config is not None
        assert hasattr(config, "mode")
    
    def test_is_local_mode_default(self):
        """Test that default mode is local."""
        import sys
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from config.runtime_config import is_local_mode, is_runpod_mode
        
        # Default should be local
        assert is_local_mode() is True
        assert is_runpod_mode() is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
