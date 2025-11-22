# Training Configuration Guide

## Overview

This document explains the training configuration system for OneSeek-7B-Zero DNA v2 training with adaptive weights and real-time monitoring.

## Important: About pj.yaml

**⚠️ DO NOT USE pj.yaml FOR CONFIGURATION ⚠️**

The file `pj.yaml` (if it exists) contains console errors and debugging output. It is **NOT** a configuration file and should not be parsed or used for settings.

## Configuration Files

The training system uses the following configuration approach:

### Backend Configuration (JavaScript)

**File:** `backend/config/trainingConfig.js`

This is the main configuration file that defines all training parameters:

```javascript
import { TRAINING_CONFIG, generateRunId, validateBaseModels } from '../config/trainingConfig.js';

// Access configuration
const epochs = TRAINING_CONFIG.defaults.epochs;
const threshold = TRAINING_CONFIG.confidence_auto_stop.threshold;

// Generate run ID (no colons in filename)
const runId = generateRunId();

// Validate base models are selected
validateBaseModels(selectedModels);
```

### Python Configuration Module

**File:** `scripts/training_config.py`

This module provides configuration access for Python training scripts:

```python
from training_config import get_config, validate_base_models

# Get configuration
config = get_config()

# Validate base models from environment
validate_base_models(config.base_models)

# Access settings
threshold = config.confidence_auto_stop['threshold']
patience = config.confidence_auto_stop['patience']
```

## Configuration Sections

### 1. Base Models

Base models **MUST** be selected from the admin panel. No hardcoded defaults are used.

```javascript
// Backend: Models come from admin panel selection
const baseModels = req.body.baseModels;  // From admin UI
validateBaseModels(baseModels);  // Throws error if empty

// Python: Models come from BASE_MODELS environment variable
BASE_MODELS=mistral-7b-instruct,llama-2-7b-chat
```

**Key principle:** The training system ONLY uses models explicitly selected by administrators. This prevents:
- Accidental training of wrong models
- Dual-model mode being forced when models exist locally
- Inconsistent base model inclusion

### 2. Adaptive Weights Engine

Controls how model weights are adjusted during training:

```javascript
adaptive_weights: {
  enabled: true,
  min_multiplier: 0.5,    // Bottom model gets ≥50% weight
  max_multiplier: 1.5,    // Top model gets ≤150% weight
  adjust_strategy: {
    top_model_boost: 0.3,      // +30% for best model
    bottom_model_penalty: 0.4,  // -40% for worst model
    normalize_weights: true,
    adjust_every_epoch: true
  }
}
```

### 3. Confidence-Based Auto-Stop

Automatically stops training when loss plateaus:

```javascript
confidence_auto_stop: {
  enabled: true,
  threshold: 0.001,      // Stop if loss change < 0.001
  patience: 3,           // Over 3 consecutive epochs
  min_epochs: 2          // Don't stop before epoch 2
}
```

### 4. Live Leaderboard

Real-time visualization of model performance:

```javascript
live_leaderboard: {
  enabled: true,
  refresh_interval: 5,  // Broadcast updates every 5 seconds
  display: {
    show_weights: true,
    show_lr_multipliers: true,
    show_loss_per_model: true,
    show_progress: true
  }
}
```

### 5. Metadata Naming (NO COLONS)

Prevents file naming issues on Windows:

```javascript
metadata: {
  naming_pattern: 'run-{timestamp}',
  timestamp_format: '%Y%m%d-%H%M%S',  // Example: 20231122-143025
  use_atomic_writes: true,
  temp_suffix: '.tmp'
}
```

**Before (broken):** `run:2023-11-22:14:30:25` ❌  
**After (correct):** `run-20231122-143025` ✅

## API Endpoints

### HTTP Endpoints

```bash
# Get training metrics
GET /api/training/{runId}/metrics

# Get leaderboard
GET /api/training/{runId}/leaderboard

# Update metrics (called by training process)
POST /api/training/{runId}/metrics
```

### WebSocket Endpoint

```javascript
// Connect to live training updates
const ws = new WebSocket('ws://localhost:3001/ws/training?runId=run-20231122-143025');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type);
  // Types: initial_state, epoch_end, weight_adjustment, training_complete
};
```

## Event Payload Examples

### Epoch End Event

