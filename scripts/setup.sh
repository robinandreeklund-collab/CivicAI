#!/bin/bash

# CivicAI Setup Script
# Automates the initial setup process for the CivicAI project

set -e

echo "========================================="
echo "  CivicAI/OneSeek.AI Setup Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js installation
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}⚠ Node.js version is ${NODE_VERSION}, but 18+ is recommended${NC}"
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm installation
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Backend node_modules already exists, skipping...${NC}"
fi
cd ..

echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}Frontend node_modules already exists, skipping...${NC}"
fi
cd ..

echo ""

# Setup environment files
echo "Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created backend/.env from template${NC}"
        echo -e "${YELLOW}⚠ Please edit backend/.env and add your API keys${NC}"
    else
        echo -e "${YELLOW}⚠ backend/.env.example not found${NC}"
    fi
else
    echo -e "${YELLOW}backend/.env already exists${NC}"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo -e "${GREEN}✓ Created frontend/.env from template${NC}"
    else
        echo -e "${YELLOW}⚠ frontend/.env.example not found${NC}"
    fi
else
    echo -e "${YELLOW}frontend/.env already exists${NC}"
fi

echo ""

# Check for Python (optional ML service)
echo "Checking for Python ML service (optional)..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ $PYTHON_VERSION${NC}"
    echo ""
    echo "To set up Python ML service (optional, for advanced features):"
    echo "  cd backend/python_services"
    echo "  ./setup.sh"
    echo "  python3 nlp_pipeline.py"
else
    echo -e "${YELLOW}⚠ Python not found - Python ML service will not be available${NC}"
    echo "The application will work with JavaScript-only analysis"
fi

echo ""
echo "========================================="
echo -e "${GREEN}✓ Setup complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your API keys in backend/.env:"
echo "   - OPENAI_API_KEY (get from https://platform.openai.com/api-keys)"
echo "   - GEMINI_API_KEY (get from https://aistudio.google.com/app/apikey)"
echo "   - DEEPSEEK_API_KEY (get from https://platform.deepseek.com/)"
echo ""
echo "2. (Optional) Configure Firebase:"
echo "   - See backend/.env.firebase.example"
echo "   - See frontend/.env.firebase.example"
echo ""
echo "3. Start the application:"
echo "   Terminal 1: cd backend && npm start"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For more information, see README.md and docs/guides/SETUP.md"
echo ""
