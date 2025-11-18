#!/bin/bash

# Build script for CivicAI
# Builds both frontend and backend (if needed)

set -e

echo "========================================="
echo "  CivicAI Build Script"
echo "========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Build frontend
echo "Building frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies first..."
    npm install
fi

npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
    echo "Build output: frontend/dist"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..

echo ""
echo "========================================="
echo -e "${GREEN}✓ Build complete!${NC}"
echo "========================================="
echo ""
echo "To preview the build:"
echo "  cd frontend && npm run preview"
echo ""
