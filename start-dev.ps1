# Castlyo Development Environment Starter
Write-Host "🚀 Starting Castlyo Development Environment..." -ForegroundColor Green

# 1. Start Docker services
Write-Host "📦 Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d postgres redis minio meilisearch

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. Set environment variables
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:AdminReis97@localhost:5432/castlyo"
$env:PORT = "3001"
$env:NODE_ENV = "development"
$env:ENABLE_EMAIL_VERIFICATION = "false"
$env:ENABLE_SMS_VERIFICATION = "false"
$env:LOG_LEVEL = "debug"

# 3. Start API
Write-Host "🔌 Starting API server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev --workspace=@castlyo/api"

# Wait a bit for API to start
Start-Sleep -Seconds 5

# 4. Start Web
Write-Host "🌐 Starting Web application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev --workspace=@castlyo/web"

Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "📱 Web: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health: http://localhost:3001/api/v1/health" -ForegroundColor Cyan
