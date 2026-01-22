# Test script for event module endpoints
# Database Rules: Only create test data, never modify/delete existing data, clean up only what we create

Write-Host "=== Testing event Module Endpoints ===" -ForegroundColor Cyan

# Load tokens from .env
$envContent = Get-Content .env
$tokens = @{}
$tokens.SuperAdmin = ($envContent | Select-String -Pattern "^TESTING_SUPERADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.InstituteAdmin = ($envContent | Select-String -Pattern "^TESTING_INSTITUTEADMIN_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Candidate = ($envContent | Select-String -Pattern "^TESTING_CANDIDATE_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })
$tokens.Supervisor = ($envContent | Select-String -Pattern "^TESTING_SUPERVISOR_BEARERTOKEN\s*[=:]\s*(.+)" | ForEach-Object { ($_.Matches.Groups[1].Value).Trim() })

if (-not $tokens.SuperAdmin) {
    Write-Host "ERROR: TESTING_SUPERADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

if (-not $tokens.InstituteAdmin) {
    Write-Host "ERROR: TESTING_INSTITUTEADMIN_BEARERTOKEN not found in .env" -ForegroundColor Red
    exit 1
}

if (-not $tokens.Candidate) {
    Write-Host "ERROR: TESTING_CANDIDATE_BEARERTOKEN not found in .env" -ForegroundColor Red
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

$headersCandidate = @{
    "Authorization" = "Bearer $($tokens.Candidate)"
    "Content-Type" = "application/json"
}

$headersSupervisor = @{
    "Authorization" = "Bearer $($tokens.Supervisor)"
    "Content-Type" = "application/json"
}

# Track all created record IDs for cleanup
$global:testRecordIds = @()
$global:testAttendanceIds = @()

# Fetch existing IDs needed for testing
Write-Host "`nFetching existing IDs for testing..." -ForegroundColor Gray

# Get lecture ID
$existingLectureId = $null
try {
    $lecturesResponse = Invoke-RestMethod -Uri "http://localhost:3001/lecture/" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $lectures = if ($lecturesResponse.data) { $lecturesResponse.data } else { $lecturesResponse }
    if ($lectures.Count -gt 0) {
        $existingLectureId = $lectures[0].id
        Write-Host "  Found lecture ID: $existingLectureId" -ForegroundColor Gray
    }
} catch {
    Write-Host "  WARNING: Could not fetch lecture ID: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Get supervisor ID (for lecture/conf presenter)
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

# Get candidate ID from JWT token (decode the token to extract the ID)
$existingCandidateId = $null
try {
    # Extract candidate ID from JWT token (token format: header.payload.signature)
    $candidateToken = $tokens.Candidate
    if ($candidateToken) {
        # Decode JWT payload (second part, base64)
        $parts = $candidateToken.Split('.')
        if ($parts.Length -ge 2) {
            $payload = $parts[1]
            # Add padding if needed for base64
            $mod = $payload.Length % 4
            if ($mod -gt 0) {
                $payload = $payload + ("=" * (4 - $mod))
            }
            # Decode base64
            $decodedBytes = [System.Convert]::FromBase64String($payload)
            $decodedJson = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
            $jwtPayload = $decodedJson | ConvertFrom-Json
            $existingCandidateId = $jwtPayload.id
            if (-not $existingCandidateId) {
                $existingCandidateId = $jwtPayload._id
            }
            Write-Host "  Found candidate ID from JWT: $existingCandidateId" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  WARNING: Could not extract candidate ID from JWT: $($_.Exception.Message)" -ForegroundColor Yellow
}

if (-not $existingLectureId -or -not $existingSupervisorId -or -not $existingCandidateId) {
    Write-Host "ERROR: Missing required IDs for testing" -ForegroundColor Red
    exit 1
}

# Test 1: GET /event/ (get all events) - requires InstituteAdmin
Write-Host "`n1. Testing GET /event/..." -ForegroundColor Yellow
try {
    $getAllResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
    $allRecords = if ($getAllResponse.data) { $getAllResponse.data } else { $getAllResponse }
    Write-Host "SUCCESS: Retrieved $($allRecords.Count) event records" -ForegroundColor Green
    if ($allRecords.Count -gt 0) {
        Write-Host "  First record ID: $($allRecords[0].id)" -ForegroundColor Gray
        Write-Host "  First record type: $($allRecords[0].type)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: GET all failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 2: POST /event/ (create event) - requires InstituteAdmin
Write-Host "`n2. Testing POST /event/..." -ForegroundColor Yellow
$testTimestamp = Get-Date -Format "yyyyMMddHHmmss"
$testDateTime = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
$createBody = @{
    type = "lecture"
    lecture = $existingLectureId
    dateTime = $testDateTime
    location = "Dept"
    presenter = $existingSupervisorId
    status = "booked"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/" -Method POST -Headers $headersInstituteAdmin -Body $createBody -ErrorAction Stop
    Write-Host "SUCCESS: Created event record" -ForegroundColor Green
    $createdId = if ($createResponse.data) { $createResponse.data.id } else { $createResponse.id }
    Write-Host "  ID: $createdId" -ForegroundColor Gray
    Write-Host "  Type: $(if ($createResponse.data) { $createResponse.data.type } else { $createResponse.type })" -ForegroundColor Gray
    $global:testRecordIds += $createdId
    $global:testEventId = $createdId
} catch {
    Write-Host "ERROR: POST create failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 3: GET /event/:id (get event by ID) - using the record we just created
Write-Host "`n3. Testing GET /event/:id..." -ForegroundColor Yellow
if ($global:testEventId) {
    try {
        $getByIdResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/$($global:testEventId)" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $record = if ($getByIdResponse.data) { $getByIdResponse.data } else { $getByIdResponse }
        Write-Host "SUCCESS: Retrieved event by ID" -ForegroundColor Green
        Write-Host "  ID: $($record.id)" -ForegroundColor Gray
        Write-Host "  Type: $($record.type)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test event ID available (POST create may have failed)" -ForegroundColor Yellow
}

# Test 4: GET /event/candidate/points (get candidate's own points) - requires Candidate
Write-Host "`n4. Testing GET /event/candidate/points..." -ForegroundColor Yellow
try {
    $pointsResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/candidate/points" -Method GET -Headers $headersCandidate -ErrorAction Stop
    $points = if ($pointsResponse.data) { $pointsResponse.data } else { $pointsResponse }
    Write-Host "SUCCESS: Retrieved candidate's own points" -ForegroundColor Green
    Write-Host "  Total Points: $($points.totalPoints)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: GET candidate points failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Test 5: GET /event/candidate/:candidateId/points (get candidate points by ID)
Write-Host "`n5. Testing GET /event/candidate/:candidateId/points..." -ForegroundColor Yellow
if ($existingCandidateId) {
    try {
        $candidatePointsResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/candidate/$existingCandidateId/points" -Method GET -Headers $headersInstituteAdmin -ErrorAction Stop
        $points = if ($candidatePointsResponse.data) { $candidatePointsResponse.data } else { $candidatePointsResponse }
        Write-Host "SUCCESS: Retrieved candidate points by ID" -ForegroundColor Green
        Write-Host "  Total Points: $($points.totalPoints)" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR: GET candidate points by ID failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No candidate ID available" -ForegroundColor Yellow
}

# Test 6: POST /event/:eventId/attendance/:candidateId (add attendance)
Write-Host "`n6. Testing POST /event/:eventId/attendance/:candidateId..." -ForegroundColor Yellow
if ($global:testEventId -and $existingCandidateId) {
    try {
        $addAttendanceResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/$($global:testEventId)/attendance/$existingCandidateId" -Method POST -Headers $headersCandidate -ErrorAction Stop
        Write-Host "SUCCESS: Added attendance" -ForegroundColor Green
        Write-Host "  Event ID: $($global:testEventId)" -ForegroundColor Gray
        Write-Host "  Candidate ID: $existingCandidateId" -ForegroundColor Gray
        # Track attendance for cleanup
        $global:testAttendanceIds += @{
            EventId = $global:testEventId
            CandidateId = $existingCandidateId
        }
    } catch {
        Write-Host "ERROR: Add attendance failed - $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "SKIPPED: No test event ID or candidate ID available" -ForegroundColor Yellow
}

# Test 7: POST /event/bulk-import-attendance (bulk import attendance) - requires InstituteAdmin
Write-Host "`n7. Testing POST /event/bulk-import-attendance..." -ForegroundColor Yellow
try {
    Write-Host "  Calling bulk import (this may create attendance records)..." -ForegroundColor Gray
    $bulkImportResponse = Invoke-RestMethod -Uri "http://localhost:3001/event/bulk-import-attendance" -Method POST -Headers $headersInstituteAdmin -ErrorAction Stop
    if ($bulkImportResponse.data -and $bulkImportResponse.data.Count -gt 0) {
        Write-Host "SUCCESS: Bulk import created/updated attendance records" -ForegroundColor Green
        Write-Host "  Records processed: $($bulkImportResponse.data.Count)" -ForegroundColor Gray
    } else {
        Write-Host "SUCCESS: Bulk import completed (may have returned no data)" -ForegroundColor Green
        Write-Host "  Response: $($bulkImportResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Bulk import failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Total events created: $($global:testRecordIds.Count)" -ForegroundColor Yellow
Write-Host "Total attendance records created: $($global:testAttendanceIds.Count)" -ForegroundColor Yellow
Write-Host "`nCleaning up all test records..." -ForegroundColor Yellow

# Cleanup: Remove attendance first, then delete events
$deletedAttendanceCount = 0
$failedAttendanceCount = 0

foreach ($attendance in $global:testAttendanceIds) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/event/$($attendance.EventId)/attendance/$($attendance.CandidateId)" -Method DELETE -Headers $headersInstituteAdmin -ErrorAction Stop | Out-Null
        $deletedAttendanceCount++
    } catch {
        $failedAttendanceCount++
        Write-Host "  Failed to remove attendance for event $($attendance.EventId): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "  Removed $deletedAttendanceCount attendance records..." -ForegroundColor Gray

# Cleanup: Delete all created events (DELETE endpoint already exists)
$deletedCount = 0
$failedCount = 0

foreach ($id in $global:testRecordIds) {
    try {
        Invoke-RestMethod -Uri "http://localhost:3001/event/$id" -Method DELETE -Headers $headersInstituteAdmin -ErrorAction Stop | Out-Null
        $deletedCount++
    } catch {
        $failedCount++
        Write-Host "  Failed to delete $id : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Cyan
Write-Host "Deleted events: $deletedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "Failed events: $failedCount records" -ForegroundColor $(if ($failedCount -eq 0) { "Gray" } else { "Red" })
Write-Host "Removed attendance: $deletedAttendanceCount records" -ForegroundColor $(if ($failedAttendanceCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "Failed attendance: $failedAttendanceCount records" -ForegroundColor $(if ($failedAttendanceCount -eq 0) { "Gray" } else { "Red" })
