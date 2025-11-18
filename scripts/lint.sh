#!/bin/bash

# Lint script for CivicAI
# Runs linters on frontend and backend code

set -e

echo "========================================="
echo "  CivicAI Lint Script"
echo "========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

# Check if ESLint is available in frontend
if [ -d "frontend/node_modules" ]; then
    echo "Linting frontend..."
    cd frontend
    
    if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
        if npm run lint; then
            echo -e "${GREEN}✓ Frontend lint passed${NC}"
        else
            echo -e "${RED}✗ Frontend lint failed${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ No lint script found in frontend/package.json${NC}"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠ Frontend node_modules not found, skipping frontend lint${NC}"
fi

echo ""

# Check if ESLint is available in backend
if [ -d "backend/node_modules" ]; then
    echo "Linting backend..."
    cd backend
    
    if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
        if npm run lint; then
            echo -e "${GREEN}✓ Backend lint passed${NC}"
        else
            echo -e "${RED}✗ Backend lint failed${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ No lint script found in backend/package.json${NC}"
    fi
    
    cd ..
else
    echo -e "${YELLOW}⚠ Backend node_modules not found, skipping backend lint${NC}"
fi

echo ""
echo "========================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All linting passed!${NC}"
    echo "========================================="
    exit 0
else
    echo -e "${RED}✗ Linting failed with $ERRORS error(s)${NC}"
    echo "========================================="
    exit 1
fi
