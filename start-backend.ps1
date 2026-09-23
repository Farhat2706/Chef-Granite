# Start backend
Write-Host "Starting Chef Granite Recipe RAG Agent Backend..." -ForegroundColor Magenta

Set-Location -Path "$PSScriptRoot/backend"

# Create virtual env if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
    py -m venv .venv
}

# Activate
& .venv/Scripts/Activate.ps1

# Install deps
Write-Host "Installing dependencies..." -ForegroundColor Cyan
py -m pip install -r requirements.txt --quiet

# Copy .env if not present
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "WARNING: .env file created from .env.example -- add your IBM watsonx.ai credentials!" -ForegroundColor Yellow
}

Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
