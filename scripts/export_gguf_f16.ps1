# PowerShell script for F16 GGUF export (Step 1 of 2)
# 
# Usage:
#   .\scripts\export_gguf_f16.ps1 -Src <model-path> -Out <output-f16-gguf>
#
# Example:
#   .\scripts\export_gguf_f16.ps1 -Src "models\oneseek-7b-zero\weights" -Out "models\oneseek-f16.gguf"

param(
    [Parameter(Mandatory=$true, HelpMessage="Source HuggingFace model directory")]
    [string]$Src,
    
    [Parameter(Mandatory=$true, HelpMessage="Output F16 GGUF file path")]
    [string]$Out,
    
    [Parameter(HelpMessage="Output result as JSON")]
    [switch]$JsonOutput
)

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Build Python command
$PythonScript = Join-Path $ScriptDir "export_gguf_f16.py"

$PythonArgs = @(
    $PythonScript,
    "--src", $Src,
    "--out", $Out
)

if ($JsonOutput) {
    $PythonArgs += "--json-output"
}

# Run Python script
Write-Host "Running F16 export..." -ForegroundColor Cyan
& python $PythonArgs

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSuccess! F16 GGUF file created." -ForegroundColor Green
    Write-Host "Next step: Run quantize_q5.ps1 to create Q5 quantized version" -ForegroundColor Cyan
} else {
    Write-Host "`nExport failed. See errors above." -ForegroundColor Red
    exit $LASTEXITCODE
}
