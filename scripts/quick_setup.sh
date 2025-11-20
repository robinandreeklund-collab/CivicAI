#!/bin/bash

# Quick Setup Script for OQT-1.0
# Run this script to set up the entire environment

set -e  # Exit on error

echo "=========================================="
echo "OQT-1.0 Quick Setup"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version"

# Check Node version
echo "Checking Node.js version..."
node_version=$(node --version)
echo "✓ Node.js $node_version"

# Check for CUDA (optional)
if command -v nvidia-smi &> /dev/null; then
    echo "Checking CUDA..."
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader | head -1
    echo "✓ CUDA available"
else
    echo "⚠️  CUDA not found - will use CPU (slower)"
fi

echo ""
echo "=========================================="
echo "Step 1: Create Python Virtual Environment"
echo "=========================================="
echo ""

python3 -m venv venv
source venv/bin/activate
echo "✓ Virtual environment created and activated"

echo ""
echo "=========================================="
echo "Step 2: Install Python Dependencies"
echo "=========================================="
echo ""

pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Python dependencies installed"

echo ""
echo "=========================================="
echo "Step 3: Install Node.js Dependencies"
echo "=========================================="
echo ""

echo "Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✓ Backend dependencies installed"

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"

echo ""
echo "=========================================="
echo "Step 4: Download Models (Optional)"
echo "=========================================="
echo ""

read -p "Download Mistral 7B and LLaMA-2 now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting model download..."
    python scripts/download_models.py
    echo "✓ Models downloaded"
else
    echo "⊗ Skipped model download. Run manually: python scripts/download_models.py"
fi

echo ""
echo "=========================================="
echo "Step 5: Setup Firebase (Optional)"
echo "=========================================="
echo ""

if [ -f "firebase-service-account.json" ]; then
    read -p "Firebase service account found. Setup collections now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Setting up Firebase collections..."
        python scripts/setup_firebase.py
        echo "✓ Firebase setup complete"
    else
        echo "⊗ Skipped Firebase setup. Run manually: python scripts/setup_firebase.py"
    fi
else
    echo "⚠️  Firebase service account not found (firebase-service-account.json)"
    echo "   Download from Firebase Console and run: python scripts/setup_firebase.py"
fi

echo ""
echo "=========================================="
echo "Step 6: Environment Configuration"
echo "=========================================="
echo ""

# Create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "⚠️  No .env.example found"
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env 2>/dev/null || echo "⚠️  No .env.example found"
fi

echo "⚠️  Please configure .env files with your credentials:"
echo "   - backend/.env"
echo "   - frontend/.env"

echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - ML Service:"
echo "  source venv/bin/activate"
echo "  python ml_service/server.py"
echo ""
echo "Terminal 2 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000/oqt-dashboard"
echo ""
echo "For detailed instructions, see: INSTALLATION_GUIDE.md"
echo ""
