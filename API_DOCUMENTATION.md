# MedScribe Neuro Server API Documentation

**Base URL**: `http://localhost:3001` (or your configured server URL)

---

## Response Format

**⚠️ IMPORTANT: ALL API responses (except `/auth/validate`) automatically follow this standardized JSON structure.** The response formatter middleware wraps every response, so you must always access data from the `data` field for success responses or `error` field for error responses.

### Success Responses (Status Codes 200-299)

All successful responses are wrapped in the following format:

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": <actual_response_data>
}
```

**Examples:**

**Single Object Response:**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

**Array Response:**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user1@example.com"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "user2@example.com"
    }
  ]
}
```

**Response with Meta Data:**
If the controller returns an object with `meta` property, it's extracted:
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": <actual_data>,
  "meta": {
    "pagination": {...},
    "total": 100
  }
}
```

### Error Responses (Status Codes 300+)

All error responses are wrapped in the following format:

```json
{
  "status": "error",
  "statusCode": <error_code>,
  "message": "<HTTP_reason_phrase>",
  "error": <error_data>
}
```

**Examples:**

**400 Bad Request (Validation Errors):**
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

**401 Unauthorized:**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UnAuthorized: wrong password"
}
```

**401 Unauthorized (Token Expired):**
When a JWT token expires, the backend automatically clears authentication cookies and returns:
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```
**Note:** This response is NOT wrapped in the standard format. The backend automatically clears `auth_token` and `refresh_token` cookies when this occurs.

**401 Unauthorized (Refresh Token Expired):**
When a refresh token expires:
```json
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED"
}
```
**Note:** This response is NOT wrapped in the standard format. The backend automatically clears both cookies when this occurs.

**403 Forbidden:**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

### Special Cases

**Auth Validate Endpoint:**
The `/auth/validate` endpoint returns a direct object (not wrapped by formatter):
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

**401 Unauthorized (No Token):**
When no Authorization header is provided, `/auth/validate` returns:
```json
{
  "message": "Unauthorized"
}
```

**Token Expiration Responses:**
Token expiration errors are NOT wrapped in the standard format. They return direct error objects:

**Access Token Expired:**
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

**Refresh Token Expired:**
```json
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED"
}
```

**Note:** When these errors occur, the backend automatically clears both `auth_token` and `refresh_token` cookies. The frontend must detect these error codes and clear Redux state, then redirect to login.

**Refresh Token Endpoint:**
The `/auth/refresh` endpoint returns a direct object (not wrapped by formatter):
```json
{
  "success": true
}
```

**Logout Endpoint:**
The `/auth/logout` endpoint returns a direct object (not wrapped by formatter):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**⚠️ CRITICAL: Response Format Rules**

1. **ALL endpoints** (except `/auth/validate`) automatically wrap responses in this format
2. **Always check `json.status`** - it will be either `"success"` or `"error"`
3. **For success responses**: Access your data from `json.data` (could be object, array, or primitive)
4. **For error responses**: Access error details from `json.error`
5. **The `statusCode`** matches the HTTP status code (200, 201, 400, 401, 404, 500, etc.)
6. **The `message`** field contains the HTTP reason phrase (e.g., "OK", "Created", "Bad Request")

**Example Response Parsing:**
```typescript
const response = await fetch('/api/endpoint');
const json = await response.json();

if (json.status === "success") {
  // Success - data is in json.data
  const myData = json.data; // This is your actual data
} else {
  // Error - details in json.error
  console.error("Error:", json.error);
}
```

**Note:** Even if an endpoint example below shows a simplified response structure, the actual API response will ALWAYS be wrapped in this format. The examples show what's inside the `data` field.

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
16. [Lectures](#lectures)
17. [Journals](#journals)
18. [Conferences](#conferences)
19. [Events](#events)
20. [Error Responses](#error-responses)

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
**Note:** This endpoint returns a direct object, not wrapped in the standard format.

**Response (401 Unauthorized - No Token):**
```json
{
  "message": "Unauthorized"
}
```
**Note:** This is a direct response, not wrapped in the standard format.

**Response (401 Unauthorized - Token Expired):**
```json
{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```
**Note:** 
- This response is NOT wrapped in the standard format
- The backend automatically clears both `auth_token` and `refresh_token` cookies when this occurs
- Frontend must detect `code: "TOKEN_EXPIRED"` and clear Redux state, then redirect to login

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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
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
}
```
**Note:** JWT tokens are sent as httpOnly cookies, not in the response body. The response contains only user data and role.

**Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
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
}
```
**Note:** JWT tokens are sent as httpOnly cookies, not in the response body.

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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
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
}
```
**Note:** JWT tokens are sent as httpOnly cookies, not in the response body.

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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
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
}
```
**Note:** JWT tokens are sent as httpOnly cookies, not in the response body.

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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
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
}
```

---

### Reset All Candidate Passwords
**POST** `/auth/resetCandPass`

---

### Request Password Change Email
**POST** `/auth/requestPasswordChangeEmail`

**Authentication Required:** Yes (all user types)

Sends an email with a password change link to the authenticated user. The link allows the user to change their password without providing their current password.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:** None (user information extracted from JWT token)

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Password change email sent successfully"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No user information found in token"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to send password change email"
}
```

**Notes:**
- User ID, email, and role are automatically extracted from the JWT token
- Email contains a link with format: `/dashboard/[role]/profile/manage-profile-information/change-password?token={token}`
- Token expires in 1 hour
- Works for all user types: candidate, supervisor, superAdmin, instituteAdmin

---

### Change Password
**PATCH** `/auth/changePassword`

**Authentication Required:** Yes (all user types)

Allows authenticated users to change their password using either:
1. **Current Password Flow**: Provide current password and new password
2. **Token Flow**: Provide token from email and new password

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body (Current Password Flow):**
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newSecurePassword456$"
}
```

**Request Body (Token Flow):**
```json
{
  "token": "secure-token-from-email",
  "newPassword": "newSecurePassword456$"
}
```

**Note:** You must provide either `currentPassword` OR `token`, but not both.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "msg": "New password must be at least 8 characters",
      "param": "newPassword",
      "location": "body"
    }
  ]
}
```

**Error Response (400 Bad Request - Current Password Incorrect):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Current password is incorrect"
}
```

**Error Response (400 Bad Request - Same Password):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "New password must be different from current password"
}
```

**Error Response (400 Bad Request - Invalid Token):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid or expired reset token"
}
```

**Error Response (400 Bad Request - Token Does Not Belong to User):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Token does not belong to this user"
}
```

**Error Response (400 Bad Request - Missing Method):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Either currentPassword or token must be provided"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Cannot provide both currentPassword and token. Use one method only."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No user ID found in token"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to change password"
}
```

**Notes:**
- User ID and role are automatically extracted from the JWT token
- New password must meet the following requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- New password cannot be the same as current password
- Works for all user types: candidate, supervisor, superAdmin, instituteAdmin

---

### Refresh Token
**POST** `/auth/refresh`

**Authentication Required:** No (uses refresh token from cookie)

Refreshes an expired access token using a valid refresh token. Both tokens are automatically sent as httpOnly cookies.

**Request:**
- No request body required
- Refresh token must be present in `refresh_token` cookie

**Response (200 OK):**
```json
{
  "success": true
}
```
**Note:** This response is NOT wrapped in the standard format. New access and refresh tokens are automatically set as httpOnly cookies.

**Response (401 Unauthorized - No Refresh Token):**
```json
{
  "error": "Refresh token not found"
}
```
**Note:** This response is NOT wrapped in the standard format.

**Response (401 Unauthorized - Refresh Token Expired):**
```json
{
  "error": "Refresh token expired",
  "code": "REFRESH_TOKEN_EXPIRED"
}
```
**Note:** 
- This response is NOT wrapped in the standard format
- The backend automatically clears both `auth_token` and `refresh_token` cookies when this occurs
- Frontend must detect `code: "REFRESH_TOKEN_EXPIRED"` and clear Redux state, then redirect to login

**Response (401 Unauthorized - Invalid Refresh Token):**
```json
{
  "error": "Invalid refresh token"
}
```
**Note:** This response is NOT wrapped in the standard format.

---

### Logout
**POST** `/auth/logout`

**Authentication Required:** No

Logs out the user by clearing authentication cookies.

**Request:**
- No request body required

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```
**Note:** This response is NOT wrapped in the standard format. Both `auth_token` and `refresh_token` cookies are automatically cleared.

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to logout"
}
```
**Note:** This response is NOT wrapped in the standard format.

---

### Forgot Password
**POST** `/auth/forgotPassword`

**Authentication Required:** No

Allows users to request a password reset link via email. The system searches for the email across all user collections (candidate, supervisor, superAdmin, instituteAdmin).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "If an account with that email exists, a password reset link has been sent"
  }
}
```

**Note:** This message is always returned regardless of whether the email exists in the system (security best practice to prevent email enumeration).

**Error Response (400 Bad Request - Invalid Email):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "msg": "Email must be a valid email address",
      "param": "email",
      "location": "body"
    }
  ]
}
```

**Notes:**
- Email is searched across all user collections (candidate, supervisor, superAdmin, instituteAdmin)
- If user exists, a secure reset token is generated and sent via email
- Reset link expires in 1 hour
- Always returns success message to prevent email enumeration attacks
- Reset link format: `{FRONTEND_URL}/reset-password?token={token}`

---

### Reset Password
**POST** `/auth/resetPassword`

**Authentication Required:** No (uses token from email)

Allows users to reset their password using a token received via email from the forgot password flow.

**Request Body:**
```json
{
  "token": "secure-random-token-from-email",
  "newPassword": "newSecurePassword456$"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid Token):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Invalid or expired reset token"
}
```

**Error Response (400 Bad Request - Token Already Used):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "This reset token has already been used"
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "msg": "New password must be at least 8 characters",
      "param": "newPassword",
      "location": "body"
    }
  ]
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to reset password"
}
```

**Notes:**
- Token is obtained from the password reset email link
- Token expires after 1 hour
- Token can only be used once
- New password must meet the same requirements as change password:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- After successful reset, the token is marked as used and cannot be reused

---

Resets all candidate passwords to the default encrypted password (`MEDscrobe01$`). No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "modifiedCount": 42,
    "defaultPassword": "MEDscrobe01$"
  }
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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "superadmin2@example.com",
    "fullName": "Super Admin User",
    "phoneNum": "01000000000",
    "approved": true,
    "role": "superAdmin"
  }
}
```

---

#### Get All Super Admins
**GET** `/superAdmin`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "superadmin@example.com",
      "fullName": "Super Admin",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "superAdmin"
    }
  ]
}
```

---

#### Get Super Admin by ID
**GET** `/superAdmin/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "fullName": "Super Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "superAdmin"
  }
}
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "superadmin@example.com",
    "fullName": "Updated Super Admin",
    "phoneNum": "+9876543210",
    "approved": true,
    "role": "superAdmin"
  }
}
```

---

#### Delete Super Admin
**DELETE** `/superAdmin/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Super admin deleted successfully"
  }
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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "instituteadmin@example.com",
    "fullName": "Institute Admin User",
    "phoneNum": "01000000000",
    "approved": true,
    "role": "instituteAdmin"
  }
}
```

---

#### Get All Institute Admins
**GET** `/instituteAdmin`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "instituteadmin@example.com",
      "fullName": "Institute Admin",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "instituteAdmin"
    }
  ]
}
```

---

#### Get Institute Admin by ID
**GET** `/instituteAdmin/:id`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "instituteadmin@example.com",
    "fullName": "Institute Admin",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "instituteAdmin"
  }
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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "instituteadmin@example.com",
    "fullName": "Updated Institute Admin",
    "phoneNum": "+9876543210",
    "approved": true,
    "role": "instituteAdmin"
  }
}
```

---

#### Delete Institute Admin
**DELETE** `/instituteAdmin/:id`

**Requires:** Institute Admin or Super Admin authentication

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Institute admin deleted successfully"
  }
}
```

---

#### Get All Supervisors (Dashboard)
**GET** `/instituteAdmin/supervisors`

**Requires:** Institute Admin authentication

**Description:** Returns a list of all supervisors in the system for the Institute Admin dashboard.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor",
      "canValidate": true,
      "position": "unknown"
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No token provided"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

---

#### Get Supervisor Submissions (Dashboard)
**GET** `/instituteAdmin/supervisors/:supervisorId/submissions`

**Requires:** Institute Admin authentication

