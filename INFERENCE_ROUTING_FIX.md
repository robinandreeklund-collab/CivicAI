# Inference Routing Fix - DNA v2 Migration Guide

## Overview

This document describes the inference routing fixes and DNA v2 migration implemented to address routing issues following the DNA v2 model architecture update (PR #70).

## Key Changes

### 1. ML Service Updates (`ml_service/server.py`)

#### New Features
- **DNA v2 Certified Model Priority**: Automatically routes to `oneseek-certified` models
- **Rate Limiting**: 10 requests/minute per IP on `/infer` endpoint (using `slowapi`)
- **MODELS_DIR Support**: Dynamic model path resolution via environment variable
- **Enhanced Fallback Logic**: Graceful degradation from certified → legacy → base models
- **Legacy Route Deprecation**: Old endpoints return HTTP 410 with migration hints
- **Input Validation**: Pydantic v2 models with comprehensive validation
- **Improved Error Handling**: Clear error messages and migration guidance

#### New Endpoints

**`POST /infer`** (Primary Endpoint)
- Rate limited: 10 requests/minute per IP
- Routes to DNA v2 certified models with fallback
- Full input validation with Pydantic

Example request:
```json
{
  "text": "Your input text here",
  "max_length": 512,
  "temperature": 0.7,
  "top_p": 0.9
}
```

Example response:
```json
{
  "response": "Generated text...",
  "model": "OneSeek DNA v2 Certified",
  "tokens": 45,
  "latency_ms": 234.56
}
```

**`POST /infer-legacy`** (Deprecated)
- Returns HTTP 410 Gone
- Provides migration instructions
- Links to migration guide

**`GET /`** (Service Info)
- Returns service status and configuration
- Lists available endpoints
- Shows active model information

### 2. Environment Variables

New and updated environment variables:

```bash
# Primary model directory (NEW)
MODELS_DIR=/path/to/models

# Rate limiting (NEW)
RATE_LIMIT_PER_MINUTE=10

# Legacy support (still works)
PRODUCTION_MODELS_PATH=/app/models

# Manual model override
ONESEEK_MODEL_PATH=/path/to/specific/model

# ML Service URL for backend proxy
ML_SERVICE_URL=http://localhost:5000
```

### 3. Backend Proxy (`backend/index.js`)

New API routes for proxying to ML service:

- **`POST /api/inference/infer`**: Proxy to ML service `/infer` endpoint
- **`GET /api/inference/status`**: Check ML service availability

Features:
- Automatic error handling
- Rate limit forwarding
- Service availability detection
- Timeout handling (60s for inference)

### 4. Frontend Dashboard (`frontend/src/components/admin/InferencePanel.jsx`)

New admin panel component features:
- Test inference requests
- Display results and errors
- Service status monitoring
- Rate limit tracking
- Real-time latency metrics

## Model Routing Priority

The inference service follows this priority order:

1. **Environment Override**: `ONESEEK_MODEL_PATH` (if set)
2. **DNA v2 Certified**: `{MODELS_DIR}/oneseek-certified/OneSeek-7B-Zero-CURRENT` symlink
3. **Legacy Fallback**: `{MODELS_DIR}/oneseek-7b-zero/OneSeek-7B-Zero-CURRENT` symlink
4. **Error**: If no model found, service exits with clear error message

### DNA v2 Certified Models

Certified models follow the DNA naming convention:
```
OneSeek-7B-Zero.v{version}.sv.ds{dataset}.{train_hash}.{data_hash}/
```

Example:
```
models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
```

## Installation & Setup

### 1. Install Dependencies

```bash
# ML Service dependencies
cd ml_service
pip install -r requirements.txt

# Backend (axios already in package.json)
cd ../backend
npm install
```

### 2. Configure Environment

Create/update `.env` file:

```bash
# ML Service
MODELS_DIR=./models
ML_SERVICE_PORT=5000

# Backend
ML_SERVICE_URL=http://localhost:5000
PORT=3001
```

### 3. Set Active Model

Use the Admin Dashboard to set a DNA v2 certified model as active:

1. Navigate to Admin Dashboard → Models tab
2. Find a DNA v2 certified model (look for `OneSeek-7B-Zero.v*` format)
3. Click "Set as Active"
4. Restart ML service

Alternatively, create symlink manually:
```bash
cd models/oneseek-certified
ln -sf OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1 OneSeek-7B-Zero-CURRENT
```

## Testing

### 1. Start Services

```bash
# Terminal 1: ML Service
cd ml_service
python server.py

# Terminal 2: Backend
cd backend
npm start

# Terminal 3: Frontend (optional)
cd frontend
npm start
```

### 2. Test with curl

**Health check:**
```bash
curl http://localhost:5000/
```

**Inference request:**
```bash
curl -X POST http://localhost:5000/infer \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is the capital of Sweden?",
    "max_length": 100,
    "temperature": 0.7,
    "top_p": 0.9
  }'
```

**Test legacy endpoint (should return 410):**
```bash
curl -X POST http://localhost:5000/infer-legacy \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'
```

**Test via backend proxy:**
```bash
curl -X POST http://localhost:3001/api/inference/infer \
  -H "Content-Type: application/json" \
  -d '{
    "text": "What is the capital of Sweden?",
    "max_length": 100
  }'
```

### 3. Test Rate Limiting

Run this script to test rate limiting (10 req/min):

```bash
for i in {1..12}; do
  echo "Request $i:"
  curl -X POST http://localhost:5000/infer \
    -H "Content-Type: application/json" \
    -d '{"text": "test"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

Expected: First 10 requests succeed, 11th and 12th return HTTP 429.

### 4. Frontend Testing

1. Navigate to Admin Dashboard
2. Open "Inference Panel" tab
3. Enter test text
4. Click "Run Inference"
5. Verify results display correctly
6. Test multiple requests to observe rate limiting

## Troubleshooting

### Service Won't Start

**Error:** "ACTIVE MODEL NOT FOUND"

**Solution:**
1. Verify model symlink exists:
   ```bash
   ls -la models/oneseek-certified/OneSeek-7B-Zero-CURRENT
   ```
2. Set active model via Admin Dashboard
3. Check `MODELS_DIR` environment variable

### Rate Limit Issues

**Error:** HTTP 429 - Rate limit exceeded

**Solution:**
- Wait 60 seconds before retry
- Rate limit is per IP address
- Consider increasing limit in `server.py` if needed:
  ```python
  @limiter.limit("20/minute")  # Increase from 10 to 20
  ```

### Service Unavailable (503)

**Error:** "ML Service Unavailable"

**Solution:**
1. Verify ML service is running:
   ```bash
   curl http://localhost:5000/
   ```
2. Check `ML_SERVICE_URL` in backend `.env`
3. Review ML service logs for errors

### Legacy Endpoint Used

**Error:** HTTP 410 - Endpoint deprecated

**Solution:**
- Update code to use `/infer` instead of `/infer-legacy`
- Follow migration instructions in error response
- See this guide for details

### Fallback to Base Model

**Warning:** "Using base model fallback"

**Explanation:**
- No DNA v2 certified model found
- Using legacy model as fallback
- This works but isn't optimal

**Solution:**
1. Train/download a DNA v2 certified model
2. Set it as active via Admin Dashboard
3. Restart ML service

## Migration from Legacy

### Update API Calls

**Before:**
```javascript
// Old endpoint (deprecated)
fetch('/api/ml/inference', {
  method: 'POST',
  body: JSON.stringify({ text: input })
})
```

**After:**
```javascript
// New endpoint with validation
fetch('/api/inference/infer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    text: input,
    max_length: 512,
    temperature: 0.7,
    top_p: 0.9
  })
})
```

### Update Model References

**Before:**
```python
ONESEEK_PATH = "models/oneseek-7b-zero"
```

**After:**
```python
# Use environment variable or CURRENT symlink
ONESEEK_PATH = get_active_model_path()  # Auto-detects certified models
```

## Performance Notes

### Rate Limiting Impact

- Default: 10 requests/minute per IP
- Suitable for testing and low-traffic scenarios
- For production, consider:
  - Increasing limit
  - Implementing user-based limits
  - Using API keys for quotas

### Latency Expectations

- **CPU**: 2-10 seconds per inference
- **GPU (CUDA)**: 200-500ms per inference
- **Intel GPU (DirectML/IPEX)**: 500-1500ms per inference

Latency varies based on:
- Input text length
- max_length parameter
- Hardware capabilities
- Model size

## Related Documentation

- **DNA v2 Migration**: `ONESEEK_7B_ZERO_MIGRATION_GUIDE.md`
- **DNA v2 Structure**: `DNA_V2_IMPLEMENTATION_SUMMARY.md`
- **Certified Models**: `ONESEEK_CERTIFIED_STRUCTURE.md`
- **Testing Guide**: `TESTING_GUIDE_DNA_V2.md`

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review ML service logs
3. Verify environment variables
4. Check model symlinks
5. Consult DNA v2 migration guide

## Version History

- **v2.1.0** (Current): DNA v2 certified model support, rate limiting, MODELS_DIR
- **v2.0.0**: Initial DNA v2 migration
- **v1.1.0**: Dual-model support
- **v1.0.0**: Legacy single-model implementation
