# OQT-1.0 Installation Guide

Complete guide for installing and running OQT-1.0 with Mistral 7B and LLaMA-2 locally.

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or higher
- **Git**: Latest version
- **CUDA**: 11.8 or higher (for GPU support)
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

```bash
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI
```

---

## 2. Install Python Dependencies

### Create Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate
```

### Install Python Packages

```bash
# Install dependencies
pip install --upgrade pip
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

```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
```

---

## 3. Install Node.js Dependencies

### Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## 4. Download Models

### Option A: Automatic Download (Recommended)

Run the model download script:

```bash
python scripts/download_models.py
```

This will:
1. Download Mistral 7B Instruct from HuggingFace
2. Download LLaMA-2 7B Chat from HuggingFace
3. Save models to `models/` directory
4. Verify model integrity

### Option B: Manual Download

```bash
# Create models directory
mkdir -p models

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

```bash
ls -lh models/
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

### Create Firestore Collections

Run the Firebase setup script:

```bash
python scripts/setup_firebase.py
```

Or manually create collections via Firebase Console:

#### Required Collections:

1. **questions**
   - Stores user questions
   - Fields: `question`, `timestamp`, `userId`, `metadata`

2. **external_raw_responses**
   - Raw responses from external AI services
   - Fields: `questionId`, `service`, `response`, `timestamp`, `metadata`

3. **per_response_analysis**
   - Analysis results for each response
   - Fields: `responseId`, `bias`, `sentiment`, `toxicity`, `fairness`, `timestamp`

4. **oqt_training_events**
   - Training event logs
   - Fields: `eventId`, `type`, `timestamp`, `samplesProcessed`, `metrics`

5. **oqt_model_versions**
   - Model version history
   - Fields: `version`, `timestamp`, `metrics`, `trainingData`

6. **oqt_queries**
   - OQT-1.0 query logs
   - Fields: `queryId`, `question`, `response`, `confidence`, `timestamp`

7. **oqt_provenance**
   - Provenance tracking
   - Fields: `queryId`, `processingSteps`, `inputHash`, `timestamp`

8. **ledger_entries**
   - Blockchain-style ledger
   - Fields: `entryId`, `type`, `data`, `hash`, `previousHash`, `timestamp`

### Firestore Indexes

Create composite indexes for efficient queries:

```bash
# Run via Firebase CLI
firebase deploy --only firestore:indexes
```

Or create via Firebase Console:
- Collection: `questions`, Fields: `userId ASC, timestamp DESC`
- Collection: `oqt_queries`, Fields: `timestamp DESC`
- Collection: `oqt_training_events`, Fields: `type ASC, timestamp DESC`

### Download Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in project root
4. **IMPORTANT**: Add to `.gitignore` to prevent committing

---

## 6. Environment Configuration

### Create Environment Files

```bash
# Backend .env
cp backend/.env.example backend/.env

# Frontend .env
cp frontend/.env.example frontend/.env
```

### Configure Backend (.env)

Edit `backend/.env`:

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

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 7. Run the Application

### Start Python ML Service (Terminal 1)

```bash
# Activate virtual environment
source venv/bin/activate

# Start ML service
python ml_service/server.py
```

This starts the ML inference service on port 5000.

### Start Node.js Backend (Terminal 2)

```bash
cd backend
npm run dev
```

This starts the Express.js backend on port 3001.

### Start React Frontend (Terminal 3)

```bash
cd frontend
npm run dev
```

This starts the Vite dev server on port 3000.

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# Backend runs in production mode
cd ../backend
NODE_ENV=production node index.js
```

---

## 8. Verify Installation

### Test API Endpoints

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

### Test Frontend

1. Open browser: http://localhost:3000
2. Navigate to: http://localhost:3000/oqt-dashboard
3. Submit a test question
4. Verify response appears in chat

### Test ML Service

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

### Verify Firebase Connection

```bash
# Run Firebase connection test
npm run test:firebase
```

---

## Troubleshooting

### GPU Issues

If you encounter GPU memory errors:

```bash
# Reduce batch size in config
export MAX_BATCH_SIZE=1

# Use CPU only (slower)
export USE_GPU=false
export CUDA_VISIBLE_DEVICES=-1
```

### Model Download Issues

If HuggingFace downloads fail:

```bash
# Set cache directory
export HF_HOME=/path/to/large/disk/cache

# Resume interrupted download
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --resume-download
```

### Firebase Connection Issues

```bash
# Verify service account path
ls -la firebase-service-account.json

# Test Firebase connection
python -c "import firebase_admin; from firebase_admin import credentials, firestore; cred = credentials.Certificate('firebase-service-account.json'); firebase_admin.initialize_app(cred); db = firestore.client(); print('✓ Firebase connected')"
```

### Port Conflicts

If ports are already in use:

```bash
# Change backend port
export PORT=3002

# Change frontend port
export VITE_PORT=3001

# Or kill existing processes
lsof -ti:3001 | xargs kill -9
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