**Description:** Returns all submissions supervised by a specific supervisor. This displays the supervisor's dashboard view (same data the supervisor sees).

**URL Parameters:**
- `supervisorId` (required): Supervisor MongoDB ObjectId

**Query Parameters:**
- `status` (optional): Filter by submission status. Valid values: `approved`, `pending`, `rejected`. If omitted, returns all submissions.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "phoneNum": "+1234567890",
        "regNum": "REG123456",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": {
        "_id": "507f1f77bcf86cd799439013",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": {
          "_id": "507f1f77bcf86cd799439020",
          "engName": "Cairo University Hospital",
          "arabName": "مستشفى جامعة القاهرة",
          "location": {
            "long": 31.2001,
            "lat": 30.0444
          }
        },
        "arabProc": {
          "_id": "507f1f77bcf86cd799439021",
          "title": "اسم الإجراء بالعربية",
          "numCode": "61070",
          "alphaCode": "ABC",
          "description": "Procedure description"
        },
        "procDate": "2025-07-14T04:49:35.286Z",
        "google_uid": "abc123",
        "formLink": "https://example.com/form"
      },
      "supervisorDocId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "supervisor@example.com",
        "fullName": "Dr. Jane Smith",
        "phoneNum": "+1234567890",
        "approved": true,
        "role": "supervisor",
        "canValidate": true,
        "position": "unknown"
      },
      "roleInSurg": "operator",
      "subStatus": "pending",
      "procedureName": ["Procedure A", "Procedure B"],
      "diagnosisName": ["Diagnosis X"],
      "procCptDocId": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "numCode": "12345",
          "alphaCode": "ABC",
          "title": "Procedure Title",
          "description": "Procedure description"
        }
      ],
      "icdDocId": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "icdCode": "G93.1",
          "title": "Diagnosis Title",
          "description": "Diagnosis description"
        }
      ],
      "mainDiagDocId": {
        "_id": "507f1f77bcf86cd799439017",
        "title": "Main Diagnosis Title"
      }
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Supervisor ID must be a valid MongoDB ObjectId",
      "path": "supervisorId",
      "location": "params"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Supervisor not found"
}
```

---

#### Get All Candidates (Dashboard)
**GET** `/instituteAdmin/candidates`

**Requires:** Institute Admin authentication

**Description:** Returns a list of all candidates in the system for the Institute Admin dashboard.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
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
}
```

---

#### Get Candidate Submissions (Dashboard)
**GET** `/instituteAdmin/candidates/:candidateId/submissions`

**Requires:** Institute Admin authentication

**Description:** Returns all submissions for a specific candidate. This displays the candidate's LogBook view (same data the candidate sees).

**URL Parameters:**
- `candidateId` (required): Candidate MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "phoneNum": "+1234567890",
        "regNum": "REG123456",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": {
        "_id": "507f1f77bcf86cd799439013",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": {
          "_id": "507f1f77bcf86cd799439020",
          "engName": "Cairo University Hospital",
          "arabName": "مستشفى جامعة القاهرة",
          "location": {
            "long": 31.2001,
            "lat": 30.0444
          }
        },
        "arabProc": {
          "_id": "507f1f77bcf86cd799439021",
          "title": "اسم الإجراء بالعربية",
          "numCode": "61070",
          "alphaCode": "ABC",
          "description": "Procedure description"
        },
        "procDate": "2025-07-14T04:49:35.286Z",
        "google_uid": "abc123",
        "formLink": "https://example.com/form"
      },
      "supervisorDocId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "supervisor@example.com",
        "fullName": "Dr. Jane Smith",
        "phoneNum": "+1234567890",
        "approved": true,
        "role": "supervisor",
        "canValidate": true,
        "position": "unknown"
      },
      "mainDiagDocId": {
        "_id": "507f1f77bcf86cd799439017",
        "title": "cns tumors",
        "procs": ["507f1f77bcf86cd799439018"],
        "diagnosis": ["507f1f77bcf86cd799439019"]
      },
      "roleInSurg": "operator",
      "assRoleDesc": "assisted with retraction",
      "otherSurgRank": "professor",
      "otherSurgName": "Dr. Smith",
      "isItRevSurg": false,
      "preOpClinCond": "stable",
      "insUsed": "microscope",
      "consUsed": "bone cement",
      "consDetails": "Used for reconstruction",
      "subGoogleUid": "sub123",
      "subStatus": "approved",
      "procCptDocId": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "numCode": "12345",
          "alphaCode": "ABC",
          "title": "Procedure Title",
          "description": "Procedure description"
        }
      ],
      "icdDocId": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "icdCode": "G93.1",
          "title": "Diagnosis Title",
          "description": "Diagnosis description"
        }
      ],
      "diagnosisName": ["Diagnosis X"],
      "procedureName": ["Procedure A", "Procedure B"],
      "surgNotes": "Surgical notes here",
      "IntEvents": "No complications",
      "spOrCran": "cranial",
      "pos": "supine",
      "approach": "frontal",
      "clinPres": "headache",
      "region": "cervical",
      "createdAt": "2025-07-14T04:49:35.286Z",
      "updatedAt": "2025-07-14T04:49:35.286Z"
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Candidate ID must be a valid MongoDB ObjectId",
      "path": "candidateId",
      "location": "params"
    }
  ]
}
```

---

#### Get Candidate Submission by ID (Dashboard)
**GET** `/instituteAdmin/candidates/:candidateId/submissions/:submissionId`

**Requires:** Institute Admin authentication

**Description:** Returns a specific submission belonging to a candidate. This allows institute admins to view detailed submission information for any candidate.

**URL Parameters:**
- `candidateId` (required): Candidate MongoDB ObjectId
- `submissionId` (required): Submission MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "candDocId": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate"
    },
    "procDocId": {
      "_id": "507f1f77bcf86cd799439013",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة",
        "location": {
          "long": 31.2001,
          "lat": 30.0444
        }
      },
      "arabProc": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "اسم الإجراء بالعربية",
        "numCode": "61070",
        "alphaCode": "ABC",
        "description": "Procedure description"
      },
      "procDate": "2025-07-14T04:49:35.286Z",
      "google_uid": "abc123",
      "formLink": "https://example.com/form"
    },
    "supervisorDocId": {
      "_id": "507f1f77bcf86cd799439014",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor"
    },
    "mainDiagDocId": {
      "_id": "507f1f77bcf86cd799439017",
      "title": "cns tumors"
    },
    "roleInSurg": "operator",
    "assRoleDesc": "assisted with retraction",
    "otherSurgRank": "professor",
    "otherSurgName": "Dr. Smith",
    "isItRevSurg": false,
    "preOpClinCond": "stable",
    "insUsed": "microscope",
    "consUsed": "bone cement",
    "consDetails": "Used for reconstruction",
    "subGoogleUid": "sub123",
    "subStatus": "approved",
    "procCptDocId": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "numCode": "12345",
        "alphaCode": "ABC",
        "description": "Procedure description"
      }
    ],
    "icdDocId": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "code": "G93.1",
        "description": "Diagnosis description"
      }
    ],
    "diagnosisName": ["Diagnosis X"],
    "procedureName": ["Procedure A", "Procedure B"],
    "surgNotes": "Surgical notes here",
    "IntEvents": "No complications",
    "spOrCran": "cranial",
    "pos": "supine",
    "approach": "frontal",
    "clinPres": "headache",
    "region": "cervical",
    "createdAt": "2025-07-14T04:49:35.286Z",
    "updatedAt": "2025-07-14T04:49:35.286Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Candidate ID must be a valid MongoDB ObjectId",
      "path": "candidateId",
      "location": "params"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found or does not belong to the specified candidate"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Notes:**
- The endpoint verifies that the submission belongs to the specified candidate before returning it
- All ObjectId references are populated with their full document data
- Returns 404 if submission doesn't exist or doesn't belong to the candidate
- Returns 400 if either ID format is invalid

---

#### Get Calendar Procedures with Filters (Dashboard)
**GET** `/instituteAdmin/calendarProcedures`

**Requires:** Institute Admin authentication

**Description:** Returns all calendar procedures (calSurg) with optional filtering capabilities. Supports filtering by hospital, arabProc (by title or numCode), and timestamp (month/year).

**Query Parameters (all optional):**
- `hospitalId` (optional): Filter by hospital MongoDB ObjectId
- `arabProcTitle` (optional): Filter by Arabic procedure title (partial match, case-insensitive)
- `arabProcNumCode` (optional): Filter by Arabic procedure numCode (exact or partial match)
- `month` (optional): Filter by month (1-12). When provided, filters calSurg entries within that month
- `year` (optional): Filter by year (e.g., 2025). When provided, filters calSurg entries within that year
- `startDate` (optional): Filter by start date (ISO 8601 format). When provided with `endDate`, filters calSurg entries within the date range
- `endDate` (optional): Filter by end date (ISO 8601 format). When provided with `startDate`, filters calSurg entries within the date range

**Note:** Multiple filters can be combined. For example, you can filter by both `hospitalId` and `month` and `year` simultaneously.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-01-15T10:00:00.000Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة",
        "location": {
          "long": 31.2001,
          "lat": 30.0444
        }
      },
      "arabProc": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "اسم الإجراء بالعربية",
        "numCode": "61070",
        "alphaCode": "ABC",
        "description": "Procedure description"
      },
      "procDate": "2025-01-15T10:00:00.000Z",
      "google_uid": "abc123",
      "formLink": "https://example.com/form"
    }
  ]
}
```

---

#### Get All Hospitals (Dashboard)
**GET** `/instituteAdmin/hospitals`

**Requires:** Institute Admin authentication

**Description:** Returns a list of all hospitals in the system. Used for the hospital filter dropdown in the Calendar Procedures section.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "arabName": "مستشفى جامعة القاهرة",
      "engName": "Cairo University Hospital",
      "location": {
        "long": 31.2001,
        "lat": 30.0444
      },
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
    }
  ]
}
```

---

#### Get Arabic Procedures (Dashboard)
**GET** `/instituteAdmin/arabicProcedures`

**Requires:** Institute Admin authentication

**Description:** Returns a list of all Arabic procedures. Used for the autocomplete/search functionality when filtering calendar procedures by arabProc.

**Query Parameters (optional):**
- `search` (optional): Search term to filter by title or numCode (case-insensitive partial match). If provided, returns only procedures matching the search term.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "مراجعة صمام اوميا",
      "alphaCode": "VSHN",
      "numCode": "61070",
      "description": "Ommaya valve reservoir check and fluid sampling procedure."
    }
  ]
}
```

---

#### Get Hospital-Based Analysis Data (Dashboard)
**GET** `/instituteAdmin/calendarProcedures/analysis/hospital`

**Requires:** Institute Admin authentication

**Description:** Returns aggregated analysis data for calendar procedures grouped by hospital. Used to generate the hospital-based analysis chart.

**Query Parameters (all optional):**
- `hospitalId` (optional): Filter by specific hospital MongoDB ObjectId. If omitted, returns analysis for all hospitals.
- `month` (optional): Filter by month (1-12). When provided, filters calSurg entries within that month
- `year` (optional): Filter by year (e.g., 2025). When provided, filters calSurg entries within that year
- `startDate` (optional): Filter by start date (ISO 8601 format). When provided with `endDate`, filters calSurg entries within the date range
- `endDate` (optional): Filter by end date (ISO 8601 format). When provided with `startDate`, filters calSurg entries within the date range
- `groupBy` (optional): Grouping method. Valid values: `title` (group by arabProc title) or `alphaCode` (group by arabProc alphaCode). Default: `title`

**Response (200 OK) - When groupBy is "title":**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة"
      },
      "procedures": [
        {
          "title": "مراجعة صمام اوميا",
          "frequency": 15
        },
        {
          "title": "إجراء آخر",
          "frequency": 8
        }
      ]
    },
    {
      "hospital": {
        "_id": "507f1f77bcf86cd799439021",
        "engName": "Another Hospital",
        "arabName": "مستشفى آخر"
      },
      "procedures": [
        {
          "title": "مراجعة صمام اوميا",
          "frequency": 5
        }
      ]
    }
  ]
}
```

**Response (200 OK) - When groupBy is "alphaCode":**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة"
      },
      "procedures": [
        {
          "alphaCode": "VSHN",
          "frequency": 15
        },
        {
          "alphaCode": "ABC",
          "frequency": 8
        }
      ]
    }
  ]
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "msg": "groupBy must be either 'title' or 'alphaCode'",
      "param": "groupBy",
      "location": "query"
    }
  ]
}
```

