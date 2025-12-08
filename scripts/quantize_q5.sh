#!/bin/bash
# Shell script for Q5 quantization (Step 2 of 2)
# 
# Usage:
#   ./scripts/quantize_q5.sh --src <f16-gguf> --out <output-q5-gguf> [--type <Q5_K_M|Q5_K_S|Q5_0>]
#
# Example:
#   ./scripts/quantize_q5.sh --src models/oneseek-f16.gguf --out models/oneseek-q5.gguf
#
# Environment Variables:
#   LLAMA_QUANTIZE_PATH - Path to llama-quantize binary (overrides default search)

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/quantize_q5.py"

# Check if Python script exists
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo -e "${RED}Error: Python script not found: $PYTHON_SCRIPT${NC}"
    exit 1
fi

# Check for llama-quantize binary
if [ -z "$LLAMA_QUANTIZE_PATH" ]; then
    # Try to find llama-quantize in common locations
    if command -v llama-quantize &> /dev/null; then
        echo -e "${CYAN}Found llama-quantize in PATH${NC}"
    elif [ -f "./llama.cpp-bin-cuda/llama-quantize" ]; then
        echo -e "${CYAN}Found llama-quantize in ./llama.cpp-bin-cuda/${NC}"
    elif [ -f "./llama.cpp/build/bin/llama-quantize" ]; then
        echo -e "${CYAN}Found llama-quantize in ./llama.cpp/build/bin/${NC}"
    else
        echo -e "${YELLOW}Warning: llama-quantize not found in standard locations.${NC}"
        echo -e "${YELLOW}Set LLAMA_QUANTIZE_PATH environment variable to specify location.${NC}"
        echo ""
    fi
fi

# Run Python script with all arguments
echo -e "${CYAN}Running Q5 quantization...${NC}"
python3 "$PYTHON_SCRIPT" "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}Success! Q5 quantized GGUF file created.${NC}"
else
    echo ""
    echo -e "${RED}Quantization failed. See errors above.${NC}"
    exit $EXIT_CODE
fi
