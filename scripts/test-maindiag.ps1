# Test script for mainDiag module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing mainDiag Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: GET /mainDiag/ (get all mainDiags) - no auth required
Write-Host "`n1. Testing GET /mainDiag/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/mainDiag/" -Method GET -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) mainDiag records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        Write-Host "  First record title: $($allRecords[0].title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /mainDiag/ (create mainDiag) - requires SuperAdmin
Write-Host "`n2. Testing POST /mainDiag/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    title = "TEST_mainDiag_$testTimestamp"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/mainDiag/" -Method POST -Headers $headers -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created mainDiag record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  title: $($createResponse.data.title)" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testMainDiagId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /mainDiag/:id (get mainDiag by ID) - using the record we just created
Write-Host "`n3. Testing GET /mainDiag/:id..." -ForegroundColor Yellow
if ($global:testMainDiagId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/mainDiag/$($global:testMainDiagId)" -Method GET -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved mainDiag by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  title: $($record.title)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test record ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Test 4: PUT /mainDiag/:id (update mainDiag) - only on our test record
Write-Host "`n4. Testing PUT /mainDiag/:id..." -ForegroundColor Yellow
if ($global:testMainDiagId) {
    $updateBody = @{
        title = "TEST_mainDiag_updated_$testTimestamp"
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/mainDiag/$($global:testMainDiagId)" -Method PUT -Headers @{"Content-Type" = "application/json"} -Body $updateBody -ErrorAction Stop
        $updatedRecord = if ($updateResponse.data) { $updateResponse.data } else { $updateResponse }
        Write-Host "SUCCESS: Updated mainDiag record" -ForegroundColor Green
        Write-Host "  ID: $($updatedRecord.id)" -ForegroundColor Gray
        Write-Host "  Updated title: $($updatedRecord.title)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: PUT update failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test record ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total records created: $($global:testRecordIds.Count)" -ForegroundColor Yellow
Write-Host "`nCleaning up all test records..." -ForegroundColor Yellow

# Cleanup: Delete all created records (DELETE endpoint already exists)
$deletedCount = 0
$failedCount = 0

foreach ($id in $global:testRecordIds) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/mainDiag/$id" -Method DELETE -Headers @{"Content-Type" = "application/json"} -ErrorAction Stop | Out-Null
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
