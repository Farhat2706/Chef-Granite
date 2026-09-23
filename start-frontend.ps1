# Start frontend
Write-Host "Starting Chef Granite Recipe Agent Frontend..." -ForegroundColor Magenta

Set-Location -Path "$PSScriptRoot/frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Cyan
    npm install
}

Write-Host "Starting Vite dev server on http://localhost:5173" -ForegroundColor Green
npm run dev