---

## Submissions (`/sub`)

### Create Submissions from External
**POST** `/sub/postAllFromExternal`

Creates submissions from external data source (Google Sheets).

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Note:** `row` is optional. If omitted, all rows are processed.

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
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
}
```

---

### Update Submission Status from External
**PATCH** `/sub/updateStatusFromExternal`

Updates submission statuses from external data source.

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "subStatus": "approved"
    }
  ]
}
```

---

### Get Candidate Submission Statistics
**GET** `/sub/candidate/stats`

**Authentication Required:** Yes (Candidate role)

Returns statistics about the logged-in candidate's submissions.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "totalApproved": 15,
    "totalRejected": 3,
    "totalPending": 7,
    "totalApprovedAndPending": 22
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No candidate ID found in token"
}
```

---

### Get Candidate Submissions
**GET** `/sub/candidate/submissions`

**Authentication Required:** Yes (Candidate role)

Returns all submissions for the logged-in candidate with all related data populated (diagnosis, procedures, supervisor, etc.). All ObjectId references are populated with their full document data.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "phoneNum": "+1234567890",
        "regNum": "REG123456",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": {
        "_id": "507f1f77bcf86cd799439013",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": {
          "_id": "507f1f77bcf86cd799439020",
          "engName": "Cairo University Hospital",
          "arabName": "مستشفى جامعة القاهرة",
          "location": {
            "long": 31.2001,
            "lat": 30.0444
          }
        },
        "arabProc": {
          "_id": "507f1f77bcf86cd799439021",
          "title": "اسم الإجراء بالعربية",
          "numCode": "61070",
          "alphaCode": "ABC",
          "description": "Procedure description"
        },
        "procDate": "2025-07-14T04:49:35.286Z",
        "google_uid": "abc123",
        "formLink": "https://example.com/form"
      },
      "supervisorDocId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "supervisor@example.com",
        "fullName": "Dr. Jane Smith",
        "phoneNum": "+1234567890",
        "approved": true,
        "role": "supervisor",
        "canValidate": true,
        "position": "unknown"
      },
      "mainDiagDocId": {
        "_id": "507f1f77bcf86cd799439017",
        "title": "cns tumors",
        "procs": ["507f1f77bcf86cd799439018"],
        "diagnosis": ["507f1f77bcf86cd799439019"]
      },
      "roleInSurg": "operator",
      "assRoleDesc": "assisted with retraction",
      "otherSurgRank": "professor",
      "otherSurgName": "Dr. Smith",
      "isItRevSurg": false,
      "preOpClinCond": "stable",
      "insUsed": "microscope",
      "consUsed": "bone cement",
      "consDetails": "Used for reconstruction",
      "subGoogleUid": "sub123",
      "subStatus": "approved",
      "procCptDocId": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "numCode": "12345",
          "alphaCode": "ABC",
          "title": "Procedure Title",
          "description": "Procedure description"
        }
      ],
      "icdDocId": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "icdCode": "G93.1",
          "title": "Diagnosis Title",
          "description": "Diagnosis description"
        }
      ],
      "diagnosisName": ["Diagnosis X"],
      "procedureName": ["Procedure A", "Procedure B"],
      "surgNotes": "Surgical notes here",
      "IntEvents": "No complications",
      "spOrCran": "cranial",
      "pos": "supine",
      "approach": "frontal",
      "clinPres": "headache",
      "region": "cervical",
      "createdAt": "2025-07-14T04:49:35.286Z",
      "updatedAt": "2025-07-14T04:49:35.286Z"
    }
  ]
}
```

**Note:** All ObjectId references (`candDocId`, `procDocId`, `supervisorDocId`, `mainDiagDocId`, `procCptDocId`, `icdDocId`) are populated with their full document data, not just the ObjectId.

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No candidate ID found in token"
}
```

---

### Get Single Candidate Submission by ID
**GET** `/sub/candidate/submissions/:id`

**Authentication Required:** Yes (Candidate role)

Returns a single submission by ID, verifying that it belongs to the logged-in candidate.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Submission MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "candDocId": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate"
    },
    "procDocId": {
      "_id": "507f1f77bcf86cd799439013",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة",
        "location": {
          "long": 31.2001,
          "lat": 30.0444
        }
      },
      "arabProc": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "اسم الإجراء بالعربية",
        "numCode": "61070",
        "alphaCode": "ABC",
        "description": "Procedure description"
      },
      "procDate": "2025-07-14T04:49:35.286Z",
      "google_uid": "abc123",
      "formLink": "https://example.com/form"
    },
    "supervisorDocId": {
      "_id": "507f1f77bcf86cd799439014",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor"
    },
    "mainDiagDocId": {
      "_id": "507f1f77bcf86cd799439017",
      "title": "cns tumors",
      "procs": ["507f1f77bcf86cd799439018"],
      "diagnosis": ["507f1f77bcf86cd799439019"]
    },
    "roleInSurg": "operator",
    "assRoleDesc": "assisted with retraction",
    "otherSurgRank": "professor",
    "otherSurgName": "Dr. Smith",
    "isItRevSurg": false,
    "preOpClinCond": "stable",
    "insUsed": "microscope",
    "consUsed": "bone cement",
    "consDetails": "Used for reconstruction",
    "subGoogleUid": "sub123",
    "subStatus": "approved",
    "procCptDocId": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "numCode": "12345",
        "alphaCode": "ABC",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "icdDocId": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "icdCode": "G93.1",
        "title": "Diagnosis Title",
        "description": "Diagnosis description"
      }
    ],
    "diagnosisName": ["Diagnosis X"],
    "procedureName": ["Procedure A", "Procedure B"],
    "surgNotes": "Surgical notes here",
    "IntEvents": "No complications",
    "spOrCran": "cranial",
    "pos": "supine",
    "approach": "frontal",
    "clinPres": "headache",
    "region": "cervical",
    "createdAt": "2025-07-14T04:49:35.286Z",
    "updatedAt": "2025-07-14T04:49:35.286Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID must be a valid MongoDB ObjectId",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No candidate ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission does not belong to this candidate"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- User ID and role are automatically extracted from the JWT token
- **Current Password Flow**: Requires providing the current password for verification
- **Token Flow**: Requires providing a token received from the password change email (from `/auth/requestPasswordChangeEmail`)
- New password must meet the following requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
- New password cannot be the same as current password (when using current password flow)
- Token must belong to the authenticated user (when using token flow)
- Token expires after 1 hour
- Token can only be used once
- Works for all user types: candidate, supervisor, superAdmin, instituteAdmin

---

### Get Supervisor Submissions
**GET** `/sub/supervisor/submissions`

**Authentication Required:** Yes (Supervisor role)

Returns all submissions assigned to the logged-in supervisor with all related data populated (diagnosis, procedures, candidate, etc.). Optionally filter by submission status.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Query Parameters:**
- `status` (optional): Filter submissions by status. Valid values: `approved`, `pending`, `rejected`. If omitted, returns all submissions.

**Examples:**
- Get all submissions: `GET /sub/supervisor/submissions`
- Get approved submissions: `GET /sub/supervisor/submissions?status=approved`
- Get pending submissions: `GET /sub/supervisor/submissions?status=pending`
- Get rejected submissions: `GET /sub/supervisor/submissions?status=rejected`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "phoneNum": "+1234567890",
        "regNum": "REG123456",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": {
        "_id": "507f1f77bcf86cd799439013",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": {
          "_id": "507f1f77bcf86cd799439020",
          "engName": "Cairo University Hospital",
          "arabName": "مستشفى جامعة القاهرة",
          "location": {
            "long": 31.2001,
            "lat": 30.0444
          }
        },
        "arabProc": {
          "_id": "507f1f77bcf86cd799439021",
          "title": "Procedure Title",
          "numCode": "12345",
          "alphaCode": "ABC",
          "description": "Procedure description"
        }
      },
      "supervisorDocId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "supervisor@example.com",
        "fullName": "Dr. Jane Smith",
        "phoneNum": "+1234567890",
        "approved": true,
        "role": "supervisor",
        "canValidate": true,
        "position": "unknown"
      },
      "roleInSurg": "operator",
      "subStatus": "pending",
      "procedureName": ["Procedure A", "Procedure B"],
      "diagnosisName": ["Diagnosis X"],
      "procCptDocId": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "numCode": "12345",
          "description": "CPT Description"
        }
      ],
      "icdDocId": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "code": "I10",
          "description": "ICD Description"
        }
      ],
      "mainDiagDocId": {
        "_id": "507f1f77bcf86cd799439017",
        "title": "Main Diagnosis Title"
      }
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- The supervisor ID is automatically extracted from the JWT token
- All ObjectId references are populated with their full document data
- If `status` query parameter is provided, only submissions with that status are returned
- Valid status values are: `approved`, `pending`, `rejected`
- If `status` is omitted, all submissions for the supervisor are returned regardless of status

---

### Get Single Supervisor Submission by ID
**GET** `/sub/supervisor/submissions/:id`

**Authentication Required:** Yes (Supervisor role)

Returns a single submission by ID, verifying that it belongs to the logged-in supervisor.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Submission MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "candDocId": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate"
    },
    "procDocId": {
      "_id": "507f1f77bcf86cd799439013",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة",
        "location": {
          "long": 31.2001,
          "lat": 30.0444
        }
      },
      "arabProc": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Procedure Title",
        "numCode": "12345",
        "alphaCode": "ABC",
        "description": "Procedure description"
      }
    },
    "supervisorDocId": {
      "_id": "507f1f77bcf86cd799439014",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor",
      "canValidate": true,
      "position": "unknown"
    },
    "roleInSurg": "operator",
    "subStatus": "pending",
    "procedureName": ["Procedure A", "Procedure B"],
    "diagnosisName": ["Diagnosis X"],
    "procCptDocId": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "numCode": "12345",
        "description": "CPT Description"
      }
    ],
    "icdDocId": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "code": "I10",
        "description": "ICD Description"
      }
    ],
    "mainDiagDocId": {
      "_id": "507f1f77bcf86cd799439017",
      "title": "Main Diagnosis Title"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID must be a valid MongoDB ObjectId",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission does not belong to this supervisor"
}
```

**Notes:**
- The supervisor ID is automatically extracted from the JWT token
- The submission ID parameter is validated to ensure it's a valid MongoDB ObjectId format
- The endpoint verifies that the submission belongs to the logged-in supervisor
- All ObjectId references are populated with their full document data
- Returns 400 if the submission ID format is invalid
- Returns 404 if submission doesn't exist or doesn't belong to the supervisor

---

### Get Candidate Submissions by Supervisor
**GET** `/sub/supervisor/candidates/:candidateId/submissions`

**Authentication Required:** Yes (Supervisor role)

Returns submissions for a specific candidate. By default, returns only submissions supervised by the logged-in supervisor. With the `all=true` query parameter, returns ALL submissions for the candidate (requires supervisor-candidate relationship verification).

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `candidateId` (required): Candidate MongoDB ObjectId

**Query Parameters:**
- `all` (optional): When set to `true`, returns ALL submissions for the candidate, regardless of which supervisor is assigned. The supervisor must have at least one submission relationship with the candidate to access all submissions. When omitted or `false`, returns only submissions supervised by the logged-in supervisor (default behavior).

**Examples:**
- Get supervisor's submissions only: `GET /sub/supervisor/candidates/507f1f77bcf86cd799439012/submissions`
- Get all candidate submissions: `GET /sub/supervisor/candidates/507f1f77bcf86cd799439012/submissions?all=true`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": {
        "_id": "507f1f77bcf86cd799439012",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "phoneNum": "+1234567890",
        "regNum": "REG123456",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": {
        "_id": "507f1f77bcf86cd799439013",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": {
          "_id": "507f1f77bcf86cd799439020",
          "engName": "Cairo University Hospital",
          "arabName": "مستشفى جامعة القاهرة",
          "location": {
            "long": 31.2001,
            "lat": 30.0444
          }
        },
        "arabProc": {
          "_id": "507f1f77bcf86cd799439021",
          "title": "Procedure Title",
          "numCode": "12345",
          "alphaCode": "ABC",
          "description": "Procedure description"
        }
      },
      "supervisorDocId": {
        "_id": "507f1f77bcf86cd799439014",
        "email": "supervisor@example.com",
        "fullName": "Dr. Jane Smith",
        "phoneNum": "+1234567890",
        "approved": true,
        "role": "supervisor",
        "canValidate": true,
        "position": "unknown"
      },
      "roleInSurg": "operator",
      "subStatus": "pending",
      "procedureName": ["Procedure A", "Procedure B"],
      "diagnosisName": ["Diagnosis X"],
      "procCptDocId": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "numCode": "12345",
          "description": "CPT Description"
        }
      ],
      "icdDocId": [
        {
          "_id": "507f1f77bcf86cd799439016",
          "code": "I10",
          "description": "ICD Description"
        }
      ],
      "mainDiagDocId": {
        "_id": "507f1f77bcf86cd799439017",
        "title": "Main Diagnosis Title"
      }
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

