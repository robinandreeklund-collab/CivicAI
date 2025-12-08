# PowerShell script for combined Q5 GGUF export (2-step process)
# 
# Usage:
#   .\scripts\export_gguf_q5.ps1 -Src <model-path> -Out <output-q5-gguf> [-Type <Q5_K_M|Q5_K_S|Q5_0>] [-KeepF16]
#
# Example:
#   .\scripts\export_gguf_q5.ps1 -Src "models\oneseek-7b-zero\weights" -Out "models\oneseek-q5.gguf"
#
# This script performs both steps:
#   1. Convert HuggingFace model to F16 GGUF
#   2. Quantize F16 GGUF to Q5
#
# Environment Variables:
#   LLAMA_QUANTIZE_PATH - Path to llama-quantize.exe

param(
    [Parameter(Mandatory=$true, HelpMessage="Source HuggingFace model directory")]
    [string]$Src,
    
    [Parameter(Mandatory=$true, HelpMessage="Output Q5 GGUF file path")]
    [string]$Out,
    
    [Parameter(HelpMessage="Quantization type (Q5_K_M, Q5_K_S, Q5_0, Q5_K)")]
    [ValidateSet("Q5_K_M", "Q5_K_S", "Q5_K", "Q5_0")]
    [string]$Type = "Q5_K_M",
    
    [Parameter(HelpMessage="Keep intermediate F16 GGUF file")]
    [switch]$KeepF16,
    
    [Parameter(HelpMessage="Output result as JSON")]
    [switch]$JsonOutput
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Build Python command
$PythonScript = Join-Path $ScriptDir "export_gguf_q5.py"

$PythonArgs = @(
    $PythonScript,
    "--src", $Src,
    "--out", $Out,
    "--type", $Type
)

if ($KeepF16) {
    $PythonArgs += "--keep-f16"
}

if ($JsonOutput) {
    $PythonArgs += "--json-output"
}

# Check for llama-quantize binary if not set
if (-not $env:LLAMA_QUANTIZE_PATH) {
    $DefaultPath = "C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-quantize.exe"
    if (Test-Path $DefaultPath) {
        Write-Host "Using default llama-quantize path: $DefaultPath" -ForegroundColor Cyan
    } else {
        Write-Host "Warning: llama-quantize.exe not found at default path." -ForegroundColor Yellow
        Write-Host "Default path: $DefaultPath" -ForegroundColor Yellow
        Write-Host "Set LLAMA_QUANTIZE_PATH environment variable to specify location." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Run Python script
Write-Host "Starting 2-step Q5 GGUF export..." -ForegroundColor Cyan
Write-Host "This may take 30-60 minutes depending on model size." -ForegroundColor Cyan
Write-Host ""

& python $PythonArgs

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n===========================================================" -ForegroundColor Green
    Write-Host "Success! Q5 quantized GGUF file is ready to use." -ForegroundColor Green
    Write-Host "===========================================================" -ForegroundColor Green
} else {
    Write-Host "`nExport failed. See errors above." -ForegroundColor Red
    exit $LASTEXITCODE
}
