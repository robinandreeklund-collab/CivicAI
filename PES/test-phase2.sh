#!/bin/bash

# PES Phase 2 Quick Test Script
# Usage: ./PES/test-phase2.sh

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║         PES Phase 2 Quick Test Suite                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq not installed - output will be unformatted${NC}"
    echo "   Install with: sudo apt-get install jq"
    USE_JQ=false
else
    USE_JQ=true
fi

# Test 1: Check ONESEEK
echo "1️⃣  Checking ONESEEK service..."
if curl -s --max-time 5 http://localhost:5000/ &> /dev/null; then
    echo -e "${GREEN}✅ ONESEEK is running${NC}"
else
    echo -e "${RED}❌ ONESEEK is NOT running on port 5000${NC}"
    echo "   Start ml_service first"
    exit 1
fi
echo ""

# Test 2: Check Backend API
echo "2️⃣  Checking backend API..."
if curl -s --max-time 5 http://localhost:3001/api/pes/status &> /dev/null; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
    
    # Show status
    if [ "$USE_JQ" = true ]; then
        echo ""
        curl -s http://localhost:3001/api/pes/status | jq
    fi
else
    echo -e "${RED}❌ Backend API is NOT running on port 3001${NC}"
    echo "   Start backend with: cd backend && npm run dev"
    exit 1
fi
echo ""

# Test 3: Check for debates
echo "3️⃣  Checking for debates in database..."
DEBATE_RESPONSE=$(curl -s "http://localhost:3001/api/pes/debates?limit=1")

if [ "$USE_JQ" = true ]; then
    DEBATE_COUNT=$(echo "$DEBATE_RESPONSE" | jq '.total // 0')
else
    DEBATE_COUNT=0
fi

if [ "$DEBATE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $DEBATE_COUNT debates${NC}"
else
    echo -e "${YELLOW}⚠️  No debates found in database${NC}"
    echo "   Run live debates first: go to /7b-zero and enable 'Debatt ON'"
fi
echo ""

# Test 4: Run component tests
echo "4️⃣  Running component tests..."
echo ""

cd "$(dirname "$0")/.."

if node PES/tests/test-phase2.js; then
    echo ""
    echo -e "${GREEN}✅ All component tests passed${NC}"
else
    echo ""
    echo -e "${RED}❌ Some component tests failed${NC}"
    echo "   See output above for details"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              Quick Tests Complete! ✅                  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "To test full evolution loop:"
echo "  1. Via API:"
echo "     curl -X POST http://localhost:3001/api/pes/evolution/start \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"baseline_prompt\":\"...\",\"debate_count\":5,\"variant_count\":3}'"
echo ""
echo "  2. Via Frontend:"
echo "     http://localhost:5173/pes/evolution"
echo ""
echo "  3. See full guide:"
echo "     cat PES/PHASE2_TESTING_GUIDE.md"
echo ""
