# Test script for supervisor module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing supervisor Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Supervisor = ($envContent | Select-String -Pattern "^TESTING_SUPERVISOR_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

$headersSuperAdmin = @{
    "Authorization" = "Bearer $($tokens.SuperAdmin)"
    "Content-Type" = "application/json"
}

$headersSupervisor = @{
    "Authorization" = "Bearer $($tokens.Supervisor)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()

# Test 1: GET /supervisor/ (get all supervisors) - read only
Write-Host "`n1. Testing GET /supervisor/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/supervisor/" -Method GET -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) supervisor records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        Write-Host "  First record email: $($allRecords[0].email)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /supervisor/ (create supervisor) - requires SuperAdmin
Write-Host "`n2. Testing POST /supervisor/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    email = "TEST_supervisor_$testTimestamp@example.com"
    password = "TestPassword123!"
    fullName = "TEST Supervisor $testTimestamp"
    phoneNum = "12345678901"
    approved = $true
    canValidate = $false
    position = "Lecturer"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/supervisor/" -Method POST -Headers $headersSuperAdmin -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created supervisor record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  email: $($createResponse.data.email)" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testSupervisorId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /supervisor/:id (get supervisor by ID) - using the record we just created
Write-Host "`n3. Testing GET /supervisor/:id..." -ForegroundColor Yellow
if ($global:testSupervisorId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/supervisor/$($global:testSupervisorId)" -Method GET -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved supervisor by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  email: $($record.email)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test supervisor ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Test 4: GET /supervisor/candidates (requires Supervisor auth)
Write-Host "`n4. Testing GET /supervisor/candidates..." -ForegroundColor Yellow
if ($tokens.Supervisor) {
    try {
        $getCandidatesResponse = Invoke-RestMethod -Uri "http://localhost:3001/supervisor/candidates" -Method GET -Headers $headersSupervisor -ErrorAction Stop
        $candidates = if ($getCandidatesResponse.data) { $getCandidatesResponse.data } else { $getCandidatesResponse }
        Write-Host "SUCCESS: Retrieved supervised candidates" -ForegroundColor Green
        Write-Host "  Number of candidates: $($candidates.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidates failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: TESTING_SUPERVISOR_BEARERTOKEN not found in .env" -ForegroundColor Yellow
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
        Invoke-RestMethod -Uri "http://localhost:3001/supervisor/$id" -Method DELETE -Headers @{"Content-Type" = "application/json"} -ErrorAction Stop | Out-Null
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
