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
Write-Host "To access admin dashboard:" -ForegroundColor Yellow
Write-Host "1. Create an account or log in at http://localhost:3000/logga-in"
Write-Host "2. Update your user role in Firebase:"
Write-Host "   - Go to Firebase Console -> Firestore Database"
Write-Host "   - Navigate to 'users' collection"
Write-Host "   - Find your user document"
Write-Host "   - Change 'role' field from 'user' to 'admin'"
Write-Host "3. Log out and log in again to refresh your session"
Write-Host ""
