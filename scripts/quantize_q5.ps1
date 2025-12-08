# PowerShell script for Q5 quantization (Step 2 of 2)
# 
# Usage:
#   .\scripts\quantize_q5.ps1 -Src <f16-gguf> -Out <output-q5-gguf> [-Type <Q5_K_M|Q5_K_S|Q5_0>]
#
# Example:
#   .\scripts\quantize_q5.ps1 -Src "models\oneseek-f16.gguf" -Out "models\oneseek-q5.gguf"
#
# Environment Variables:
#   LLAMA_QUANTIZE_PATH - Path to llama-quantize.exe (overrides default)
#
# Default Windows path:
#   C:\Users\robin\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-quantize.exe

param(
    [Parameter(Mandatory=$true, HelpMessage="Source F16 GGUF file")]
    [string]$Src,
    
    [Parameter(Mandatory=$true, HelpMessage="Output Q5 GGUF file path")]
    [string]$Out,
    
    [Parameter(HelpMessage="Quantization type (Q5_K_M, Q5_K_S, Q5_0, Q5_K)")]
    [ValidateSet("Q5_K_M", "Q5_K_S", "Q5_K", "Q5_0")]
    [string]$Type = "Q5_K_M",
    
    [Parameter(HelpMessage="Output result as JSON")]
    [switch]$JsonOutput
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Build Python command
$PythonScript = Join-Path $ScriptDir "quantize_q5.py"

$PythonArgs = @(
    $PythonScript,
    "--src", $Src,
    "--out", $Out,
    "--type", $Type
)

if ($JsonOutput) {
    $PythonArgs += "--json-output"
}

# Check for llama-quantize binary if not set
if (-not $env:LLAMA_QUANTIZE_PATH) {
    $DefaultPath = "$env:USERPROFILE\Documents\GitHub\CivicAI\llama.cpp-bin-cuda\llama-quantize.exe"
    if (Test-Path $DefaultPath) {
        Write-Host "Using default llama-quantize path: $DefaultPath" -ForegroundColor Cyan
    } else {
        Write-Host "Warning: llama-quantize.exe not found at default path." -ForegroundColor Yellow
        Write-Host "Default path: $DefaultPath" -ForegroundColor Yellow
        Write-Host "Set LLAMA_QUANTIZE_PATH environment variable to specify location." -ForegroundColor Yellow
    }
}

# Run Python script
Write-Host "Running Q5 quantization..." -ForegroundColor Cyan
& python $PythonArgs

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! Q5 quantized GGUF file created." -ForegroundColor Green
} else {
    Write-Host "`nQuantization failed. See errors above." -ForegroundColor Red
    exit $LASTEXITCODE
}
