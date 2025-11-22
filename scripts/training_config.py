"""
Training Configuration Module

This module provides configuration loading for DNA v2 training.
Configuration is defined in backend/config/trainingConfig.js but can be
accessed here through environment variables and default values.

DO NOT USE pj.yaml - it contains console errors and is not a configuration file.
"""

import os
import json
from pathlib import Path
from typing import Dict, Any, List


class TrainingConfig:
    """
    Training configuration with adaptive weights and auto-stop settings.
    
    Configuration values are loaded from:
    1. Environment variables (highest priority)
    2. Default values from this class (fallback)
    
    Base models MUST be provided via BASE_MODELS environment variable from admin panel.
    No default base models are used.
    """
    
    def __init__(self):
        # Version
        self.version = "2.0.0"
        self.description = "DNA v2 Training with Adaptive Weights"
        
        # Base Models (MUST come from admin panel via BASE_MODELS env var)
        base_models_env = os.environ.get('BASE_MODELS', '')
        self.base_models = [m.strip() for m in base_models_env.split(',') if m.strip()]
        
        # Training Defaults
        self.defaults = {
            'epochs': 3,
            'batch_size': 8,
            'learning_rate': 0.0001,
            'seed': 42,
            'language': 'en'
        }
        
        # Adaptive Weights Configuration
        self.adaptive_weights = {
            'enabled': True,
            'min_multiplier': 0.5,     # Bottom model gets at least 50%
            'max_multiplier': 1.5,     # Top model gets at most 150%
            'adjust_strategy': {
                'top_model_boost': 0.3,      # +30% for best model
                'bottom_model_penalty': 0.4,  # -40% for worst model
                'normalize_weights': True,
                'adjust_every_epoch': True
            }
        }
        
        # Confidence-Based Auto-Stop
        self.confidence_auto_stop = {
            'enabled': True,
            'threshold': 0.001,
            'patience': 3,
            'min_epochs': 2
        }
        
        # Live Metrics to Broadcast
        self.live_metrics = [
            'epoch',
            'val_losses',
            'weights',
            'lr_multipliers',
            'total_loss',
            'auto_stop_info',
            'progress_percent',
            'current_lr'
        ]
        
        # Model Management
        self.models = {
            'output_dir': 'models/oneseek-certified',
            'metadata': {
                'naming_pattern': 'run-{timestamp}',
                'timestamp_format': '%Y%m%d-%H%M%S',  # NO COLONS
                'use_atomic_writes': True,
                'temp_suffix': '.tmp',
                'version': '2.0',
                'include_immutable_hash': True
            },
            'dna': {
                'version': '2.0',
                'format': 'OneSeek-7B-Zero.v{version}.{category_hash}',
                'include_dataset_categories': True,
                'include_base_model_weights': True
            }
        }
        
        # Logging
        self.logging = {
            'level': 'INFO',
            'format': 'json',
            'include_timestamps': True,
            'include_context': True
        }
    
    def validate_base_models(self) -> bool:
        """
        Validate that base models are selected (not using defaults).
        
        Returns:
            bool: True if valid
            
        Raises:
            ValueError: If no base models are selected
        """
        if not self.base_models:
            raise ValueError(
                "No base models selected. Base models must be provided via "
                "BASE_MODELS environment variable from the admin panel. "
                "DO NOT use default values."
            )
        return True
    
    def get_weight_bounds(self) -> Dict[str, float]:
        """Get adaptive weight bounds."""
        return {
            'min': self.adaptive_weights['min_multiplier'],
            'max': self.adaptive_weights['max_multiplier']
        }
    
    def get_auto_stop_config(self) -> Dict[str, Any]:
        """Get auto-stop configuration."""
        return {
            'enabled': self.confidence_auto_stop['enabled'],
            'threshold': self.confidence_auto_stop['threshold'],
            'patience': self.confidence_auto_stop['patience'],
            'min_epochs': self.confidence_auto_stop['min_epochs']
        }
    
    def generate_run_id(self) -> str:
        """
        Generate run ID with proper timestamp format (NO COLONS).
        
        Returns:
            str: Run ID in format: run-YYYYMMDD-HHMMSS
        """
        from datetime import datetime
        timestamp = datetime.now().strftime(self.models['metadata']['timestamp_format'])
        return f"run-{timestamp}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            'version': self.version,
            'description': self.description,
            'base_models': self.base_models,
            'defaults': self.defaults,
            'adaptive_weights': self.adaptive_weights,
            'confidence_auto_stop': self.confidence_auto_stop,
            'live_metrics': self.live_metrics,
            'models': self.models,
            'logging': self.logging
        }


# Global configuration instance
_config = None


def get_config() -> TrainingConfig:
    """Get global training configuration instance."""
    global _config
    if _config is None:
        _config = TrainingConfig()
    return _config


def validate_base_models(base_models: List[str]) -> bool:
    """
    Validate that base models list is not empty.
    
    Args:
        base_models: List of base model names
        
    Returns:
        bool: True if valid
        
    Raises:
        ValueError: If no base models provided
    """
    if not base_models:
        raise ValueError(
            "No base models selected. Please select at least one model "
            "from the admin panel. DO NOT use hardcoded defaults."
        )
    return True
