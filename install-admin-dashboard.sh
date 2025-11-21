#!/bin/bash

# Installation script for Admin Dashboard
# Run this after pulling the new changes

echo "========================================="
echo "Admin Dashboard - Installation Script"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the CivicAI root directory"
    exit 1
fi

echo "Step 1: Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Backend installation failed"
    exit 1
fi
echo "✓ Backend dependencies installed"
echo ""

echo "Step 2: Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error: Frontend installation failed"
    exit 1
fi
echo "✓ Frontend dependencies installed"
echo ""

echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then visit: http://localhost:3000/admin"
echo ""
echo "For first-time access, run in browser console:"
echo "  localStorage.setItem('oneseek_user', JSON.stringify({"
echo "    userId: 'admin123', role: 'admin', isAdmin: true"
echo "  }));"
echo "  location.reload();"
echo ""
