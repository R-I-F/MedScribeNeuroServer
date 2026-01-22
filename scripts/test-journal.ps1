# Test script for journal module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing journal Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.InstituteAdmin = ($envContent | Select-String -Pattern "^TESTING_INSTITUTEADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

if (-not $tokens.InstituteAdmin) {
    Write-Host "ERROR: TESTING_INSTITUTEADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

$headersSuperAdmin = @{
    "Authorization" = "Bearer $($tokens.SuperAdmin)"
    "Content-Type" = "application/json"
}

$headersInstituteAdmin = @{
    "Authorization" = "Bearer $($tokens.InstituteAdmin)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()

# Test 1: GET /journal/ (get all journals) - requires InstituteAdmin
Write-Host "`n1. Testing GET /journal/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/journal/" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) journal records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        Write-Host "  First record title: $($allRecords[0].journalTitle)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /journal/ (create journal) - requires SuperAdmin
Write-Host "`n2. Testing POST /journal/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    journalTitle = "TEST_Journal_$testTimestamp"
    pdfLink = "https://example.com/test_journal_$testTimestamp.pdf"
    google_uid = "TEST_GOOGLE_UID_$testTimestamp"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/journal/" -Method POST -Headers $headersSuperAdmin -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created journal record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  journalTitle: $(if ($createResponse.data) { $createResponse.data.journalTitle } else { $createResponse.journalTitle })" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testJournalId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /journal/:id (get journal by ID) - using the record we just created
Write-Host "`n3. Testing GET /journal/:id..." -ForegroundColor Yellow
if ($global:testJournalId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/journal/$($global:testJournalId)" -Method GET -Headers $headersSuperAdmin -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved journal by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  journalTitle: $($record.journalTitle)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test journal ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Test 4: POST /journal/postBulk (bulk create from external) - requires SuperAdmin
Write-Host "`n4. Testing POST /journal/postBulk..." -ForegroundColor Yellow
$bulkBody = @{} | ConvertTo-Json

try {
    Write-Host "  Calling external service (this may create many records)..." -ForegroundColor Gray
    $bulkResponse = Invoke-RestMethod -Uri "http://localhost:3001/journal/postBulk" -Method POST -Headers $headersSuperAdmin -Body $bulkBody -ErrorAction Stop
    
    if ($bulkResponse.data -and $bulkResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: Bulk import created $($bulkResponse.data.Count) records" -ForegroundColor Green
        $bulkIds = $bulkResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $bulkIds
        Write-Host "  First record ID: $($bulkIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($bulkIds[-1])" -ForegroundColor Gray
    } elseif ($bulkResponse.Count -gt 0) {
        # Sometimes response is just an array
        Write-Host "SUCCESS: Bulk import created $($bulkResponse.Count) records" -ForegroundColor Green
        $bulkIds = $bulkResponse | ForEach-Object { $_.id }
        $global:testRecordIds += $bulkIds
        Write-Host "  First record ID: $($bulkIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($bulkIds[-1])" -ForegroundColor Gray
    } else {
        Write-Host "WARNING: Bulk import returned no data or unexpected format" -ForegroundColor Yellow
        Write-Host "  Response: $($bulkResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Bulk import failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
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
        Invoke-RestMethod -Uri "http://localhost:3001/journal/$id" -Method DELETE -Headers $headersSuperAdmin -ErrorAction Stop | Out-Null
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
