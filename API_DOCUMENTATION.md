# MedScribe Neuro Server API Documentation

**Base URL**: `http://localhost:3001` (or your configured server URL)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Submissions](#submissions)
4. [Candidates](#candidates)
5. [Supervisors](#supervisors)
6. [Super Admins](#super-admins)
7. [Institute Admins](#institute-admins)
8. [Calendar Surgery](#calendar-surgery)
9. [Diagnosis](#diagnosis)
10. [Procedure CPT](#procedure-cpt)
11. [Main Diagnosis](#main-diagnosis)
12. [Arabic Procedures](#arabic-procedures)
13. [Hospitals](#hospitals)
14. [Mailer](#mailer)
15. [External Service](#external-service)
16. [Error Responses](#error-responses)

---

## Authentication

### JWT Token Structure

All JWT tokens contain the following payload:
```json
{
  "email": "user@example.com",
  "role": "candidate" | "supervisor" | "superAdmin" | "instituteAdmin",
  "_id": "507f1f77bcf86cd799439011"
}
```

**Important**: The `_id` field is the MongoDB ObjectId of the authenticated user as a string. Use this directly in API calls without needing to query by email.

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
  "tokenPayload": {
    "email": "user@example.com",
    "role": "candidate",
    "_id": "507f1f77bcf86cd799439011"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

---

### Login Endpoints

All login endpoints return the same response format with a JWT token and user data.

#### Login Candidate
**POST** `/auth/loginCand`

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "candidate@example.com",
    "fullName": "John Doe",
    "phoneNum": "+1234567890",
    "regNum": "REG123456",
    "nationality": "Egyptian",
    "rank": "professor",
    "regDeg": "msc",
    "approved": false,
    "role": "candidate"
  },
  "role": "candidate"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "UnAuthorized: wrong password"
}
```

---

#### Login Supervisor
**POST** `/auth/loginSupervisor`

**Request Body:**
```json
{
  "email": "supervisor@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor"
  },
  "role": "supervisor"
}
```

---

#### Login Super Admin
**POST** `/auth/loginSuperAdmin`

**Request Body:**
```json
{
  "email": "superadmin@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "fullName": "Super Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "superAdmin"
  },
  "role": "superAdmin"
}
```

---

#### Login Institute Admin
**POST** `/auth/loginInstituteAdmin`

**Request Body:**
```json
{
  "email": "instituteadmin@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "instituteadmin@example.com",
    "fullName": "Institute Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "instituteAdmin"
  },
  "role": "instituteAdmin"
}
```

---

### Register Candidate
**POST** `/auth/registerCand`

Registers a new candidate user. No authentication required.

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
  "_id": "507f1f77bcf86cd799439011",
  "email": "candidate@example.com",
  "fullName": "John Doe",
  "phoneNum": "+1234567890",
  "regNum": "REG123456",
  "nationality": "Egyptian",
  "rank": "professor",
  "regDeg": "msc",
  "approved": false,
  "role": "candidate"
}
```

---

### Reset All Candidate Passwords
**POST** `/auth/resetCandPass`

Resets all candidate passwords to the default encrypted password (`MEDscrobe01$`). No authentication required.

**Response (200 OK):**
```json
{
  "modifiedCount": 42,
  "defaultPassword": "MEDscrobe01$"
}
```

---

## User Management

### Super Admins (`/superAdmin`)

All Super Admin endpoints require authentication as a Super Admin.

**Required Headers:**
```
Authorization: Bearer <superAdmin_token>
```

#### Create Super Admin
**POST** `/superAdmin`

**Request Body:**
```json
{
  "email": "superadmin2@example.com",
  "password": "SuperAdmin123$",
  "fullName": "Super Admin User",
  "phoneNum": "01000000000",
  "approved": true
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "superadmin2@example.com",
  "fullName": "Super Admin User",
  "phoneNum": "01000000000",
  "approved": true,
  "role": "superAdmin"
}
```

---

#### Get All Super Admins
**GET** `/superAdmin`

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "fullName": "Super Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "superAdmin"
  }
]
```

---

#### Get Super Admin by ID
**GET** `/superAdmin/:id`

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "superadmin@example.com",
  "fullName": "Super Admin",
  "phoneNum": "+1234567890",
  "approved": true,
  "role": "superAdmin"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Super admin not found"
}
```

---

#### Update Super Admin
**PUT** `/superAdmin/:id`

**Request Body:**
```json
{
  "fullName": "Updated Super Admin",
  "phoneNum": "+9876543210"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "superadmin@example.com",
  "fullName": "Updated Super Admin",
  "phoneNum": "+9876543210",
  "approved": true,
  "role": "superAdmin"
}
```

---

#### Delete Super Admin
**DELETE** `/superAdmin/:id`

**Response (200 OK):**
```json
{
  "message": "Super admin deleted successfully"
}
```

---

### Institute Admins (`/instituteAdmin`)

All Institute Admin endpoints require authentication as a Super Admin (for creation) or Institute Admin/Super Admin (for other operations).

**Required Headers:**
```
Authorization: Bearer <token>
```

#### Create Institute Admin
**POST** `/instituteAdmin`

**Requires:** Super Admin authentication

**Request Body:**
```json
{
  "email": "instituteadmin@example.com",
  "password": "InstituteAdmin123$",
  "fullName": "Institute Admin User",
  "phoneNum": "01000000000",
  "approved": true
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "instituteadmin@example.com",
  "fullName": "Institute Admin User",
  "phoneNum": "01000000000",
  "approved": true,
  "role": "instituteAdmin"
}
```

---

#### Get All Institute Admins
**GET** `/instituteAdmin`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "instituteadmin@example.com",
    "fullName": "Institute Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "instituteAdmin"
  }
]
```

---

#### Get Institute Admin by ID
**GET** `/instituteAdmin/:id`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "instituteadmin@example.com",
  "fullName": "Institute Admin",
  "phoneNum": "+1234567890",
  "approved": true,
  "role": "instituteAdmin"
}
```

---

#### Update Institute Admin
**PUT** `/instituteAdmin/:id`

**Requires:** Institute Admin or Super Admin authentication

**Request Body:**
```json
{
  "fullName": "Updated Institute Admin",
  "phoneNum": "+9876543210"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "instituteadmin@example.com",
  "fullName": "Updated Institute Admin",
  "phoneNum": "+9876543210",
  "approved": true,
  "role": "instituteAdmin"
}
```

---

#### Delete Institute Admin
**DELETE** `/instituteAdmin/:id`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
{
  "message": "Institute admin deleted successfully"
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
  "row": 46
}
```

**Note:** `row` is optional. If omitted, all rows are processed.

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "candDocId": "507f1f77bcf86cd799439012",
    "procDocId": "507f1f77bcf86cd799439013",
    "supervisorDocId": "507f1f77bcf86cd799439014",
    "roleInSurg": "operator",
    "subStatus": "pending",
    "procedureName": ["Procedure A", "Procedure B"],
    "diagnosisName": ["Diagnosis X"],
    "procCptDocId": ["507f1f77bcf86cd799439015"],
    "icdDocId": ["507f1f77bcf86cd799439016"]
  }
]
```

---

### Update Submission Status from External
**PATCH** `/sub/updateStatusFromExternal`

Updates submission statuses from external data source.

**Request Body:**
```json
{
  "row": 46
}
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "subStatus": "approved"
  }
]
```

---

## Candidates (`/cand`)

### Create Candidates from External
**POST** `/cand/createCandsFromExternal`

Creates candidates from external data source (Google Sheets).

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "candidate@example.com",
    "fullName": "John Doe",
    "phoneNum": "+1234567890",
    "regNum": "REG123456",
    "nationality": "Egyptian",
    "rank": "professor",
    "regDeg": "msc",
    "approved": false,
    "role": "candidate"
  }
]
```

---

## Supervisors (`/supervisor`)

### Create Supervisor
**POST** `/supervisor`

No authentication required.

**Request Body:**
```json
{
  "email": "supervisor@example.com",
  "password": "Supervisor123$",
  "fullName": "Dr. Jane Smith",
  "phoneNum": "+1234567890",
  "approved": true
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "supervisor@example.com",
  "fullName": "Dr. Jane Smith",
  "phoneNum": "+1234567890",
  "approved": true,
  "role": "supervisor"
}
```

---

### Get All Supervisors
**GET** `/supervisor`

No authentication required.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor"
  }
]
```

---

### Get Supervisor by ID
**GET** `/supervisor/:id`

No authentication required.

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "supervisor@example.com",
  "fullName": "Dr. Jane Smith",
  "phoneNum": "+1234567890",
  "approved": true,
  "role": "supervisor"
}
```

---

### Update Supervisor
**PUT** `/supervisor/:id`

No authentication required.

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith Updated",
  "phoneNum": "+9876543210"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "supervisor@example.com",
  "fullName": "Dr. Jane Smith Updated",
  "phoneNum": "+9876543210",
  "approved": true,
  "role": "supervisor"
}
```

---

### Delete Supervisor
**DELETE** `/supervisor/:id`

No authentication required.

**Response (200 OK):**
```json
{
  "message": "Supervisor deleted successfully"
}
```

---

## Calendar Surgery (`/calSurg`)

### Create CalSurg from External
**POST** `/calSurg/postAllFromExternal`

Creates calendar surgery entries from external data source.

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "google_uid": "unique-google-id",
    "date": "2025-01-15",
    "time": "10:00"
  }
]
```

---

### Get CalSurg by ID
**GET** `/calSurg/getById`

**Query Parameters:**
- `id` (required): MongoDB ObjectId

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "google_uid": "unique-google-id",
  "date": "2025-01-15",
  "time": "10:00"
}
```

---

### Get All CalSurg with Filters
**GET** `/calSurg/getAll`

**Query Parameters (all optional):**
- `startDate`: Start date filter
- `endDate`: End date filter
- `month`: Month filter
- `year`: Year filter
- `day`: Day filter

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "google_uid": "unique-google-id",
    "date": "2025-01-15",
    "time": "10:00"
  }
]
```

---

## Diagnosis (`/diagnosis`)

### Create Bulk Diagnoses
**POST** `/diagnosis/postBulk`

**Request Body:**
```json
{
  "diagnoses": [
    {
      "icdCode": "G93.1",
      "icdName": "Anoxic brain damage"
    },
    {
      "icdCode": "G93.2",
      "icdName": "Benign intracranial hypertension"
    }
  ]
}
```

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "icdCode": "G93.1",
    "icdName": "Anoxic brain damage"
  }
]
```

