# Script to stop all ML services
Write-Host "🛑 Stopping ML Services..." -ForegroundColor Yellow

# Navigate to ml directory
Set-Location $PSScriptRoot

# Stop all services
docker-compose down

Write-Host "✅ All services stopped" -ForegroundColor Green
