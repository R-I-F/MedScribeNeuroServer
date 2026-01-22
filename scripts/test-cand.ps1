# Test script for cand module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing cand Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: POST /cand/createCandsFromExternal (creates many candidates from external source)
Write-Host "`n1. Testing POST /cand/createCandsFromExternal..." -ForegroundColor Yellow
$externalBody = @{} | ConvertTo-Json

try {
    Write-Host "  Calling external service (this may create many records)..." -ForegroundColor Gray
    $externalResponse = Invoke-RestMethod -Uri "http://localhost:3001/cand/createCandsFromExternal" -Method POST -Headers $headers -Body $externalBody -ErrorAction Stop
    
    if ($externalResponse.data -and $externalResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: External import created $($externalResponse.data.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  First record email: $($externalResponse.data[0].email)" -ForegroundColor Gray
        $global:testCandidateId = $externalIds[0]
    } elseif ($externalResponse.Count -gt 0) {
        # Sometimes response is just an array
        Write-Host "SUCCESS: External import created $($externalResponse.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  First record email: $($externalResponse[0].email)" -ForegroundColor Gray
        $global:testCandidateId = $externalIds[0]
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

# Test 2: PATCH /cand/:id/resetPassword (modifies password - only on our test record)
Write-Host "`n2. Testing PATCH /cand/:id/resetPassword..." -ForegroundColor Yellow
if ($global:testCandidateId) {
    Write-Host "  NOTE: This modifies data (password reset), but only on our test record" -ForegroundColor Gray
    try {
        $resetResponse = Invoke-RestMethod -Uri "http://localhost:3001/cand/$($global:testCandidateId)/resetPassword" -Method PATCH -Headers $headers -ErrorAction Stop
        Write-Host "SUCCESS: Password reset completed" -ForegroundColor Green
        Write-Host "  Message: $($resetResponse.data.message)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: Password reset failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test candidate ID available (POST create may have failed)" -ForegroundColor Yellow
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
        Invoke-RestMethod -Uri "http://localhost:3001/cand/$id" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
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
