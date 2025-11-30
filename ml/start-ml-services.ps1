# Script to start all ML services including RAG quiz generation
Write-Host "🚀 Starting ML Services (including RAG Quiz Generation)..." -ForegroundColor Cyan

# Navigate to ml directory
Set-Location $PSScriptRoot

# Check if Docker is running
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Build and start all services
Write-Host "`n📦 Building Docker images..." -ForegroundColor Yellow
docker-compose build quiz-rag

Write-Host "`n▶️  Starting all services..." -ForegroundColor Green
docker-compose up -d

# Wait a moment for services to start
Start-Sleep -Seconds 3

Write-Host "`n✅ Services Status:" -ForegroundColor Green
docker-compose ps

Write-Host "`n📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  • Analysis:           http://localhost:3001" -ForegroundColor White
Write-Host "  • Interview Question: http://localhost:3002" -ForegroundColor White
Write-Host "  • Quiz Generation:    http://localhost:3003" -ForegroundColor White
Write-Host "  • RAG Quiz (NEW):     http://localhost:8001" -ForegroundColor Green
Write-Host "  • Resume ATS:         http://localhost:3004" -ForegroundColor White
Write-Host "  • Resume Parser:      http://localhost:3005" -ForegroundColor White
Write-Host "  • Speech to Text:     http://localhost:3006" -ForegroundColor White
Write-Host "  • Facial Expression:  http://localhost:3008" -ForegroundColor White
Write-Host "  • MinIO Console:      http://localhost:9001" -ForegroundColor White

Write-Host "`n💡 Commands:" -ForegroundColor Yellow
Write-Host "  View logs:  docker-compose logs -f quiz-rag" -ForegroundColor White
Write-Host "  Stop all:   docker-compose down" -ForegroundColor White
Write-Host "  Restart:    docker-compose restart quiz-rag" -ForegroundColor White
