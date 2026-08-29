# SupportSafe one-command startup script
# Starts the Django backend (:8000) and the Next.js frontend (:3000)
$ErrorActionPreference = "Continue"
$root = $PSScriptRoot

Write-Host "=== SupportSafe startup ===" -ForegroundColor Cyan

# 1) Backend (Django, port 8000)
Write-Host "[1/2] Starting Django backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
Start-Process -FilePath "$root\.venv\Scripts\python.exe" `
  -ArgumentList "$root\backend_django\manage.py", "runserver", "127.0.0.1:8000", "--noreload" `
  -WorkingDirectory "$root\backend_django" `
  -RedirectStandardOutput "$root\backend_django_server.log" `
  -RedirectStandardError "$root\backend_django_error.log" `
  -WindowStyle Hidden

# 2) Frontend (Next.js, port 3000)
Write-Host "[2/2] Starting Next.js frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" `
  -ArgumentList "/c", "npm run dev" `
  -WorkingDirectory "$root\frontend" `
  -WindowStyle Hidden

Write-Host ""
Write-Host "Waiting for services..." -ForegroundColor Yellow
$deadline = (Get-Date).AddSeconds(60)
do {
  Start-Sleep -Seconds 2
  $backendUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -InformationLevel Quiet -WarningAction SilentlyContinue
  $frontendUp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
} until ((($backendUp) -and ($frontendUp)) -or ((Get-Date) -gt $deadline))

if ($backendUp) { Write-Host "  Backend  : http://127.0.0.1:8000  (UP)" -ForegroundColor Green } else { Write-Host "  Backend  : did not start - see backend_django_error.log" -ForegroundColor Red }
if ($frontendUp) { Write-Host "  Frontend : http://localhost:3000  (UP)" -ForegroundColor Green } else { Write-Host "  Frontend : did not start - run 'npm run dev' in frontend/ to see errors" -ForegroundColor Red }
Write-Host ""
Write-Host "Open http://localhost:3000 in your browser." -ForegroundColor Cyan
