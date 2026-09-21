# SiliconScan AI - Local Launch Script for Windows PowerShell
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SiliconScan AI - Semiconductor Wafer Defect Detection   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# Check Python venv
$VenvPython = Join-Path $WorkspaceRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
    Write-Host "[!] Virtual environment not found. Please create .venv first." -ForegroundColor Yellow
    exit 1
}

# Check Model Checkpoint
$Checkpoint = Join-Path $WorkspaceRoot "ml\checkpoints\best_wafer_cnn.pth"
if (-not (Test-Path $Checkpoint)) {
    Write-Host "[i] No trained checkpoint found. Training pipeline should be run." -ForegroundColor Yellow
}

Write-Host "[+] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
$BackendProcess = Start-Process -FilePath $VenvPython -ArgumentList "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" -WorkingDirectory $WorkspaceRoot -PassThru

Write-Host "[+] Launching React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
$FrontendDir = Join-Path $WorkspaceRoot "frontend"
$FrontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir -PassThru

Write-Host ""
Write-Host "System is running!" -ForegroundColor Cyan
Write-Host "  Backend API:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C or close this terminal window to stop the servers." -ForegroundColor Gray

try {
    Wait-Process -Id $BackendProcess.Id, $FrontendProcess.Id
} finally {
    Stop-Process -Id $BackendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $FrontendProcess.Id -ErrorAction SilentlyContinue
}