OR (when `all=true` and supervisor has no relationship with candidate):

```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "You do not have permission to view this candidate's submissions"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Candidate not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- The supervisor ID is automatically extracted from the JWT token
- **Default behavior (without `all=true`):** Returns only submissions that belong to both the specified candidate and the logged-in supervisor
- **With `all=true`:** Returns ALL submissions for the candidate, regardless of assigned supervisor. The supervisor must have at least one submission relationship with the candidate to access all submissions (security verification)
- All ObjectId references are populated with their full document data
- Returns empty array if no submissions found for the candidate-supervisor relationship (default behavior)
- When `all=true`, the `supervisorDocId` in returned submissions may be different from the logged-in supervisor (showing the actual assigned supervisor for each submission)

---

### Review Submission (Approve/Reject)
**PATCH** `/sub/supervisor/submissions/:id/review`

**Authentication Required:** Yes (Validator Supervisor role only)

**⚠️ Important:** Only **Validator Supervisors** (`canValidate: true`) can review submissions. Academic Supervisors (`canValidate: false`) will receive a 403 Forbidden error.

Allows a supervisor to review a submission by approving or rejecting it. This endpoint:
1. Updates the submission status in MongoDB
2. Updates the submission status in Google Sheets via Google Apps Script API
3. Sends an email notification to the candidate with submission details and review comments
4. Returns the updated submission document

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Submission MongoDB ObjectId

**Request Body:**
```json
{
  "status": "approved",
  "review": "Excellent work on this procedure. All documentation is complete and accurate."
}
```

**Request Body Fields:**
- `status` (required): Submission status. Must be either `"approved"` or `"rejected"`
- `review` (optional): Review comments from the supervisor. Maximum 2000 characters. This review is included in the email sent to the candidate but is not stored in MongoDB or Google Sheets.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "candDocId": {
      "_id": "507f1f77bcf86cd799439012",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate"
    },
    "procDocId": {
      "_id": "507f1f77bcf86cd799439013",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "_id": "507f1f77bcf86cd799439020",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة",
        "location": {
          "long": 31.2001,
          "lat": 30.0444
        }
      },
      "arabProc": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Procedure Title",
        "numCode": "12345",
        "alphaCode": "ABC",
        "description": "Procedure description"
      },
      "procDate": "2025-07-14T04:49:35.286Z",
      "google_uid": "proc-uid-123"
    },
    "supervisorDocId": {
      "_id": "507f1f77bcf86cd799439014",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor",
      "canValidate": true,
      "position": "unknown"
    },
    "roleInSurg": "operator",
    "subStatus": "approved",
    "subGoogleUid": "submission-uid-123",
    "procedureName": ["Procedure A", "Procedure B"],
    "diagnosisName": ["Diagnosis X"],
    "procCptDocId": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "numCode": "12345",
        "description": "CPT Description"
      }
    ],
    "icdDocId": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "code": "I10",
        "description": "ICD Description"
      }
    ],
    "mainDiagDocId": {
      "_id": "507f1f77bcf86cd799439017",
      "title": "Main Diagnosis Title"
    }
  }
}
```

**Error Response (400 Bad Request - Validation Errors):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Status must be either 'approved' or 'rejected'",
      "path": "status",
      "location": "body"
    }
  ]
}
```

OR

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID must be a valid MongoDB ObjectId",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission does not belong to this supervisor"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- The supervisor ID is automatically extracted from the JWT token
- The endpoint verifies that the submission belongs to the logged-in supervisor before allowing the review
- **MongoDB Update**: The submission status is updated in the database
- **Google Sheets Update**: The submission status is updated in Google Sheets via the Google Apps Script API. If this update fails, the operation continues (MongoDB update is not rolled back)
- **Email Notification**: A comprehensive email is sent to the candidate containing complete submission details:
  - **Basic Information**: Submission ID, submission date, submission status, submission Google UID, review date
  - **Candidate Information**: Name, email, phone, registration number, rank, degree
  - **Supervisor Information**: Name, email, phone
  - **Procedure Information**: Procedure date, procedure Google UID, hospital (English and Arabic), patient name, patient date of birth, patient gender, Arabic procedure title, Arabic procedure numCode and alphaCode, Arabic procedure description, all procedure names
  - **CPT Codes**: All CPT codes with their descriptions
  - **Diagnosis Information**: Main diagnosis title, all diagnosis names
  - **ICD Codes**: All ICD codes with their descriptions
  - **Surgical Details**: Role in surgery, assistant role description (if applicable), other surgeon rank and name, revision surgery status, pre-operative clinical condition (if applicable), spinal or cranial (if applicable), position (if applicable), approach (if applicable), clinical presentation (if applicable), region (if applicable)
  - **Instruments and Consumables**: Instruments used, consumables used, consumable details (if provided)
  - **Documentation**: Surgical notes (if provided), intraoperative events (if provided)
  - **Review Comments**: Review comments from supervisor (if provided)
  - If email sending fails, the operation continues (MongoDB and Google Sheets updates are not rolled back)
- **Review Comments**: The `review` field is optional and is included in the email sent to the candidate. Review comments are NOT stored in MongoDB or Google Sheets
- Valid status values are: `"approved"` or `"rejected"`
- The review field has a maximum length of 2000 characters
- All ObjectId references in the response are populated with their full document data
- Returns 400 if the submission ID format is invalid or status is invalid
- Returns 404 if submission doesn't exist or doesn't belong to the supervisor

---

### Generate Surgical Notes using AI
**POST** `/sub/submissions/:id/generateSurgicalNotes`

**Authentication Required:** Yes (Institute Admin or Super Admin role)

**Description:** Generates comprehensive surgical notes for a submission using AI (Google Gemini). The endpoint takes a submission ID, populates all required fields, and uses AI to generate professional surgical notes based on the submission data.

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): Submission MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "surgicalNotes": "PREOPERATIVE DIAGNOSIS:\n1. [Diagnosis from submission]\n\nPOSTOPERATIVE DIAGNOSIS:\n1. [Diagnosis from submission]\n\nPROCEDURE PERFORMED:\n[Procedure names from submission]\n\nSURGEON(S):\n[Surgeon name] (Operator)\n[Supervisor name] (Supervisor)\n\nASSISTANT(S):\n[Other surgeons if applicable]\n\nANESTHESIA:\nGeneral anesthesia\n\nPROCEDURE DESCRIPTION:\n[Detailed AI-generated procedure description based on submission data]\n\nFINDINGS:\n[AI-generated findings based on submission data]\n\nINSTRUMENTS AND MATERIALS USED:\n[Instruments and consumables from submission]\n\nINTRAOPERATIVE EVENTS:\n[Intraoperative events from submission, if any]\n\nESTIMATED BLOOD LOSS:\n[If applicable]\n\nPOSTOPERATIVE PLAN:\n[AI-generated postoperative plan]"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID must be a valid MongoDB ObjectId",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "AI service is not configured"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to generate text from AI"
}
```

**Notes:**
- The submission must exist and have all required populated fields:
  - `candDocId` (candidate)
  - `procDocId` (procedure with hospital and arabProc)
  - `supervisorDocId` (supervisor)
  - `mainDiagDocId` (main diagnosis)
  - `procCptDocId` (CPT codes)
  - `icdDocId` (ICD codes)
- The AI uses Google Gemini API (gemini-2.5-flash model by default)
- Requires `GEMINI_API_KEY` environment variable to be configured
- The generated surgical notes are comprehensive and include:
  - Preoperative and postoperative diagnoses
  - Procedure performed
  - Surgeon and assistant information
  - Detailed procedure description
  - Findings
  - Instruments and materials used
  - Intraoperative events
  - Postoperative plan
- Returns 404 if submission doesn't exist
- Returns 500 if AI service is not configured or API call fails
- Only Institute Admins and Super Admins can access this endpoint

---

## Candidates (`/cand`)

### Create Candidates from External
**POST** `/cand/createCandsFromExternal`

Creates candidates from external data source (Google Sheets).

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
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
}
```

---

### Reset Candidate Password
**PATCH** `/cand/:id/resetPassword`

Resets a specific candidate's password to the default password (`MEDscrobe01$`).

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**URL Parameters:**
- `id` (required): Candidate MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Candidate password reset successfully"
  }
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Candidate ID must be a valid MongoDB ObjectId",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Candidate not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to reset candidate password"
}
```

**Notes:**
- The password is reset to the default password: `MEDscrobe01$`
- The password is automatically hashed before being stored in the database
- Only Super Admins can reset candidate passwords
- Returns 404 if the candidate with the specified ID does not exist

---

### Create Supervisor
**POST** `/supervisor`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor",
    "canValidate": true
  }
}
```

---

## Supervisors (`/supervisor`)

The Supervisors module manages two types of supervisors:

### Supervisor Types

1. **Validator Supervisors** (`canValidate: true`)
   - Can validate procedure submissions (approve/reject)
   - Can participate in calendar events (lectures, journals, conferences)
   - Can view submissions assigned to them
   - Default type for backward compatibility

2. **Academic Supervisors** (`canValidate: false`)
   - Can ONLY participate in calendar events (lectures, journals, conferences)
   - CANNOT validate procedure submissions
   - CANNOT view or review submissions
   - Used for supervisors who only participate in academic activities

**Note:** Both types can participate in events. Only validator supervisors can review submissions.

### Supervisor Model

```ts
interface ISupervisor {
  email: string;
  password: string;
  fullName: string;
  phoneNum: string;
  approved: boolean;
  role: "supervisor";
  canValidate?: boolean; // true = validator (default), false = academic only
  position?: "Professor" | "Assistant Professor" | "Lecturer" | "Assistant Lecturer" | "Guest Doctor" | "unknown"; // Supervisor's academic position (defaults to "unknown")
}
```

---

### Get Supervised Candidates
**GET** `/supervisor/candidates`

**Authentication Required:** Yes (Supervisor role)

Returns a list of all unique candidates supervised by the logged-in supervisor, including submission statistics for each candidate.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate",
      "submissionStats": {
        "total": 10,
        "approved": 7,
        "pending": 2,
        "rejected": 1
      }
    }
  ]
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- The supervisor ID is automatically extracted from the JWT token
- Returns unique candidates extracted from all submissions assigned to the supervisor
- Each candidate includes submission statistics (total, approved, pending, rejected)
- Statistics are calculated from all submissions for that candidate-supervisor relationship
- Returns empty array if supervisor has no submissions

---

### Create Supervisor
**POST** `/supervisor`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor",
    "canValidate": true,
    "position": "Professor"
  }
}
```

---

### Get All Supervisors
**GET** `/supervisor`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "supervisor",
      "canValidate": true,
      "position": "unknown"
    }
  ]
}
```

---

### Get Supervisor by ID
**GET** `/supervisor/:id`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor",
    "canValidate": true
  }
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
  "phoneNum": "+9876543210",
  "canValidate": false,
  "position": "Assistant Professor"
}
```

**Request Body Fields (all optional):**
- `email`: Supervisor email address
- `password`: Supervisor password (min 8 characters)
- `fullName`: Supervisor full name
- `phoneNum`: Supervisor phone number (min 11 digits)
- `approved`: Approval status (boolean)
- `canValidate`: Whether supervisor can validate submissions (boolean)
  - `true`: Validator supervisor (can validate submissions AND participate in events)
  - `false`: Academic supervisor (can ONLY participate in events, cannot validate)
- `position`: Supervisor's academic position
  - Valid values: `"Professor"`, `"Assistant Professor"`, `"Lecturer"`, `"Assistant Lecturer"`, `"Guest Doctor"`, `"unknown"`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith Updated",
    "phoneNum": "+9876543210",
    "approved": true,
    "role": "supervisor",
    "position": "Assistant Professor"
  }
}
```

---

### Delete Supervisor
**DELETE** `/supervisor/:id`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Supervisor deleted successfully"
  }
}
```

