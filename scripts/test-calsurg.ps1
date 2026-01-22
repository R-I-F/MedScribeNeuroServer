# Test script for calSurg module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing calSurg Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: GET /calSurg/getAll (no filters - read only)
Write-Host "`n1. Testing GET /calSurg/getAll (no filters)..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/calSurg/getAll" -Method GET -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) calSurg records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        $global:existingCalSurgId = $allRecords[0].id
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: GET /calSurg/getAll (with filters - read only)
Write-Host "`n2. Testing GET /calSurg/getAll (with filters)..." -ForegroundColor Yellow
$currentYear = Get-Date -Format "yyyy"
$currentMonth = (Get-Date).Month.ToString().PadLeft(2, '0')
$monthFilter = "$currentYear-$currentMonth"
try {
    $getFilteredResponse = Invoke-RestMethod -Uri "http://localhost:3001/calSurg/getAll?month=$monthFilter" -Method GET -ErrorAction Stop
    $filteredRecords = if ($getFilteredResponse.data) { $getFilteredResponse.data } else { $getFilteredResponse }
    Write-Host "SUCCESS: Retrieved $($filteredRecords.Count) calSurg records with month filter" -ForegroundColor Green
} catch {
    Write-Host "ERROR: GET all with filters failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /calSurg/getById (read only - using existing ID if available)
Write-Host "`n3. Testing GET /calSurg/getById..." -ForegroundColor Yellow
if ($global:existingCalSurgId) {
    $getByIdBody = @{
        _id = $global:existingCalSurgId
    } | ConvertTo-Json

    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/calSurg/getById" -Method GET -Headers @{"Content-Type" = "application/json"} -Body $getByIdBody -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved calSurg by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  patientName: $($record.patientName)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No existing calSurg ID available to test" -ForegroundColor Yellow
}

# Test 4: POST /calSurg/postAllFromExternal (creates many records from external source)
Write-Host "`n4. Testing POST /calSurg/postAllFromExternal..." -ForegroundColor Yellow
$externalBody = @{} | ConvertTo-Json

try {
    Write-Host "  Calling external service (this may create many records)..." -ForegroundColor Gray
    $externalResponse = Invoke-RestMethod -Uri "http://localhost:3001/calSurg/postAllFromExternal" -Method POST -Headers $headers -Body $externalBody -ErrorAction Stop
    
    if ($externalResponse.data -and $externalResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: External import created $($externalResponse.data.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($externalIds[-1])" -ForegroundColor Gray
    } elseif ($externalResponse.Count -gt 0) {
        # Sometimes response is just an array
        Write-Host "SUCCESS: External import created $($externalResponse.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse | ForEach-Object { $_.id }
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
        Invoke-RestMethod -Uri "http://localhost:3001/calSurg/$id" -Method DELETE -Headers $headers -ErrorAction Stop | Out-Null
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
