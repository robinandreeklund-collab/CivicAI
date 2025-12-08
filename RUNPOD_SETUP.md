# RunPod Environment Switcher - Setup Guide

## Overview

CivicAI now supports seamless switching between **local** and **RunPod** execution environments. This allows administrators to:

- Develop and test models locally
- Deploy and run inference on RunPod's cloud infrastructure
- Train models on powerful RunPod GPUs
- Switch between environments without changing user workflows

**Key Feature**: End users always interact with the same API and interface, regardless of whether the system is running locally or on RunPod.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (User Interface)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Same API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Backend API                               │
│                  (Node.js Server)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Model Interface                             │
│            (ml_service/model_interface.py)                   │
│                                                              │
│  Reads config/runtime_settings.json to determine mode       │
└────────┬────────────────────────────────────────────┬───────┘
         │                                             │
         │ mode: local                                 │ mode: runpod
         │                                             │
┌────────▼─────────────┐                    ┌─────────▼────────────┐
│   Local Inference    │                    │  RunPod API Client   │
│   (PyTorch Model)    │                    │  (REST API Calls)    │
└──────────────────────┘                    └──────────────────────┘
```

## Components

### 1. Configuration Module (`config/runtime_config.py`)
- Stores execution mode (local/runpod)
- Manages RunPod credentials (API key, endpoint URL)
- Validates configuration
- Provides configuration access to other modules

### 2. RunPod API Client (`ml_service/runpod_client.py`)
- Handles HTTP requests to RunPod endpoints
- Implements retry logic and error handling
- Supports inference and training operations
- Connection testing and health checks

### 3. Model Interface (`ml_service/model_interface.py`)
- Unified API for model operations
- Routes requests based on configuration
- Maintains consistent response format
- Transparent switching between local and RunPod

### 4. Admin CLI (`scripts/admin_cli.py`)
- Command-line tool for administrators
- Configure execution mode
- Set RunPod credentials
- Test connections
- View current configuration

### 5. Unified Training (`ml/training/train.py`)
- Single training script for both environments
- Automatically uses configured mode
- Supports local GPU training
- Submits jobs to RunPod when configured

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI

# Install dependencies
pip install -r requirements.txt
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure for Local Mode (Default)

By default, the system runs in local mode:

```bash
# Check current configuration
python scripts/admin_cli.py show-config

# Ensure local mode is set
python scripts/admin_cli.py set-mode local
```

### 3. Configure for RunPod Mode

To use RunPod for inference and training:

```bash
# Set mode to RunPod
python scripts/admin_cli.py set-mode runpod

# Configure RunPod credentials (interactive)
python scripts/admin_cli.py set-runpod-credentials

# Or configure non-interactively
python scripts/admin_cli.py set-runpod-credentials \
  --api-key YOUR_RUNPOD_API_KEY \
  --endpoint-url https://api.runpod.ai/v2/YOUR_ENDPOINT_ID

# Test the connection
python scripts/admin_cli.py test-connection
```

### 4. Get RunPod Credentials

1. **Create RunPod Account**
   - Visit https://www.runpod.io/
   - Sign up for an account

2. **Get API Key**
   - Go to https://www.runpod.io/console/user/settings
   - Copy your API key

3. **Create Serverless Endpoint**
   - Navigate to Serverless section
   - Create a new endpoint
   - Deploy your model (or use a pre-built endpoint)
   - Copy the endpoint URL (format: `https://api.runpod.ai/v2/YOUR_ENDPOINT_ID`)

## Usage

### Running Inference

The inference API remains the same regardless of mode:

```bash
# Start the backend
cd backend
npm start

# In another terminal, start ML service
cd ml_service
python server.py

# Make inference requests (same for both modes)
curl -X POST http://localhost:3001/api/inference/infer \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is artificial intelligence?",
    "max_tokens": 512,
    "temperature": 0.7
  }'
```

The system automatically routes to local model or RunPod based on configuration.

### Training Models

#### Local Training

```bash
# Ensure local mode is active
python scripts/admin_cli.py set-mode local

# Run training
python ml/training/train.py \
  --dataset datasets/my_data.jsonl \
  --model mistralai/Mistral-7B-v0.1 \
  --epochs 3 \
  --learning-rate 2e-4 \
  --batch-size 4
```