---

### Reset All Supervisor Passwords
**POST** `/supervisor/resetPasswords`

Resets all supervisor passwords to a default encrypted password.

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
No request body required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "modifiedCount": 12,
    "defaultPassword": "MEDsuper01$"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No token provided"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Super Admin access required"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to reset supervisor passwords"
}
```

**Notes:**
- This endpoint updates all supervisor passwords in the database to the encrypted default password "MEDsuper01$"
- The password is hashed using bcryptjs before being stored
- Only Super Admins can execute this operation
- Returns the number of supervisors whose passwords were updated

---

## Calendar Surgery (`/calSurg`)

### Create CalSurg from External
**POST** `/calSurg/postAllFromExternal`

Creates calendar surgery entries from external data source.

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "google_uid": "unique-google-id",
      "date": "2025-01-15",
      "time": "10:00"
    }
  ]
}
```

---

### Get CalSurg by ID
**GET** `/calSurg/getById`

**Query Parameters:**
- `id` (required): MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "google_uid": "unique-google-id",
    "date": "2025-01-15",
    "time": "10:00"
  }
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
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "google_uid": "unique-google-id",
      "date": "2025-01-15",
      "time": "10:00"
    }
  ]
}
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
      "icdName": "Anoxic brain damage",
      "neuroLogName": ["Anoxic Brain Damage"]
    },
    {
      "icdCode": "G93.2",
      "icdName": "Benign intracranial hypertension",
      "neuroLogName": ["Benign Intracranial Hypertension"]
    }
  ]
}
```

**Field Requirements:**
- `diagnoses` (required): Array of diagnosis objects
  - `icdCode` (required): ICD code, string
  - `icdName` (required): ICD name, string
  - `neuroLogName` (optional): Array of neuro log names, string array

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "icdCode": "G93.1",
      "icdName": "Anoxic brain damage",
      "neuroLogName": ["anoxic brain damage"],
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "icdCode": "G93.2",
      "icdName": "Benign intracranial hypertension",
      "neuroLogName": ["benign intracranial hypertension"],
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
    }
  ]
}
```

**Note:** The `neuroLogName` array values are automatically converted to lowercase.

---

### Create Single Diagnosis
**POST** `/diagnosis/post`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "icdCode": "G93.1",
  "icdName": "Anoxic brain damage",
  "neuroLogName": ["Anoxic Brain Damage"]
}
```

**Field Requirements:**
- `icdCode` (required): ICD code, string
- `icdName` (required): ICD name, string
- `neuroLogName` (optional): Array of neuro log names, string array

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "icdCode": "G93.1",
    "icdName": "Anoxic brain damage",
    "neuroLogName": ["anoxic brain damage"],
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T14:00:00.000Z"
  }
}
```

**Note:** The `neuroLogName` array values are automatically converted to lowercase.

---

## Procedure CPT (`/procCpt`)

### Create ProcCpt from External
**POST** `/procCpt/postAllFromExternal`

Creates procedure CPT codes from external data source.

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "numCode": "61783",
      "alphaCode": "A",
      "title": "Craniotomy for tumor resection",
      "description": "Procedure description"
    }
  ]
}
```

---

### Upsert ProcCpt
**POST** `/procCpt/upsert`

Creates or updates a procedure CPT code. If a procedure with the same `numCode` exists, it will be updated. Otherwise, a new procedure will be created.

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "numCode": "61783",
  "alphaCode": "A",
  "title": "Craniotomy for tumor resection",
  "description": "Procedure description"
}
```

**Field Requirements:**
- `numCode` (required): Numerical code, string, max 50 characters (used to determine if procedure exists)
- `alphaCode` (required): Alpha code, string, max 50 characters
- `title` (required): Procedure title, string, max 200 characters
- `description` (required): Procedure description, string, max 500 characters

**Note:** The upsert operation uses `numCode` to determine if a procedure already exists. If a procedure with the same `numCode` is found, all fields will be updated. Otherwise, a new procedure will be created.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "numCode": "61783",
    "alphaCode": "A",
    "title": "Craniotomy for tumor resection",
    "description": "Procedure description"
  }
}
```

---

## Main Diagnosis (`/mainDiag`)

### Create Main Diagnosis
**POST** `/mainDiag`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

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
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "cns tumors",
    "procs": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "diagnosis": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
  }
}
```

---

### Get All Main Diagnoses
**GET** `/mainDiag`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "cns tumors",
      "procs": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "numCode": "61783",
          "alphaCode": "A",
          "title": "Procedure Title",
          "description": "Procedure description"
        }
      ],
      "diagnosis": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "icdCode": "G93.1",
          "icdName": "Anoxic brain damage"
        }
      ]
    }
  ]
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data, not just ObjectIds.

---

### Get Main Diagnosis by ID
**GET** `/mainDiag/:id`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "cns tumors",
    "procs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "numCode": "61783",
        "alphaCode": "A",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "diagnosis": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "icdCode": "G93.1",
        "icdName": "Anoxic brain damage"
      }
    ]
  }
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data, not just ObjectIds.

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

**Field Requirements:**
- `title` (optional): Main diagnosis title, string, max 200 characters
- `procs` (optional): Array of procedure numCodes (strings) to append to existing procedures. Duplicates are automatically avoided.
- `diagnosis` (optional): Array of diagnosis icdCodes (strings) to append to existing diagnoses. Duplicates are automatically avoided.

**Note:** The `procs` and `diagnosis` arrays are appended to existing values, not replaced. If a procedure or diagnosis already exists, it won't be duplicated.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "updated title",
    "procs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "numCode": "61783",
        "alphaCode": "A",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "diagnosis": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "icdCode": "G93.1",
        "icdName": "Anoxic brain damage"
      }
    ]
  }
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data in the response.

---

### Delete Main Diagnosis
**DELETE** `/mainDiag/:id`

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "MainDiag deleted successfully"
  }
}
```

---

## Arabic Procedures (`/arabProc`)

### Get All Arab Procedures
**GET** `/arabProc/getAllArabProcs`

No authentication required.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "مراجعة صمام اوميا",
      "alphaCode": "VSHN",
      "numCode": "61070",
      "description": "Ommaya valve reservoir check and fluid sampling procedure."
    }
  ]
}
```

---

### Create Arab Procedure
**POST** `/arabProc/createArabProc`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "title": "مراجعة صمام اوميا",
  "alphaCode": "VSHN",
  "numCode": "61070",
  "description": "Ommaya valve reservoir check and fluid sampling procedure."
}
```

**Field Requirements:**
- `title` (required): Arabic procedure title, string, max 100 characters
- `alphaCode` (required): Alpha code, string, max 10 characters
- `numCode` (required): Numerical code, string
- `description` (required): Procedure description, string

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "مراجعة صمام اوميا",
    "alphaCode": "VSHN",
    "numCode": "61070",
    "description": "Ommaya valve reservoir check and fluid sampling procedure."
  }
}
```

---

### Create Arab Procedure from External
**POST** `/arabProc/createArabProcFromExternal`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "مراجعة صمام اوميا",
      "alphaCode": "VSHN",
      "numCode": "61070",
      "description": "Ommaya valve reservoir check and fluid sampling procedure."
    }
  ]
}
```

---

## Hospitals (`/hospital`)

### Create Hospital
**POST** `/hospital/create`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**Request Body:**
```json
{
  "arabName": "مستشفى جامعة القاهرة",
  "engName": "Cairo University Hospital",
  "location": {
    "long": 31.2001,
    "lat": 30.0444
  }
}
```

**Field Requirements:**
- `arabName` (required): Arabic hospital name, string, max 100 characters
- `engName` (required): English hospital name, string, max 100 characters
- `location` (optional): Object with coordinates
  - `long` (optional): Longitude, number between -180 and 180
  - `lat` (optional): Latitude, number between -90 and 90

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "arabName": "مستشفى جامعة القاهرة",
    "engName": "Cairo University Hospital",
    "location": {
      "long": 31.2001,
      "lat": 30.0444
    },
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T14:00:00.000Z"
  }
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
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Email sent successfully to recipient@example.com"
  }
}
```

---

## External Service (`/external`)

---

## Lectures (`/lecture`)

The Lectures module provides access to lecture data for Institute Admins to use when creating events.

### Authentication

- **Requires:** Institute Admin authentication for `GET /lecture` endpoint
- Higher roles (Super Admin) are also allowed via `requireInstituteAdmin`
- **Note:** POST, PATCH, DELETE, and GET by ID endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

### Get All Lectures

**GET** `/lecture`

**Requires:** Institute Admin authentication

**Description:**  
Returns all lectures available in the system. This endpoint is used by Institute Admins to select lectures when creating events.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "lectureTitle": "1.2.1: Introduction to Neurosurgery",
      "google_uid": "lecture-001",
      "mainTopic": "neurosurgery basics",
      "level": "msc",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` (string, required): MongoDB ObjectId of the lecture
- `lectureTitle` (string, required): Title of the lecture
- `google_uid` (string, required): Google Sheets unique identifier
- `mainTopic` (string, required): Main topic of the lecture
- `level` (string, required): Level of the lecture - `"msc"` or `"md"`
- `createdAt` (string, optional): ISO 8601 timestamp
- `updatedAt` (string, optional): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `instituteAdmin` or `superAdmin` role
- `500 Internal Server Error`: Server error

---

## Journals (`/journal`)

The Journals module provides access to journal data for Institute Admins to use when creating events.

### Authentication

- **Requires:** Institute Admin authentication for `GET /journal` endpoint
- Higher roles (Super Admin) are also allowed via `requireInstituteAdmin`
- **Note:** POST, PATCH, DELETE, and GET by ID endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

### Get All Journals

**GET** `/journal`

**Requires:** Institute Admin authentication

**Description:**  
Returns all journals available in the system. This endpoint is used by Institute Admins to select journals when creating events.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "journalTitle": "Neurosurgery Journal - Volume 1",
      "pdfLink": "https://example.com/journal1.pdf",
      "google_uid": "journal-001",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` (string, required): MongoDB ObjectId of the journal
- `journalTitle` (string, required): Title of the journal
- `pdfLink` (string, required): Link to the journal PDF
- `google_uid` (string, required): Google Sheets unique identifier
- `createdAt` (string, optional): ISO 8601 timestamp
- `updatedAt` (string, optional): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `instituteAdmin` or `superAdmin` role
- `500 Internal Server Error`: Server error

---

## Conferences (`/conf`)

The Conferences module provides access to conference data for Institute Admins to use when creating events.

### Authentication

- **Requires:** Institute Admin authentication for `GET /conf` endpoint
- Higher roles (Super Admin) are also allowed via `requireInstituteAdmin`
- **Note:** POST, PATCH, DELETE, and GET by ID endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

### Get All Conferences

**GET** `/conf`

**Requires:** Institute Admin authentication

**Description:**  
Returns all conferences available in the system. This endpoint is used by Institute Admins to select conferences when creating events.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439031",
      "confTitle": "Annual Neurosurgery Conference 2024",
      "google_uid": "conf-001",
      "presenter": "6905e9dc719e11e810a0453c",
      "date": "2024-06-15T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` (string, required): MongoDB ObjectId of the conference
- `confTitle` (string, required): Title of the conference
- `google_uid` (string, required): Google Sheets unique identifier
- `presenter` (string, required): MongoDB ObjectId reference to Supervisor
- `date` (string, required): Date of the conference (ISO 8601)
- `createdAt` (string, optional): ISO 8601 timestamp
- `updatedAt` (string, optional): ISO 8601 timestamp

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `instituteAdmin` or `superAdmin` role
- `500 Internal Server Error`: Server error

---

## Events (`/event`)

The Events module allows **Institute Admins** to schedule lectures, journals, and conferences on a shared calendar, with associated presenters and candidate attendance.

**📋 Frontend Implementation Guide:** For comprehensive frontend requirements and implementation details, see `FRONTEND_EVENTS_CALENDAR_REQUIREMENTS.md`.

### Authentication

- **Requires:** Institute Admin authentication for all `/event` endpoints  
- Higher roles (Super Admin) are also allowed via `requireInstituteAdmin`

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

### Event Model

