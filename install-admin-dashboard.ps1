# Installation script for Admin Dashboard (Windows PowerShell)
# Run this after pulling the new changes

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Admin Dashboard - Installation Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the CivicAI root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Frontend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  cd backend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Then visit: http://localhost:3000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "For first-time access, run in browser console (F12):" -ForegroundColor Yellow
Write-Host "  localStorage.setItem('oneseek_user', JSON.stringify({"
Write-Host "    userId: 'admin123', role: 'admin', isAdmin: true"
Write-Host "  }));"
Write-Host "  location.reload();"
Write-Host ""
