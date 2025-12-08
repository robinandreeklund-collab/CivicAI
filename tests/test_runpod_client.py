"""
Tests for RunPod API Client
Tests communication with RunPod endpoints (mocked).
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
import sys

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml_service.runpod_client import RunPodClient, RunPodResponse, create_runpod_client


class TestRunPodClient:
    """Tests for RunPod client."""
    
    def test_client_initialization(self):
        """Test client initialization with valid credentials."""
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test",
            timeout=300,
            max_retries=3
        )
        
        assert client.api_key == "test_key"
        assert client.endpoint_url == "https://api.runpod.ai/v2/test"
        assert client.timeout == 300
        assert client.max_retries == 3
    
    def test_client_initialization_requires_api_key(self):
        """Test that client requires API key."""
        with pytest.raises(ValueError, match="API key cannot be empty"):
            RunPodClient(
                api_key="",
                endpoint_url="https://api.runpod.ai/v2/test"
            )
    
    def test_client_initialization_requires_endpoint_url(self):
        """Test that client requires endpoint URL."""
        with pytest.raises(ValueError, match="Endpoint URL cannot be empty"):
            RunPodClient(
                api_key="test_key",
                endpoint_url=""
            )
    
    def test_get_headers(self):
        """Test that headers include authorization."""
        client = RunPodClient(
            api_key="test_key_123",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        headers = client._get_headers()
        
        assert "Authorization" in headers
        assert headers["Authorization"] == "Bearer test_key_123"
        assert headers["Content-Type"] == "application/json"
    
    @patch('ml_service.runpod_client.requests.request')
    def test_successful_inference(self, mock_request):
        """Test successful inference request."""
        # Mock successful response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "output": {
                "text": "This is a test response"
            }
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        result = client.inference(
            prompt="Test prompt",
            max_tokens=100,
            temperature=0.7
        )
        
        assert result.success is True
        assert result.data is not None
        assert "output" in result.data
        assert result.latency_ms is not None
    
    @patch('ml_service.runpod_client.requests.request')
    def test_failed_inference_http_error(self, mock_request):
        """Test inference with HTTP error."""
        # Mock HTTP error
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_response.raise_for_status.side_effect = Exception("HTTP Error")
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test",
            max_retries=0  # No retries for faster test
        )
        
        result = client.inference(prompt="Test")
        
        assert result.success is False
        assert result.error is not None
    
    @patch('ml_service.runpod_client.requests.request')
    def test_timeout_with_retry(self, mock_request):
        """Test timeout with retry logic."""
        import requests
        
        # First call times out, second succeeds
        mock_request.side_effect = [
            requests.exceptions.Timeout("Request timed out"),
            Mock(
                status_code=200,
                json=lambda: {"output": "success"},
                raise_for_status=Mock(),
                content=b'{"output": "success"}'
            )
        ]
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test",
            timeout=10,
            max_retries=1
        )
        
        result = client.inference(prompt="Test")
        
        # Should succeed on retry
        assert result.success is True
        assert mock_request.call_count == 2
    
    @patch('ml_service.runpod_client.requests.request')
    def test_submit_training_job(self, mock_request):
        """Test submitting training job."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "job_12345",
            "status": "queued"
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        result = client.submit_training_job(
            dataset_url="https://example.com/dataset.jsonl",
            model_name="mistralai/Mistral-7B-v0.1",
            epochs=3
        )
        
        assert result.success is True
        assert "id" in result.data
        assert result.data["id"] == "job_12345"
    
    @patch('ml_service.runpod_client.requests.request')
    def test_check_job_status(self, mock_request):
        """Test checking job status."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "completed",
            "progress": 100
        }
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        result = client.check_job_status("job_12345")
        
        assert result.success is True
        assert result.data["status"] == "completed"
    
    @patch('ml_service.runpod_client.requests.request')
    def test_health_check(self, mock_request):
        """Test health check endpoint."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "healthy"}
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        result = client.health_check()
        
        assert result.success is True
    
    @patch('ml_service.runpod_client.requests.request')
    def test_test_connection_success(self, mock_request):
        """Test connection test succeeds."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "ok"}
        mock_response.raise_for_status = Mock()
        mock_request.return_value = mock_response
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test"
        )
        
        is_connected, error = client.test_connection()
        
        assert is_connected is True
        assert error is None
    
    @patch('ml_service.runpod_client.requests.request')
    def test_test_connection_failure(self, mock_request):
        """Test connection test fails."""
        import requests
        mock_request.side_effect = requests.exceptions.ConnectionError("Connection failed")
        
        client = RunPodClient(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test",
            max_retries=0
        )
        
        is_connected, error = client.test_connection()
        
        assert is_connected is False
        assert error is not None


class TestRunPodResponse:
    """Tests for RunPodResponse dataclass."""
    
    def test_successful_response(self):
        """Test creating successful response."""
        response = RunPodResponse(
            success=True,
            data={"output": "test"},
            status_code=200,
            latency_ms=123.45
        )
        
        assert response.success is True
        assert response.data == {"output": "test"}
        assert response.status_code == 200
        assert response.latency_ms == 123.45
        assert response.error is None
    
    def test_error_response(self):
        """Test creating error response."""
        response = RunPodResponse(
            success=False,
            error="Something went wrong"
        )
        
        assert response.success is False
        assert response.error == "Something went wrong"
        assert response.data is None


class TestFactoryFunction:
    """Tests for create_runpod_client factory function."""
    
    def test_create_client(self):
        """Test creating client via factory function."""
        client = create_runpod_client(
            api_key="test_key",
            endpoint_url="https://api.runpod.ai/v2/test",
            timeout=600,
            max_retries=5
        )
        
        assert isinstance(client, RunPodClient)
        assert client.api_key == "test_key"
        assert client.timeout == 600
        assert client.max_retries == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
