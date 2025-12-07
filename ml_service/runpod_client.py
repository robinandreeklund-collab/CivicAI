"""
RunPod API Client for CivicAI
Handles communication with RunPod serverless endpoints for model inference and training.

This client provides a unified interface for sending requests to RunPod endpoints,
handling authentication, retries, and error conditions.
"""

import requests
import time
import logging
import typing
from typing import Dict, Optional, List, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class RunPodResponse:
    """Response from RunPod API."""
    
    success: bool
    data: Optional[Dict] = None
    error: Optional[str] = None
    status_code: Optional[int] = None
    latency_ms: Optional[float] = None


class RunPodClient:
    """Client for RunPod API interactions."""
    
    def __init__(
        self, 
        api_key: str, 
        endpoint_url: str,
        timeout: int = 300,
        max_retries: int = 3
    ):
        """
        Initialize RunPod client.
        
        Args:
            api_key: RunPod API key
            endpoint_url: RunPod endpoint URL
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
        """
        self.api_key = api_key
        self.endpoint_url = endpoint_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Validate inputs
        if not self.api_key:
            raise ValueError("API key cannot be empty")
        if not self.endpoint_url:
            raise ValueError("Endpoint URL cannot be empty")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def _make_request(
        self, 
        method: str,
        path: str,
        data: Optional[Dict] = None,
        retry_count: int = 0
    ) -> RunPodResponse:
        """
        Make HTTP request to RunPod API with retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: API path (will be appended to endpoint_url)
            data: Request payload
            retry_count: Current retry attempt
            
        Returns:
            RunPodResponse object
        """
        url = f"{self.endpoint_url}{path}"
        start_time = time.time()
        
        try:
            logger.debug(f"Making {method} request to {url}")
            
            response = requests.request(
                method=method,
                url=url,
                json=data,
                headers=self._get_headers(),
                timeout=self.timeout
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Check for HTTP errors
            response.raise_for_status()
            
            # Parse response
            response_data = response.json() if response.content else {}
            
            logger.info(f"RunPod request successful ({latency_ms:.2f}ms)")
            
            return RunPodResponse(
                success=True,
                data=response_data,
                status_code=response.status_code,
                latency_ms=latency_ms
            )
            
        except requests.exceptions.Timeout:
            error_msg = f"Request timeout after {self.timeout}s"
            logger.error(error_msg)
            
            # Retry on timeout
            if retry_count < self.max_retries:
                wait_time = 2 ** retry_count  # Exponential backoff
                logger.info(f"Retrying in {wait_time}s (attempt {retry_count + 1}/{self.max_retries})")
                time.sleep(wait_time)
                return self._make_request(method, path, data, retry_count + 1)
            
            return RunPodResponse(
                success=False,
                error=error_msg
            )
            
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            
            # Retry on 5xx errors
            if e.response.status_code >= 500 and retry_count < self.max_retries:
                wait_time = 2 ** retry_count
                logger.info(f"Retrying in {wait_time}s (attempt {retry_count + 1}/{self.max_retries})")
                time.sleep(wait_time)
                return self._make_request(method, path, data, retry_count + 1)
            
            return RunPodResponse(
                success=False,
                error=error_msg,
                status_code=e.response.status_code
            )
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            logger.error(error_msg)
            
            # Retry on connection errors
            if retry_count < self.max_retries:
                wait_time = 2 ** retry_count
                logger.info(f"Retrying in {wait_time}s (attempt {retry_count + 1}/{self.max_retries})")
                time.sleep(wait_time)
                return self._make_request(method, path, data, retry_count + 1)
            
            return RunPodResponse(
                success=False,
                error=error_msg
            )
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return RunPodResponse(
                success=False,
                error=error_msg
            )
    
    def inference(
        self, 
        prompt: str, 
        max_tokens: int = 512,
        temperature: float = 0.7,
        **kwargs
    ) -> RunPodResponse:
        """
        Run inference on RunPod endpoint.
        
        Args:
            prompt: Input prompt for the model
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional model parameters
            
        Returns:
            RunPodResponse with generated text
        """
        payload = {
            "input": {
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
                **kwargs
            }
        }
        
        logger.info(f"Sending inference request (prompt length: {len(prompt)})")
        return self._make_request("POST", "/run", data=payload)
    
    def submit_training_job(
        self,
        dataset_url: str,
        model_name: str,
        epochs: int = 3,
        learning_rate: float = 2e-4,
        **kwargs
    ) -> RunPodResponse:
        """
        Submit a training job to RunPod.
        
        Args:
            dataset_url: URL to training dataset
            model_name: Name of the base model to fine-tune
            epochs: Number of training epochs
            learning_rate: Learning rate
            **kwargs: Additional training parameters
            
        Returns:
            RunPodResponse with job ID
        """
        payload = {
            "input": {
                "task": "train",
                "dataset_url": dataset_url,
                "model_name": model_name,
                "epochs": epochs,
                "learning_rate": learning_rate,
                **kwargs
            }
        }
        
        logger.info(f"Submitting training job for model: {model_name}")
        return self._make_request("POST", "/run", data=payload)
    
    def check_job_status(self, job_id: str) -> RunPodResponse:
        """
        Check status of a RunPod job.
        
        Args:
            job_id: Job ID to check
            
        Returns:
            RunPodResponse with job status
        """
        logger.debug(f"Checking status for job: {job_id}")
        return self._make_request("GET", f"/status/{job_id}")
    
    def cancel_job(self, job_id: str) -> RunPodResponse:
        """
        Cancel a running job.
        
        Args:
            job_id: Job ID to cancel
            
        Returns:
            RunPodResponse with cancellation status
        """
        logger.info(f"Cancelling job: {job_id}")
        return self._make_request("POST", f"/cancel/{job_id}")
    
    def health_check(self) -> RunPodResponse:
        """
        Check if RunPod endpoint is healthy.
        
        Returns:
            RunPodResponse with health status
        """
        logger.debug("Performing health check")
        return self._make_request("GET", "/health")
    
    def test_connection(self) -> typing.Tuple[bool, Optional[str]]:
        """
        Test connection to RunPod endpoint.
        
        Returns:
            tuple: (is_connected, error_message)
        """
        try:
            response = self.health_check()
            if response.success:
                logger.info("RunPod connection test successful")
                return True, None
            else:
                error_msg = response.error or "Unknown error"
                logger.error(f"RunPod connection test failed: {error_msg}")
                return False, error_msg
        except Exception as e:
            error_msg = f"Connection test failed: {str(e)}"
            logger.error(error_msg)
            return False, error_msg


def create_runpod_client(
    api_key: str,
    endpoint_url: str,
    timeout: int = 300,
    max_retries: int = 3
) -> RunPodClient:
    """
    Factory function to create a RunPod client.
    
    Args:
        api_key: RunPod API key
        endpoint_url: RunPod endpoint URL
        timeout: Request timeout in seconds
        max_retries: Maximum retry attempts
        
    Returns:
        Configured RunPodClient instance
    """
    return RunPodClient(
        api_key=api_key,
        endpoint_url=endpoint_url,
        timeout=timeout,
        max_retries=max_retries
    )
