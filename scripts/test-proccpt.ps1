# Test script for procCpt module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing procCpt Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: POST /procCpt/upsert
Write-Host "`n1. Testing POST /procCpt/upsert..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$upsertBody = @{
    title = "TEST_procCpt_$testTimestamp"
    alphaCode = "TEST"
    numCode = "TEST_CPT_$testTimestamp"
    description = "Test description for procCpt upsert"
} | ConvertTo-Json

try {
    $upsertResponse = Invoke-RestMethod -Uri "http://localhost:3001/procCpt/upsert" -Method POST -Headers $headers -Body $upsertBody -ErrorAction Stop
    Write-Host "SUCCESS: Upsert created record" -ForegroundColor Green
    Write-Host "  ID: $($upsertResponse.data.id)" -ForegroundColor Gray
    Write-Host "  numCode: $($upsertResponse.data.numCode)" -ForegroundColor Gray
    $global:testRecordIds += $upsertResponse.data.id
    $global:manualUpsertId = $upsertResponse.data.id
} catch {
    Write-Host "ERROR: Upsert failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /procCpt/postAllFromExternal (creates many records from external source)
Write-Host "`n2. Testing POST /procCpt/postAllFromExternal..." -ForegroundColor Yellow
$externalBody = @{} | ConvertTo-Json

try {
    Write-Host "  Calling external service (this may create many records)..." -ForegroundColor Gray
    $externalResponse = Invoke-RestMethod -Uri "http://localhost:3001/procCpt/postAllFromExternal" -Method POST -Headers $headers -Body $externalBody -ErrorAction Stop
    
    if ($externalResponse.data -and $externalResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: External import created $($externalResponse.data.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($externalIds[-1])" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: External import returned no data or unexpected format" -ForegroundColor Yellow
        Write-Host "  Response: $($externalResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: External import failed - $($_.Exception.Message)" -ForegroundColor Red
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
        Invoke-RestMethod -Uri "http://localhost:3001/procCpt/$id" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
        $deletedCount++
        if ($deletedCount % 10 -eq 0) {
            Write-Host "  Deleted $deletedCount records..." -ForegroundColor Gray
        }
    } catch {
        $failedCount++
        Write-Host "  Failed to delete $id : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "Failed: $failedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Gray" } else { "Red" })