```ts
type TEventType = "lecture" | "journal" | "conf";
type TEventStatus = "booked" | "held" | "canceled";
type TAttendanceAddedByRole = "instituteAdmin" | "supervisor" | "candidate";

interface IEventAttendance {
  candidate: ObjectId;            // Ref: Candidate
  addedBy: ObjectId;              // Ref: User (who added the candidate)
  addedByRole: TAttendanceAddedByRole; // Role of who added
  flagged: boolean;                // Default: false
  flaggedBy?: ObjectId;          // Ref: User (who flagged, if flagged)
  flaggedAt?: Date;                // When flagged
  points: number;                  // +1 if not flagged, -2 if flagged
  createdAt: Date;                 // When added to attendance
}

interface IEvent {
  type: TEventType;               // "lecture" | "journal" | "conf"
  lecture?: ObjectId;             // when type = "lecture"
  journal?: ObjectId;             // when type = "journal"
  conf?: ObjectId;                // when type = "conf"
  dateTime: Date;                 // event start datetime
  location: string;
  presenter: ObjectId;            // Supervisor (lecture/conf) or Candidate (journal)
  attendance: IEventAttendance[]; // Array of attendance records with metadata
  status: TEventStatus;           // "booked" (default) | "held" | "canceled"
}
```

#### Presenter Rules

- `type = "lecture"` or `type = "conf"` → `presenter` **must** be a valid Supervisor `_id`
- `type = "journal"` → `presenter` **must** be a valid Candidate `_id`

These rules are enforced in the backend (provider) by checking existence in the appropriate collection.

**Note:** In API responses, the `presenter` field is automatically populated with the full presenter object:
- For `lecture` and `conf` events: populated from `Supervisor` collection with fields: `_id`, `fullName`, `email`, `phoneNum`, `role`, `position`, `canValidate`
- For `journal` events: populated from `Candidate` collection with fields: `_id`, `fullName`, `email`, `phoneNum`, `regNum`, `role`

#### Attendance Rules

The `attendance` field is an array of attendance records with metadata:

- **`candidate`**: Reference to the Candidate who is attending
- **`addedBy`**: Reference to the User who added the candidate to attendance
- **`addedByRole`**: Role of who added (`"instituteAdmin"`, `"supervisor"`, or `"candidate"`)
- **`flagged`**: Boolean indicating if the candidate was flagged (default: `false`)
- **`flaggedBy`**: Reference to the User who flagged the candidate (if flagged)
- **`flaggedAt`**: Timestamp when the candidate was flagged (if flagged)
- **`points`**: Points awarded for this attendance:
  - `+1` if not flagged (normal attendance)
  - `-2` if flagged (penalty)
- **`createdAt`**: Timestamp when the candidate was added to attendance

**Note:** In API responses, the `attendance[].candidate` field is automatically populated with the full candidate object.

**Points System:**
- Candidates earn `+1` point for each event they attend
- If a candidate is flagged, they receive `-2` points for that event (overriding the +1)
- Total candidate points = sum of all `attendance.points` across all events
- Points can be viewed via `GET /event/candidate/:candidateId/points`

#### Location Rules

The `location` field has different validation rules based on event type:

- **`type = "lecture"` or `type = "journal"`**: Location **must** be either `"Dept"` or `"Online"` (case-insensitive)
  - Valid values: `"Dept"`, `"dept"`, `"Online"`, `"online"` (all normalized to lowercase in database)
  - Invalid values will result in validation error

- **`type = "conf"`**: Location can be **any string** (open field)
  - No restrictions on location value
  - Examples: `"Cairo University Hospital"`, `"Online"`, `"Conference Hall A"`, etc.

**Validation Errors:**
- If lecture/journal event has location other than "Dept" or "Online" → `400 Bad Request` with error message

#### Event Status Rules

The `status` field tracks the event lifecycle:

- **`"booked"`** (default): Event is created/scheduled by Institute Admin. This is the initial state when an event is created.
- **`"held"`**: Event was held and has attendees. Status is automatically set to `"held"` when attendance is registered (attendance array has entries).
- **`"canceled"`**: Event was canceled (no attendees after event date). Status is automatically set to `"canceled"` when attendance is empty and the event date has passed.

**Automatic Status Updates:**
- When `attendance` is updated and has entries → status automatically becomes `"held"`
- When `attendance` is updated to empty and event `dateTime` has passed → status automatically becomes `"canceled"`
- Status can also be manually updated via the update endpoint

---

### Create Event

**POST** `/event`

**Requires:** Institute Admin authentication

**Request Body (Lecture Event Example):**
```json
{
  "type": "lecture",
  "lecture": "507f1f77bcf86cd799439011",
  "dateTime": "2025-01-15T10:00:00.000Z",
  "location": "Dept",
  "presenter": "6905e9dc719e11e810a0453c",
  "attendance": [],
  "status": "booked"
}
```

**Request Body (Conference Event Example):**
```json
{
  "type": "conf",
  "conf": "507f1f77bcf86cd799439012",
  "dateTime": "2025-01-20T14:00:00.000Z",
  "location": "Cairo University Hospital - Main Auditorium",
  "presenter": "6905e9dc719e11e810a0453c",
  "attendance": [],
  "status": "booked"
}
```

**Note:** 
- The `status` field is optional and defaults to `"booked"` if not provided
- The `attendance` field is also optional and defaults to an empty array
- For `lecture` and `journal` events, `location` must be `"Dept"` or `"Online"` (case-insensitive)
- For `conf` events, `location` can be any string

**Validation Rules:**
- `type`: required, `"lecture" | "journal" | "conf"`
- `lecture` (required if `type = "lecture"`): valid MongoId
- `journal` (required if `type = "journal"`): valid MongoId
- `conf` (required if `type = "conf"`): valid MongoId
- `dateTime`: required, ISO8601, converted to `Date`
- `location`: required string
- `presenter`: required, valid MongoId (`Supervisor` for lecture/conf, `Candidate` for journal)
- `attendance` (optional): array of valid MongoIds (Candidates), defaults to empty array
- `status` (optional): `"booked" | "held" | "canceled"`, defaults to `"booked"`

**Response (201 Created, wrapped):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "type": "lecture",
    "lecture": "507f1f77bcf86cd799439011",
    "dateTime": "2025-01-15T10:00:00.000Z",
    "location": "main auditorium",
    "presenter": {
      "_id": "6905e9dc719e11e810a0453c",
      "fullName": "Dr. John Doe",
      "email": "john.doe@example.com",
      "phoneNum": "+1234567890",
      "role": "supervisor",
      "position": "Professor",
      "canValidate": true
    },
    "attendance": [],
    "status": "booked",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

---

### Get All Events

**GET** `/event`

**Requires:** Institute Admin authentication

**Description:**  
Returns all events with populated references:
- `lecture` / `journal` / `conf`
- `presenter` (Supervisor for lecture/conf, Candidate for journal)
- `attendance` (candidates)

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "type": "lecture",
      "lecture": {
        "_id": "507f1f77bcf86cd799439011",
        "lectureTitle": "1.2.1: Introduction to Neurosurgery",
        "google_uid": "lecture-001",
        "mainTopic": "neurosurgery basics",
        "level": "msc"
      },
      "journal": null,
      "conf": null,
      "dateTime": "2025-01-15T10:00:00.000Z",
      "location": "main auditorium",
      "presenter": {
        "_id": "6905e9dc719e11e810a0453c",
        "fullName": "Dr. John Doe",
        "email": "john.doe@example.com",
        "phoneNum": "+1234567890",
        "role": "supervisor",
        "position": "Professor",
        "canValidate": true
      },
      "attendance": [
        {
          "candidate": {
            "_id": "692727ac12025d432235f620",
            "fullName": "Candidate A",
            "email": "candA@example.com",
            "phoneNum": "+1234567890",
            "regNum": "REG123456",
            "role": "candidate"
          },
          "addedBy": "6905e9dc719e11e810a0453c",
          "addedByRole": "instituteAdmin",
          "flagged": false,
          "points": 1,
          "createdAt": "2025-01-15T09:00:00.000Z"
        }
      ],
      "status": "held",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-01T12:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "type": "journal",
      "lecture": null,
      "journal": {
        "_id": "507f1f77bcf86cd799439013",
        "journalTitle": "Neurosurgery Research Journal",
        "google_uid": "journal-001"
      },
      "conf": null,
      "dateTime": "2025-01-18T14:00:00.000Z",
      "location": "Dept",
      "presenter": {
        "_id": "692727ac12025d432235f621",
        "fullName": "Candidate B",
        "email": "candB@example.com",
        "phoneNum": "+1234567891",
        "regNum": "REG123456",
        "role": "candidate"
      },
      "attendance": [],
      "status": "booked",
      "createdAt": "2025-01-02T12:00:00.000Z",
      "updatedAt": "2025-01-02T12:00:00.000Z"
    }
  ]
}
```

---

### Get Event by ID

**GET** `/event/:id`

**Requires:** Institute Admin authentication

**URL Parameters:**
- `id`: Event MongoDB ObjectId

**Response (200 OK):**
Same structure as a single item in the `GET /event` response.

**Error (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Event not found"
}
```

---

## Attendance Management

The following endpoints allow managing candidate attendance for events with points tracking and flagging capabilities.

### Add Candidate to Attendance

**POST** `/event/:eventId/attendance/:candidateId`

**Requires:** Authentication (varies by role)

**Authorization:**
- **Institute Admin**: Can add any candidate to any event
- **Supervisor (Presenter)**: Can add candidates to events where they are the presenter (lecture/conf only)
- **Candidate**: Can add themselves to any event

**URL Parameters:**
- `eventId`: Event MongoDB ObjectId
- `candidateId`: Candidate MongoDB ObjectId

