Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Setting Up Web3 ZKP Health Insurance Hackathon Project" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Python Virtual Environment
Write-Host "`n[1/3] Setting up Python Virtual Environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
    Write-Host "Virtual environment created at ./venv" -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists." -ForegroundColor Gray
}

# 2. Install Python Requirements
Write-Host "`n[2/3] Installing Python dependencies from requirements.txt..." -ForegroundColor Yellow
& .\venv\Scripts\python -m pip install --upgrade pip
& .\venv\Scripts\pip install -r requirements.txt
Write-Host "Python dependencies installed successfully!" -ForegroundColor Green

# 3. Install Node.js & ZKP Dependencies
Write-Host "`n[3/3] Installing Node.js & Smart Contract Dependencies (npm install)..." -ForegroundColor Yellow
npm install
Write-Host "Node.js dependencies installed successfully!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "Environment Setup Complete!" -ForegroundColor Cyan
Write-Host "To activate Python environment in PowerShell, run:" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
