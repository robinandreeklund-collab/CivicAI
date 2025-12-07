"""
Model Interface for CivicAI
Provides unified interface for model inference, abstracting local vs RunPod execution.

This module allows transparent switching between local model execution and RunPod
cloud execution without changing the API contract. Administrators can switch modes
via configuration without affecting end users.
"""

import logging
import sys
import os
from pathlib import Path
from typing import Dict, Optional, Any, AsyncGenerator
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.runtime_config import get_runtime_config, is_runpod_mode
from ml_service.runpod_client import create_runpod_client, RunPodResponse

logger = logging.getLogger(__name__)


class ModelInterface:
    """
    Unified interface for model inference.
    Routes requests to local model or RunPod based on configuration.
    """
    
    def __init__(self):
        """Initialize model interface."""
        self.config = get_runtime_config()
        self._local_model = None
        self._local_tokenizer = None
        self._runpod_client = None
        
        # Initialize based on mode
        if is_runpod_mode():
            self._init_runpod()
        else:
            logger.info("Model interface initialized in LOCAL mode")
    
    def _init_runpod(self):
        """Initialize RunPod client."""
        try:
            self._runpod_client = create_runpod_client(
                api_key=self.config.runpod_api_key,
                endpoint_url=self.config.runpod_endpoint_url,
                timeout=self.config.runpod_timeout,
                max_retries=self.config.runpod_max_retries
            )
            logger.info("RunPod client initialized successfully")
            
            # Test connection
            is_connected, error = self._runpod_client.test_connection()
            if not is_connected:
                logger.warning(f"RunPod connection test failed: {error}")
            
        except Exception as e:
            logger.error(f"Failed to initialize RunPod client: {e}")
            raise
    
    def _load_local_model(self, model_path: str):
        """
        Load local model for inference.
        
        Args:
            model_path: Path to the local model
        """
        if self._local_model is not None:
            logger.info("Local model already loaded")
            return
        
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
            
            logger.info(f"Loading local model from {model_path}")
            
            # Load tokenizer
            self._local_tokenizer = AutoTokenizer.from_pretrained(
                model_path,
                trust_remote_code=True
            )
            
            # Load model
            self._local_model = AutoModelForCausalLM.from_pretrained(
                model_path,
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map="auto"
            )
            
            logger.info("Local model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            raise
    
    def infer(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        model_path: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Run inference on the model.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            model_path: Path to local model (only used in local mode)
            **kwargs: Additional generation parameters
            
        Returns:
            Dict with 'text' (generated text) and 'metadata' (metrics, mode, etc.)
        """
        # Reload config to catch any changes
        self.config = get_runtime_config()
        
        if is_runpod_mode():
            return self._infer_runpod(prompt, max_tokens, temperature, **kwargs)
        else:
            return self._infer_local(prompt, max_tokens, temperature, model_path, **kwargs)
    
    def _infer_local(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        model_path: Optional[str],
        **kwargs
    ) -> Dict[str, Any]:
        """Run inference on local model."""
        try:
            import torch
            import time
            
            # Determine model path
            if model_path is None:
                # Try to get from config first
                config_model_path = os.getenv('LOCAL_MODEL_PATH')
                if config_model_path:
                    model_path = config_model_path
                else:
                    # Fallback: Try OneSeek certified model
                    default_path = Path(__file__).parent.parent / "models" / "oneseek-certified"
                    if default_path.exists():
                        # Find the most recent run
                        runs = sorted([d for d in default_path.iterdir() if d.is_dir()], reverse=True)
                        if runs:
                            model_path = str(runs[0])
                            logger.info(f"Using most recent certified model: {model_path}")
                        else:
                            raise ValueError(
                                "No models found. Set LOCAL_MODEL_PATH environment variable "
                                "or provide model_path parameter"
                            )
                    else:
                        raise ValueError(
                            "No models found. Set LOCAL_MODEL_PATH environment variable "
                            "or provide model_path parameter"
                        )
            
            # Load model if not already loaded
            if self._local_model is None:
                self._load_local_model(model_path)
            
            logger.info(f"Running local inference (max_tokens={max_tokens}, temp={temperature})")
            start_time = time.time()
            
            # Tokenize input
            inputs = self._local_tokenizer(prompt, return_tensors="pt").to(self._local_model.device)
            
            # Generate
            with torch.no_grad():
                outputs = self._local_model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=temperature > 0,
                    **kwargs
                )
            
            # Decode output
            generated_text = self._local_tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:],
                skip_special_tokens=True
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            logger.info(f"Local inference completed ({latency_ms:.2f}ms)")
            
            return {
                "text": generated_text,
                "metadata": {
                    "mode": "local",
                    "model_path": model_path,
                    "latency_ms": latency_ms,
                    "tokens_generated": len(outputs[0]) - inputs['input_ids'].shape[1]
                }
            }
            
        except Exception as e:
            logger.error(f"Local inference error: {e}")
            raise RuntimeError(f"Local inference failed: {str(e)}")
    
    def _infer_runpod(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Run inference on RunPod."""
        try:
            if self._runpod_client is None:
                self._init_runpod()
            
            logger.info(f"Running RunPod inference (max_tokens={max_tokens}, temp={temperature})")
            
            response: RunPodResponse = self._runpod_client.inference(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            
            if not response.success:
                error_msg = response.error or "Unknown RunPod error"
                logger.error(f"RunPod inference failed: {error_msg}")
                raise RuntimeError(f"RunPod inference failed: {error_msg}")
            
            # Extract generated text from response
            # RunPod response format may vary, adjust as needed
            generated_text = response.data.get("output", {}).get("text", "")
            if not generated_text and "output" in response.data:
                # Alternative format
                generated_text = response.data.get("output", "")
            
            logger.info(f"RunPod inference completed ({response.latency_ms:.2f}ms)")
            
            return {
                "text": generated_text,
                "metadata": {
                    "mode": "runpod",
                    "endpoint": self.config.runpod_endpoint_url,
                    "latency_ms": response.latency_ms,
                    "status_code": response.status_code
                }
            }
            
        except Exception as e:
            logger.error(f"RunPod inference error: {e}")
            raise RuntimeError(f"RunPod inference failed: {str(e)}")
    
    async def infer_stream(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.7,
        model_path: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """
        Run streaming inference on the model.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            model_path: Path to local model (only used in local mode)
            **kwargs: Additional generation parameters
            
        Yields:
            Generated text chunks
        """
        # Note: Streaming is more complex and would require additional implementation
        # For now, we'll do a simple non-streaming call and yield the result
        
        result = self.infer(prompt, max_tokens, temperature, model_path, **kwargs)
        yield result["text"]
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current model interface status.
        
        Returns:
            Status information including mode, model state, etc.
        """
        self.config = get_runtime_config()
        
        status = {
            "mode": self.config.mode,
            "is_ready": False,
            "details": {}
        }
        
        if is_runpod_mode():
            if self._runpod_client is not None:
                is_connected, error = self._runpod_client.test_connection()
                status["is_ready"] = is_connected
                status["details"] = {
                    "endpoint": self.config.runpod_endpoint_url,
                    "connected": is_connected,
                    "error": error
                }
            else:
                status["details"] = {
                    "endpoint": self.config.runpod_endpoint_url,
                    "connected": False,
                    "error": "Client not initialized"
                }
        else:
            status["is_ready"] = self._local_model is not None
            status["details"] = {
                "model_loaded": self._local_model is not None,
                "tokenizer_loaded": self._local_tokenizer is not None
            }
        
        return status
    
    def reload_config(self):
        """Reload configuration and reinitialize if mode changed."""
        old_mode = self.config.mode
        self.config = get_runtime_config()
        
        if old_mode != self.config.mode:
            logger.info(f"Mode changed from {old_mode} to {self.config.mode}, reinitializing")
            
            # Clean up old resources
            if old_mode == "local":
                self._local_model = None
                self._local_tokenizer = None
            else:
                self._runpod_client = None
            
            # Initialize new mode
            if is_runpod_mode():
                self._init_runpod()


# Global model interface instance
_model_interface: Optional[ModelInterface] = None


def get_model_interface() -> ModelInterface:
    """Get the global model interface instance."""
    global _model_interface
    if _model_interface is None:
        _model_interface = ModelInterface()
    return _model_interface


def reload_model_interface():
    """Reload the model interface (useful after config changes)."""
    global _model_interface
    if _model_interface is not None:
        _model_interface.reload_config()
    else:
        _model_interface = ModelInterface()