#### RunPod Training

```bash
# Switch to RunPod mode
python scripts/admin_cli.py set-mode runpod

# Upload dataset to accessible URL (S3, HTTP server, etc.)
# For example: https://my-bucket.s3.amazonaws.com/dataset.jsonl

# Run training (dataset must be a URL)
python ml/training/train.py \
  --dataset https://my-bucket.s3.amazonaws.com/dataset.jsonl \
  --model mistralai/Mistral-7B-v0.1 \
  --epochs 3 \
  --learning-rate 2e-4 \
  --batch-size 4
```

**Note**: RunPod training requires the dataset to be accessible via URL. Upload your dataset to S3, Google Cloud Storage, or make it available via HTTP/HTTPS.

## Admin CLI Reference

### Show Configuration

```bash
python scripts/admin_cli.py show-config
```

Output:
```
======================================================================
  Current Runtime Configuration
======================================================================

Execution Mode: LOCAL

Local Mode: Models will be executed on this machine
```

### Set Mode

```bash
# Switch to local mode
python scripts/admin_cli.py set-mode local

# Switch to RunPod mode
python scripts/admin_cli.py set-mode runpod
```

### Configure RunPod

```bash
# Interactive configuration
python scripts/admin_cli.py set-runpod-credentials

# Non-interactive configuration
python scripts/admin_cli.py set-runpod-credentials \
  --api-key YOUR_API_KEY \
  --endpoint-url https://api.runpod.ai/v2/YOUR_ENDPOINT

# Skip connection test
python scripts/admin_cli.py set-runpod-credentials \
  --api-key YOUR_API_KEY \
  --endpoint-url https://api.runpod.ai/v2/YOUR_ENDPOINT \
  --no-test
```

### Test Connection

```bash
python scripts/admin_cli.py test-connection
```

### Advanced Settings

```bash
# Set request timeout (in seconds)
python scripts/admin_cli.py set-timeout 600

# Set maximum retry attempts
python scripts/admin_cli.py set-max-retries 5
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t civicai:latest .
```

### Run with Local Mode

```bash
docker run -d \
  --name civicai \
  --gpus all \
  -p 3001:3001 \
  -p 5000:5000 \
  -e RUNTIME_MODE=local \
  -v $(pwd)/models:/app/models \
  civicai:latest
```

### Run with RunPod Mode

```bash
docker run -d \
  --name civicai \
  -p 3001:3001 \
  -p 5000:5000 \
  -e RUNTIME_MODE=runpod \
  -e RUNPOD_API_KEY=your_api_key_here \
  -e RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/your_endpoint \
  civicai:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  civicai:
    build: .
    ports:
      - "3001:3001"
      - "5000:5000"
    environment:
      - RUNTIME_MODE=local
      - RUNPOD_API_KEY=${RUNPOD_API_KEY}
      - RUNPOD_ENDPOINT_URL=${RUNPOD_ENDPOINT_URL}
    volumes:
      - ./models:/app/models
      - ./data:/app/data
      - ./config:/app/config
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

Run with:

```bash
# Local mode
RUNTIME_MODE=local docker-compose up -d