---

### Create Single Diagnosis
**POST** `/diagnosis/post`

**Request Body:**
```json
{
  "icdCode": "G93.1",
  "icdName": "Anoxic brain damage"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "icdCode": "G93.1",
  "icdName": "Anoxic brain damage"
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
  "row": 46
}
```

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "numCode": "61783",
    "alphaCode": "A",
    "title": "Craniotomy for tumor resection",
    "description": "Procedure description"
  }
]
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
  "title": "Craniotomy for tumor resection",
  "description": "Procedure description"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "numCode": "61783",
  "alphaCode": "A",
  "title": "Craniotomy for tumor resection",
  "description": "Procedure description"
}
```

---

## Main Diagnosis (`/mainDiag`)

### Create Main Diagnosis
**POST** `/mainDiag`

**Request Body:**
```json
{
  "title": "cns tumors",
  "procsArray": ["61783", "61108-00"],
  "diagnosis": ["G93.1", "G93.2"]
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "cns tumors",
  "procs": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
  "diagnosis": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
}
```

---

### Get All Main Diagnoses
**GET** `/mainDiag`

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "cns tumors",
    "procs": ["507f1f77bcf86cd799439012"],
    "diagnosis": ["507f1f77bcf86cd799439014"]
  }
]
```

---

### Get Main Diagnosis by ID
**GET** `/mainDiag/:id`

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "cns tumors",
  "procs": ["507f1f77bcf86cd799439012"],
  "diagnosis": ["507f1f77bcf86cd799439014"]
}
```

---

### Update Main Diagnosis
**PUT** `/mainDiag/:id`

**Request Body:**
```json
{
  "title": "updated title",
  "procs": ["61783"],
  "diagnosis": ["G93.1"]
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "updated title",
  "procs": ["507f1f77bcf86cd799439012"],
  "diagnosis": ["507f1f77bcf86cd799439014"]
}
```

---

### Delete Main Diagnosis
**DELETE** `/mainDiag/:id`

**Response (200 OK):**
```json
{
  "message": "MainDiag deleted successfully"
}
```

---

## Arabic Procedures (`/arabProc`)

### Get All Arab Procedures
**GET** `/arabProc/getAllArabProcs`

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "numCode": "61070",
    "arabicName": "اسم الإجراء بالعربية"
  }
]
```

