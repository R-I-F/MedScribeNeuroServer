# Test script for sub module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing sub Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Candidate = ($envContent | Select-String -Pattern "^TESTING_CANDIDATE_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Supervisor = ($envContent | Select-String -Pattern "^TESTING_SUPERVISOR_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.InstituteAdmin = ($envContent | Select-String -Pattern "^TESTING_INSTITUTEADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

$headersSuperAdmin = @{
    "Authorization" = "Bearer $($tokens.SuperAdmin)"
    "Content-Type" = "application/json"
}

$headersCandidate = @{
    "Authorization" = "Bearer $($tokens.Candidate)"
    "Content-Type" = "application/json"
}

$headersSupervisor = @{
    "Authorization" = "Bearer $($tokens.Supervisor)"
    "Content-Type" = "application/json"
}

$headersInstituteAdmin = @{
    "Authorization" = "Bearer $($tokens.InstituteAdmin)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()

# Test 1: GET /sub/candidate/stats (requires Candidate auth)
Write-Host "`n1. Testing GET /sub/candidate/stats..." -ForegroundColor Yellow
if ($tokens.Candidate) {
    try {
        $statsResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/candidate/stats" -Method GET -Headers $headersCandidate -ErrorAction Stop
        $stats = if ($statsResponse.data) { $statsResponse.data } else { $statsResponse }
        Write-Host "SUCCESS: Retrieved candidate submission stats" -ForegroundColor Green
        Write-Host "  Stats data retrieved" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidate stats failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: TESTING_CANDIDATE_BEARERTOKEN not found in .env" -ForegroundColor Yellow
}

# Test 2: GET /sub/candidate/submissions (requires Candidate auth)
Write-Host "`n2. Testing GET /sub/candidate/submissions..." -ForegroundColor Yellow
if ($tokens.Candidate) {
    try {
        $candidateSubmissionsResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/candidate/submissions" -Method GET -Headers $headersCandidate -ErrorAction Stop
        $candidateSubmissions = if ($candidateSubmissionsResponse.data) { $candidateSubmissionsResponse.data } else { $candidateSubmissionsResponse }
        Write-Host "SUCCESS: Retrieved $($candidateSubmissions.Count) candidate submissions" -ForegroundColor Green
        if ($candidateSubmissions.Count -gt 0) {
            Write-Host "  First submission ID: $($candidateSubmissions[0].id)" -ForegroundColor Gray
            $global:existingCandidateSubmissionId = $candidateSubmissions[0].id
        }
    } catch {
        Write-Host "ERROR: GET candidate submissions failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: TESTING_CANDIDATE_BEARERTOKEN not found in .env" -ForegroundColor Yellow
}

# Test 3: GET /sub/candidate/submissions/:id (requires Candidate auth)
Write-Host "`n3. Testing GET /sub/candidate/submissions/:id..." -ForegroundColor Yellow
if ($tokens.Candidate -and $global:existingCandidateSubmissionId) {
    try {
        $candidateSubmissionByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/candidate/submissions/$($global:existingCandidateSubmissionId)" -Method GET -Headers $headersCandidate -ErrorAction Stop
        $submission = if ($candidateSubmissionByIdResponse.data) { $candidateSubmissionByIdResponse.data } else { $candidateSubmissionByIdResponse }
        Write-Host "SUCCESS: Retrieved candidate submission by ID" -ForegroundColor Green
        Write-Host "  Submission ID: $($submission.id)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidate submission by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No candidate token or submission ID available" -ForegroundColor Yellow
}

# Test 4: GET /sub/supervisor/submissions (requires Supervisor auth)
Write-Host "`n4. Testing GET /sub/supervisor/submissions..." -ForegroundColor Yellow
if ($tokens.Supervisor) {
    try {
        $supervisorSubmissionsResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/supervisor/submissions" -Method GET -Headers $headersSupervisor -ErrorAction Stop
        $supervisorSubmissions = if ($supervisorSubmissionsResponse.data) { $supervisorSubmissionsResponse.data } else { $supervisorSubmissionsResponse }
        Write-Host "SUCCESS: Retrieved $($supervisorSubmissions.Count) supervisor submissions" -ForegroundColor Green
        if ($supervisorSubmissions.Count -gt 0) {
            Write-Host "  First submission ID: $($supervisorSubmissions[0].id)" -ForegroundColor Gray
            $global:existingSupervisorSubmissionId = $supervisorSubmissions[0].id
            if ($supervisorSubmissions[0].candidate -and $supervisorSubmissions[0].candidate.id) {
                $global:existingCandidateIdForSupervisor = $supervisorSubmissions[0].candidate.id
            }
        }
    } catch {
        Write-Host "ERROR: GET supervisor submissions failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: TESTING_SUPERVISOR_BEARERTOKEN not found in .env" -ForegroundColor Yellow
}

# Test 5: GET /sub/supervisor/submissions/:id (requires Supervisor auth)
Write-Host "`n5. Testing GET /sub/supervisor/submissions/:id..." -ForegroundColor Yellow
if ($tokens.Supervisor -and $global:existingSupervisorSubmissionId) {
    try {
        $supervisorSubmissionByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/supervisor/submissions/$($global:existingSupervisorSubmissionId)" -Method GET -Headers $headersSupervisor -ErrorAction Stop
        $submission = if ($supervisorSubmissionByIdResponse.data) { $supervisorSubmissionByIdResponse.data } else { $supervisorSubmissionByIdResponse }
        Write-Host "SUCCESS: Retrieved supervisor submission by ID" -ForegroundColor Green
        Write-Host "  Submission ID: $($submission.id)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET supervisor submission by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No supervisor token or submission ID available" -ForegroundColor Yellow
}

# Test 6: GET /sub/supervisor/candidates/:candidateId/submissions (requires Supervisor auth)
Write-Host "`n6. Testing GET /sub/supervisor/candidates/:candidateId/submissions..." -ForegroundColor Yellow
if ($tokens.Supervisor -and $global:existingCandidateIdForSupervisor) {
    try {
        $candidateSubsBySupervisorResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/supervisor/candidates/$($global:existingCandidateIdForSupervisor)/submissions" -Method GET -Headers $headersSupervisor -ErrorAction Stop
        $subs = if ($candidateSubsBySupervisorResponse.data) { $candidateSubsBySupervisorResponse.data } else { $candidateSubsBySupervisorResponse }
        Write-Host "SUCCESS: Retrieved candidate submissions by supervisor" -ForegroundColor Green
        Write-Host "  Number of submissions: $($subs.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidate submissions by supervisor failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No supervisor token or candidate ID available" -ForegroundColor Yellow
}

# Test 7: POST /sub/postAllFromExternal (creates many submissions from external source)
Write-Host "`n7. Testing POST /sub/postAllFromExternal..." -ForegroundColor Yellow
$externalBody = @{} | ConvertTo-Json

try {
    Write-Host "  Calling external service (this may create many records)..." -ForegroundColor Gray
    $externalResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/postAllFromExternal" -Method POST -Headers $headersSuperAdmin -Body $externalBody -ErrorAction Stop
    
    if ($externalResponse.data -and $externalResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: External import created $($externalResponse.data.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse.data | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($externalIds[-1])" -ForegroundColor Gray
        $global:testSubmissionId = $externalIds[0]
    } elseif ($externalResponse.Count -gt 0) {
        # Sometimes response is just an array
        Write-Host "SUCCESS: External import created $($externalResponse.Count) records" -ForegroundColor Green
        $externalIds = $externalResponse | ForEach-Object { $_.id }
        $global:testRecordIds += $externalIds
        Write-Host "  First record ID: $($externalIds[0])" -ForegroundColor Gray
        Write-Host "  Last record ID: $($externalIds[-1])" -ForegroundColor Gray
        $global:testSubmissionId = $externalIds[0]
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

# Test 8: POST /sub/submissions/:id/generateSurgicalNotes (requires InstituteAdmin auth)
Write-Host "`n8. Testing POST /sub/submissions/:id/generateSurgicalNotes..." -ForegroundColor Yellow
if ($tokens.InstituteAdmin -and $global:testSubmissionId) {
    try {
        $generateNotesResponse = Invoke-RestMethod -Uri "http://localhost:3001/sub/submissions/$($global:testSubmissionId)/generateSurgicalNotes" -Method POST -Headers $headersInstituteAdmin -ErrorAction Stop
        Write-Host "SUCCESS: Generated surgical notes" -ForegroundColor Green
        Write-Host "  Notes generated" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: Generate surgical notes failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No institute admin token or test submission ID available" -ForegroundColor Yellow
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
        Invoke-RestMethod -Uri "http://localhost:3001/sub/$id" -Method DELETE -Headers $headersSuperAdmin -ErrorAction Stop | Out-Null
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
