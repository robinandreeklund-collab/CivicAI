# OQT-1.0 Installation Guide

Complete guide for installing and running OQT-1.0 with Mistral 7B and LLaMA-2 locally.

**📁 Important**: All commands assume you are in the **project root directory** (`CivicAI/`) unless otherwise specified.

## 🔑 Virtual Environment Quick Reference

| Command Type | Requires venv? | Platform |
|-------------|---------------|----------|
| Python scripts (`python scripts/*.py`) | ✅ YES | All |
| ML service (`python ml_service/server.py`) | ✅ YES | All |
| Node.js commands (`npm install`, `npm run dev`) | ❌ NO | All |
| Model download (`huggingface-cli`) | ✅ YES | All |
| Firebase Python tests | ✅ YES | All |

**How to activate venv:**
- **Linux/Mac**: `source venv/bin/activate`
- **Windows**: `.\venv\Scripts\Activate.ps1`

---

## Quick Start (Automated)

For a quick automated setup, use one of these scripts:

### Linux/Mac (Bash):
```bash
./scripts/quick_setup.sh
```

### Windows (PowerShell):
```powershell
.\scripts\quick_setup.ps1
```

These scripts will:
- ✅ Create Python virtual environment
- ✅ Install all dependencies (Python + Node.js)
- ✅ Download models (optional)
- ✅ Setup Firebase collections (optional)
- ✅ Create .env configuration files

**Continue below for detailed manual installation steps.**

---

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **Git**: Latest version
- **CUDA**: 11.8 or higher (for GPU support, optional)
- **Disk Space**: At least 50GB free (for model weights)
- **RAM**: 16GB minimum (32GB recommended)
- **GPU**: NVIDIA GPU with 12GB+ VRAM (recommended for production)

## Table of Contents

