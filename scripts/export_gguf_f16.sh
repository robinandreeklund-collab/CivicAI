#!/bin/bash
# Shell script for F16 GGUF export (Step 1 of 2)
# 
# Usage:
#   ./scripts/export_gguf_f16.sh --src <model-path> --out <output-f16-gguf>
#
# Example:
#   ./scripts/export_gguf_f16.sh --src models/oneseek-7b-zero/weights --out models/oneseek-f16.gguf

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/export_gguf_f16.py"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}Error: Python script not found: $PYTHON_SCRIPT${NC}"
    exit 1
fi

# Run Python script with all arguments
echo -e "${CYAN}Running F16 export...${NC}"
python3 "$PYTHON_SCRIPT" "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Success! F16 GGUF file created.${NC}"
    echo -e "${CYAN}Next step: Run quantize_q5.sh to create Q5 quantized version${NC}"
else
    echo ""
    echo -e "${RED}Export failed. See errors above.${NC}"
    exit $EXIT_CODE
fi
