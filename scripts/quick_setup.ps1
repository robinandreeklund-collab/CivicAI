# Quick Setup Script for OQT-1.0 (PowerShell)
# Run this script to set up the entire environment on Windows

$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "OQT-1.0 Quick Setup (Windows)"
Write-Host "=========================================="
Write-Host ""

# Check Python version
Write-Host "Checking Python version..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion"
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10 or higher."
    exit 1
}

# Check Node version
Write-Host "Checking Node.js version..."
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion"
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
}

# Check for CUDA (optional)
Write-Host "Checking CUDA..."
try {
    $cudaCheck = nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader 2>&1 | Select-Object -First 1
    Write-Host "✓ CUDA available: $cudaCheck"
} catch {
    Write-Host "⚠️  CUDA not found - will use CPU (slower)"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 1: Create Python Virtual Environment"
Write-Host "=========================================="
Write-Host ""

# Create virtual environment
python -m venv venv
Write-Host "✓ Virtual environment created"

# Activate virtual environment
Write-Host "Activating virtual environment..."
& .\venv\Scripts\Activate.ps1
Write-Host "✓ Virtual environment activated"

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 2: Install Python Dependencies"
Write-Host "=========================================="
Write-Host ""

python -m pip install --upgrade pip
pip install -r requirements.txt
Write-Host "✓ Python dependencies installed"

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 3: Install Node.js Dependencies"
Write-Host "=========================================="
Write-Host ""

Write-Host "Installing backend dependencies..."
cd backend
npm install
cd ..
Write-Host "✓ Backend dependencies installed"

Write-Host "Installing frontend dependencies..."
cd frontend
npm install
cd ..
Write-Host "✓ Frontend dependencies installed"

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 4: Download Models (Optional)"
Write-Host "=========================================="
Write-Host ""

$downloadModels = Read-Host "Download Mistral 7B and LLaMA-2 now? (y/n)"
if ($downloadModels -eq "y" -or $downloadModels -eq "Y") {
    Write-Host "Starting model download..."
    python scripts/download_models.py
    Write-Host "✓ Models downloaded"
} else {
    Write-Host "⊗ Skipped model download. Run manually: python scripts/download_models.py"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 5: Setup Firebase (Optional)"
Write-Host "=========================================="
Write-Host ""

if (Test-Path "firebase-service-account.json") {
    $setupFirebase = Read-Host "Firebase service account found. Setup collections now? (y/n)"
    if ($setupFirebase -eq "y" -or $setupFirebase -eq "Y") {
        Write-Host "Setting up Firebase collections..."
        python scripts/setup_firebase.py
        Write-Host "✓ Firebase setup complete"
    } else {
        Write-Host "⊗ Skipped Firebase setup. Run manually: python scripts/setup_firebase.py"
    }
} else {
    Write-Host "⚠️  Firebase service account not found (firebase-service-account.json)"
    Write-Host "   Download from Firebase Console and run: python scripts/setup_firebase.py"
}

Write-Host ""
Write-Host "=========================================="
Write-Host "Step 6: Environment Configuration"
Write-Host "=========================================="
Write-Host ""

# Create .env files if they don't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend\.env from example..."
    if (Test-Path "backend\.env.example") {
        Copy-Item backend\.env.example backend\.env
    } else {
        Write-Host "⚠️  No .env.example found"
    }
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "Creating frontend\.env from example..."
    if (Test-Path "frontend\.env.example") {
        Copy-Item frontend\.env.example frontend\.env
    } else {
        Write-Host "⚠️  No .env.example found"
    }
}

Write-Host "⚠️  Please configure .env files with your credentials:"
Write-Host "   - backend\.env"
Write-Host "   - frontend\.env"

Write-Host ""
Write-Host "=========================================="
Write-Host "✓ Setup Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "To start the application, open 3 separate PowerShell terminals:"
Write-Host ""
Write-Host "Terminal 1 - ML Service:"
Write-Host "  cd $PWD"
Write-Host "  .\venv\Scripts\Activate.ps1"
Write-Host "  python ml_service/server.py"
Write-Host ""
Write-Host "Terminal 2 - Backend:"
Write-Host "  cd $PWD\backend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Terminal 3 - Frontend:"
Write-Host "  cd $PWD\frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:3000/oqt-dashboard"
Write-Host ""
Write-Host "For detailed instructions, see: INSTALLATION_GUIDE.md"
Write-Host ""