---

### Create Arab Procedure
**POST** `/arabProc/createArabProc`

**Request Body:**
```json
{
  "numCode": "61070",
  "arabicName": "اسم الإجراء بالعربية"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "numCode": "61070",
  "arabicName": "اسم الإجراء بالعربية"
}
```

---

### Create Arab Procedure from External
**POST** `/arabProc/createArabProcFromExternal`

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "numCode": "61070",
    "arabicName": "اسم الإجراء بالعربية"
  }
]
```

---

## Hospitals (`/hospital`)

### Create Hospital
**POST** `/hospital/create`

**Request Body:**
```json
{
  "name": "Cairo University Hospital",
  "address": "Cairo, Egypt"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Cairo University Hospital",
  "address": "Cairo, Egypt"
}
```

---

## Mailer (`/mailer`)

### Send Email
**POST** `/mailer/send`

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "from": "sender@example.com"
}
```

**Note:** At least one of `text` or `html` must be provided. `from` is optional.

**Response (200 OK):**
```json
{
  "message": "Email sent successfully to recipient@example.com"
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
  "success": true,
  "data": {
    "data": [...]
  }
}
```

---

## Error Responses

### 400 Bad Request
Validation errors:
```json
{
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
  "error": "Unauthorized"
}
```
or
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error message"
}
```

---

## Authentication Requirements Summary

| Endpoint Category | Authentication Required | Role Required |
|-----------------|------------------------|---------------|
| `/auth/login*` | No | - |
| `/auth/registerCand` | No | - |
| `/auth/resetCandPass` | No | - |
| `/superAdmin/*` | Yes | Super Admin |
| `/instituteAdmin/*` | Yes | Super Admin (create) / Institute Admin or Super Admin (others) |
| `/supervisor/*` | No | - |
| `/sub/*` | No | - |
| `/cand/*` | No | - |
| `/calSurg/*` | No | - |
| `/diagnosis/*` | No | - |
| `/procCpt/*` | No | - |
| `/mainDiag/*` | No | - |
| `/arabProc/*` | No | - |
| `/hospital/*` | No | - |
| `/mailer/*` | No | - |
| `/external/*` | No | - |

---

## Important Notes

1. **JWT Token Structure**: All JWT tokens now include `_id` field. Use `res.locals.jwt._id` directly in your frontend after decoding the token.

2. **Token Usage**: Include the JWT token in the Authorization header for protected endpoints:
   ```
   Authorization: Bearer <token>
   ```

3. **User Roles**: The system supports four user roles:
   - `candidate`: Medical candidates
   - `supervisor`: Supervisors
   - `superAdmin`: Super administrators (highest level)
   - `instituteAdmin`: Institute administrators

4. **Admin Creation**: 
   - Super Admins can only be created by existing Super Admins
   - Institute Admins can only be created by Super Admins
   - There is no public registration endpoint for admins

5. **Data Formats**:
   - All timestamps are in ISO 8601 format
   - All MongoDB ObjectIds are returned as strings
   - Password fields are never returned in responses

6. **External Data Endpoints**: Endpoints with "FromExternal" pull data from configured Google Sheets. The `row` parameter is optional; if omitted, all rows are processed.

7. **Response Format**: Most endpoints return data directly (not wrapped in a `data` object), except where specified. Error responses follow the error format shown above.

---

## Frontend Integration Tips

1. **Token Storage**: Store the JWT token securely (e.g., localStorage, sessionStorage, or httpOnly cookies).

2. **Token Decoding**: Decode the JWT token to access `_id`, `email`, and `role` without additional API calls.

3. **Token Refresh**: Implement token refresh logic if tokens expire. Check the `exp` claim in the JWT.

4. **Error Handling**: Always check for 401/403 errors and redirect to login if needed.

5. **Role-Based UI**: Use the `role` field from the JWT to conditionally render UI elements based on user permissions.
