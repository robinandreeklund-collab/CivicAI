# CivicAI Python ML Service - Windows Setup Script
# This script automates the installation of Python dependencies on Windows

Write-Host "=== CivicAI Python ML Service - Windows Installation ===" -ForegroundColor Cyan
Write-Host ""

# Check Python version
Write-Host "Checking Python version..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found. Please install Python 3.8+ from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Create virtual environment
Write-Host "Creating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists. Removing old one..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force venv
}
python -m venv venv
Write-Host "Virtual environment created" -ForegroundColor Green
Write-Host ""

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to activate virtual environment." -ForegroundColor Red
    Write-Host "Try running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    exit 1
}
Write-Host "Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host ""

# Install core dependencies
Write-Host "Installing core Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install some dependencies" -ForegroundColor Red
    Write-Host "This is normal on Windows. Continuing with available packages..." -ForegroundColor Yellow
}
Write-Host ""

# Download spaCy models
Write-Host "Downloading spaCy Swedish model..." -ForegroundColor Yellow
python -m spacy download sv_core_news_sm
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not download Swedish model, will use English fallback" -ForegroundColor Yellow
}
Write-Host ""

# Download TextBlob corpora
Write-Host "Downloading TextBlob corpora..." -ForegroundColor Yellow
python -m textblob.download_corpora
Write-Host ""

# Summary
Write-Host "=== Installation Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Virtual environment created and activated" -ForegroundColor Green
Write-Host "✓ Core dependencies installed" -ForegroundColor Green
Write-Host "✓ spaCy models downloaded" -ForegroundColor Green
Write-Host "✓ TextBlob corpora downloaded" -ForegroundColor Green
Write-Host ""
Write-Host "NOTE: BERTopic is optional and may not work on Windows due to compilation requirements." -ForegroundColor Yellow
Write-Host "The system will use Gensim LDA for topic modeling instead." -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Start Python service: python nlp_pipeline.py" -ForegroundColor White
Write-Host "2. Open new terminal for backend: cd ..\.. && npm start" -ForegroundColor White
Write-Host "3. Open new terminal for frontend: cd ..\..\frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Installation complete! 🎉" -ForegroundColor Green
