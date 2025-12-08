#!/bin/bash
# Shell script for combined Q5 GGUF export (2-step process)
# 
# Usage:
#   ./scripts/export_gguf_q5.sh --src <model-path> --out <output-q5-gguf> [--type <Q5_K_M|Q5_K_S|Q5_0>] [--keep-f16]
#
# Example:
#   ./scripts/export_gguf_q5.sh --src models/oneseek-7b-zero/weights --out models/oneseek-q5.gguf
#
# This script performs both steps:
#   1. Convert HuggingFace model to F16 GGUF
#   2. Quantize F16 GGUF to Q5
#
# Environment Variables:
#   LLAMA_QUANTIZE_PATH - Path to llama-quantize binary

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/export_gguf_q5.py"

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
echo -e "${CYAN}Starting 2-step Q5 GGUF export...${NC}"
echo -e "${CYAN}This may take 30-60 minutes depending on model size.${NC}"
echo ""

python3 "$PYTHON_SCRIPT" "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}===========================================================${NC}"
    echo -e "${GREEN}Success! Q5 quantized GGUF file is ready to use.${NC}"
    echo -e "${GREEN}===========================================================${NC}"
else
    echo ""
    echo -e "${RED}Export failed. See errors above.${NC}"
    exit $EXIT_CODE
fi
