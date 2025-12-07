"""
Runtime Configuration Module for CivicAI
Manages configuration for switching between local and RunPod environments.

This module provides a centralized configuration system that allows administrators
to switch between local model execution and RunPod cloud execution without
affecting the user interface or API contracts.
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional, Literal
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

# Configuration file path
CONFIG_DIR = Path(__file__).parent
CONFIG_FILE = CONFIG_DIR / "runtime_settings.json"

# Valid execution modes
ExecutionMode = Literal["local", "runpod"]


@dataclass
class RuntimeConfig:
    """Runtime configuration for model execution."""
    
    mode: ExecutionMode = "local"
    runpod_api_key: Optional[str] = None
    runpod_endpoint_url: Optional[str] = None
    runpod_timeout: int = 300  # seconds
    runpod_max_retries: int = 3
    
    def validate(self) -> tuple[bool, Optional[str]]:
        """
        Validate the configuration.
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if self.mode not in ["local", "runpod"]:
            return False, f"Invalid mode: {self.mode}. Must be 'local' or 'runpod'"
        
        if self.mode == "runpod":
            if not self.runpod_api_key:
                return False, "RunPod API key is required when mode is 'runpod'"
            if not self.runpod_endpoint_url:
                return False, "RunPod endpoint URL is required when mode is 'runpod'"
            if not self.runpod_endpoint_url.startswith(("http://", "https://")):
                return False, "RunPod endpoint URL must start with http:// or https://"
        
        if self.runpod_timeout < 1:
            return False, "RunPod timeout must be at least 1 second"
        
        if self.runpod_max_retries < 0:
            return False, "RunPod max retries must be non-negative"
        
        return True, None
    
    def to_dict(self) -> Dict:
        """Convert configuration to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> "RuntimeConfig":
        """Create configuration from dictionary."""
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


class ConfigManager:
    """Manages runtime configuration for the application."""
    
    def __init__(self, config_file: Path = CONFIG_FILE):
        self.config_file = config_file
        self._config: Optional[RuntimeConfig] = None
        self._load_config()
    
    def _load_config(self) -> None:
        """Load configuration from file or create default."""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    data = json.load(f)
                self._config = RuntimeConfig.from_dict(data)
                logger.info(f"Loaded configuration from {self.config_file}")
            except Exception as e:
                logger.error(f"Error loading configuration: {e}")
                logger.info("Using default configuration")
                self._config = RuntimeConfig()
        else:
            logger.info("Configuration file not found, using defaults")
            self._config = RuntimeConfig()
            self._save_config()
    
    def _save_config(self) -> None:
        """Save configuration to file."""
        try:
            # Ensure directory exists
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(self.config_file, 'w') as f:
                json.dump(self._config.to_dict(), f, indent=2)
            logger.info(f"Saved configuration to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
            raise
    
    def get_config(self) -> RuntimeConfig:
        """Get current configuration."""
        if self._config is None:
            self._load_config()
        return self._config
    
    def update_config(self, **kwargs) -> tuple[bool, Optional[str]]:
        """
        Update configuration with new values.
        
        Args:
            **kwargs: Configuration fields to update
            
        Returns:
            tuple: (success, error_message)
        """
        # Create updated config
        current_dict = self._config.to_dict()
        current_dict.update(kwargs)
        new_config = RuntimeConfig.from_dict(current_dict)
        
        # Validate
        is_valid, error_msg = new_config.validate()
        if not is_valid:
            return False, error_msg
        
        # Save
        self._config = new_config
        self._save_config()
        return True, None
    
    def set_mode(self, mode: ExecutionMode) -> tuple[bool, Optional[str]]:
        """
        Set execution mode.
        
        Args:
            mode: Execution mode ('local' or 'runpod')
            
        Returns:
            tuple: (success, error_message)
        """
        return self.update_config(mode=mode)
    
    def set_runpod_credentials(self, api_key: str, endpoint_url: str) -> tuple[bool, Optional[str]]:
        """
        Set RunPod credentials.
        
        Args:
            api_key: RunPod API key
            endpoint_url: RunPod endpoint URL
            
        Returns:
            tuple: (success, error_message)
        """
        return self.update_config(
            runpod_api_key=api_key,
            runpod_endpoint_url=endpoint_url
        )
    
    def is_runpod_mode(self) -> bool:
        """Check if currently in RunPod mode."""
        return self._config.mode == "runpod"
    
    def is_local_mode(self) -> bool:
        """Check if currently in local mode."""
        return self._config.mode == "local"
    
    def get_display_info(self) -> Dict:
        """
        Get configuration info suitable for display.
        Masks sensitive data like API keys.
        """
        config = self._config.to_dict()
        if config.get('runpod_api_key'):
            # Show only first 8 chars of API key
            key = config['runpod_api_key']
            config['runpod_api_key'] = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "***"
        return config


# Global configuration manager instance
_config_manager: Optional[ConfigManager] = None


def get_config_manager() -> ConfigManager:
    """Get the global configuration manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager


def get_runtime_config() -> RuntimeConfig:
    """Get the current runtime configuration."""
    return get_config_manager().get_config()


def is_runpod_mode() -> bool:
    """Check if currently running in RunPod mode."""
    return get_config_manager().is_runpod_mode()


def is_local_mode() -> bool:
    """Check if currently running in local mode."""
    return get_config_manager().is_local_mode()
