/**
 * Training Configuration for OneSeek-7B-Zero
 * 
 * This configuration defines all training parameters including:
 * - Adaptive weight adjustment settings
 * - Live leaderboard configuration
 * - Confidence-based auto-stop thresholds
 * - Real-time metrics broadcasting
 */

export const TRAINING_CONFIG = {
  version: '2.0.0',
  description: 'DNA v2 Training with Adaptive Weights and Real-time Monitoring',

  // Base Models Configuration
  // These models are selected from the admin panel and should NOT be hardcoded
  // The system will only train models explicitly selected by administrators
  base_models: {
    // Models are dynamically loaded from admin panel selection
    // No default values - must be explicitly selected
    selected: [],
    
    // Discovery settings for finding available base models
    discovery: {
      enabled: true,
      search_paths: [
        'models/',
        'models/base_models/'
      ],
      validation: {
        require_config_json: true,
        require_tokenizer: true
      }
    }
  },

  // Training Default Parameters
  defaults: {
    epochs: 3,
    batch_size: 8,
    learning_rate: 0.0001,
    seed: 42,
    language: 'en'
  },

  // Adaptive Training Weights Engine
  adaptive_weights: {
    enabled: true,
    
    // Weight multiplier bounds
    min_multiplier: 0.5,    // Bottom model gets at least 50% weight
    max_multiplier: 1.5,    // Top model gets at most 150% weight
    
    // Adjustment strategy
    adjust_strategy: {
      // Performance-based adjustments
      top_model_boost: 0.3,       // +30% for best performing model
      bottom_model_penalty: 0.4,   // -40% for worst performing model
      
      // Normalization
      normalize_weights: true,     // Always normalize to sum=1.0
      
      // Frequency of adjustments
      adjust_every_epoch: true
    }
  },

  // Live Leaderboard Configuration
  live_leaderboard: {
    enabled: true,
    refresh_interval: 5,  // seconds - how often to broadcast updates
    
    // Display settings
    display: {
      show_weights: true,
      show_lr_multipliers: true,
      show_loss_per_model: true,
      show_progress: true
    }
  },

  // Confidence-Based Auto-Stop
  confidence_auto_stop: {
    enabled: true,
    threshold: 0.001,      // Stop if loss change < 0.001
    patience: 3,           // Over 3 consecutive epochs
    
    // Minimum epochs before auto-stop can trigger
    min_epochs: 2
  },

  // Live Metrics to Broadcast
  live_metrics_to_broadcast: [
    'epoch',
    'val_losses',           // Per-model validation losses
    'weights',              // Current adaptive weights per model
    'lr_multipliers',       // Learning rate multipliers per model
    'total_loss',           // Combined validation loss
    'auto_stop_info',       // Remaining patience, threshold status
    'progress_percent',     // Overall training progress
    'current_lr'            // Current learning rate
  ],

  // Model Management
  models: {
    // Output directory for certified models
    output_dir: 'models/oneseek-certified',
    
    // Metadata configuration
    metadata: {
      // File naming (NO COLONS - use hyphens or underscores)
      naming_pattern: 'run-{timestamp}',  // e.g., run-20231122-143025
      timestamp_format: '%Y%m%d-%H%M%S',
      
      // Atomic writes for metadata files
      use_atomic_writes: true,
      temp_suffix: '.tmp',
      
      // Metadata versioning
      version: '2.0',
      include_immutable_hash: true
    },
    
    // DNA Fingerprint Configuration
    dna: {
      version: '2.0',
      format: 'OneSeek-7B-Zero.v{version}.{category_hash}',
      include_dataset_categories: true,
      include_base_model_weights: true
    }
  },

  // API Configuration
  api: {
    // Training Metrics Endpoint
    training_metrics: {
      enabled: true,
      endpoint_pattern: '/api/training/{run_id}/metrics',
      
      // Cache settings
      cache_enabled: true,
      cache_ttl: 5  // seconds
    },
    
    // WebSocket Configuration
    websocket: {
      enabled: true,
      endpoint_pattern: '/ws/training?runId={run_id}',
      
      // Event types
      events: [
        'epoch_start',
        'epoch_end',
        'weight_adjustment',
        'auto_stop_triggered',
        'training_complete',
        'training_error'
      ],
      
      // Connection settings
      heartbeat_interval: 30,  // seconds
      max_connections_per_run: 10
    }
  },

  // Logging Configuration
  logging: {
    level: 'INFO',  // DEBUG, INFO, WARNING, ERROR
    
    // Log outputs
    outputs: {
      console: true,
      file: true
    },
    
    // Log file settings
    file: {
      path: 'logs/training.log',
      max_size_mb: 100,
      max_files: 10
    },
    
    // Structured logging
    format: 'json',
    include_timestamps: true,
    include_context: true
  },

  // Storage Configuration
  storage: {
    // Dataset storage
    datasets_dir: 'datasets',
    
    // Training history
    history_file: 'ml/training_history.json',
    max_history_entries: 50,
    
    // Ledger configuration
    ledger: {
      enabled: true,
      dir: 'ml/ledger',
      type: 'in_memory'  // or 'http' for remote ledger
    }
  },

  // Performance Configuration
  performance: {
    // CPU/GPU settings
    device: {
      auto_detect: true,
      fallback_to_cpu: true
    },
    
    // Memory management
    memory: {
      max_batch_size: 64,
      gradient_accumulation_steps: 1
    }
  },
  
  // DDP (Distributed Data Parallel) Configuration
  ddp: {
    enabled: false,           // Enable full DDP training via torchrun
    backend: 'nccl',          // nccl for NVIDIA GPUs, gloo for CPU
    auto_detect_gpus: true,   // Auto-detect available GPUs
    recommended_for_multi_gpu: true,  // DDP is recommended for 2+ GPUs
    estimated_speedup_per_gpu: 0.95   // ~95% efficiency per additional GPU
  }
};

