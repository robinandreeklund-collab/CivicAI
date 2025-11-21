# OQT-1.0 Verification Guide

This guide helps verify that all components of OQT-1.0 are correctly installed and functional.

## Quick Verification (No Models Required)

These tests verify the system works in **simulated mode** (without downloading the 27GB model files).

### Prerequisites Check

```bash
# Check Python version (should be 3.10+)
python3 --version

# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

### 1. Backend Services Verification

```bash
cd /home/runner/work/CivicAI/CivicAI/backend

# Install dependencies
npm install

# Test service imports
echo "Testing Mistral service..."
node -e "import('./services/mistral.js').then(m => console.log('✓ Mistral service OK')).catch(e => console.error('✗ Error:', e.message))"

echo "Testing LLaMA service..."
node -e "import('./services/llama.js').then(m => console.log('✓ LLaMA service OK')).catch(e => console.error('✗ Error:', e.message))"

echo "Testing OQT Multi-Model Pipeline..."
node -e "import('./services/oqtMultiModelPipeline.js').then(m => console.log('✓ Pipeline OK')).catch(e => console.error('✗ Error:', e.message))"

echo "Testing OQT API..."
node -e "import('./api/oqt.js').then(m => console.log('✓ OQT API OK')).catch(e => console.error('✗ Error:', e.message))"
```

**Expected Output**: All services should show "✓ ... OK"

### 2. Python ML Service Verification

```bash
cd /home/runner/work/CivicAI/CivicAI

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\Activate.ps1  # Windows

# Install minimal dependencies for verification
pip install fastapi uvicorn pydantic

# Test Python imports
python3 -c "from fastapi import FastAPI; print('✓ FastAPI installed')"
python3 -c "import uvicorn; print('✓ Uvicorn installed')"

# Test ML service syntax
python3 -m py_compile ml_service/server.py
echo "✓ ML service syntax OK"
```

**Expected Output**: All imports should succeed

### 3. Firebase Setup Script Verification

```bash
# Test setup_firebase.py syntax
python3 -m py_compile scripts/setup_firebase.py
echo "✓ Firebase setup script syntax OK"

# Show collections that will be created
python3 -c "
import sys
sys.path.insert(0, 'scripts')
exec(open('scripts/setup_firebase.py').read().replace('if __name__', 'if False'))
for name in COLLECTIONS.keys():
    print(f'  - {name}')
print('✓ 6 collections defined')
"
```

**Expected Output**: Shows 6 collections:
- ai_interactions
- oqt_queries
- oqt_training_events
- oqt_metrics
- oqt_provenance
- oqt_ledger

### 4. API Endpoints Verification (Simulated)

**Start Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Should start on http://localhost:3001
```

**Test Endpoints** (Terminal 2):
```bash
# Test OQT status endpoint
curl http://localhost:3001/api/oqt/status

# Expected: JSON with status: "up"

# Test OQT query (simulated)
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vad är demokrati?"}'

# Expected: JSON with response, confidence, version

# Test multi-model query (simulated)
curl -X POST http://localhost:3001/api/oqt/multi-model-query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vad är AI?", "includeExternal": false, "enableTraining": true}'

# Expected: JSON with analysis, consensus, bias, fairness

# Test metrics endpoint
curl http://localhost:3001/api/oqt/metrics

# Expected: JSON with model metrics
```

### 5. Frontend Verification

```bash
cd frontend

# Install dependencies
npm install

# Build frontend
npm run build

# Expected: Build completes successfully, creates dist/ folder
```

**Test Dev Server**:
```bash
npm run dev
# Should start on http://localhost:3000
# Open http://localhost:3000/oqt-dashboard
```

**Expected**: 
- Dashboard loads
- Chat interface visible
- Can type questions (gets simulated responses)

## Full Verification (With Models)

These tests require downloading the 27GB model files.

### 1. Download Models

```bash
# Activate virtual environment
source venv/bin/activate

# Install full dependencies
pip install -r requirements.txt

# Download models (requires ~27GB disk space)
python scripts/download_models.py

# Verify models exist
ls -lh models/mistral-7b-instruct/
ls -lh models/llama-2-7b-chat/
```