1. [Clone Repository](#1-clone-repository)
2. [Install Python Dependencies](#2-install-python-dependencies)
3. [Install Node.js Dependencies](#3-install-nodejs-dependencies)
4. [Download Models](#4-download-models)
5. [Setup Firebase](#5-setup-firebase)
6. [Environment Configuration](#6-environment-configuration)
7. [Run the Application](#7-run-the-application)
8. [Verify Installation](#8-verify-installation)

---

## 1. Clone Repository

**📁 Run from**: Any directory where you want to install the project

### Linux/Mac (Bash):
```bash
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI
```

### Windows (PowerShell):
```powershell
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI
```

**Current directory**: `CivicAI/` (project root)

---

## 2. Install Python Dependencies

**📁 Run from**: `CivicAI/` (project root)

### Create Python Virtual Environment

### Linux/Mac (Bash):
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### Windows (PowerShell):
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an error about execution policy, run this first:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Note**: Keep this terminal open with the virtual environment activated for all Python commands.

### Install Python Packages

**📁 Run from**: `CivicAI/` (project root, with venv activated)

### Linux/Mac (Bash):
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Windows (PowerShell):
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

The `requirements.txt` includes:
- PyTorch 2.0+ (with CUDA support)
- Transformers 4.35+
- Accelerate 0.24+
- Firebase Admin SDK
- FastAPI/Flask for API endpoints
- Additional ML and NLP libraries

### Verify Python Installation

**📁 Run from**: `CivicAI/` (project root, with venv activated)

### Linux/Mac (Bash):
```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
```

### Windows (PowerShell):
```powershell
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
```

---

## 3. Install Node.js Dependencies

### Backend Dependencies

**📁 Run from**: `CivicAI/` (project root)

### Linux/Mac (Bash):
```bash
cd backend
npm install
cd ..
```

### Windows (PowerShell):
```powershell
cd backend
npm install
cd ..
```

**Current directory**: Back in `CivicAI/` (project root)

### Frontend Dependencies

**📁 Run from**: `CivicAI/` (project root)

### Linux/Mac (Bash):
```bash
cd frontend
npm install
cd ..
```

### Windows (PowerShell):
```powershell
cd frontend
npm install
cd ..
```

**Current directory**: Back in `CivicAI/` (project root)

---

## 4. Download Models

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: Virtual environment must be activated for this step

### Option A: Automatic Download (Recommended)

### Linux/Mac (Bash):
```bash
# Make sure venv is activated first
source venv/bin/activate

# Download models
python scripts/download_models.py
```

### Windows (PowerShell):
```powershell
# Make sure venv is activated first
.\venv\Scripts\Activate.ps1

# Download models
python scripts/download_models.py
```

This will:
1. Download Mistral 7B Instruct from HuggingFace
2. Download LLaMA-2 7B Chat from HuggingFace
3. Save models to `models/` directory
4. Verify model integrity

### Option B: Manual Download

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: Virtual environment must be activated

### Linux/Mac (Bash):
```bash
# Make sure venv is activated first
source venv/bin/activate

# Create models directory
mkdir -p models

# Download Mistral 7B
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --local-dir models/mistral-7b-instruct

# Download LLaMA-2 7B (requires HuggingFace access token)
huggingface-cli login
huggingface-cli download meta-llama/Llama-2-7b-chat-hf --local-dir models/llama-2-7b-chat
```

### Windows (PowerShell):
```powershell
# Make sure venv is activated first
.\venv\Scripts\Activate.ps1

# Create models directory
New-Item -ItemType Directory -Force -Path models

# Download Mistral 7B
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --local-dir models/mistral-7b-instruct

# Download LLaMA-2 7B (requires HuggingFace access token)
huggingface-cli login
huggingface-cli download meta-llama/Llama-2-7b-chat-hf --local-dir models/llama-2-7b-chat
```

**Note**: For LLaMA-2, you need to:
1. Request access at https://huggingface.co/meta-llama/Llama-2-7b-chat-hf
2. Wait for approval (usually within hours)
3. Generate HuggingFace token at https://huggingface.co/settings/tokens
4. Run `huggingface-cli login` and paste your token

### Verify Models

**📁 Run from**: `CivicAI/` (project root)

### Linux/Mac (Bash):
```bash
ls -lh models/
```

### Windows (PowerShell):
```powershell
Get-ChildItem -Path models\ -Recurse | Measure-Object -Property Length -Sum
dir models\
```

You should see:
- `models/mistral-7b-instruct/` (≈14GB)
- `models/llama-2-7b-chat/` (≈13GB)

---

## 5. Setup Firebase

### Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add Project"
3. Follow the setup wizard
4. Enable Firestore Database
5. Download service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebase-service-account.json` in `CivicAI/` (project root)

### Create Firestore Collections

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: 
- Virtual environment must be activated
- Make sure `firebase-service-account.json` is in the project root before running

**Note**: The script now creates only **6 essential collections** based on actual usage in the code. Redundant collections have been removed to simplify the database structure.

### Linux/Mac (Bash):
```bash
# Make sure venv is activated first
source venv/bin/activate

# Setup Firebase collections
python scripts/setup_firebase.py
```

### Windows (PowerShell):
```powershell
# Make sure venv is activated first
.\venv\Scripts\Activate.ps1

# Alternativ 1: Använd Python-scriptet (REKOMMENDERAT)
python scripts/setup_firebase.py

# Alternativ 2: Använd PowerShell-scriptet för vägledning
# (Visar collections som ska skapas, men skapar inte själva collections)
.\scripts\setup_firebase.ps1

# Alternativ 3: Använd PowerShell-scriptet för detaljerad vägledning
.\scripts\create_collections.ps1
```

**PowerShell-scriptets funktioner**:
- `setup_firebase.ps1`: Visar collections, exporterar schema till JSON
- `create_collections.ps1`: Detaljerad manual för att skapa collections via Firebase Console

**Notera**: PowerShell-scripten skapar INTE själva collections automatiskt pga Firebase REST API komplexitet. De ger istället tydliga instruktioner för manuell skapning via Firebase Console eller rekommenderar Python-scriptet.

Or manually create collections via Firebase Console:

#### Required Collections (6 st):

1. **ai_interactions**
   - Unified storage for questions, raw AI responses, and ML analyses
   - Fields: `interactionId`, `question{}`, `raw_responses[]`, `processed_data{}`, `timestamp`
   - Purpose: Central data source for training and analysis

2. **oqt_queries**
   - Direct queries to OQT-1.0 from dashboard
   - Fields: `queryId`, `question`, `response`, `confidence`, `timestamp`, `model`, `version`, `metadata{}`
   - Purpose: Track user interactions with OQT-1.0

3. **oqt_training_events**
   - Training event logs (micro-training and batch training)
   - Fields: `trainingId`, `type`, `timestamp`, `samplesProcessed`, `stage1{}`, `stage2{}`, `modelVersion`, `metrics{}`
   - Purpose: Transparency around model training

4. **oqt_metrics**
   - Performance metrics over time
   - Fields: `metricId`, `version`, `timestamp`, `metrics{}`, `training{}`
   - Purpose: Dashboard "Mätvärden" tab

5. **oqt_provenance**
   - Provenance tracking for transparency
   - Fields: `provenanceId`, `queryId`, `timestamp`, `model`, `version`, `processingSteps[]`, `inputHash`
   - Purpose: Complete traceability of decisions

6. **oqt_ledger**
   - Blockchain-style immutable ledger
   - Fields: `blockNumber`, `type`, `timestamp`, `data{}`, `hash`, `previousHash`
   - Purpose: Immutable audit trail

**Removed redundant collections**: `questions`, `external_raw_responses`, `per_response_analysis`, `oqt_model_versions`, `ledger_entries` (their data is now in `ai_interactions`, `oqt_training_events`, or `oqt_ledger`).

See `OQT-1.0-README.md` for complete schema documentation.

### Firestore Indexes

**📁 Run from**: `CivicAI/` (project root)

Create composite indexes for efficient queries:

### Linux/Mac (Bash):
```bash
# Run via Firebase CLI (if installed)
firebase deploy --only firestore:indexes
```

### Windows (PowerShell):
```powershell
# Run via Firebase CLI (if installed)
firebase deploy --only firestore:indexes
```

Or create via Firebase Console:
- Collection: `ai_interactions`, Fields: `question.source ASC, timestamp DESC`
- Collection: `ai_interactions`, Fields: `timestamp DESC`
- Collection: `oqt_queries`, Fields: `timestamp DESC`
- Collection: `oqt_queries`, Fields: `version ASC, timestamp DESC`
- Collection: `oqt_training_events`, Fields: `type ASC, timestamp DESC`
- Collection: `oqt_training_events`, Fields: `modelVersion ASC, timestamp DESC`
- Collection: `oqt_metrics`, Fields: `version ASC, timestamp DESC`
- Collection: `oqt_provenance`, Fields: `queryId ASC`
- Collection: `oqt_ledger`, Fields: `blockNumber ASC`
- Collection: `oqt_ledger`, Fields: `type ASC, timestamp DESC`

---

## 6. Environment Configuration

**📁 Run from**: `CivicAI/` (project root)

### Create Environment Files

### Linux/Mac (Bash):
```bash
# Backend .env
cp backend/.env.example backend/.env

# Frontend .env
cp frontend/.env.example frontend/.env
```

### Windows (PowerShell):
```powershell
# Backend .env
Copy-Item backend\.env.example backend\.env

# Frontend .env
Copy-Item frontend\.env.example frontend\.env
```

### Configure Backend (.env)

**📁 Edit file**: `CivicAI/backend/.env`

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=../firebase-service-account.json

# Or use individual credentials:
# FIREBASE_CLIENT_EMAIL=your-client-email
# FIREBASE_PRIVATE_KEY=your-private-key

# Model Paths
MISTRAL_MODEL_PATH=../models/mistral-7b-instruct
LLAMA_MODEL_PATH=../models/llama-2-7b-chat

# API Keys (Optional - for external AI services)
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
XAI_API_KEY=your-xai-key

# GPU Configuration
CUDA_VISIBLE_DEVICES=0
USE_GPU=true
```

### Configure Frontend (.env)

**📁 Edit file**: `CivicAI/frontend/.env`

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 7. Run the Application

You need **3 separate terminals** to run all services. Keep all terminals open while using the application.

### Terminal 1: Start Python ML Service

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: Virtual environment must be activated

### Linux/Mac (Bash):
```bash
# Activate virtual environment (if not already activated)
source venv/bin/activate

# Start ML service
python ml_service/server.py
```

**Expected output**: 
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
Starting ML Service...
Device: cuda
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

### Windows (PowerShell):
```powershell
# Activate virtual environment (if not already activated)
.\venv\Scripts\Activate.ps1

# Start ML service
python ml_service/server.py
```

**Expected output**: 
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
Starting ML Service...
Device: cuda
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

**Service running on**: http://localhost:5000  
**⚠️ Keep this terminal open** - The ML service must continue running

---

### Terminal 2: Start Node.js Backend

**📁 Run from**: `CivicAI/` (project root)  
**ℹ️ Note**: Virtual environment NOT required for Node.js

### Linux/Mac (Bash):
```bash
# Navigate to backend
cd backend

# Start backend server
npm run dev
```

**Expected output**:
```
> backend@1.0.0 dev
> nodemon index.js

[nodemon] starting `node index.js`
Server running on port 3001
```

### Windows (PowerShell):
```powershell
# Navigate to backend
cd backend

# Start backend server
npm run dev
```

**Expected output**:
```
> backend@1.0.0 dev
> nodemon index.js

[nodemon] starting `node index.js`
Server running on port 3001
```

**Service running on**: http://localhost:3001  
**⚠️ Keep this terminal open** - The backend must continue running

---

### Terminal 3: Start React Frontend

**📁 Run from**: `CivicAI/` (project root)  
**ℹ️ Note**: Virtual environment NOT required for Node.js

### Linux/Mac (Bash):
```bash
# Navigate to frontend
cd frontend

# Start frontend dev server
npm run dev
```

**Expected output**:
```
  VITE v5.4.21  ready in 324 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Windows (PowerShell):
```powershell
# Navigate to frontend
cd frontend

# Start frontend dev server
npm run dev
```

**Expected output**:
```
  VITE v5.4.21  ready in 324 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Service running on**: http://localhost:3000  
**⚠️ Keep this terminal open** - The frontend must continue running

---

### Access the Application

**All three services must be running** before accessing the application.

Open your browser and go to:
- **OQT Dashboard**: http://localhost:3000/oqt-dashboard
- **Homepage**: http://localhost:3000

**✅ Success indicators**:
- OQT Dashboard loads with chat interface
- You can type a question and click "Skicka"
- Response appears in chat bubbles

### Production Build

**📁 Run from**: `CivicAI/` (project root)  
**ℹ️ Note**: Virtual environment NOT required for building frontend

### Linux/Mac (Bash):
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Start ML service (with venv activated)
source venv/bin/activate
python ml_service/server.py &

# Backend runs in production mode
cd backend
NODE_ENV=production node index.js
```

### Windows (PowerShell):
```powershell
# Build frontend
cd frontend
npm run build
cd ..

# Start ML service in separate terminal (with venv activated)
# Terminal 1:
.\venv\Scripts\Activate.ps1
python ml_service/server.py

# Backend runs in production mode
# Terminal 2:
cd backend
$env:NODE_ENV="production"
node index.js
```

---

## 8. Verify Installation

### Test API Endpoints

**📁 Run from**: Any terminal (services must be running)

### Linux/Mac (Bash):
```bash
# Check backend health
curl http://localhost:3001/health

# Check OQT status
curl http://localhost:3001/api/oqt/status

# Test query (requires backend + ML service)
curl -X POST http://localhost:3001/api/oqt/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Vad är demokrati?"}'
```

### Windows (PowerShell):
```powershell
# Check backend health
Invoke-WebRequest -Uri http://localhost:3001/health

# Check OQT status
Invoke-WebRequest -Uri http://localhost:3001/api/oqt/status

# Test query (requires backend + ML service)
Invoke-RestMethod -Uri http://localhost:3001/api/oqt/query `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"question": "Vad är demokrati?"}'
```

### Test Frontend

1. Open browser: http://localhost:3000
2. Navigate to: http://localhost:3000/oqt-dashboard
3. Submit a test question in the chat input
4. Verify response appears in chat bubbles

### Test ML Service

**📁 Run from**: Any terminal (ML service must be running)

### Linux/Mac (Bash):
```bash
# Test Mistral inference
curl -X POST http://localhost:5000/inference/mistral \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är AI?"}'

# Test LLaMA inference
curl -X POST http://localhost:5000/inference/llama \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är AI?"}'
```

### Windows (PowerShell):
```powershell
# Test Mistral inference
Invoke-RestMethod -Uri http://localhost:5000/inference/mistral `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"text": "Vad är AI?"}'

# Test LLaMA inference
Invoke-RestMethod -Uri http://localhost:5000/inference/llama `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"text": "Vad är AI?"}'
```

### Verify Firebase Connection

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: Virtual environment must be activated

### Linux/Mac (Bash):
```bash
# Activate venv
source venv/bin/activate

# Test Firebase connection with Python
python -c "import firebase_admin; from firebase_admin import credentials, firestore; cred = credentials.Certificate('firebase-service-account.json'); firebase_admin.initialize_app(cred); db = firestore.client(); print('✓ Firebase connected')"
```

### Windows (PowerShell):
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Test Firebase connection with Python
python -c "import firebase_admin; from firebase_admin import credentials, firestore; cred = credentials.Certificate('firebase-service-account.json'); firebase_admin.initialize_app(cred); db = firestore.client(); print('✓ Firebase connected')"
```

---

## Troubleshooting

### GPU Issues

If you encounter GPU memory errors:

### Linux/Mac (Bash):
```bash
# Reduce batch size in config
export MAX_BATCH_SIZE=1

# Use CPU only (slower)
export USE_GPU=false
export CUDA_VISIBLE_DEVICES=-1
```

### Windows (PowerShell):
```powershell
# Reduce batch size in config
$env:MAX_BATCH_SIZE=1

# Use CPU only (slower)
$env:USE_GPU="false"
$env:CUDA_VISIBLE_DEVICES="-1"
```

### Model Download Issues

If HuggingFace downloads fail:

### Linux/Mac (Bash):
```bash
# Set cache directory
export HF_HOME=/path/to/large/disk/cache

# Resume interrupted download
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --resume-download
```

### Windows (PowerShell):
```powershell
# Set cache directory
$env:HF_HOME="C:\path\to\large\disk\cache"

# Resume interrupted download
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --resume-download
```

### Firebase Connection Issues

**📁 Run from**: `CivicAI/` (project root)  
**⚠️ Important**: Virtual environment must be activated for Python commands

### Linux/Mac (Bash):
```bash
# Verify service account path
ls -la firebase-service-account.json

# Activate venv
source venv/bin/activate

# Test Firebase connection
python -c "import firebase_admin; from firebase_admin import credentials, firestore; cred = credentials.Certificate('firebase-service-account.json'); firebase_admin.initialize_app(cred); db = firestore.client(); print('✓ Firebase connected')"
```

### Windows (PowerShell):
```powershell
# Verify service account path
Get-Item firebase-service-account.json

# Activate venv
.\venv\Scripts\Activate.ps1

# Test Firebase connection
python -c "import firebase_admin; from firebase_admin import credentials, firestore; cred = credentials.Certificate('firebase-service-account.json'); firebase_admin.initialize_app(cred); db = firestore.client(); print('✓ Firebase connected')"
```

### Port Conflicts

If ports are already in use:

### Linux/Mac (Bash):
```bash
# Change backend port
export PORT=3002

# Change frontend port
export VITE_PORT=3001

# Or kill existing processes
lsof -ti:3001 | xargs kill -9
```

### Windows (PowerShell):
```powershell
# Change backend port
$env:PORT=3002

# Change frontend port
$env:VITE_PORT=3001

# Or kill existing processes
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

---

## Performance Optimization

### For Production Deployment

1. **Use GPU Acceleration**
   - Install CUDA toolkit
   - Verify `torch.cuda.is_available()` returns `True`

2. **Enable Model Quantization**
   ```python
   # In ML service config
   USE_8BIT_QUANTIZATION=true
   ```

3. **Redis Caching**
   ```bash
   # Install Redis
   sudo apt install redis-server
   
   # Configure in .env
   REDIS_URL=redis://localhost:6379
   ```

4. **Load Balancing**
   - Use nginx for reverse proxy
   - Deploy multiple ML service instances
   - Use PM2 for Node.js process management

---

## Directory Structure

```
CivicAI/
├── backend/
│   ├── api/
│   │   └── oqt.js              # OQT API endpoints
│   ├── services/
│   │   ├── mistral.js          # Mistral integration
│   │   ├── llama.js            # LLaMA integration
│   │   └── oqtMultiModelPipeline.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── pages/
│   │       └── OQTDashboardPage.jsx
│   └── package.json
├── ml_service/
│   ├── server.py               # ML inference service
│   ├── models.py               # Model loading
│   └── inference.py            # Inference logic
├── models/
│   ├── mistral-7b-instruct/    # Mistral model files
│   └── llama-2-7b-chat/        # LLaMA model files
├── scripts/
│   ├── download_models.py      # Model download script
│   └── setup_firebase.py       # Firebase setup script
├── requirements.txt            # Python dependencies
└── firebase-service-account.json  # Firebase credentials
```

---

## Next Steps

1. **Configure Firebase Rules**
   - Set up security rules in Firebase Console
   - Enable authentication if needed

2. **Monitor Performance**
   - Check GPU utilization: `nvidia-smi`
   - Monitor memory: `htop`
   - Check logs: `tail -f backend/logs/app.log`

3. **Scale the System**
   - Deploy to cloud (AWS, GCP, Azure)
   - Set up CI/CD pipeline
   - Configure monitoring (Prometheus, Grafana)

4. **Fine-tune Models**
   - Collect training data
   - Run weekly batch training
   - Monitor model metrics

---

## Support

For issues or questions:
- Check documentation: `docs/`
- Review API reference: `docs/OQT_MULTI_MODEL_API.md`
- Open GitHub issue: https://github.com/robinandreeklund-collab/CivicAI/issues

---

**Installation complete!** 🎉

Your OQT-1.0 system with Mistral 7B and LLaMA-2 should now be running locally.