**Response (200 OK):**
Returns the updated event with the new attendance record.

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "type": "lecture",
    "attendance": [
      {
        "candidate": {
          "_id": "692727ac12025d432235f620",
          "fullName": "Candidate A",
          "email": "candA@example.com"
        },
        "addedBy": "6905e9dc719e11e810a0453c",
        "addedByRole": "instituteAdmin",
        "flagged": false,
        "points": 1,
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid event or candidate ID
- `403 Forbidden`: Insufficient permissions (e.g., supervisor trying to add to event where they're not presenter)
- `404 Not Found`: Event or candidate not found
- `409 Conflict`: Candidate already in attendance

---

### Remove Candidate from Attendance

**DELETE** `/event/:eventId/attendance/:candidateId`

**Requires:** Authentication (varies by role)

**Authorization:**
- **Institute Admin**: Can remove any candidate from any event
- **Supervisor (Presenter)**: Can remove candidates from events where they are the presenter (lecture/conf only)

**URL Parameters:**
- `eventId`: Event MongoDB ObjectId
- `candidateId`: Candidate MongoDB ObjectId

**Response (200 OK):**
Returns the updated event with the candidate removed from attendance.

**Error Responses:**
- `400 Bad Request`: Invalid event or candidate ID
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Event not found or candidate not in attendance

---

### Flag Candidate Attendance

**PATCH** `/event/:eventId/attendance/:candidateId/flag`

**Requires:** Authentication (varies by role)

**Authorization:**
- **Institute Admin**: Can flag any candidate in any event
- **Supervisor (Presenter)**: Can flag candidates in events where they are the presenter (lecture/conf only)

**Description:**
Flags a candidate's attendance, which:
- Sets `flagged = true`
- Sets `flaggedBy` to the current user
- Sets `flaggedAt` to current timestamp
- Changes `points` from `+1` to `-2` (penalty)

**URL Parameters:**
- `eventId`: Event MongoDB ObjectId
- `candidateId`: Candidate MongoDB ObjectId

**Response (200 OK):**
Returns the updated event with the flagged attendance record.

```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "attendance": [
      {
        "candidate": {
          "_id": "692727ac12025d432235f620",
          "fullName": "Candidate A"
        },
        "addedBy": "6905e9dc719e11e810a0453c",
        "addedByRole": "instituteAdmin",
        "flagged": true,
        "flaggedBy": "6905e9dc719e11e810a0453c",
        "flaggedAt": "2025-01-20T11:00:00.000Z",
        "points": -2,
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid event or candidate ID
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Event not found or candidate not in attendance

---

### Unflag Candidate Attendance

**PATCH** `/event/:eventId/attendance/:candidateId/unflag`

**Requires:** Authentication (varies by role)

**Authorization:**
- **Institute Admin**: Can unflag any candidate in any event
- **Supervisor (Presenter)**: Can unflag candidates in events where they are the presenter (lecture/conf only)

**Description:**
Unflags a candidate's attendance, which:
- Sets `flagged = false`
- Removes `flaggedBy` and `flaggedAt`
- Changes `points` from `-2` back to `+1`

**URL Parameters:**
- `eventId`: Event MongoDB ObjectId
- `candidateId`: Candidate MongoDB ObjectId

**Response (200 OK):**
Returns the updated event with the unflagged attendance record.

**Error Responses:**
- `400 Bad Request`: Invalid event or candidate ID
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Event not found or candidate not in attendance

---

### Get My Academic Points (Candidate Dashboard)

**GET** `/event/candidate/points`

**Requires:** Candidate authentication

**Description:**
Returns the total academic points for the logged-in candidate across all events. This endpoint automatically uses the candidate's ID from the JWT token, so candidates can easily view their own points on their dashboard.

Points are calculated as:
- `+1` for each event attended (not flagged)
- `-2` for each flagged attendance

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "totalPoints": 15
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No candidate ID found in token"
}
```

**Error Response (403 Forbidden):**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- The candidate ID is automatically extracted from the JWT token
- Only candidates can access this endpoint (requires `requireCandidate` middleware)
- Returns 0 if the candidate has no event attendance records
- Points are calculated from all events where the candidate is in the attendance list

---

### Get Candidate Total Points by ID

**GET** `/event/candidate/:candidateId/points`

**Requires:** Authentication (any authenticated user can view points)

**Description:**
Returns the total points for a specific candidate across all events. This endpoint allows viewing any candidate's points by providing their ID. Points are calculated as:
- `+1` for each event attended (not flagged)
- `-2` for each flagged attendance

**URL Parameters:**
- `candidateId`: Candidate MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "totalPoints": 15
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid candidate ID
- `404 Not Found`: Candidate not found

---

### Bulk Import Attendance from External Spreadsheet

**POST** `/event/bulk-import-attendance`

**Requires:** Institute Admin authentication

**Description:**
Bulk imports candidate attendance from an external Google Sheet. The endpoint:
- Reads from spreadsheet: `lectureRegistrationRes`, sheet: `"Form Responses 1"`
- Column B: Candidate Email Address
- Column C: Lecture or Journal UID (google_uid)
- Skips candidates that don't exist in the database
- Skips candidates already registered for the event (no duplicates)
- Adds candidates to attendance with `addedByRole = "instituteAdmin"`

**Request Body:**
No request body required. The endpoint automatically fetches data from the configured spreadsheet.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "totalRows": 50,
    "processed": 50,
    "added": 35,
    "skipped": 15,
    "errors": [
      {
        "row": 3,
        "email": "nonexistent@example.com",
        "uid": "lecture-001",
        "reason": "Candidate not found in database"
      },
      {
        "row": 7,
        "email": "candidate@example.com",
        "uid": "lecture-002",
        "reason": "Candidate already registered for this event"
      },
      {
        "row": 12,
        "email": "candidate2@example.com",
        "uid": "invalid-uid",
        "reason": "Lecture or Journal not found with this UID"
      }
    ]
  }
}
```

**Response Fields:**
- `totalRows`: Total number of rows in the spreadsheet
- `processed`: Number of rows processed (including errors)
- `added`: Number of candidates successfully added to attendance
- `skipped`: Number of rows skipped (due to errors or duplicates)
- `errors`: Array of error details for skipped rows

**Error Reasons:**
- `"Missing email or UID"`: Row is missing email or UID data
- `"Candidate not found in database"`: Email doesn't match any candidate
- `"Lecture or Journal not found with this UID"`: UID doesn't match any lecture/journal
- `"Event not found for this Lecture/Journal"`: No event exists for the lecture/journal
- `"Candidate already registered for this event"`: Candidate is already in attendance (duplicate)

**Error Responses:**
- `500 Internal Server Error`: Failed to fetch spreadsheet data or other server errors

**Note:**
- The endpoint processes all rows and returns a summary
- Errors are collected and returned in the response (does not fail the entire operation)
- Each successful addition awards `+1` point to the candidate
- The `addedBy` field is set to the Institute Admin who triggered the import

---

### Update Event

**PATCH** `/event/:id`

**Requires:** Institute Admin authentication

**URL Parameters:**
- `id`: Event MongoDB ObjectId

**Request Body (partial, any subset of fields):**
```json
{
  "location": "Online",
  "dateTime": "2025-01-20T10:00:00.000Z",
  "attendance": [
    "692727ac12025d432235f620",
    "692727ac12025d432235f621"
  ],
  "status": "held"
}
```

**Note:** When updating `location`:
- For `lecture` or `journal` events → must be `"Dept"` or `"Online"`
- For `conf` events → can be any string

**Note:** When updating `dateTime`:
- Must be a valid ISO 8601 format date string
- **Business Rule**: Cannot change the date of an event that has already been held (status = `"held"`)
- If attempting to change dateTime of a "held" event → returns `400 Bad Request` with error message

**Error Response (400 Bad Request) - DateTime Validation Failed:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Cannot change date of an event that has already been held"
}
```

**Note:** When `attendance` is updated:
- If `attendance` has entries → status automatically becomes `"held"`
- If `attendance` is empty and event `dateTime` has passed → status automatically becomes `"canceled"`
- Status can also be manually updated independently

**Status Change Validation:**
The backend enforces strict rules when changing event status based on attendance:

1. **Events with Unflagged Candidates**: If an event has at least one candidate with `flagged === false`, the status **must** be `"held"`. Cannot be changed to `"booked"` or `"canceled"`.

2. **Events with No Candidates**: If an event has no candidates in attendance, the status can only be `"booked"` or `"canceled"`. Cannot be changed to `"held"`.

3. **Events with Only Flagged Candidates**: If an event has candidates but all are flagged (`flagged === true`), all statuses are allowed (`"booked"`, `"held"`, or `"canceled"`).

**Error Response (400 Bad Request) - Status Validation Failed:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Cannot change status: Event has unflagged candidates and must remain as 'held'"
}
```

OR

```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Cannot change status to 'held': Event has no candidates. Allowed statuses: 'booked' or 'canceled'"
}
```

**Automatic Status Updates After Attendance Changes:**
- **After unflagging a candidate**: If the event has unflagged candidates and status is `"booked"` or `"canceled"`, status is automatically changed to `"held"`.

Backend re-validates:
- Event `type` / `lecture` / `journal` / `conf` consistency
- Existence of referenced lecture/journal/conf
- Presenter role (Supervisor vs Candidate) based on type
- Location value based on type (see Location Rules above)
- Attendance IDs format
- Status enum value (`"booked" | "held" | "canceled"`)
- **Status change based on attendance rules (see above)**

**Location Update Validation:**
- If updating `location` for `lecture` or `journal` → must be `"Dept"` or `"Online"`
- If updating `location` for `conf` → can be any string
- If updating `type` and `location` together → location is validated against the new type

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "type": "lecture",
    "lecture": "507f1f77bcf86cd799439011",
    "dateTime": "2025-01-20T10:00:00.000Z",
    "location": "Online",
    "presenter": {
      "_id": "6905e9dc719e11e810a0453c",
      "fullName": "Dr. John Doe",
      "email": "john.doe@example.com",
      "phoneNum": "+1234567890",
      "role": "supervisor",
      "position": "Professor",
      "canValidate": true
    },
    "attendance": [
      {
        "candidate": {
          "_id": "692727ac12025d432235f620",
          "fullName": "Candidate A",
          "email": "candA@example.com",
          "phoneNum": "+1234567890",
          "regNum": "REG123456",
          "role": "candidate"
        },
        "addedBy": "6905e9dc719e11e810a0453c",
        "addedByRole": "instituteAdmin",
        "flagged": false,
        "points": 1,
        "createdAt": "2025-01-20T09:00:00.000Z"
      },
      {
        "candidate": {
          "_id": "692727ac12025d432235f621",
          "fullName": "Candidate B",
          "email": "candB@example.com",
          "phoneNum": "+1234567891",
          "regNum": "REG123457",
          "role": "candidate"
        },
        "addedBy": "692727ac12025d432235f621",
        "addedByRole": "candidate",
        "flagged": false,
        "points": 1,
        "createdAt": "2025-01-20T09:30:00.000Z"
      }
    ],
    "status": "held"
  }
}
```

---

### Delete Event

**DELETE** `/event/:id`

**Requires:** Institute Admin authentication

**URL Parameters:**
- `id`: Event MongoDB ObjectId

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Event deleted successfully"
  }
}
```

**Error (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Event not found"
}
```


### Get Arab Procedure Data
**GET** `/external`

Retrieves Arabic procedure data from external source.

**Query Parameters:**
- Various parameters (see validator)

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "success": true,
    "data": {
      "data": [...]
    }
  }
}
```

---

## Error Responses

All error responses follow the standardized format with `status: "error"` and the error details in the `error` field.

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

**Special Case:** `/auth/validate` endpoint may return a direct object:
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
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
  "error": "Error message details"
}
```

---

## PDF Report Generation Endpoints

All PDF report endpoints require **Institute Admin authentication** via JWT token in Authorization header or httpOnly cookie.

### Response Format
PDF endpoints return:
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="<report-name>-<timestamp>.pdf"`
- **Status Code**: `200 OK` on success
- **Error responses**: Follow standard API error format (JSON) when PDF generation fails

All PDF reports include MedScribe branding in the header:
- **Logo**: MedScribe logo (40x40 pixels) in top-left corner
- **Branding Text**: "MedScribe" with "Med" in `#19203f` (dark blue) and "Scribe" in `#1991c8` (light blue)
- **Report Title**: Centered or right-aligned
- **Generated Date/Time**: Right-aligned in header

---

#### Supervisors Submission Count Report
**GET** `/instituteAdmin/reports/supervisors/submission-count`

**Requires:** Institute Admin authentication

**Description:** Generates a PDF report showing submission count analysis for all supervisors, excluding any supervisor with the name "Tester_Supervisor" (case-insensitive matching).

**Query Parameters (optional):**
- `startDate` (ISO 8601): Filter submissions by start date
- `endDate` (ISO 8601): Filter submissions by end date

**PDF Content:**
1. **Report Header** with MedScribe branding
2. **Bar Chart**: Vertical stacked bar chart showing approved (green), pending (yellow), and rejected (red) submissions per supervisor
3. **Data Table**: Columns - Supervisor Name | Approved | Pending | Rejected | Total
   - Supervisors sorted by total submission count (descending)
   - Excludes supervisors with "Tester_Supervisor" in name or email (case-insensitive)

**Color Scheme:**
- Approved: `hsl(142, 76%, 36%)` (Green)
- Pending: `hsl(45, 93%, 47%)` (Yellow)
- Rejected: `hsl(0, 84%, 60%)` (Red)

**Response (200 OK):**
- PDF file with Content-Type: `application/pdf`
- Filename format: `supervisors-submission-count-<timestamp>.pdf`

**Error Responses:**
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User is not an Institute Admin
- **500 Internal Server Error**: PDF generation failed

---

#### Candidates Submission Count Report
**GET** `/instituteAdmin/reports/candidates/submission-count`

**Requires:** Institute Admin authentication

**Description:** Generates a PDF report showing submission count analysis for all candidates, excluding any candidate with email or fullName containing "tester" (case-insensitive).

**Query Parameters (optional):**
- `startDate` (ISO 8601): Filter submissions by start date
- `endDate` (ISO 8601): Filter submissions by end date

**PDF Content:**
1. **Report Header** with MedScribe branding
2. **Bar Chart**: Vertical stacked bar chart showing approved (green), pending (yellow), and rejected (red) submissions per candidate
3. **Data Table**: Columns - Candidate Name | Approved | Pending | Rejected | Total
   - Candidates sorted by total submission count (descending)
   - Excludes candidates with "tester" in email or fullName (case-insensitive)

**Color Scheme:**
- Approved: `hsl(142, 76%, 36%)` (Green)
- Pending: `hsl(45, 93%, 47%)` (Yellow)
- Rejected: `hsl(0, 84%, 60%)` (Red)

**Response (200 OK):**
- PDF file with Content-Type: `application/pdf`
- Filename format: `candidates-submission-count-<timestamp>.pdf`

**Error Responses:**
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User is not an Institute Admin
- **500 Internal Server Error**: PDF generation failed

---

#### Calendar Procedures Hospital Analysis Report
**GET** `/instituteAdmin/reports/calendar-procedures/hospital-analysis`

