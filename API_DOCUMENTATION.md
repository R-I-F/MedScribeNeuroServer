# MedScribe Neuro Server API Documentation

Base URL: `http://localhost:3001` (or your configured server URL)

All responses follow a standardized format:
```json
{
  "status": "success" | "error",
  "statusCode": 200,
  "message": "OK",
  "data": { ... },
  "error": { ... },
  "meta": { ... }
}
```

---

## Authentication (`/auth`)

### Validate Token
**GET** `/auth/validate`

Validates a JWT token and returns authorization status.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "authorized": true,
  "tokenPayload": { "email": "user@example.com", ... }
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

---

### Register Candidate
**POST** `/auth/registerCand`

Registers a new candidate user.

**Request Body:**
```json
{
  "email": "candidate@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phoneNum": "+1234567890",
  "regNum": "REG123456",
  "nationality": "Egyptian",
  "rank": "professor",
  "regDeg": "msc"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    "email": "candidate@example.com",
    "fullName": "John Doe",
    ...
  }
}
```

---

### Login Candidate
**POST** `/auth/loginCand`

Authenticates a candidate and returns a JWT token.

**Request Body:**
```json
{
  "email": "candidate@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "candidate": {
      "_id": "...",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      ...
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "UnAuthorized: wrong password"
}
```

---

### Reset All Candidate Passwords
**POST** `/auth/resetCandPass`

Resets all candidate passwords to the default encrypted password (`MEDscrobe01$`).

**Response (200 OK):**
```json
{
  "data": {
    "updatedCount": 42,
    "defaultPassword": "MEDscrobe01$"
  }
}
```

---

### Get All Users
**GET** `/auth/get/all`

Retrieves all users (currently not implemented).

---

## Mailer (`/mailer`)

### Send Email
**POST** `/mailer/send`

Sends an email using the configured SMTP server.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "from": "sender@example.com" // optional
}
```

**Note:** At least one of `text` or `html` must be provided.

**Response (200 OK):**
```json
{
  "data": {
    "message": "Email sent successfully to recipient@example.com"
  }
}
```

---

## Submissions (`/sub`)

### Create Submissions from External
**POST** `/sub/postAllFromExternal`

Creates submissions from external data source (Google Sheets).

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": "...",
      ...
    }
  ]
}
```

---

### Update Submission Status from External
**PATCH** `/sub/updateStatusFromExternal`

Updates submission statuses from external data source.

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "...",
      "subStatus": "approved",
      ...
    }
  ]
}
```

---

## Candidates (`/cand`)

### Create Candidates from External
**POST** `/cand/createCandsFromExternal`

Creates candidates from external data source (Google Sheets).

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      ...
    }
  ]
}
```

---

## CalSurg (`/calSurg`)

### Create CalSurg from External
**POST** `/calSurg/postAllFromExternal`

Creates calendar surgery entries from external data source.

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      "google_uid": "...",
      ...
    }
  ]
}
```

---

### Get CalSurg by ID
**GET** `/calSurg/getById`

Retrieves a calendar surgery entry by ID.

**Query Parameters:**
- `id` (required): MongoDB ObjectId

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "google_uid": "...",
    ...
  }
}
```

---

### Get All CalSurg with Filters
**GET** `/calSurg/getAll`

Retrieves calendar surgery entries with optional filters.

**Query Parameters:**
- Various filter parameters (see validator)

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "...",
      "google_uid": "...",
      ...
    }
  ]
}
```

---

## Diagnosis (`/diagnosis`)

### Create Bulk Diagnoses
**POST** `/diagnosis/postBulk`

Creates multiple diagnoses in bulk.

**Request Body:**
```json
{
  "diagnoses": [
    {
      "icdCode": "G93.1",
      "title": "Anoxic brain damage",
      ...
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      "icdCode": "G93.1",
      ...
    }
  ]
}
```

---

### Create Single Diagnosis
**POST** `/diagnosis/post`

Creates a single diagnosis.

**Request Body:**
```json
{
  "icdCode": "G93.1",
  "title": "Anoxic brain damage",
  ...
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    "icdCode": "G93.1",
    ...
  }
}
```

---

## Procedure CPT (`/procCpt`)

### Create ProcCpt from External
**POST** `/procCpt/postAllFromExternal`

Creates procedure CPT codes from external data source.

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      "numCode": "61783",
      ...
    }
  ]
}
```

---

### Upsert ProcCpt
**POST** `/procCpt/upsert`

