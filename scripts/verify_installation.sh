#!/bin/bash
# OQT-1.0 Basic Verification Script
# Tests that all components work in simulated mode (no models required)

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  OQT-1.0 Basic Verification (Simulated Mode)                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Track results
PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo "✅ PASS"
        ((PASSED++))
        return 0
    else
        echo "❌ FAIL"
        ((FAILED++))
        return 1
    fi
}

echo "1️⃣  Prerequisites Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

run_test "Python 3.10+" "python3 --version | grep -E 'Python 3\.(1[0-9]|[2-9][0-9])'"
run_test "Node.js 18+" "node --version | grep -E 'v(1[89]|[2-9][0-9])'"
run_test "npm installed" "npm --version"
run_test "Git installed" "git --version"

echo ""
echo "2️⃣  Python Scripts Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT"

run_test "setup_firebase.py syntax" "python3 -m py_compile scripts/setup_firebase.py"
run_test "ML service syntax" "python3 -m py_compile ml_service/server.py"

echo ""
echo "3️⃣  Backend Services Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/backend"

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi

run_test "Mistral service import" "node -e \"import('./services/mistral.js').then(() => process.exit(0)).catch(() => process.exit(1))\""
run_test "LLaMA service import" "node -e \"import('./services/llama.js').then(() => process.exit(0)).catch(() => process.exit(1))\""
run_test "OQT Pipeline import" "node -e \"import('./services/oqtMultiModelPipeline.js').then(() => process.exit(0)).catch(() => process.exit(1))\""
run_test "OQT API import" "node -e \"import('./api/oqt.js').then(() => process.exit(0)).catch(() => process.exit(1))\""

echo ""
echo "4️⃣  Firebase Collections Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT"

# Count collections defined in setup_firebase.py
COLLECTION_COUNT=$(python3 -c "
exec(open('scripts/setup_firebase.py').read().replace('if __name__', 'if False'))
print(len(COLLECTIONS))
" 2>/dev/null || echo "0")

if [ "$COLLECTION_COUNT" -eq "6" ]; then
    echo "Testing: 6 Firebase collections defined... ✅ PASS"
    ((PASSED++))
else
    echo "Testing: 6 Firebase collections defined... ❌ FAIL (found $COLLECTION_COUNT)"
    ((FAILED++))
fi

# List collections
echo ""
echo "Defined collections:"
python3 -c "
exec(open('scripts/setup_firebase.py').read().replace('if __name__', 'if False'))
for name in COLLECTIONS.keys():
    print(f'  • {name}')
" 2>/dev/null

echo ""
echo "5️⃣  Frontend Build Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi

run_test "Frontend dependencies" "[ -d node_modules ]"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  VERIFICATION SUMMARY                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Passed: $PASSED"
echo "  ❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All basic verifications passed!"
    echo ""
    echo "Next steps:"
    echo "  1. Start backend: cd backend && npm run dev"
    echo "  2. Start frontend: cd frontend && npm run dev"
    echo "  3. Open: http://localhost:3000/oqt-dashboard"
    echo ""
    echo "Note: System is running in SIMULATED mode (no models)."
    echo "To use real models, run: python scripts/download_models.py"
    exit 0
else
    echo "⚠️  Some verifications failed. Please check the errors above."
    exit 1
fi
