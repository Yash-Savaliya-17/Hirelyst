# Start Dual RAG System
# This script starts MCQ RAG, Theory RAG, and Orchestrator services

Write-Host "🚀 Starting Dual RAG Quiz Generation System..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if .env files exist
$envFiles = @(
    "quiz-generation\mcq-rag\.env",
    "quiz-generation\theory-rag\.env",
    "quiz-generation\orchestrator\.env"
)

$missingEnv = @()
foreach ($env in $envFiles) {
    if (-not (Test-Path $env)) {
        $missingEnv += $env
    }
}

if ($missingEnv.Count -gt 0) {
    Write-Host "⚠️ Missing .env files:" -ForegroundColor Yellow
    foreach ($file in $missingEnv) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Please create these files with GEMINI_API_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All .env files found" -ForegroundColor Green
Write-Host ""

# Build images if needed
Write-Host "🔨 Building Docker images (if needed)..." -ForegroundColor Cyan
docker-compose build quiz-rag quiz-rag-theory quiz-orchestrator

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker images built" -ForegroundColor Green
Write-Host ""

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose up -d quiz-rag quiz-rag-theory quiz-orchestrator

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Services started" -ForegroundColor Green
Write-Host ""

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "🔍 Checking service health..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="MCQ RAG"; Port=8001},
    @{Name="Theory RAG"; Port=8002},
    @{Name="Orchestrator"; Port=8003}
)

$allHealthy = $true

foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "✅ $($service.Name) (port $($service.Port)): Healthy" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $($service.Name) (port $($service.Port)): $($response.status)" -ForegroundColor Yellow
            $allHealthy = $false
        }
    } catch {
        Write-Host "❌ $($service.Name) (port $($service.Port)): Not responding" -ForegroundColor Red
        $allHealthy = $false
    }
}

Write-Host ""

if ($allHealthy) {
    Write-Host "🎉 All services are healthy and ready!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some services are not ready yet. Check logs with:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f quiz-rag quiz-rag-theory quiz-orchestrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   MCQ RAG:       http://localhost:8001" -ForegroundColor White
Write-Host "   Theory RAG:    http://localhost:8002" -ForegroundColor White
Write-Host "   Orchestrator:  http://localhost:8003" -ForegroundColor White
Write-Host ""
Write-Host "📚 View logs: docker-compose logs -f [service-name]" -ForegroundColor Cyan
Write-Host "🛑 Stop services: docker-compose down" -ForegroundColor Cyan
Write-Host ""