# RunPod mode
RUNTIME_MODE=runpod \
RUNPOD_API_KEY=your_key \
RUNPOD_ENDPOINT_URL=https://api.runpod.ai/v2/endpoint \
docker-compose up -d
```

## Configuration File

The configuration is stored in `config/runtime_settings.json`:

```json
{
  "mode": "local",
  "runpod_api_key": null,
  "runpod_endpoint_url": null,
  "runpod_timeout": 300,
  "runpod_max_retries": 3
}
```

**Security Note**: This file may contain sensitive API keys. Ensure it's:
- Not committed to version control (add to .gitignore)
- Properly secured with file permissions
- Backed up securely

## Workflow Examples

### Development Workflow

1. **Develop locally**
   ```bash
   python scripts/admin_cli.py set-mode local
   ```

2. **Train and test on local GPU**
   ```bash
   python ml/training/train.py --dataset data/test.jsonl --epochs 1
   ```

3. **Test inference**
   ```bash
   python -c "from ml_service.model_interface import get_model_interface; \
              print(get_model_interface().infer('Test prompt'))"
   ```

### Production Workflow

1. **Switch to RunPod for production**
   ```bash
   python scripts/admin_cli.py set-mode runpod
   python scripts/admin_cli.py set-runpod-credentials
   ```

2. **Upload dataset to S3/Cloud Storage**
   ```bash
   aws s3 cp datasets/production.jsonl s3://my-bucket/production.jsonl
   ```

3. **Train on RunPod**
   ```bash
   python ml/training/train.py \
     --dataset https://my-bucket.s3.amazonaws.com/production.jsonl \
     --epochs 5
   ```

4. **Serve inference via RunPod**
   - All inference requests automatically route to RunPod
   - No code changes needed!

### Testing Workflow

1. **Test both modes**
   ```bash
   # Test local
   python scripts/admin_cli.py set-mode local
   python ml/training/train.py --dataset data/tiny.jsonl --epochs 1
   
   # Test RunPod
   python scripts/admin_cli.py set-mode runpod
   python scripts/admin_cli.py test-connection
   ```

## Troubleshooting

### Connection Issues

**Problem**: RunPod connection test fails

**Solutions**:
1. Verify API key is correct
2. Check endpoint URL format
3. Ensure endpoint is deployed and running
4. Check firewall/network settings
5. Verify RunPod account has sufficient credits

```bash
# Test connection
python scripts/admin_cli.py test-connection

# Increase timeout if network is slow
python scripts/admin_cli.py set-timeout 600
```

### Import Errors

**Problem**: `ModuleNotFoundError` when running scripts

**Solution**: Ensure Python path is correct

```bash
# From project root
export PYTHONPATH=/path/to/CivicAI:$PYTHONPATH
python scripts/admin_cli.py show-config
```

### Dataset Access (RunPod)

**Problem**: RunPod training fails with dataset access error

**Solution**: Dataset must be publicly accessible or use signed URLs

```bash
# Upload to S3 with public read
aws s3 cp dataset.jsonl s3://my-bucket/dataset.jsonl --acl public-read

# Or generate signed URL
aws s3 presign s3://my-bucket/dataset.jsonl --expires-in 7200
```

### Configuration Not Persisting

**Problem**: Configuration resets after restart

**Solution**: Check file permissions

```bash
# Ensure config directory is writable
chmod 755 config
chmod 644 config/runtime_settings.json
```

## Security Best Practices

1. **API Key Management**
   - Never commit API keys to version control
   - Use environment variables in production
   - Rotate API keys regularly
   - Use separate keys for dev/staging/prod

2. **File Permissions**
   ```bash
   # Restrict access to config file
   chmod 600 config/runtime_settings.json
   ```

3. **Network Security**
   - Use HTTPS for all RunPod endpoints
   - Implement rate limiting
   - Monitor API usage
   - Set appropriate timeouts

4. **Access Control**
   - Restrict admin CLI to authorized users only
   - Implement audit logging for mode changes
   - Use role-based access control (RBAC)

## Performance Considerations

### Local Mode
- **Pros**: No network latency, full control, no API costs
- **Cons**: Limited by local hardware, requires GPU for good performance
- **Best for**: Development, testing, small-scale inference

### RunPod Mode
- **Pros**: Powerful GPUs, scalable, pay-per-use
- **Cons**: Network latency, API costs, requires internet connection
- **Best for**: Production, heavy workloads, training large models

### Optimization Tips

1. **Batch requests** when possible to reduce API calls
2. **Use appropriate timeouts** based on expected workload
3. **Monitor costs** when using RunPod
4. **Cache results** for repeated queries
5. **Use local mode for development** to save costs

## Monitoring and Logging

All operations are logged with appropriate log levels:

```python
import logging
logging.basicConfig(level=logging.INFO)
```

Check logs for:
- Mode switches
- API requests/responses
- Training progress
- Errors and warnings

## Support

For issues and questions:
- GitHub Issues: https://github.com/robinandreeklund-collab/CivicAI/issues
- Documentation: See project README.md
- Admin CLI help: `python scripts/admin_cli.py --help`

## Version History

- **1.0.0** (2024): Initial implementation
  - Local/RunPod mode switching
  - Unified training interface
  - Admin CLI tool
  - Docker support
