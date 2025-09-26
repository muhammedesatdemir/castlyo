# Test Registration Flow Script
# This script tests the complete registration flow end-to-end

Write-Host "🚀 Testing Castlyo Registration Flow" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Step 1: Stop and clean up existing containers
Write-Host "`n1. Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down -v

# Step 2: Start PostgreSQL
Write-Host "`n2. Starting PostgreSQL..." -ForegroundColor Yellow
docker compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "   Waiting for PostgreSQL to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Step 3: Run database migrations
Write-Host "`n3. Running database migrations..." -ForegroundColor Yellow
Set-Location packages/database
npm run db:generate
npm run db:migrate
Set-Location ../..

# Step 4: Start the API
Write-Host "`n4. Starting API server..." -ForegroundColor Yellow
docker compose up -d --build api

# Wait for API to be ready
Write-Host "   Waiting for API to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Step 5: Test API health
Write-Host "`n5. Testing API health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
    if ($healthResponse.status -eq "ok") {
        Write-Host "   ✅ API is healthy" -ForegroundColor Green
    } else {
        Write-Host "   ❌ API health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ API is not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Test registration endpoint
Write-Host "`n6. Testing registration endpoint..." -ForegroundColor Yellow
$registrationData = @{
    email = "test@example.com"
    password = "TestPassword123!"
    passwordConfirm = "TestPassword123!"
    role = "TALENT"
    kvkkConsent = $true
    termsConsent = $true
    marketingConsent = $false
    firstName = "Test"
    lastName = "User"
    gender = "OTHER"
    city = "Istanbul"
    experience = "BEGINNER"
    specialties = @("Model")
    languages = @("TR")
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $registrationData -ContentType "application/json"
    if ($registerResponse.success -eq $true) {
        Write-Host "   ✅ Registration successful" -ForegroundColor Green
        Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
        Write-Host "   User Status: $($registerResponse.user.status)" -ForegroundColor Gray
        Write-Host "   Access Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Registration failed: $($registerResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Registration request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Start the web application
Write-Host "`n7. Starting web application..." -ForegroundColor Yellow
docker compose up -d --build web

# Wait for web app to be ready
Write-Host "   Waiting for web app to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 20

# Step 8: Test web app health
Write-Host "`n8. Testing web application..." -ForegroundColor Yellow
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Web application is running" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Web application is not responding properly" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Web application is not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 9: Test registration through web API
Write-Host "`n9. Testing registration through web API..." -ForegroundColor Yellow
$webRegistrationData = @{
    email = "web-test@example.com"
    password = "WebTestPassword123!"
    passwordConfirm = "WebTestPassword123!"
    role = "TALENT"
    kvkkConsent = $true
    termsConsent = $true
    marketingConsent = $false
    firstName = "Web"
    lastName = "Test"
    gender = "OTHER"
    city = "Istanbul"
    experience = "BEGINNER"
    specialties = @("Model")
    languages = @("TR")
} | ConvertTo-Json

try {
    $webRegisterResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method POST -Body $webRegistrationData -ContentType "application/json"
    if ($webRegisterResponse.success -eq $true) {
        Write-Host "   ✅ Web registration successful" -ForegroundColor Green
        Write-Host "   User ID: $($webRegisterResponse.data.user.id)" -ForegroundColor Gray
        Write-Host "   User Status: $($webRegisterResponse.data.user.status)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Web registration failed: $($webRegisterResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Web registration request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All tests passed! Registration flow is working correctly." -ForegroundColor Green
Write-Host "`nYou can now:" -ForegroundColor Cyan
Write-Host "  - Visit http://localhost:3000 to test the UI" -ForegroundColor White
Write-Host "  - Visit http://localhost:3001/health to check API status" -ForegroundColor White
Write-Host "  - Use the registration forms in the web app" -ForegroundColor White

Write-Host "`nTo stop the services, run: docker compose down" -ForegroundColor Yellow
