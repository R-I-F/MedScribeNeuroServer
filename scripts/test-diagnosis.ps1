# Test script for diagnosis module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing diagnosis Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: POST /diagnosis/postBulk (no auth required)
Write-Host "`n1. Testing POST /diagnosis/postBulk..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$bulkBody = @{
    diagnoses = @(
        @{
            icdCode = "TEST_ICD_$testTimestamp" + "_1"
            icdName = "test diagnosis 1 created at $testTimestamp"
            neuroLogName = @("test neuro log 1", "test neuro log 2")
        },
        @{
            icdCode = "TEST_ICD_$testTimestamp" + "_2"
            icdName = "test diagnosis 2 created at $testTimestamp"
            neuroLogName = @("test neuro log 3")
        }
    )
} | ConvertTo-Json -Depth 3

try {
    $bulkResponse = Invoke-RestMethod -Uri "http://localhost:3001/diagnosis/postBulk" -Method POST -Headers @{"Content-Type" = "application/json"} -Body $bulkBody -ErrorAction Stop
    if ($bulkResponse.data -and $bulkResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: Bulk creation created $($bulkResponse.data.Count) records" -ForegroundColor Green
        $bulkIds = $bulkResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $bulkIds
        Write-Host "  First record ID: $($bulkIds[0])" -ForegroundColor Gray
        Write-Host "  First record icdCode: $($bulkResponse.data[0].icdCode)" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Bulk creation returned no data or unexpected format" -ForegroundColor Yellow
        Write-Host "  Response: $($bulkResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Bulk creation failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /diagnosis/post (requires SuperAdmin)
Write-Host "`n2. Testing POST /diagnosis/post..." -ForegroundColor Yellow
$singleBody = @{
    icdCode = "TEST_ICD_$testTimestamp" + "_3"
    icdName = "test single diagnosis created at $testTimestamp"
    neuroLogName = @("test single neuro log 1", "test single neuro log 2")
} | ConvertTo-Json -Depth 2

try {
    $singleResponse = Invoke-RestMethod -Uri "http://localhost:3001/diagnosis/post" -Method POST -Headers $headers -Body $singleBody -ErrorAction Stop
    Write-Host "SUCCESS: Single creation created record" -ForegroundColor Green
    Write-Host "  ID: $($singleResponse.data.id)" -ForegroundColor Gray
    Write-Host "  icdCode: $($singleResponse.data.icdCode)" -ForegroundColor Gray
    $global:testRecordIds += $singleResponse.data.id
    $global:manualSingleId = $singleResponse.data.id
} catch {
    Write-Host "ERROR: Single creation failed - $($_.Exception.Message)" -ForegroundColor Red
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
        Invoke-RestMethod -Uri "http://localhost:3001/diagnosis/$id" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
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
