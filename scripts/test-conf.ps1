# Test script for conf module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing conf Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.InstituteAdmin = ($envContent | Select-String -Pattern "^TESTING_INSTITUTEADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Supervisor = ($envContent | Select-String -Pattern "^TESTING_SUPERVISOR_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

if (-not $tokens.InstituteAdmin) {
    Write-Host "ERROR: TESTING_INSTITUTEADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

if (-not $tokens.Supervisor) {
    Write-Host "WARNING: TESTING_SUPERVISOR_BEARERTOKEN not found in .env - may need supervisor ID" -ForegroundColor Yellow
}

$headersSuperAdmin = @{
    "Authorization" = "Bearer $($tokens.SuperAdmin)"
    "Content-Type" = "application/json"
}

$headersInstituteAdmin = @{
    "Authorization" = "Bearer $($tokens.InstituteAdmin)"
    "Content-Type" = "application/json"
}

$headersSupervisor = @{
    "Authorization" = "Bearer $($tokens.Supervisor)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()

# Get an existing supervisor ID for testing (conf requires a presenter which is a supervisor)
Write-Host "`nFetching existing supervisor ID for testing..." -ForegroundColor Gray
$existingSupervisorId = $null
if ($tokens.Supervisor) {
    try {
        $supervisorsResponse = Invoke-RestMethod -Uri "http://localhost:3001/supervisor/" -Method GET -Headers $headersSupervisor -ErrorAction Stop
        $supervisors = if ($supervisorsResponse.data) { $supervisorsResponse.data } else { $supervisorsResponse }
        if ($supervisors.Count -gt 0) {
            $existingSupervisorId = $supervisors[0].id
            Write-Host "  Found supervisor ID: $existingSupervisorId" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  WARNING: Could not fetch supervisor ID: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if (-not $existingSupervisorId) {
    Write-Host "ERROR: Could not get a supervisor ID. Conf creation requires a valid supervisor (presenter) ID." -ForegroundColor Red
    exit 1
}

# Test 1: GET /conf/ (get all confs) - requires InstituteAdmin
Write-Host "`n1. Testing GET /conf/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/conf/" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) conf records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        Write-Host "  First record title: $($allRecords[0].confTitle)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /conf/ (create conf) - requires SuperAdmin
Write-Host "`n2. Testing POST /conf/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$testDate = (Get-Date).ToString("yyyy-MM-dd")
$createBody = @{
    confTitle = "TEST_Conf_$testTimestamp"
    google_uid = "TEST_GOOGLE_UID_$testTimestamp"
    presenter = $existingSupervisorId
    date = $testDate
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/conf/" -Method POST -Headers $headersSuperAdmin -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created conf record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  confTitle: $(if ($createResponse.data) { $createResponse.data.confTitle } else { $createResponse.confTitle })" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testConfId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /conf/:id (get conf by ID) - using the record we just created
Write-Host "`n3. Testing GET /conf/:id..." -ForegroundColor Yellow
if ($global:testConfId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/conf/$($global:testConfId)" -Method GET -Headers $headersSuperAdmin -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved conf by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  confTitle: $($record.confTitle)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test conf ID available (POST create may have failed)" -ForegroundColor Yellow
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
        Invoke-RestMethod -Uri "http://localhost:3001/conf/$id" -Method DELETE -Headers $headersSuperAdmin -ErrorAction Stop | Out-Null
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