```json
{
  "type": "epoch_end",
  "epoch": 3,
  "val_losses": {
    "mistral-7b-instruct": 3.17,
    "llama-2-7b-chat": 4.03
  },
  "weights": {
    "mistral-7b-instruct": 1.48,
    "llama-2-7b-chat": 0.71
  },
  "lr_multipliers": {
    "mistral-7b-instruct": 0.000148,
    "llama-2-7b-chat": 0.000071
  },
  "total_loss": 3.98,
  "auto_stop_info": {
    "remaining": 2,
    "threshold": 0.001,
    "current_change": 0.0023
  },
  "progress_percent": 60,
  "timestamp": "2023-11-22T14:30:25.123Z"
}
```

## Usage Examples

### Starting Training (Admin Panel)

```javascript
// In TrainingControl.jsx
const startTraining = async () => {
  const response = await fetch('/api/admin/training/start-dna-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      datasetId: selectedDataset,
      baseModels: selectedBaseModels,  // From admin selection
      epochs: 3,
      learningRate: 0.0001,
      autoStopThreshold: 0.001,
      autoStopPatience: 3
    })
  });
};
```

### Monitoring Training (Live Leaderboard)

```jsx
// In LiveLeaderboard.jsx
import LiveLeaderboard from './components/admin/LiveLeaderboard';

<LiveLeaderboard runId="run-20231122-143025" />
```

## Environment Variables

The training system uses these environment variables:

```bash
# Base models (comma-separated, from admin panel)
BASE_MODELS=mistral-7b-instruct,llama-2-7b-chat

# Models directory
MODELS_DIR=models

# Ledger configuration (optional)
LEDGER_URL=http://localhost:8080
LEDGER_PRIVATE_KEY_PATH=/path/to/key
```

## File Structure

```
CivicAI/
├── backend/
│   ├── config/
│   │   ├── trainingConfig.js     # Main config (JavaScript)
│   │   └── pipelineConfig.js     # Pipeline config
│   ├── api/
│   │   ├── admin.js              # Uses trainingConfig.js
│   │   └── training_metrics.js   # Live metrics API
│   └── ws/
│       └── training_ws.js        # WebSocket handler
├── scripts/
│   ├── training_config.py        # Python config module
│   └── train_dna_v2.py           # Uses training_config.py
├── frontend/
│   └── src/
│       └── components/
│           └── admin/
│               ├── LiveLeaderboard.jsx
│               └── TrainingControl.jsx
└── models/
    └── oneseek-certified/
        └── run-20231122-143025/  # Proper naming (no colons)
            ├── oneseek_dna.json
            ├── training_results.json
            ├── live_metrics.json
            └── ledger_proof.json
```

## Migration from pj.yaml (if needed)

If you previously tried to use pj.yaml for configuration:

1. **Remove pj.yaml** - It's not a config file
2. **Use trainingConfig.js** - All settings go here
3. **Update imports** - Import from `config/trainingConfig.js`
4. **Update Python code** - Import from `training_config.py`

## Common Issues

### Issue: "No base models selected"

**Cause:** BASE_MODELS environment variable not set or empty  
**Solution:** Select models in admin panel before starting training

### Issue: "File not found: run:2023-11..."

**Cause:** Colons in filename (Windows incompatible)  
**Solution:** Use `generateRunId()` which formats as `run-20231122-143025`

### Issue: "Configuration not found"

**Cause:** Trying to load pj.yaml or wrong config file  
**Solution:** Import from `config/trainingConfig.js` or `training_config.py`

## Best Practices

1. ✅ **Always select base models** from admin panel
2. ✅ **Use `generateRunId()`** for file naming
3. ✅ **Import from trainingConfig.js** for JavaScript
4. ✅ **Import from training_config.py** for Python
5. ❌ **Never parse pj.yaml** - it's not a config file
6. ❌ **Never hardcode base models** - must come from admin selection
7. ❌ **Never use colons in filenames** - use hyphens instead

## Testing Configuration

```javascript
// Test configuration loading
import { TRAINING_CONFIG, validateBaseModels, generateRunId } from './config/trainingConfig.js';

// Should work
const runId = generateRunId();
console.log(runId);  // run-20231122-143025

// Should throw error (no models)
try {
  validateBaseModels([]);
} catch (error) {
  console.log('Correctly throws error:', error.message);
}

// Should work (models selected)
validateBaseModels(['mistral-7b-instruct', 'llama-2-7b-chat']);
```

## Support

For questions about configuration:
1. Check this guide first
2. Review `backend/config/trainingConfig.js`
3. Review `scripts/training_config.py`
4. Check admin panel for base model selection

**Remember:** pj.yaml is NOT a configuration file!
