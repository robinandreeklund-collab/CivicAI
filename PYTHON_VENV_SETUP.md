# Python Virtual Environment Setup for Admin Dashboard Training

The admin dashboard training feature requires a Python virtual environment with the necessary dependencies installed.

## Quick Setup

### Windows (PowerShell)

```powershell
# Navigate to python_services directory
cd backend/python_services

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; print('PyTorch:', torch.__version__)"
python -c "import transformers; print('Transformers:', transformers.__version__)"
python -c "import peft; print('PEFT:', peft.__version__)"
```

### Linux/Mac

```bash
# Navigate to python_services directory
cd backend/python_services

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; print('PyTorch:', torch.__version__)"
python -c "import transformers; print('Transformers:', transformers.__version__)"
python -c "import peft; print('PEFT:', peft.__version__)"
```

## How Admin Dashboard Uses the Virtual Environment

The admin dashboard backend automatically detects and uses the virtual environment:

**Windows:**
- Looks for: `backend/python_services/venv/Scripts/python.exe`
- Falls back to: `python` (system Python)

**Linux/Mac:**
- Looks for: `backend/python_services/venv/bin/python3`
- Falls back to: `python3` (system Python)

### Example Log Output

When training starts, you'll see:
```
Using virtual environment: C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe
```

Or if venv not found:
```
Virtual environment not found, using system python
```

## Required Dependencies

The `backend/python_services/requirements.txt` includes:

```
torch>=2.0.0
transformers>=4.30.0
peft>=0.4.0
datasets>=2.12.0
accelerate>=0.20.0
bitsandbytes>=0.39.0
scipy>=1.10.0
```

## Training Workflow

1. **User uploads dataset** via admin dashboard
2. **Dataset saved** to `/datasets/timestamp-uuid.jsonl`
3. **User configures** epochs, batch size, learning rate
4. **User clicks** "Start Training"
5. **Backend detects** venv location
6. **Backend spawns** Python process:
   ```
   backend/python_services/venv/Scripts/python.exe scripts/train_identity.py
   ```
7. **Environment variables** passed:
   - `DATASET_PATH`: Full path to dataset
   - `EPOCHS`: Number of epochs
   - `BATCH_SIZE`: Batch size
   - `LEARNING_RATE`: Learning rate
8. **Real-time logs** streamed to UI
9. **Training completes** or user stops

## Troubleshooting

### Virtual Environment Not Activating (Windows)

If you get execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Virtual Environment Not Found

The backend will log:
```
Virtual environment not found, using system python
```

**Solution:** Create the venv as shown in Quick Setup above.

### Import Errors During Training

If training logs show missing packages:
```
ModuleNotFoundError: No module named 'torch'
```

**Solution:**
1. Activate venv
2. Install requirements: `pip install -r requirements.txt`
3. Restart backend server

### CUDA Not Available

If you have GPU but PyTorch shows `CUDA available: False`:

**Windows:**
```powershell
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Linux:**
```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Path Issues

Ensure backend is started from the `backend/` directory:
```
cd backend
npm run dev
```

The backend will then correctly locate:
- `python_services/venv/` (virtual environment)
- `../datasets/` (datasets folder)
- `../scripts/train_identity.py` (training script)
- `../models/` (model outputs)

## Verification

After setup, verify everything works:

1. **Start backend:**
   ```
   cd backend
   npm run dev
   ```

2. **Check logs** when starting training in admin dashboard:
   ```
   Using virtual environment: <path to venv python>
   ```

3. **Training should show** real dependencies:
   ```
   ✅ PyTorch detected: 2.x.x
   ✅ Transformers detected: 4.x.x
   ✅ PEFT detected: 0.x.x
   ```

## Manual Testing (Outside Admin Dashboard)

To test training script directly:

**Windows:**
```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services
.\venv\Scripts\Activate.ps1
cd ..\..
$env:DATASET_PATH="datasets\oneseek_identity_v1.jsonl"
$env:EPOCHS="3"
$env:BATCH_SIZE="8"
$env:LEARNING_RATE="0.0001"
python scripts\train_identity.py
```

**Linux/Mac:**
```bash
cd backend/python_services
source venv/bin/activate
cd ../..
export DATASET_PATH="datasets/oneseek_identity_v1.jsonl"
export EPOCHS="3"
export BATCH_SIZE="8"
export LEARNING_RATE="0.0001"
python scripts/train_identity.py
```

## Summary

- ✅ Create venv in `backend/python_services/venv`
- ✅ Install dependencies from `requirements.txt`
- ✅ Backend auto-detects and uses venv Python
- ✅ Falls back to system Python if venv not found
- ✅ Training runs with all required packages
- ✅ Real-time logs show actual training progress

---

**Related Documentation:**
- `ADMIN_DASHBOARD_GUIDE.md` - Admin dashboard usage
- `INSTALLATION_ADMIN_DASHBOARD.md` - Installation instructions
- `ADMIN_REAL_DATA_INTEGRATION.md` - Real data integration details