/**
 * Get training configuration value by path
 * @param {string} path - Dot-separated path (e.g., 'adaptive_weights.enabled')
 * @returns {*} Configuration value
 */
export function getTrainingConfig(path) {
  const keys = path.split('.');
  let value = TRAINING_CONFIG;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Validate that base models are selected (not using defaults)
 * @param {Array} selectedModels - Models selected from admin panel
 * @returns {boolean} True if valid
 */
export function validateBaseModels(selectedModels) {
  if (!selectedModels || selectedModels.length === 0) {
    throw new Error('No base models selected. Please select at least one model from the admin panel.');
  }
  return true;
}

/**
 * Get adaptive weight bounds
 * @returns {Object} Min and max multipliers
 */
export function getWeightBounds() {
  return {
    min: TRAINING_CONFIG.adaptive_weights.min_multiplier,
    max: TRAINING_CONFIG.adaptive_weights.max_multiplier
  };
}

/**
 * Get auto-stop configuration
 * @returns {Object} Threshold and patience settings
 */
export function getAutoStopConfig() {
  return {
    enabled: TRAINING_CONFIG.confidence_auto_stop.enabled,
    threshold: TRAINING_CONFIG.confidence_auto_stop.threshold,
    patience: TRAINING_CONFIG.confidence_auto_stop.patience,
    min_epochs: TRAINING_CONFIG.confidence_auto_stop.min_epochs
  };
}

/**
 * Generate run ID with proper timestamp format (no colons)
 * @returns {string} Run ID in format: run-YYYYMMDD-HHMMSS
 */
export function generateRunId() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')     // Replace colons with hyphens
    .replace(/\./g, '-')    // Replace dots with hyphens
    .substring(0, 19);      // Take only YYYY-MM-DDTHH-MM-SS
  
  return `run-${timestamp.replace('T', '-')}`;
}

export default TRAINING_CONFIG;
