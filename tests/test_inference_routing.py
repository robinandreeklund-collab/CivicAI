"""
Tests for ML Inference Service Routing
Tests the inference service routing logic, rate limiting, and fallback behavior
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import os

# Add ml_service to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'ml_service'))


class TestModelsBaseDir:
    """Test MODELS_DIR environment variable support"""
    
    @patch.dict(os.environ, {'MODELS_DIR': '/custom/models'})
    @patch('pathlib.Path.exists')
    def test_models_dir_from_env(self, mock_exists):
        """Test that MODELS_DIR environment variable is respected"""
        mock_exists.return_value = True
        
        # Import after patching environment
        from server import get_models_base_dir
        
        result = get_models_base_dir()
        assert '/custom/models' in str(result)
    
    @patch.dict(os.environ, {}, clear=True)
    def test_models_dir_default(self):
        """Test default models directory when no env var set"""
        from server import get_models_base_dir
        
        result = get_models_base_dir()
        assert 'models' in str(result)
    
    @patch.dict(os.environ, {'PRODUCTION_MODELS_PATH': '/app/models'})
    @patch('pathlib.Path.exists')
    def test_legacy_production_models_path(self, mock_exists):
        """Test legacy PRODUCTION_MODELS_PATH still works"""
        mock_exists.return_value = True
        
        from server import get_models_base_dir
        
        result = get_models_base_dir()
        assert '/app/models' in str(result)


class TestModelRoutingPriority:
    """Test DNA v2 certified model routing priority"""
    
    @patch.dict(os.environ, {'ONESEEK_MODEL_PATH': '/override/model'})
    @patch('pathlib.Path.exists')
    def test_env_override_priority(self, mock_exists):
        """Test ONESEEK_MODEL_PATH takes highest priority"""
        mock_exists.return_value = True
        
        from server import get_active_model_path
        
        result = get_active_model_path()
        assert '/override/model' in str(result)
    
    @patch.dict(os.environ, {}, clear=True)
    @patch('pathlib.Path.exists')
    @patch('pathlib.Path.is_symlink')
    @patch('pathlib.Path.resolve')
    def test_certified_model_priority(self, mock_resolve, mock_is_symlink, mock_exists):
        """Test DNA v2 certified model is prioritized over legacy"""
        # Setup mocks
        mock_exists.return_value = True
        mock_is_symlink.return_value = True
        mock_resolve.return_value = Path('/models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.ds.hash1.hash2')
        
        from server import get_active_model_path
        
        result = get_active_model_path()
        # Should contain certified path
        assert 'oneseek-certified' in str(result) or 'OneSeek-7B-Zero.v' in str(result)


class TestInferenceRequestValidation:
    """Test Pydantic validation for inference requests"""
    
    def test_valid_request(self):
        """Test valid inference request"""
        from server import InferenceRequest
        
        request = InferenceRequest(
            text="Test input",
            max_length=512,
            temperature=0.7,
            top_p=0.9
        )
        
        assert request.text == "Test input"
        assert request.max_length == 512
        assert request.temperature == 0.7
        assert request.top_p == 0.9
    
    def test_empty_text_validation(self):
        """Test that empty text is rejected"""
        from server import InferenceRequest
        from pydantic import ValidationError as PydanticValidationError
        
        with pytest.raises((PydanticValidationError, ValueError)):
            InferenceRequest(text="")
    
    def test_text_length_validation(self):
        """Test text length limits"""
        from server import InferenceRequest
        from pydantic import ValidationError as PydanticValidationError
        
        # Too long
        with pytest.raises(PydanticValidationError):
            InferenceRequest(text="a" * 10001)
    
    def test_parameter_ranges(self):
        """Test parameter range validation"""
        from server import InferenceRequest
        from pydantic import ValidationError as PydanticValidationError
        
        # Valid ranges
        request = InferenceRequest(
            text="test",
            max_length=1,
            temperature=0.0,
            top_p=0.0
        )
        assert request.max_length == 1
        
        # Invalid max_length (too high)
        with pytest.raises(PydanticValidationError):
            InferenceRequest(text="test", max_length=3000)
        
        # Invalid temperature (too high)
        with pytest.raises(PydanticValidationError):
            InferenceRequest(text="test", temperature=3.0)
    
    def test_text_sanitization(self):
        """Test that text is sanitized (null bytes removed)"""
        from server import InferenceRequest
        
        request = InferenceRequest(text="test\x00with\x00nulls")
        assert '\x00' not in request.text
        # Text should have null bytes removed
        assert request.text == "testwithnulls"


class TestRateLimiting:
    """Test rate limiting configuration"""
    
    def test_limiter_configured(self):
        """Test that rate limiter is properly configured"""
        from server import limiter
        
        assert limiter is not None
        # Limiter should have key_func set
        assert limiter.key_func is not None


class TestLegacyEndpointDeprecation:
    """Test that legacy endpoints return proper deprecation responses"""
    
    @pytest.mark.asyncio
    async def test_legacy_endpoint_returns_410(self):
        """Test /infer-legacy returns HTTP 410"""
        from server import app, InferenceRequest
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        response = client.post(
            "/infer-legacy",
            json={"text": "test"}
        )
        
        # Check status code
        assert response.status_code == 410
        
        # Check response structure
        data = response.json()
        assert "error" in data or "detail" in data
        assert "migration_guide" in data or "new_endpoint" in data


class TestServiceEndpoints:
    """Test service information endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns service info"""
        from server import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert "endpoints" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
