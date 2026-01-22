# Test script for hospital module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing hospital Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $($tokens.SuperAdmin)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()

# Test 1: POST /hospital/create (requires SuperAdmin)
Write-Host "`n1. Testing POST /hospital/create..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    arabName = "TEST_Hospital_Arabic_$testTimestamp"
    engName = "TEST_Hospital_English_$testTimestamp"
    location = @{
        long = 31.2357
        lat = 30.0444
    }
} | ConvertTo-Json -Depth 2

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/hospital/create" -Method POST -Headers $headers -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created hospital record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  arabName: $($createResponse.data.arabName)" -ForegroundColor Gray
    Write-Host "  engName: $($createResponse.data.engName)" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testHospitalId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total records created: $($global:testRecordIds.Count)" -ForegroundColor Yellow
Write-Host "`nCleaning up all test records..." -ForegroundColor Yellow

# Cleanup: Delete all created records
$deletedCount = 0
$failedCount = 0

foreach ($id in $global:testRecordIds) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/hospital/$id" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
        $deletedCount++
        Write-Host "  Deleted record: $id" -ForegroundColor Gray
    } catch {
        $failedCount++
        Write-Host "  Failed to delete $id : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "Failed: $failedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Gray" } else { "Red" })
