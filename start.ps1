# Lead Hunter — PowerShell startup script for Windows
# Run: powershell -ExecutionPolicy Bypass -File start.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Lead Hunter Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Step 1: Starting backend (port 8000)..." -ForegroundColor Green
$backendDir = Join-Path $PSScriptRoot "backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$backendDir`" && python -m pip install -q -e . && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal -PassThru | Out-Null

Write-Host "Waiting 4 seconds for backend to initialize..."
Start-Sleep -Seconds 4

Write-Host "`nStep 2: Starting frontend (port 5173)..." -ForegroundColor Green
$frontendDir = Join-Path $PSScriptRoot "frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$frontendDir`" && npm install -q && npm run dev" -WindowStyle Normal -PassThru | Out-Null

Write-Host "Waiting 8 seconds for frontend to build..."
Start-Sleep -Seconds 8

Write-Host "`nStep 3: Opening http://localhost:5173 in your browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "`n✓ Done! Two windows should be running:" -ForegroundColor Green
Write-Host "  - Lead Hunter - Backend (port 8000)" -ForegroundColor White
Write-Host "  - Lead Hunter - Frontend (port 5173)" -ForegroundColor White
Write-Host "`nIf the app doesn't load, check both windows for errors." -ForegroundColor Yellow
Write-Host "Close both windows to stop the servers." -ForegroundColor Yellow
