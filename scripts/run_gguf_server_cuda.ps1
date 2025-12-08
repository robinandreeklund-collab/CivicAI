# PowerShell script to run GGUF model server with CUDA support
#
# Usage:
#   .\scripts\run_gguf_server_cuda.ps1 -Model <path-to-gguf> [-Port <port>] [-Layers <n>] [-Context <size>]
#
# Example:
#   .\scripts\run_gguf_server_cuda.ps1 -Model "models\oneseek-q5.gguf" -Port 8080 -Layers 32
#
# Requirements:
#   - llama.cpp server binary (llama-server.exe or server.exe)
#   - CUDA-enabled GPU (optional, will use CPU if CUDA not available)
#
# Environment Variables:
#   LLAMA_SERVER_PATH - Path to llama-server.exe (overrides default search)

param(
    [Parameter(Mandatory=$true, HelpMessage="Path to GGUF model file")]
    [string]$Model,
    
    [Parameter(HelpMessage="Server port (default: 8080)")]
    [int]$Port = 8080,
    
    [Parameter(HelpMessage="Number of GPU layers (default: 32, 0 for CPU-only)")]
    [int]$Layers = 32,
    
    [Parameter(HelpMessage="Context size (default: 4096)")]
    [int]$Context = 4096,
    
    [Parameter(HelpMessage="Number of threads (default: auto)")]
    [int]$Threads = 0,
    
    [Parameter(HelpMessage="Host address (default: 127.0.0.1)")]
    [string]$Host = "127.0.0.1"
)

# Colors
$Green = "Green"
$Cyan = "Cyan"
$Yellow = "Yellow"
$Red = "Red"

Write-Host "===========================================================" -ForegroundColor $Cyan
Write-Host "GGUF Model Server with CUDA Support" -ForegroundColor $Cyan
Write-Host "===========================================================" -ForegroundColor $Cyan

# Check if model file exists
if (-not (Test-Path $Model)) {
    Write-Host "Error: Model file not found: $Model" -ForegroundColor $Red
    exit 1
}

Write-Host "Model: $Model" -ForegroundColor $Cyan
Write-Host "Port: $Port" -ForegroundColor $Cyan
Write-Host "GPU Layers: $Layers" -ForegroundColor $Cyan
Write-Host "Context: $Context" -ForegroundColor $Cyan
Write-Host "===========================================================" -ForegroundColor $Cyan

# Find llama-server binary
$ServerBin = $null

if ($env:LLAMA_SERVER_PATH -and (Test-Path $env:LLAMA_SERVER_PATH)) {
    $ServerBin = $env:LLAMA_SERVER_PATH
    Write-Host "Using llama-server from LLAMA_SERVER_PATH: $ServerBin" -ForegroundColor $Cyan
} else {
    # Check common locations
    $PossiblePaths = @(
        "C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-server.exe",
        "C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\server.exe",
        ".\llama.cpp-bin-cuda\llama-server.exe",
        ".\llama.cpp-bin-cuda\server.exe",
        ".\llama.cpp\build\bin\Release\llama-server.exe",
        ".\llama.cpp\build\bin\Release\server.exe"
    )
    
    foreach ($Path in $PossiblePaths) {
        if (Test-Path $Path) {
            $ServerBin = $Path
            Write-Host "Found llama-server: $ServerBin" -ForegroundColor $Cyan
            break
        }
    }
}

if (-not $ServerBin) {
    Write-Host "Error: llama-server binary not found!" -ForegroundColor $Red
    Write-Host "" -ForegroundColor $Red
    Write-Host "Please install llama.cpp server binary:" -ForegroundColor $Yellow
    Write-Host "  1. Download from: https://github.com/ggerganov/llama.cpp/releases" -ForegroundColor $Yellow
    Write-Host "  2. Extract to: C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\" -ForegroundColor $Yellow
    Write-Host "  3. Or set LLAMA_SERVER_PATH environment variable" -ForegroundColor $Yellow
    exit 1
}

# Build server command
$Args = @(
    "--model", $Model,
    "--host", $Host,
    "--port", $Port,
    "--ctx-size", $Context,
    "--n-gpu-layers", $Layers
)

if ($Threads -gt 0) {
    $Args += @("--threads", $Threads)
}

# Start server
Write-Host "" -ForegroundColor $Cyan
Write-Host "Starting GGUF server..." -ForegroundColor $Green
Write-Host "Command: $ServerBin $($Args -join ' ')" -ForegroundColor $Cyan
Write-Host "" -ForegroundColor $Cyan
Write-Host "Server will be available at: http://${Host}:${Port}" -ForegroundColor $Green
Write-Host "API endpoint: http://${Host}:${Port}/v1/chat/completions" -ForegroundColor $Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor $Yellow
Write-Host "===========================================================" -ForegroundColor $Cyan
Write-Host "" -ForegroundColor $Cyan

try {
    & $ServerBin @Args
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor $Red
    exit 1
}