**Requires:** Institute Admin authentication

**Description:** Generates a PDF report showing hospital-based procedure analysis for calendar procedures. The report algorithmically determines which hospitals have procedures and generates sections for each.

**Query Parameters (optional):**
- `hospitalId` (MongoDB ObjectId): Filter by specific hospital
- `month` (1-12): Filter by month
- `year` (e.g., 2025): Filter by year
- `startDate` (ISO 8601): Filter by start date
- `endDate` (ISO 8601): Filter by end date
- `groupBy` (`title` | `alphaCode`): Group procedures by title or alphaCode. Default: `title`

**PDF Content:**
1. **Report Header** with MedScribe branding
2. **Summary Section**:
   - Total number of calendar procedures across all hospitals
   - Total number of candidate submissions
   - Comparison statement
3. **Hospitals with Procedures Section**:
   - For each hospital that has procedures (algorithmically determined):
     - Hospital name (English and Arabic if available)
     - Bar chart showing procedure frequency
     - Data table: Procedure Title (or AlphaCode) | Count
4. **Hospitals with No Procedures Section**:
   - List of all hospitals that exist in the database but have zero calendar procedures

**Algorithmic Hospital List Generation:**
- Dynamically determines hospitals that have procedures by querying all calendar procedures
- Extracts unique `hospital._id` values from procedures
- Generates a report section for each hospital that has procedures
- Lists hospitals with no procedures separately

**Response (200 OK):**
- PDF file with Content-Type: `application/pdf`
- Filename format: `calendar-procedures-hospital-analysis-<timestamp>.pdf`

**Error Responses:**
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User is not an Institute Admin
- **500 Internal Server Error**: PDF generation failed

**Notes:**
- Hospital matching is flexible (case-insensitive, handles variations in naming)
- If no procedures found, returns a PDF with a message indicating no data available
- The comparison between total procedures and total submissions is clearly stated

---

#### Canceled Events Report
**GET** `/instituteAdmin/reports/events/canceled/pdf`

**Requires:** Institute Admin authentication

**Description:** Generates a PDF report containing **all events with `status = "canceled"`**, including key details (date/time, type, resource title + google UID, presenter, location, attendance count). Supports optional date filtering on `event.dateTime`.

**Query Parameters (optional):**
- `startDate` (ISO 8601): Include events with `dateTime >= startDate`
- `endDate` (ISO 8601): Include events with `dateTime <= endDate`

**PDF Content:**
1. **Detailed list only** (no summary/table):
   - Note line: **Canceled events: X / Total events: Y** for the selected period
   - Date/Time + Type + Resource title
   - Status, Location
   - **Resource UID**
   - Presenter name + presenter email
   - Attendance count

**Response (200 OK):**
- PDF file with Content-Type: `application/pdf`
- Filename format: `canceled-events-<timestamp>.pdf`

**Error Responses:**
- **400 Bad Request**: Invalid `startDate/endDate` (must be ISO 8601) or `endDate < startDate`
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User is not an Institute Admin
- **500 Internal Server Error**: PDF generation failed

---

## Authentication Requirements Summary

| Endpoint Category | Authentication Required | Role Required |
|-----------------|------------------------|---------------|
| `/auth/login*` | No | - |
| `/auth/registerCand` | No | - |
| `/auth/resetCandPass` | No | - |
| `/auth/requestPasswordChangeEmail` | Yes | All user types (candidate, supervisor, superAdmin, instituteAdmin) |
| `/auth/changePassword` | Yes | All user types (candidate, supervisor, superAdmin, instituteAdmin) |
| `/auth/forgotPassword` | No | - |
| `/auth/resetPassword` | No | - |
| `/superAdmin/*` | Yes | Super Admin |
| `/instituteAdmin/*` | Yes | Super Admin (create) / Institute Admin or Super Admin (others) |
| `/instituteAdmin/supervisors` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/supervisors/:supervisorId/submissions` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/candidates` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/candidates/:candidateId/submissions` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/calendarProcedures` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/hospitals` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/arabicProcedures` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/calendarProcedures/analysis/hospital` | Yes | Institute Admin or Super Admin |
| `/instituteAdmin/reports/*` | Yes | Institute Admin |
| `/instituteAdmin/reports/supervisors/submission-count` | Yes | Institute Admin |
| `/instituteAdmin/reports/candidates/submission-count` | Yes | Institute Admin |
| `/instituteAdmin/reports/calendar-procedures/hospital-analysis` | Yes | Institute Admin |
| `/instituteAdmin/reports/events/canceled/pdf` | Yes | Institute Admin |
| `/instituteAdmin/candidates/:candidateId/submissions` | Yes | Institute Admin |
| `/instituteAdmin/candidates/:candidateId/submissions/:submissionId` | Yes | Institute Admin |
| `/event/*` | Yes | Institute Admin or Super Admin (via `requireInstituteAdmin`) / Candidate (GET /candidate/points) |
| `/lecture` (GET) | Yes | Institute Admin or Super Admin (via `requireInstituteAdmin`) |
| `/lecture/*` (POST, PATCH, DELETE, GET by ID) | Yes | Super Admin only |
| `/journal` (GET) | Yes | Institute Admin or Super Admin (via `requireInstituteAdmin`) |
| `/journal/*` (POST, PATCH, DELETE, GET by ID) | Yes | Super Admin only |
| `/conf` (GET) | Yes | Institute Admin or Super Admin (via `requireInstituteAdmin`) |
| `/conf/*` (POST, PATCH, DELETE, GET by ID) | Yes | Super Admin only |
| `/supervisor/*` | Partial | Super Admin (POST, POST /resetPasswords) / Supervisor (GET /candidates) / No (GET, PUT, DELETE) |
| `/sub/*` | Partial | Super Admin (POST /postAllFromExternal, PATCH /updateStatusFromExternal) / Candidate (GET /candidate/stats, GET /candidate/submissions, GET /candidate/submissions/:id) / Supervisor (GET /supervisor/submissions, GET /supervisor/submissions/:id, GET /supervisor/candidates/:candidateId/submissions, PATCH /supervisor/submissions/:id/review) / Institute Admin (POST /submissions/:id/generateSurgicalNotes) / No (others) |
| `/sub/candidate/stats` | Yes | Candidate |
| `/sub/candidate/submissions` | Yes | Candidate |
| `/sub/supervisor/submissions` | Yes | Supervisor |
| `/sub/supervisor/submissions/:id` | Yes | Supervisor |
| `/sub/supervisor/submissions/:id/review` | Yes | Validator Supervisor only (canValidate: true) |
| `/sub/supervisor/candidates/:candidateId/submissions` | Yes | Supervisor |
| `/sub/submissions/:id/generateSurgicalNotes` | Yes | Institute Admin or Super Admin |
| `/supervisor/candidates` | Yes | Supervisor |
| `/cand/*` | Partial | Super Admin (POST /createCandsFromExternal, PATCH /:id/resetPassword) / No (others) |
| `/calSurg/*` | Partial | Super Admin (POST /postAllFromExternal) / No (GET) |
| `/diagnosis/*` | Partial | Super Admin (POST /post) / No (POST /postBulk, GET) |
| `/procCpt/*` | Partial | Super Admin (POST /postAllFromExternal, POST /upsert) / No (GET) |
| `/mainDiag/*` | Partial | Super Admin (POST) / No (GET, PUT, DELETE) |
| `/arabProc/*` | Partial | Super Admin (POST /createArabProc, POST /createArabProcFromExternal) / No (GET) |
| `/hospital/*` | Partial | Super Admin (POST /create) / No (GET, PUT, DELETE) |
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

7. **Response Format**: **ALL endpoints automatically wrap responses** in the standardized format with `status`, `statusCode`, `message`, and either `data` (success) or `error` (error) fields. See the [Response Format](#response-format) section for details.

---

## Frontend Integration Tips

### Response Parsing

**Always parse responses using the standardized format:**

```typescript
// Example: TypeScript/JavaScript response handling
const response = await fetch('/api/endpoint', options);
const json = await response.json();

// Check status field
if (json.status === "success") {
  // Access actual data from data field
  const actualData = json.data;
  // Use actualData (could be object, array, or primitive)
} else {
  // Handle error
  const errorDetails = json.error;
  console.error("Error:", json.statusCode, errorDetails);
}
```

**Key Points:**
- Always check `json.status === "success"` before accessing `json.data`
- The `data` field contains the actual response (object, array, or primitive)
- The `error` field contains error details when `status === "error"`
- The `statusCode` matches the HTTP status code
- The `message` field contains the HTTP reason phrase

### Token Management

1. **Token Storage**: JWT tokens are sent as httpOnly cookies automatically. No manual storage needed.

2. **Token Access**: Decode the JWT token from cookies to access `_id`, `email`, and `role` without additional API calls.

3. **Token Expiration**: 
   - **Access Token**: Expires based on `SERVER_TOKEN_EXPIRETIME` environment variable (default: 3600 seconds / 1 hour)
   - **Refresh Token**: Expires based on `SERVER_REFRESH_TOKEN_EXPIRETIME` environment variable (default: 604800 seconds / 7 days)
   - When a token expires, the backend **automatically clears** both `auth_token` and `refresh_token` cookies
   - The backend returns specific error codes: `TOKEN_EXPIRED` or `REFRESH_TOKEN_EXPIRED`
   - **Frontend must detect these error codes and clear Redux state, then redirect to login**

4. **Token Refresh**: 
   - Use the `/auth/refresh` endpoint to refresh an expired access token using a valid refresh token
   - If the refresh token is also expired, the user must log in again
   - Check the `exp` claim in the JWT to proactively refresh before expiration (optional)

5. **Cookie Handling**: Ensure `credentials: "include"` is set in fetch requests to send cookies:
   ```typescript
   fetch('/api/endpoint', {
     credentials: 'include',
     headers: {
       'Content-Type': 'application/json'
     }
   })
   ```

6. **Token Expiration Handling**:
   - When receiving a `401 Unauthorized` response, check for `code: "TOKEN_EXPIRED"` or `code: "REFRESH_TOKEN_EXPIRED"`
   - When these codes are detected, clear all frontend authentication state (Redux, localStorage, etc.)
   - Redirect the user to the login page
   - The backend has already cleared the cookies, so no manual cookie clearing is needed

### Error Handling

1. **Always check `status` field**: Use `json.status === "success"` to determine success
2. **HTTP Status Codes**: Check `json.statusCode` for specific error types:
   - `401`: Unauthorized - redirect to login
     - **Token Expired**: Check for `code: "TOKEN_EXPIRED"` or `code: "REFRESH_TOKEN_EXPIRED"` in the response
     - When token expiration is detected, clear all frontend auth state and redirect to login
     - The backend automatically clears cookies, so no manual cookie clearing is needed
   - `403`: Forbidden - insufficient permissions
   - `404`: Not Found - resource doesn't exist
   - `400`: Bad Request - validation errors (check `error` array)
   - `500`: Internal Server Error - server issue

3. **Token Expiration Detection**:
   ```typescript
   if (response.status === 401) {
     const error = await response.json();
     
     // Check for token expiration (these responses are NOT wrapped in standard format)
     if (error.code === "TOKEN_EXPIRED" || error.code === "REFRESH_TOKEN_EXPIRED") {
       // Clear Redux state
       dispatch(clearAuthState());
       
       // Clear local storage if used
       localStorage.clear();
       
       // Redirect to login
       window.location.href = '/login';
     }
   }
   ```

4. **Validation Errors**: When `statusCode === 400`, the `error` field contains an array of validation errors:
   ```typescript
   if (json.statusCode === 400) {
     json.error.forEach(err => {
       console.error(`${err.param}: ${err.msg}`);
     });
   }
   ```

### Role-Based UI

Use the `role` field from the decoded JWT token to conditionally render UI elements based on user permissions:
- `candidate`: Medical candidates
- `supervisor`: Supervisors  
- `superAdmin`: Super administrators (highest level)
- `instituteAdmin`: Institute administrators

### Example: Complete API Call

```typescript
async function fetchUserData() {
  try {
    const response = await fetch('http://localhost:3001/superAdmin', {
      method: 'GET',
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const json = await response.json();
    
    if (json.status === "success") {
      // Access data from json.data
      const superAdmins = json.data; // This is the array
      return superAdmins;
    } else {
      // Handle error
      throw new Error(json.error || json.message);
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```
