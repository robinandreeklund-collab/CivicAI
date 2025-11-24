# Remote GPU Training - Setup & Usage Guide

This guide explains how to set up and use the remote GPU training feature to train models on a powerful desktop GPU while controlling everything from your laptop.

## Overview

The remote training feature allows you to:
- Train models on a desktop with GPUs (e.g., 2×2080Ti) while working from your laptop
- Automatically fallback to local training if the desktop is offline
- Monitor training progress in real-time
- Manage LoRA adapters with size tracking and integrity verification

## Architecture

```
Laptop (Control)           Network Share           Desktop (GPU Worker)
┌─────────────┐            ┌──────────┐            ┌─────────────┐
│             │   HTTP     │          │            │             │
│ Admin UI    │────────────│ Backend  │            │  Remote     │
│             │            │ Server   │            │  Worker     │
└─────────────┘            └──────────┘            └─────────────┘
      │                         │                         │
      │                    Z:\models (Shared)             │
      └─────────────────────────┴─────────────────────────┘
                      Dataset, Models, Adapters
```

## Setup Instructions

### 1. Desktop Setup (One-Time Setup - 2 minutes)

On your desktop with GPUs:

```bash
# 1. Create virtual environment
python -m venv worker_venv

# 2. Activate virtual environment
# Windows:
worker_venv\Scripts\activate
# Linux/Mac:
source worker_venv/bin/activate

# 3. Install dependencies
pip install torch accelerate peft transformers requests

# 4. Map network share to laptop (Windows)
# Replace DIN-LAPTOP-IP with your laptop's IP address
net use Z: \\DIN-LAPTOP-IP\CivicAI\models /persistent:yes

# Linux/Mac: Mount network share
# sudo mount -t cifs //DIN-LAPTOP-IP/CivicAI/models /mnt/models -o username=youruser

# 5. Set environment variables
# Windows (PowerShell):
$env:SHARED_MODELS_PATH = "Z:\models"
$env:LAPTOP_API_URL = "http://192.168.1.100:3001"

# Linux/Mac:
export SHARED_MODELS_PATH="/mnt/models"
export LAPTOP_API_URL="http://192.168.1.100:3001"

# 6. Start the remote worker
python Z:\scripts\remote_worker.py
```

### 2. Laptop Setup (Sharing Models Folder)

On your laptop:

**Windows:**
1. Right-click on the `CivicAI/models` folder
2. Select "Properties" → "Sharing" → "Share"
3. Add users and grant permissions
4. Note the network path (e.g., `\\YOUR-LAPTOP\models`)

**Linux/Mac:**
Use Samba or NFS to share the folder.

### 3. Using Remote Training

1. Open the Admin Dashboard in your browser
2. Navigate to the "Training Control" section
3. Click on the "🚀 Remote Training" tab
4. Check the worker status:
   - **Green**: Desktop is online and ready
   - **Red**: Desktop is offline (will fallback to local training)
5. Configure your training parameters in the "⚙️ Configuration" tab
6. Click "Send to Desktop (2×2080Ti)" to start training

## Features

### 1. Training Console
Real-time console showing:
- Base model size
- Accumulated adapter sizes
- Total chain size with warnings
- Live training logs

### 2. Model Evolution Tree
Visual tree view showing:
- Base model as root
- All adapters as branches
- Size and metadata for each component
- Health status indicators

### 3. Remote Training Control
- Worker status monitoring
- Job queue management
- Training mode selection (Remote/Local)
- GPU metrics display

### 4. Size Tracking & Warnings
The system automatically tracks model chain size:
- **< 6 GB**: ✅ Optimal
- **6-9 GB**: ℹ️ Consider merge planning
- **9-16 GB**: ⚠️ Recommend merge soon
- **> 16 GB**: 🚨 Critical - merge immediately

## Advanced Features

### Adapter Verification
Verify adapter integrity and compatibility:

```bash
python scripts/verify_chain.py \
  --base-model kb-llama-3-1-8b-swedish \
  --adapters run-2024-01-01 run-2024-01-02 \
  --verbose
```

### Merging Adapters
Merge multiple adapters into the base model:

```bash
python scripts/merge_adapters.py \
  --base-model kb-llama-3-1-8b-swedish \
  --adapters run-2024-01-01 run-2024-01-02 run-2024-01-03 \
  --output models/merged \
  --output-name civic-ai-v2.0
```

### API Endpoints

The backend provides several API endpoints:

#### Get Remote Worker Status
```bash
GET /api/remote/status
```

#### Submit Training Job
```bash
POST /api/remote/submit
{
  "dataset": "datasets/my_data.jsonl",
  "baseModels": ["kb-llama-3-1-8b-swedish"],
  "params": {
    "epochs": 3,
    "learningRate": 0.0001,
    "batchSize": 8
  }
}
```

#### Calculate Chain Size
```bash
GET /api/remote/chain/size?baseModel=kb-llama-3-1-8b-swedish&adapters=run1,run2,run3
```

#### Verify Chain Compatibility
```bash
POST /api/remote/chain/verify
{
  "baseModel": "kb-llama-3-1-8b-swedish",
  "adapters": ["run-2024-01-01", "run-2024-01-02"]
}
```

## Troubleshooting

### Desktop Worker Not Connecting
1. Check network connectivity: `ping YOUR-LAPTOP-IP`
2. Verify firewall allows port 3001
3. Check shared folder permissions
4. Verify environment variables are set correctly

### Training Fails Immediately
1. Check dataset path is accessible from desktop
2. Verify GPU drivers are installed
3. Check Python dependencies are installed
4. Review remote_worker.py logs

### Size Calculations Incorrect
1. Ensure all adapters are in the `models/oneseek-certified/` directory
2. Check that adapter files are not corrupted
3. Verify adapter_config.json exists in each adapter directory

## Best Practices

1. **Regular Merging**: Merge adapters when total size exceeds 9 GB
2. **Adapter Naming**: Use descriptive run IDs (e.g., `run-2024-01-15-civic-questions`)
3. **Backup**: Always backup before merging adapters
4. **Verification**: Run verify_chain.py before and after important operations
5. **Monitoring**: Check size warnings regularly in the console

## Performance

With remote GPU training:
- **Local (Laptop CPU)**: ~30-45 minutes per epoch
- **Remote (2×2080Ti)**: ~4-6 minutes per epoch
- **Disk Usage**: ~420-450 MB per adapter (vs 30+ GB for full models)

## Security Considerations

- Use a secure network or VPN for remote training
- Ensure shared folders have appropriate permissions
- Keep training data encrypted during transfer
- Use HTTPS for API endpoints in production
