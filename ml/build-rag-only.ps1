# Build and start only RAG quiz module
Write-Host "🔨 Building RAG Quiz Module..." -ForegroundColor Cyan

# Navigate to ml directory
Set-Location $PSScriptRoot

# Check if Docker is running
Write-Host "`n🔍 Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Build only RAG service
Write-Host "`n📦 Building RAG Quiz image..." -ForegroundColor Yellow
docker-compose build quiz-rag

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n✅ RAG image built successfully!" -ForegroundColor Green

# Start RAG service
Write-Host "`n▶️  Starting RAG Quiz service..." -ForegroundColor Yellow
docker-compose up -d quiz-rag

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Failed to start service!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for service to start
Write-Host "`n⏳ Waiting for service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Show logs
Write-Host "`n📋 Service logs:" -ForegroundColor Cyan
docker-compose logs --tail=50 quiz-rag

Write-Host "`n✅ RAG Quiz service is running on http://localhost:8001" -ForegroundColor Green
Write-Host "`n💡 Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:    docker-compose logs -f quiz-rag" -ForegroundColor White
Write-Host "  Stop service: docker-compose stop quiz-rag" -ForegroundColor White
Write-Host "  Restart:      docker-compose restart quiz-rag" -ForegroundColor White
Write-Host "  Remove:       docker-compose down quiz-rag" -ForegroundColor White

Write-Host "`n🧪 Test the service:" -ForegroundColor Cyan
Write-Host "  curl http://localhost:8001/health" -ForegroundColor White