Creates or updates a procedure CPT code.

**Request Body:**
```json
{
  "numCode": "61783",
  "alphaCode": "A",
  "title": "Procedure title",
  ...
}
```

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "numCode": "61783",
    ...
  }
}
```

---

## Supervisor (`/supervisor`)

### Create Supervisor
**POST** `/supervisor/`

Creates a new supervisor.

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith",
  "email": "jane.smith@example.com",
  ...
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    "fullName": "Dr. Jane Smith",
    ...
  }
}
```

---

### Get All Supervisors
**GET** `/supervisor/`

Retrieves all supervisors.

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "...",
      "fullName": "Dr. Jane Smith",
      ...
    }
  ]
}
```

---

### Get Supervisor by ID
**GET** `/supervisor/:id`

Retrieves a supervisor by MongoDB ObjectId.

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "fullName": "Dr. Jane Smith",
    ...
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "Supervisor not found"
}
```

---

### Update Supervisor
**PUT** `/supervisor/:id`

Updates a supervisor by ID.

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith Updated",
  ...
}
```

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "fullName": "Dr. Jane Smith Updated",
    ...
  }
}
```

---

### Delete Supervisor
**DELETE** `/supervisor/:id`

Deletes a supervisor by ID.

**Response (200 OK):**
```json
{
  "data": {
    "message": "Supervisor deleted successfully"
  }
}
```

---

## Main Diagnosis (`/mainDiag`)

### Create Main Diagnosis
**POST** `/mainDiag/`

Creates a new main diagnosis category.

**Request Body:**
```json
{
  "title": "cns tumors",
  ...
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    "title": "cns tumors",
    ...
  }
}
```

---

### Get All Main Diagnoses
**GET** `/mainDiag/`

Retrieves all main diagnosis categories.

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "...",
      "title": "cns tumors",
      ...
    }
  ]
}
```

---

### Get Main Diagnosis by ID
**GET** `/mainDiag/:id`

Retrieves a main diagnosis by MongoDB ObjectId.

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "title": "cns tumors",
    ...
  }
}
```

---

### Update Main Diagnosis
**PUT** `/mainDiag/:id`

Updates a main diagnosis by ID.

**Request Body:**
```json
{
  "title": "updated title",
  ...
}
```

**Response (200 OK):**
```json
{
  "data": {
    "_id": "...",
    "title": "updated title",
    ...
  }
}
```

---

### Delete Main Diagnosis
**DELETE** `/mainDiag/:id`

Deletes a main diagnosis by ID.

**Response (200 OK):**
```json
{
  "data": {
    "message": "MainDiag deleted successfully"
  }
}
```

---

## Arab Procedure (`/arabProc`)

### Get All Arab Procedures
**GET** `/arabProc/getAllArabProcs`

Retrieves all Arabic procedure entries.

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "...",
      ...
    }
  ]
}
```

---

### Create Arab Procedure
**POST** `/arabProc/createArabProc`

Creates a new Arabic procedure entry.

**Request Body:**
```json
{
  ...
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    ...
  }
}
```

---

### Create Arab Procedure from External
**POST** `/arabProc/createArabProcFromExternal`

Creates Arabic procedure entries from external data source.

**Request Body:**
```json
{
  "row": 46  // optional, specific row number
}
```

**Response (201 Created):**
```json
{
  "data": [
    {
      "_id": "...",
      ...
    }
  ]
}
```

---

## Hospital (`/hospital`)

### Create Hospital
**POST** `/hospital/create`

Creates a new hospital entry.

**Request Body:**
```json
{
  "name": "Cairo University Hospital",
  ...
}
```

**Response (201 Created):**
```json
{
  "data": {
    "_id": "...",
    "name": "Cairo University Hospital",
    ...
  }
}
```

---

## External Service (`/external`)

### Get Arab Procedure Data
**GET** `/external`

Retrieves Arabic procedure data from external source.

**Query Parameters:**
- Various parameters (see validator)

**Response (200 OK):**
```json
{
  "data": {
    ...
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
Validation errors:
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "msg": "Invalid email",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message"
}
```

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

To obtain a token, use the `/auth/loginCand` endpoint.

---

## Notes

- All timestamps are in ISO 8601 format
- All MongoDB ObjectIds are returned as strings
- Password fields are never returned in responses
- External data endpoints pull from configured Google Sheets
- The `row` parameter in external endpoints is optional; if omitted, all rows are processed