**Expected**: Model directories should contain config.json, tokenizer files, and .safetensors files

### 2. ML Service with Real Models

**Start ML Service** (Terminal 1):
```bash
source venv/bin/activate
python ml_service/server.py
# Should start on http://localhost:5000
```

**Test Real Inference** (Terminal 2):
```bash
# Test Mistral inference
curl -X POST http://localhost:5000/inference/mistral \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är AI?", "max_length": 256}'

# Expected: JSON with real Mistral-generated response

# Test LLaMA inference
curl -X POST http://localhost:5000/inference/llama \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är demokrati?", "max_length": 256}'

# Expected: JSON with real LLaMA-generated response

# Check models loaded
curl http://localhost:5000/models/status

# Expected: Shows mistral and llama as loaded
```

### 3. Complete Stack Test

**Start All Services**:

Terminal 1 - ML Service:
```bash
source venv/bin/activate
python ml_service/server.py
```

Terminal 2 - Backend:
```bash
cd backend
npm run dev
```

Terminal 3 - Frontend:
```bash
cd frontend
npm run dev
```

**Test Integration**:
1. Open http://localhost:3000/oqt-dashboard
2. Ask question: "Vad är demokrati?"
3. Verify response comes from real models (should be more detailed than simulated)
4. Check console for ML service logs showing real inference

## Verification Checklist

### ✅ Simulated Mode (No Models)
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] All backend services import successfully
- [ ] ML service syntax valid
- [ ] Firebase setup script syntax valid
- [ ] 6 collections defined correctly
- [ ] Backend starts on port 3001
- [ ] `/api/oqt/status` returns UP
- [ ] `/api/oqt/query` returns simulated response
- [ ] `/api/oqt/multi-model-query` returns analysis
- [ ] Frontend builds successfully
- [ ] OQT Dashboard loads in browser

### ✅ Full Mode (With Models)
- [ ] Virtual environment created
- [ ] Full Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Models downloaded (~27GB)
- [ ] Mistral model files exist
- [ ] LLaMA model files exist
- [ ] ML service starts successfully
- [ ] Mistral inference works
- [ ] LLaMA inference works
- [ ] Models show as loaded in status endpoint
- [ ] Complete stack runs (ML + Backend + Frontend)
- [ ] Dashboard shows real model responses

## Troubleshooting

### Backend won't start
```bash
# Check for port conflicts
lsof -i:3001  # Linux/Mac
netstat -ano | findstr :3001  # Windows

# Kill process if needed
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### ML Service errors
```bash
# Check GPU availability
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"

# Use CPU if no GPU
export USE_GPU=false
python ml_service/server.py
```

### Model download fails
```bash
# Check disk space
df -h  # Linux/Mac
Get-PSDrive  # Windows

# Resume interrupted download
python scripts/download_models.py --resume
```

### Firebase connection issues
```bash
# Verify service account file exists
ls firebase-service-account.json

# Check file permissions
chmod 600 firebase-service-account.json  # Linux/Mac

# Test Firebase connection
python -c "
import firebase_admin
from firebase_admin import credentials, firestore
cred = credentials.Certificate('firebase-service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()
print('✓ Firebase connected')
"
```

## Summary

### What Works Now (Simulated):
✅ All API endpoints functional  
✅ Multi-model pipeline orchestration  
✅ Consensus/bias/fairness analysis  
✅ Firebase integration ready  
✅ Dashboard UI complete  
✅ Ledger system functional  

### What Requires Models:
🔄 Real Mistral 7B inference (27GB)  
🔄 Real LLaMA-2 inference (27GB)  
🔄 Actual model training  
🔄 LoRA fine-tuning  

### Next Steps:
1. ✅ Verify simulated mode works
2. 🔄 Download models (if needed)
3. 🔄 Test real inference
4. 🔄 Implement training pipeline
5. 🔄 Production deployment

---

**Note**: This guide is designed to verify OQT-1.0 works correctly in your environment. All simulated mode tests should pass without downloading models.
