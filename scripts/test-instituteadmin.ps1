# Test script for instituteAdmin module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing instituteAdmin Module Endpoints ===" -ForegroundColor Cyan

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

# Test 1: POST /instituteAdmin/ (create institute admin) - requires SuperAdmin
Write-Host "`n1. Testing POST /instituteAdmin/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$createBody = @{
    email = "TEST_instituteAdmin_$testTimestamp@example.com"
    password = "TestPassword123!"
    fullName = "TEST Institute Admin $testTimestamp"
    phoneNum = "12345678901"
    approved = $true
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/" -Method POST -Headers $headersSuperAdmin -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created institute admin record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  email: $($createResponse.data.email)" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testInstituteAdminId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: GET /instituteAdmin/ (get all institute admins) - requires InstituteAdmin
Write-Host "`n2. Testing GET /instituteAdmin/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) institute admin records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /instituteAdmin/:id (get institute admin by ID) - using the record we just created
Write-Host "`n3. Testing GET /instituteAdmin/:id..." -ForegroundColor Yellow
if ($global:testInstituteAdminId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/$($global:testInstituteAdminId)" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved institute admin by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  email: $($record.email)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test institute admin ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Test 4: GET /instituteAdmin/supervisors - requires InstituteAdmin
Write-Host "`n4. Testing GET /instituteAdmin/supervisors..." -ForegroundColor Yellow
try {
    $getSupervisorsResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/supervisors" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $supervisors = if ($getSupervisorsResponse.data) { $getSupervisorsResponse.data } else { $getSupervisorsResponse }
    Write-Host "SUCCESS: Retrieved $($supervisors.Count) supervisors" -ForegroundColor Green
    if ($supervisors.Count -gt 0) {
        Write-Host "  First supervisor ID: $($supervisors[0].id)" -ForegroundColor Gray
        $global:existingSupervisorId = $supervisors[0].id
    }
} catch {
    Write-Host "ERROR: GET supervisors failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 5: GET /instituteAdmin/supervisors/:supervisorId/submissions - requires InstituteAdmin
Write-Host "`n5. Testing GET /instituteAdmin/supervisors/:supervisorId/submissions..." -ForegroundColor Yellow
if ($global:existingSupervisorId) {
    try {
        $getSubmissionsResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/supervisors/$($global:existingSupervisorId)/submissions" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $submissions = if ($getSubmissionsResponse.data) { $getSubmissionsResponse.data } else { $getSubmissionsResponse }
        Write-Host "SUCCESS: Retrieved supervisor submissions" -ForegroundColor Green
        Write-Host "  Number of submissions: $($submissions.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET supervisor submissions failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No existing supervisor ID available" -ForegroundColor Yellow
}

# Test 6: GET /instituteAdmin/candidates - requires InstituteAdmin
Write-Host "`n6. Testing GET /instituteAdmin/candidates..." -ForegroundColor Yellow
try {
    $getCandidatesResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/candidates" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $candidates = if ($getCandidatesResponse.data) { $getCandidatesResponse.data } else { $getCandidatesResponse }
    Write-Host "SUCCESS: Retrieved $($candidates.Count) candidates" -ForegroundColor Green
    if ($candidates.Count -gt 0) {
        Write-Host "  First candidate ID: $($candidates[0].id)" -ForegroundColor Gray
        $global:existingCandidateId = $candidates[0].id
    }
} catch {
    Write-Host "ERROR: GET candidates failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 7: GET /instituteAdmin/candidates/:candidateId/submissions - requires InstituteAdmin
Write-Host "`n7. Testing GET /instituteAdmin/candidates/:candidateId/submissions..." -ForegroundColor Yellow
if ($global:existingCandidateId) {
    try {
        $getCandidateSubmissionsResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/candidates/$($global:existingCandidateId)/submissions" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $candidateSubmissions = if ($getCandidateSubmissionsResponse.data) { $getCandidateSubmissionsResponse.data } else { $getCandidateSubmissionsResponse }
        Write-Host "SUCCESS: Retrieved candidate submissions" -ForegroundColor Green
        Write-Host "  Number of submissions: $($candidateSubmissions.Count)" -ForegroundColor Gray
        if ($candidateSubmissions.Count -gt 0) {
            $global:existingSubmissionId = $candidateSubmissions[0].id
        }
    } catch {
        Write-Host "ERROR: GET candidate submissions failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No existing candidate ID available" -ForegroundColor Yellow
}

# Test 8: GET /instituteAdmin/candidates/:candidateId/submissions/:submissionId - requires InstituteAdmin
Write-Host "`n8. Testing GET /instituteAdmin/candidates/:candidateId/submissions/:submissionId..." -ForegroundColor Yellow
if ($global:existingCandidateId -and $global:existingSubmissionId) {
    try {
        $getSubmissionByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/candidates/$($global:existingCandidateId)/submissions/$($global:existingSubmissionId)" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $submission = if ($getSubmissionByIdResponse.data) { $getSubmissionByIdResponse.data } else { $getSubmissionByIdResponse }
        Write-Host "SUCCESS: Retrieved candidate submission by ID" -ForegroundColor Green
        Write-Host "  Submission ID: $($submission.id)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidate submission by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No existing candidate or submission ID available" -ForegroundColor Yellow
}

# Test 9: GET /instituteAdmin/calendarProcedures - requires InstituteAdmin
Write-Host "`n9. Testing GET /instituteAdmin/calendarProcedures..." -ForegroundColor Yellow
try {
    $getCalendarResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/calendarProcedures" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $calendarProcedures = if ($getCalendarResponse.data) { $getCalendarResponse.data } else { $getCalendarResponse }
    Write-Host "SUCCESS: Retrieved calendar procedures" -ForegroundColor Green
    Write-Host "  Number of procedures: $($calendarProcedures.Count)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: GET calendar procedures failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 10: GET /instituteAdmin/calendarProcedures/analysis/hospital - requires InstituteAdmin
Write-Host "`n10. Testing GET /instituteAdmin/calendarProcedures/analysis/hospital..." -ForegroundColor Yellow
try {
    $getAnalysisResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/calendarProcedures/analysis/hospital" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $analysis = if ($getAnalysisResponse.data) { $getAnalysisResponse.data } else { $getAnalysisResponse }
    Write-Host "SUCCESS: Retrieved hospital analysis" -ForegroundColor Green
    Write-Host "  Analysis data retrieved" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: GET hospital analysis failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 11: GET /instituteAdmin/hospitals - requires InstituteAdmin
Write-Host "`n11. Testing GET /instituteAdmin/hospitals..." -ForegroundColor Yellow
try {
    $getHospitalsResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/hospitals" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $hospitals = if ($getHospitalsResponse.data) { $getHospitalsResponse.data } else { $getHospitalsResponse }
    Write-Host "SUCCESS: Retrieved $($hospitals.Count) hospitals" -ForegroundColor Green
} catch {
    Write-Host "ERROR: GET hospitals failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 12: GET /instituteAdmin/arabicProcedures - requires InstituteAdmin
Write-Host "`n12. Testing GET /instituteAdmin/arabicProcedures..." -ForegroundColor Yellow
try {
    $getArabicProceduresResponse = Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/arabicProcedures" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $arabicProcedures = if ($getArabicProceduresResponse.data) { $getArabicProceduresResponse.data } else { $getArabicProceduresResponse }
    Write-Host "SUCCESS: Retrieved $($arabicProcedures.Count) Arabic procedures" -ForegroundColor Green
} catch {
    Write-Host "ERROR: GET Arabic procedures failed - $($_.Exception.Message)" -ForegroundColor Red
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
        Invoke-RestMethod -Uri "http://localhost:3001/instituteAdmin/$id" -Method DELETE -Headers $headersInstituteAdmin -ErrorAction Stop | Out-Null
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
