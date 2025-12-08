#!/bin/bash
# Shell script to run GGUF model server with CUDA support
#
# Usage:
#   ./scripts/run_gguf_server_cuda.sh --model <path-to-gguf> [--port <port>] [--layers <n>] [--context <size>]
#
# Example:
#   ./scripts/run_gguf_server_cuda.sh --model models/oneseek-q5.gguf --port 8080 --layers 32
#
# Requirements:
#   - llama.cpp server binary (llama-server or server)
#   - CUDA-enabled GPU (optional, will use CPU if CUDA not available)
#
# Environment Variables:
#   LLAMA_SERVER_PATH - Path to llama-server binary (overrides default search)

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default values
MODEL=""
PORT=8080
LAYERS=32
CONTEXT=4096
THREADS=0
HOST="127.0.0.1"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --model)
            MODEL="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --layers)
            LAYERS="$2"
            shift 2
            ;;
        --context)
            CONTEXT="$2"
            shift 2
            ;;
        --threads)
            THREADS="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 --model <path-to-gguf> [--port <port>] [--layers <n>] [--context <size>]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}===========================================================${NC}"
echo -e "${CYAN}GGUF Model Server with CUDA Support${NC}"
echo -e "${CYAN}===========================================================${NC}"

# Check if model specified
if [ -z "$MODEL" ]; then
    echo -e "${RED}Error: --model argument is required${NC}"
    echo "Usage: $0 --model <path-to-gguf> [--port <port>] [--layers <n>] [--context <size>]"
    exit 1
fi

# Check if model file exists
if [ ! -f "$MODEL" ]; then
    echo -e "${RED}Error: Model file not found: $MODEL${NC}"
    exit 1
fi

echo -e "${CYAN}Model: $MODEL${NC}"
echo -e "${CYAN}Port: $PORT${NC}"
echo -e "${CYAN}GPU Layers: $LAYERS${NC}"
echo -e "${CYAN}Context: $CONTEXT${NC}"
echo -e "${CYAN}===========================================================${NC}"

# Find llama-server binary
SERVER_BIN=""

if [ -n "$LLAMA_SERVER_PATH" ] && [ -f "$LLAMA_SERVER_PATH" ]; then
    SERVER_BIN="$LLAMA_SERVER_PATH"
    echo -e "${CYAN}Using llama-server from LLAMA_SERVER_PATH: $SERVER_BIN${NC}"
elif command -v llama-server &> /dev/null; then
    SERVER_BIN="llama-server"
    echo -e "${CYAN}Found llama-server in PATH${NC}"
elif command -v server &> /dev/null; then
    SERVER_BIN="server"
    echo -e "${CYAN}Found server in PATH${NC}"
else
    # Check common local paths
    POSSIBLE_PATHS=(
        "./llama.cpp-bin-cuda/llama-server"
        "./llama.cpp-bin-cuda/server"
        "./llama.cpp/build/bin/llama-server"
        "./llama.cpp/build/bin/server"
        "$HOME/llama.cpp/build/bin/llama-server"
        "$HOME/llama.cpp/build/bin/server"
    )
    
    for PATH_TO_CHECK in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$PATH_TO_CHECK" ]; then
            SERVER_BIN="$PATH_TO_CHECK"
            echo -e "${CYAN}Found llama-server: $SERVER_BIN${NC}"
            break
        fi
    done
fi

if [ -z "$SERVER_BIN" ]; then
    echo -e "${RED}Error: llama-server binary not found!${NC}"
    echo ""
    echo -e "${YELLOW}Please install llama.cpp server binary:${NC}"
    echo -e "${YELLOW}  1. Download from: https://github.com/ggerganov/llama.cpp/releases${NC}"
    echo -e "${YELLOW}  2. Build from source: git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make${NC}"
    echo -e "${YELLOW}  3. Or set LLAMA_SERVER_PATH environment variable${NC}"
    exit 1
fi

# Build server command
SERVER_ARGS=(
    "--model" "$MODEL"
    "--host" "$HOST"
    "--port" "$PORT"
    "--ctx-size" "$CONTEXT"
    "--n-gpu-layers" "$LAYERS"
)

if [ "$THREADS" -gt 0 ]; then
    SERVER_ARGS+=("--threads" "$THREADS")
fi

# Start server
echo ""
echo -e "${GREEN}Starting GGUF server...${NC}"
echo -e "${CYAN}Command: $SERVER_BIN ${SERVER_ARGS[*]}${NC}"
echo ""
echo -e "${GREEN}Server will be available at: http://${HOST}:${PORT}${NC}"
echo -e "${GREEN}API endpoint: http://${HOST}:${PORT}/v1/chat/completions${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo -e "${CYAN}===========================================================${NC}"
echo ""

exec "$SERVER_BIN" "${SERVER_ARGS[@]}"
