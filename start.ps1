# Start both Aura servers
Write-Host "Starting Aura servers..." -ForegroundColor Cyan

# Start API server
Start-Process powershell -ArgumentList "-NoExit","-Command","cd C:\Users\User\Aura\server; npx tsx api-server.ts" -WindowStyle Minimized
Write-Host "API server starting on :8080" -ForegroundColor Green

# Wait a moment
Start-Sleep -Seconds 3

# Start Vite dev server
Start-Process powershell -ArgumentList "-NoExit","-Command","cd C:\Users\User\Aura; npm run dev" -WindowStyle Minimized
Write-Host "Vite dev server starting on :3000" -ForegroundColor Green

Start-Sleep -Seconds 5

# Verify both are running
try {
    $apiStatus = (Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing).Content
    Write-Host "API server: OK - $apiStatus" -ForegroundColor Green
} catch {
    Write-Host "API server: FAILED" -ForegroundColor Red
}

try {
    $webStatus = (Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing).StatusCode
    Write-Host "Vite server: OK (status $webStatus)" -ForegroundColor Green
} catch {
    Write-Host "Vite server: FAILED" -ForegroundColor Red
}

Write-Host "`nBoth servers running. Press any key to exit (servers will keep running)." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
