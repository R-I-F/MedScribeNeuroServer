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
   - [Super Admins](#super-admins-superadmin)
   - [Institute Admins](#institute-admins-instituteadmin)
   - [Clerks](#clerks-clerk)
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

**Rate Limit:** 
- Router-level: 50 requests per 15 minutes per user
- Application-level: Maximum 3 password change tokens per user per hour

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
- **Rate Limiting**: Two-layer protection:
  - Router-level: 50 requests per 15 minutes per authenticated user
  - Application-level: Maximum 3 password change tokens per user per hour (prevents token flooding)
- If rate limit is exceeded, the request silently fails (no error message to prevent email enumeration)

---

### Change Password
**PATCH** `/auth/changePassword`

**Authentication Required:** Yes (all user types)

**Rate Limit:** 50 requests per 15 minutes per user

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
- **Rate Limiting**: 50 requests per 15 minutes per authenticated user
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

**Rate Limit:** 
- Router-level: 50 requests per 15 minutes per IP address
- Application-level: Maximum 3 password reset tokens per user per hour

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
- **Rate Limiting**: Two-layer protection:
  - Router-level: 50 requests per 15 minutes per IP address (prevents rapid-fire abuse)
  - Application-level: Maximum 3 password reset tokens per user per hour (prevents token flooding per user)
- If rate limit is exceeded, the request silently fails (no error message to prevent email enumeration)

---

### Reset Password
**POST** `/auth/resetPassword`

**Authentication Required:** No (uses token from email)

**Rate Limit:** 50 requests per 15 minutes per IP address

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
- **Rate Limiting**: 50 requests per 15 minutes per IP address (prevents brute-force token attempts)
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

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

Active `/superAdmin` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user

**Note:** POST, PUT, and DELETE endpoints have been disabled/removed for security hardening.

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Super Admin
**POST** `/superAdmin`

**Status:** ⚠️ **TEMPORARILY DISABLED** (Security hardening)

**Note:** This endpoint has been temporarily disabled to reduce attack surface. Super Admin accounts should be created directly in the database by system administrators.

**Requires:** Super Admin authentication (when enabled)

**Rate Limit:** 50 requests per 15 minutes per user (when enabled)

**Description:**  
~~Creates a new Super Admin account. Only existing Super Admins can create new Super Admin accounts.~~ **Currently disabled for security reasons.**

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can create other Super Admin accounts
- The password is automatically hashed before being stored in the database
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Super Admins
**GET** `/superAdmin`

**Requires:** Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns a list of all Super Admins in the system.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can access this endpoint
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Super Admin by ID
**GET** `/superAdmin/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Super Admin UUID (must be a valid UUID format)

**Description:**  
Returns a specific Super Admin by ID.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "super admin ID is required.",
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
  "error": "Super admin not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can access this endpoint
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the Super Admin with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Update Super Admin
**PUT** `/superAdmin/:id`

**Status:** ❌ **REMOVED** (Security hardening)

**Note:** This endpoint has been removed to reduce attack surface. Super Admin accounts should be updated directly in the database by system administrators.

---

### Delete Super Admin
**DELETE** `/superAdmin/:id`

**Status:** ❌ **REMOVED** (Security hardening)

**Note:** This endpoint has been removed to reduce attack surface. Super Admin accounts should be deleted directly in the database by system administrators.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can create Institute Admins
- The password is automatically hashed before being stored in the database
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Institute Admins
**GET** `/instituteAdmin`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns a list of all Institute Admins in the system.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Institute Admin by ID
**GET** `/instituteAdmin/:id`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Institute Admin UUID (must be a valid UUID format)

**Description:**  
Returns a specific Institute Admin by ID.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "institute admin ID is required.",
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
  "error": "Institute admin not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the Institute Admin with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Update Institute Admin
**PUT** `/instituteAdmin/:id`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Institute Admin UUID (must be a valid UUID format)

**Description:**  
Updates an Institute Admin's information.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "institute admin ID is required.",
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
  "error": "Institute admin not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- If password is provided, it is automatically hashed before being stored
- Returns 404 if the Institute Admin with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Delete Institute Admin
**DELETE** `/instituteAdmin/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Institute Admin UUID (must be a valid UUID format)

**Description:**  
Deletes an Institute Admin from the system. Only Super Admins can delete Institute Admins.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "institute admin ID is required.",
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
  "error": "Institute admin not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete Institute Admins
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the Institute Admin with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Supervisors (Dashboard)
**GET** `/instituteAdmin/supervisors`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Supervisor Submissions (Dashboard)
**GET** `/instituteAdmin/supervisors/:supervisorId/submissions`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

### Get All Candidates (Dashboard)
**GET** `/instituteAdmin/candidates`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Candidate Submissions (Dashboard)
**GET** `/instituteAdmin/candidates/:candidateId/submissions`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

### Get Candidate Submission by ID (Dashboard)
**GET** `/instituteAdmin/candidates/:candidateId/submissions/:submissionId`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

### Get Calendar Procedures with Filters (Dashboard)
**GET** `/instituteAdmin/calendarProcedures`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Response (200 OK):****
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Hospitals (Dashboard)
**GET** `/instituteAdmin/hospitals`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Arabic Procedures (Dashboard)
**GET** `/instituteAdmin/arabicProcedures`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Hospital-Based Analysis Data (Dashboard)
**GET** `/instituteAdmin/calendarProcedures/analysis/hospital`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Institute Admins and Super Admins
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Clerks (`/clerk`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/clerk` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PUT/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Clerk
**POST** `/clerk`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Creates a new Clerk account. Only Super Admins and Institute Admins can create Clerk accounts.

**Request Body:**
```json
{
  "email": "clerk@example.com",
  "password": "Clerk123$",
  "fullName": "Clerk User",
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
    "email": "clerk@example.com",
    "fullName": "Clerk User",
    "phoneNum": "01000000000",
    "approved": true,
    "role": "clerk"
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
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can create Clerk accounts
- The password is automatically hashed before being stored in the database
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Clerks
**GET** `/clerk`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns a list of all Clerks in the system.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "clerk@example.com",
      "fullName": "Clerk User",
      "phoneNum": "+1234567890",
      "approved": true,
      "role": "clerk"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can access this endpoint
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Clerk by ID
**GET** `/clerk/:id`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Clerk UUID (must be a valid UUID format)

**Description:**  
Returns a specific Clerk by ID.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "clerk@example.com",
    "fullName": "Clerk User",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "clerk"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "clerk ID is required.",
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
  "error": "Clerk not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can access this endpoint
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the Clerk with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Update Clerk
**PUT** `/clerk/:id`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Clerk UUID (must be a valid UUID format)

**Description:**  
Updates a Clerk's information.

**Request Body:**
```json
{
  "fullName": "Updated Clerk User",
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
    "email": "clerk@example.com",
    "fullName": "Updated Clerk User",
    "phoneNum": "+9876543210",
    "approved": true,
    "role": "clerk"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "clerk ID is required.",
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
  "error": "Clerk not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can update Clerk accounts
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- If password is provided, it is automatically hashed before being stored
- Returns 404 if the Clerk with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Delete Clerk
**DELETE** `/clerk/:id`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Clerk UUID (must be a valid UUID format)

**Description:**  
Deletes a Clerk from the system. Only Super Admins and Institute Admins can delete Clerk accounts.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Clerk deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "clerk ID is required.",
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
  "error": "Clerk not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can delete Clerk accounts
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the Clerk with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

## Submissions (`/sub`)

### Rate Limiting
- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
}
```

---

### Create Submissions from External
**POST** `/sub/postAllFromExternal`

Creates submissions from external data source (Google Sheets).

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns statistics about the logged-in candidate's submissions. Accessible by candidates (for their own data), supervisors, institute admins, and super admins. Clerk role cannot access this endpoint.

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

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns all submissions for the logged-in candidate with all related data populated (diagnosis, procedures, supervisor, etc.). All ObjectId references are populated with their full document data. Accessible by candidates (for their own data), supervisors, institute admins, and super admins. Clerk role cannot access this endpoint.

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

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns a single submission by ID, verifying that it belongs to the logged-in candidate. Accessible by candidates (for their own data), supervisors, institute admins, and super admins. Clerk role cannot access this endpoint.

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
- **Rate Limiting**: 50 requests per 15 minutes per authenticated user
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

**Rate Limit:** 200 requests per 15 minutes per user

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

**Rate Limit:** 200 requests per 15 minutes per user

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

**Rate Limit:** 200 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**⚠️ STATUS: DISABLED** - This endpoint has been temporarily disabled for security/maintenance reasons.

**Authentication Required:** Yes (Institute Admin or Super Admin role)

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** ~~Generates comprehensive surgical notes for a submission using AI (Google Gemini). The endpoint takes a submission ID, populates all required fields, and uses AI to generate professional surgical notes based on the submission data.~~ **This endpoint is currently disabled and will return 404 Not Found.**

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (required): Submission UUID

**⚠️ Current Response (404 Not Found) - Endpoint Disabled:**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Route not found"
}
```

**Note:** This endpoint is currently disabled. Any attempt to access it will return 404 Not Found.

~~**Response (200 OK):**~~ *(Historical - Endpoint Disabled)*
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

~~**Error Response (400 Bad Request):**~~ *(Historical - Endpoint Disabled)*
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID must be a valid UUID",
      "path": "id",
      "location": "params"
    }
  ]
}
```

~~**Error Response (404 Not Found):**~~ *(Historical - Endpoint Disabled)*
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Submission not found"
}
```

~~**Error Response (403 Forbidden):**~~ *(Historical - Endpoint Disabled)*
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

~~**Error Response (500 Internal Server Error):**~~ *(Historical - Endpoint Disabled)*
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
- ⚠️ **This endpoint is currently DISABLED** and will return 404 Not Found if accessed
- The endpoint has been temporarily disabled for security/maintenance reasons
- ~~The submission must exist and have all required populated fields~~
- ~~The AI uses Google Gemini API (gemini-2.5-flash model by default)~~
- ~~Requires `GEMINI_API_KEY` environment variable to be configured~~
- ~~The generated surgical notes are comprehensive and include:~~
  - ~~Preoperative and postoperative diagnoses~~
  - ~~Procedure performed~~
  - ~~Surgeon and assistant information~~
  - ~~Detailed procedure description~~
  - ~~Findings~~
  - ~~Instruments and materials used~~
  - ~~Intraoperative events~~
  - ~~Postoperative plan~~
- **Current Behavior**: Returns 404 Not Found (route not registered)
- ~~Only Institute Admins and Super Admins can access this endpoint~~

---

### Delete Submission
**DELETE** `/sub/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

Deletes a submission from the system. The `id` parameter must be a valid UUID format. Only Super Admins can delete submissions.

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```

**URL Parameters:**
- `id` (required): Submission UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Submission deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Submission ID is required.",
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
  "error": "Unauthorized: Invalid or missing token"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
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
- Only Super Admins can delete submissions
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the submission with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

## Candidates (`/cand`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/cand` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get All Candidates
**GET** `/cand`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns all candidates in the system, ordered by creation date (newest first). This endpoint is accessible to Super Admins and Institute Admins.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": false,
      "role": "candidate",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can access this endpoint
- Results are ordered by creation date (newest first)
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Candidate by ID
**GET** `/cand/:id`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Candidate UUID (must be a valid UUID format)

**Description:**  
Returns a specific candidate by ID. This endpoint is accessible to Super Admins and Institute Admins.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "candidate@example.com",
    "fullName": "John Doe",
    "phoneNum": "+1234567890",
    "regNum": "REG123456",
    "nationality": "Egyptian",
    "rank": "professor",
    "regDeg": "msc",
    "approved": false,
    "role": "candidate",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Candidate ID is required.",
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins and Institute Admins can access this endpoint
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the candidate with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Create Candidates from External
**POST** `/cand/createCandsFromExternal`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Field Requirements:**
- `row` (optional): Row number to fetch from external source. If omitted, all rows are processed.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can create candidates from external sources
- The `row` parameter is optional; if omitted, all rows from the external source are processed
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Reset Candidate Password
**PATCH** `/cand/:id/resetPassword`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Candidate UUID (must be a valid UUID format)

**Description:**  
Resets a specific candidate's password to the default password (`MEDscrobe01$`). The `id` parameter must be a valid UUID format.

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
      "msg": "Candidate ID is required.",
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
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
- The password is automatically hashed before being stored in the database
- Only Super Admins can reset candidate passwords
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the candidate with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Delete Candidate
**DELETE** `/cand/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Candidate UUID (must be a valid UUID format)

**Description:**  
Deletes a candidate from the system. The `id` parameter must be a valid UUID format. Only Super Admins can delete candidates.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Candidate deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Candidate ID is required.",
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete candidates
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the candidate with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

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

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/supervisor` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PUT/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

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

**Requires:** Authentication (Supervisor role or higher)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns a list of all unique candidates supervised by the logged-in supervisor, including submission statistics for each candidate.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
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
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can create supervisors
- The password is automatically hashed before being stored in the database
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get All Supervisors
**GET** `/supervisor`

**Requires:** Authentication (Super Admin, Institute Admin, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns a list of all supervisors in the system. This endpoint is accessible to Super Admins, Institute Admins, Supervisors, and Candidates.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Accessible to Super Admins, Institute Admins, Supervisors, and Candidates
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Supervisor by ID
**GET** `/supervisor/:id`

**Requires:** Authentication (Super Admin, Institute Admin, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Supervisor UUID (must be a valid UUID format)

**Description:**  
Returns a specific supervisor by ID. This endpoint is accessible to Super Admins, Institute Admins, Supervisors, and Candidates.

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

**Requires:** Authentication (Super Admin, Institute Admin, or Supervisor)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Supervisor UUID (must be a valid UUID format)

**Description:**  
Updates a supervisor's information. This endpoint is accessible to Super Admins, Institute Admins, and Supervisors.

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

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Supervisor UUID (must be a valid UUID format)

**Description:**  
Deletes a supervisor from the system. Only Super Admins can delete supervisors.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "supervisor ID is required.",
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
  "error": "Supervisor not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete supervisors
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the supervisor with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Reset All Supervisor Passwords
**POST** `/supervisor/resetPasswords`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Resets all supervisor passwords to a default encrypted password. Only Super Admins can execute this operation.

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
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
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
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

## Calendar Surgery (`/calSurg`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/calSurg` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create CalSurg from External
**POST** `/calSurg/postAllFromExternal`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
```json
{
  "row": 46
}
```

**Field Requirements:**
- `row` (optional): Row number to fetch from external source. If omitted, all rows are processed.

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-01-15T10:00:00.000Z",
      "patientName": "John Doe",
      "patientDob": "1980-05-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "id": "hospital-uuid-123",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة"
      },
      "arabProc": {
        "id": "proc-uuid-456",
        "title": "مراجعة صمام اوميا",
        "numCode": "61070",
        "alphaCode": "VSHN"
      },
      "procDate": "2025-01-15T10:00:00.000Z",
      "google_uid": "unique-google-id",
      "formLink": "https://example.com/form",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** The `hospital` and `arabProc` fields are populated with full document data, not just IDs. Patient names are automatically sanitized.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get CalSurg by ID
**GET** `/calSurg/getById`

**Requires:** Authentication (Super Admin, Institute Admin, Clerk, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
```json
{
  "_id": "507f1f77bcf86cd799439011"
}
```

**Field Requirements:**
- `_id` (required): CalSurg UUID (must be a valid UUID format)

**Description:**  
Returns a specific calendar surgery record by ID. This endpoint is accessible to all authenticated users (Super Admin, Institute Admin, Clerk, Supervisor, and Candidate).

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-01-15T10:00:00.000Z",
    "patientName": "John Doe",
    "patientDob": "1980-05-15T00:00:00.000Z",
    "gender": "male",
    "hospital": {
      "id": "hospital-uuid-123",
      "engName": "Cairo University Hospital",
      "arabName": "مستشفى جامعة القاهرة"
    },
    "arabProc": {
      "id": "proc-uuid-456",
      "title": "مراجعة صمام اوميا",
      "numCode": "61070",
      "alphaCode": "VSHN"
    },
    "procDate": "2025-01-15T10:00:00.000Z",
    "google_uid": "unique-google-id",
    "formLink": "https://example.com/form",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Note:** The `hospital` and `arabProc` fields are populated with full document data, not just IDs.

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "_id is required and must be a valid ObjectId string",
      "path": "_id",
      "location": "body"
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
  "error": "CalSurg not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get All CalSurg with Filters
**GET** `/calSurg/getAll`

**Requires:** Authentication (Super Admin, Institute Admin, Clerk, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Query Parameters (all optional):**
- `startDate` (ISO 8601): Filter by start date (must be within last 2 years, not in future)
- `endDate` (ISO 8601): Filter by end date (must be within last 2 years, not in future)
- `month` (YYYY-MM format): Filter by month (must be within last 2 years, not in future)
- `year` (YYYY format): Filter by year (must be within last 2 years, not in future)
- `day` (ISO 8601): Filter by specific day (must be within last 2 years, not in future)

**Description:**  
Returns all calendar surgery records with optional date filtering. This endpoint is accessible to all authenticated users (Super Admin, Institute Admin, Clerk, Supervisor, and Candidate). Supports filtering by date ranges, month, year, or specific day.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "timeStamp": "2025-01-15T10:00:00.000Z",
      "patientName": "John Doe",
      "patientDob": "1980-05-15T00:00:00.000Z",
      "gender": "male",
      "hospital": {
        "id": "hospital-uuid-123",
        "engName": "Cairo University Hospital",
        "arabName": "مستشفى جامعة القاهرة"
      },
      "arabProc": {
        "id": "proc-uuid-456",
        "title": "مراجعة صمام اوميا",
        "numCode": "61070",
        "alphaCode": "VSHN"
      },
      "procDate": "2025-01-15T10:00:00.000Z",
      "google_uid": "unique-google-id",
      "formLink": "https://example.com/form",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

**Note:** The `hospital` and `arabProc` fields are populated with full document data, not just IDs.

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "startDate cannot be in the future",
      "path": "startDate",
      "location": "query"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Update CalSurg
**PATCH** `/calSurg/:id`

**Requires:** Authentication (Super Admin, Institute Admin, or Clerk)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): CalSurg UUID (must be a valid UUID format)

**Request Body (all fields optional):**
```json
{
  "timeStamp": "2025-01-15T10:00:00.000Z",
  "patientName": "John Doe",
  "patientDob": "1980-05-15T00:00:00.000Z",
  "gender": "male",
  "hospital": "hospital-uuid-123",
  "arabProc": "proc-uuid-456",
  "procDate": "2025-01-15T10:00:00.000Z",
  "google_uid": "unique-google-id",
  "formLink": "https://example.com/form"
}
```

**Field Requirements:**
- `timeStamp` (optional): Timestamp, ISO 8601 date string
- `patientName` (optional): Patient name, string, max 200 characters (automatically sanitized)
- `patientDob` (optional): Patient date of birth, ISO 8601 date string
- `gender` (optional): Gender, must be either "male" or "female"
- `hospital` (optional): Hospital UUID, must be a valid UUID format
- `arabProc` (optional): Arabic procedure UUID, must be a valid UUID format
- `procDate` (optional): Procedure date, ISO 8601 date string
- `google_uid` (optional): Google UID, string, max 200 characters
- `formLink` (optional): Form link URL, must be a valid URL format

**Note:** All fields are optional - you can update any subset of fields. The `patientName` is automatically sanitized.

**Description:**  
Updates a calendar surgery record in the system. The `id` parameter must be a valid UUID format. Only Super Admins, Institute Admins, and Clerks can update calendar surgery records.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "timeStamp": "2025-01-15T10:00:00.000Z",
    "patientName": "John Doe",
    "patientDob": "1980-05-15T00:00:00.000Z",
    "gender": "male",
    "hospital": {
      "id": "hospital-uuid-123",
      "engName": "Cairo University Hospital",
      "arabName": "مستشفى جامعة القاهرة"
    },
    "arabProc": {
      "id": "proc-uuid-456",
      "title": "مراجعة صمام اوميا",
      "numCode": "61070",
      "alphaCode": "VSHN"
    },
    "procDate": "2025-01-15T10:00:00.000Z",
    "google_uid": "unique-google-id",
    "formLink": "https://example.com/form",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T11:00:00.000Z"
  }
}
```

**Note:** The `hospital` and `arabProc` fields are populated with full document data, not just IDs.

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "calSurg ID is required.",
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
  "error": "CalSurg not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins, Institute Admins, and Clerks can update calendar surgery records
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the calendar surgery record with the specified ID does not exist
- All fields are optional - you can update any subset of fields
- The `patientName` is automatically sanitized before saving

---

### Delete CalSurg
**DELETE** `/calSurg/:id`

**Requires:** Authentication (Super Admin, Institute Admin, or Clerk)

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): CalSurg UUID (must be a valid UUID format)

**Description:**  
Deletes a calendar surgery record from the system. The `id` parameter must be a valid UUID format. Only Super Admins, Institute Admins, and Clerks can delete calendar surgery records.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "CalSurg deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "calSurg ID is required.",
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
  "error": "CalSurg not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins, Institute Admins, and Clerks can delete calendar surgery records
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the calendar surgery record with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

## Diagnosis (`/diagnosis`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See [Rate Limiting](#rate-limiting-1) section below for details.

### Rate Limiting

All `/diagnosis` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get All Diagnoses
**GET** `/diagnosis`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns all diagnoses in the system, ordered by creation date (newest first). This endpoint is protected and requires authentication as a Super Admin or Institute Admin.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "icdCode": "G93.1",
      "icdName": "anoxic brain damage",
      "neuroLogName": ["anoxic brain damage"],
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "icdCode": "G93.2",
      "icdName": "benign intracranial hypertension",
      "neuroLogName": ["benign intracranial hypertension"],
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Bulk Diagnoses
**POST** `/diagnosis/postBulk`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Update Diagnosis
**PATCH** `/diagnosis/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Diagnosis UUID (must be a valid UUID format)

**Request Body (all fields optional):**
```json
{
  "icdCode": "G93.1",
  "icdName": "Anoxic brain damage",
  "neuroLogName": ["Anoxic Brain Damage"]
}
```

**Field Requirements:**
- `icdCode` (optional): ICD code, string (will be normalized to uppercase)
- `icdName` (optional): ICD name, string (will be normalized to lowercase)
- `neuroLogName` (optional): Array of neuro log names, string array (will be normalized to lowercase)

**Note:** 
- All fields are optional - you can update any subset of fields
- The `neuroLogName` array values are automatically converted to lowercase
- The `icdCode` is automatically converted to uppercase
- The `icdName` is automatically converted to lowercase
- Duplicate checks are performed if `icdCode` or `icdName` are being updated

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "icdCode": "G93.1",
    "icdName": "anoxic brain damage",
    "neuroLogName": ["anoxic brain damage"],
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T15:00:00.000Z"
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
      "msg": "Diagnosis ID is required.",
      "path": "id",
      "location": "params"
    }
  ]
}
```

**Error Response (400 Bad Request - Duplicate):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Diagnosis with ICD code 'G93.1' already exists"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Diagnosis not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can update diagnoses
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the diagnosis with the specified ID does not exist
- If updating `icdCode` or `icdName`, the system checks for duplicates and prevents conflicts
- All string fields are automatically normalized (uppercase for `icdCode`, lowercase for `icdName` and `neuroLogName`)

---

### Delete Diagnosis
**DELETE** `/diagnosis/:id`

**Requires:** Super Admin authentication

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Diagnosis UUID (must be a valid UUID format)

**Description:**  
Deletes a diagnosis from the system. The `id` parameter must be a valid UUID format.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Diagnosis deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Diagnosis ID is required.",
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
  "error": "Diagnosis not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete diagnoses
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the diagnosis with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see [Rate Limiting](#rate-limiting-1) above)

---

## Procedure CPT (`/procCpt`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See [Rate Limiting](#rate-limiting) section below for details.

### Rate Limiting

All `/procCpt` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get All Procedure CPT Codes
**GET** `/procCpt`

**Requires:** Authentication (Super Admin or Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns all procedure CPT codes in the system, ordered by creation date (newest first). This endpoint is protected and requires authentication as a Super Admin or Institute Admin.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "numCode": "61783",
      "alphaCode": "A",
      "title": "Craniotomy for tumor resection",
      "description": "Procedure description",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create ProcCpt from External
**POST** `/procCpt/postAllFromExternal`

Creates procedure CPT codes from external data source.

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Delete Procedure CPT Code
**DELETE** `/procCpt/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): ProcCpt UUID (must be a valid UUID format)

**Description:**  
Deletes a procedure CPT code from the system. The `id` parameter must be a valid UUID format.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "ProcCpt deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "ProcCpt ID is required.",
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
  "error": "ProcCpt not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete procedure CPT codes
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the procedure CPT code with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see [Rate Limiting](#rate-limiting) above)

---

## Main Diagnosis (`/mainDiag`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/mainDiag` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PUT/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Main Diagnosis
**POST** `/mainDiag`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
```json
{
  "title": "cns tumors",
  "procsArray": ["61783", "61108-00"],
  "diagnosis": ["G93.1", "G93.2"]
}
```

**Field Requirements:**
- `title` (required): Main diagnosis title, string, max 200 characters
- `procsArray` (optional): Array of procedure numCodes (strings)
- `diagnosis` (optional): Array of diagnosis icdCodes (strings)

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "cns tumors",
    "procs": [
      {
        "id": "507f1f77bcf86cd799439012",
        "numCode": "61783",
        "alphaCode": "A",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "diagnosis": [
      {
        "id": "507f1f77bcf86cd799439014",
        "icdCode": "G93.1",
        "icdName": "Anoxic brain damage"
      }
    ],
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T14:00:00.000Z"
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
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data, not just IDs. The `title` is automatically converted to lowercase.

---

### Get All Main Diagnoses
**GET** `/mainDiag`

**Requires:** Authentication (Super Admin, Institute Admin, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns all main diagnoses in the system. This endpoint is accessible to all authenticated users (Super Admin, Institute Admin, Supervisor, and Candidate).

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "cns tumors",
      "procs": [
        {
          "id": "507f1f77bcf86cd799439012",
          "numCode": "61783",
          "alphaCode": "A",
          "title": "Procedure Title",
          "description": "Procedure description"
        }
      ],
      "diagnosis": [
        {
          "id": "507f1f77bcf86cd799439014",
          "icdCode": "G93.1",
          "icdName": "Anoxic brain damage"
        }
      ],
      "createdAt": "2025-12-01T14:00:00.000Z",
      "updatedAt": "2025-12-01T14:00:00.000Z"
    }
  ]
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data, not just IDs.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get Main Diagnosis by ID
**GET** `/mainDiag/:id`

**Requires:** Authentication (Super Admin, Institute Admin, Supervisor, or Candidate)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Main Diagnosis UUID (must be a valid UUID format)

**Description:**  
Returns a specific main diagnosis by ID. This endpoint is accessible to all authenticated users (Super Admin, Institute Admin, Supervisor, and Candidate).

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "cns tumors",
    "procs": [
      {
        "id": "507f1f77bcf86cd799439012",
        "numCode": "61783",
        "alphaCode": "A",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "diagnosis": [
      {
        "id": "507f1f77bcf86cd799439014",
        "icdCode": "G93.1",
        "icdName": "Anoxic brain damage"
      }
    ],
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T14:00:00.000Z"
  }
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data, not just IDs.

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "mainDiag ID is required.",
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
  "error": "MainDiag not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Update Main Diagnosis
**PUT** `/mainDiag/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Main Diagnosis UUID (must be a valid UUID format)

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

**Note:** The `procs` and `diagnosis` arrays are appended to existing values, not replaced. If a procedure or diagnosis already exists, it won't be duplicated. The `title` is automatically converted to lowercase.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "title": "updated title",
    "procs": [
      {
        "id": "507f1f77bcf86cd799439012",
        "numCode": "61783",
        "alphaCode": "A",
        "title": "Procedure Title",
        "description": "Procedure description"
      }
    ],
    "diagnosis": [
      {
        "id": "507f1f77bcf86cd799439014",
        "icdCode": "G93.1",
        "icdName": "Anoxic brain damage"
      }
    ],
    "createdAt": "2025-12-01T14:00:00.000Z",
    "updatedAt": "2025-12-01T15:00:00.000Z"
  }
}
```

**Note:** The `procs` and `diagnosis` fields are populated with full document data in the response.

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "mainDiag ID is required.",
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
  "error": "MainDiag not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Delete Main Diagnosis
**DELETE** `/mainDiag/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Main Diagnosis UUID (must be a valid UUID format)

**Description:**  
Deletes a main diagnosis from the system. The `id` parameter must be a valid UUID format.

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

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "mainDiag ID is required.",
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
  "error": "MainDiag not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete main diagnoses
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the main diagnosis with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

## Arabic Procedures (`/arabProc`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See [Rate Limiting](#rate-limiting) section below for details.

### Rate Limiting

All `/arabProc` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Get All Arab Procedures
**GET** `/arabProc/getAllArabProcs`

**Requires:** Authentication (Super Admin, Institute Admin, or Clerk)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Description:**  
Returns all Arabic procedures in the system. This endpoint is protected and requires authentication as a Super Admin, Institute Admin, or Clerk.

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Arab Procedure
**POST** `/arabProc/createArabProc`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Create Arab Procedure from External
**POST** `/arabProc/createArabProcFromExternal`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Delete Arab Procedure
**DELETE** `/arabProc/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): ArabProc UUID (must be a valid UUID format)

**Description:**  
Deletes an Arabic procedure from the system. The `id` parameter must be a valid UUID format.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "ArabProc deleted successfully"
  }
}
```

**Error Response (400 Bad Request - Invalid UUID):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "ArabProc ID is required.",
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
  "error": "ArabProc not found"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Notes:**
- Only Super Admins can delete Arabic procedures
- The `id` parameter is validated to ensure it's a valid UUID format before processing
- Returns 404 if the procedure with the specified ID does not exist
- All endpoints are protected with user-based rate limiting (see [Rate Limiting](#rate-limiting) above)

---

## Hospitals (`/hospital`)

All endpoints in this module are protected with **user-based rate limiting**. Rate limits are applied per authenticated user (identified by JWT token user ID), with IP address fallback for edge cases. See Rate Limiting section below for details.

### Rate Limiting

All `/hospital` endpoints are protected with user-based rate limiting:

- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Authentication

- **GET endpoints**: Require authentication (accessible to all authenticated users: candidates, clerks, supervisors, institute admins, super admins)
- **POST/DELETE endpoints**: Require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

---

### Get All Hospitals

**GET** `/hospital`

**Requires:** Authentication (all authenticated users)

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns all hospitals in the system, ordered by creation date (newest first). Accessible to all authenticated users (candidates, clerks, supervisors, institute admins, and super admins).

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
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "arabName": "مستشفى آخر",
      "engName": "Another Hospital",
      "location": {
        "long": 31.2002,
        "lat": 30.0445
      },
      "createdAt": "2025-12-01T13:00:00.000Z",
      "updatedAt": "2025-12-01T13:00:00.000Z"
    }
  ]
}
```

**Response Fields:**
- `_id` (string, required): Hospital UUID
- `arabName` (string, required): Arabic hospital name
- `engName` (string, required): English hospital name
- `location` (object, optional): Hospital coordinates
  - `long` (number, optional): Longitude (-180 to 180)
  - `lat` (number, optional): Latitude (-90 to 90)
- `createdAt` (string, optional): ISO 8601 timestamp
- `updatedAt` (string, optional): ISO 8601 timestamp

**Error Responses:**

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No token provided"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message"
}
```

---

### Get Hospital by ID

**GET** `/hospital/:id`

**Requires:** Authentication (all authenticated users)

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns a specific hospital by ID. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Hospital UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
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

**Error Responses:**

**Error Response (400 Bad Request - Validation Errors):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Hospital ID must be a valid UUID (or ObjectId for backward compatibility)",
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
  "error": "Unauthorized: No token provided"
}
```

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Hospital not found"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message"
}
```

---

### Create Hospital

**POST** `/hospital/create`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<superAdmin_token>
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

**Error Responses:**

**Error Response (400 Bad Request - Validation Errors):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "hospital name is required in arabic.",
      "path": "arabName",
      "location": "body"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message"
}
```

---

### Delete Hospital

**DELETE** `/hospital/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <superAdmin_token>
```
OR
```
Cookie: auth_token=<superAdmin_token>
```

**URL Parameters:**
- `id` (required): Hospital UUID (must be valid UUID format)

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Hospital deleted successfully"
  }
}
```

**Error Responses:**

**Error Response (400 Bad Request - Validation Errors):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Hospital ID must be a valid UUID (or ObjectId for backward compatibility)",
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

**Error Response (404 Not Found):**
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Not Found",
  "error": "Hospital not found"
}
```

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Error message"
}
```

**Notes:**
- Only Super Admins can create and delete hospitals
- All endpoints are protected with user-based rate limiting
- Hospital IDs must be valid UUIDs (or ObjectIds for backward compatibility with legacy data)

---

## Mailer (`/mailer`)

### Rate Limiting
- **POST endpoint**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

---

### Send Email
**POST** `/mailer/send`

**Authentication Required:** Yes (Institute Admin or Super Admin)

**Rate Limit:** 50 requests per 15 minutes per user

Allows Institute Admins and Super Admins to send emails through the system. The email can be sent as plain text, HTML, or both.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

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

**Request Body Fields:**
- `to` (required): Recipient email address (must be a valid email format)
- `subject` (required): Email subject line (must be a non-empty string)
- `text` (optional): Plain text email content (must be a string when provided)
- `html` (optional): HTML email content (must be a string when provided)
- `from` (optional): Sender email address (must be a valid email format when provided). If not provided, uses the default system email address.

**Validation Rules:**
- At least one of `text` or `html` must be provided (cannot be empty strings)
- All email addresses (`to` and optional `from`) must be valid email formats
- Subject must be a non-empty string

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "to": "recipient@example.com"
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
      "msg": "'to' must be a valid email address",
      "path": "to",
      "location": "body"
    }
  ]
}
```

**Error Response (400 Bad Request - Missing Content):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "Provide at least one of 'text' or 'html' in the request body.",
      "path": "",
      "location": "body"
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

**Error Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to send email"
}
```

**Notes:**
- Only Institute Admins and Super Admins can send emails
- Rate limiting: 50 requests per 15 minutes per authenticated user
- At least one of `text` or `html` must be provided (cannot both be empty)
- If `from` is not provided, the system uses the default email address from environment variables
- Email addresses are validated for proper format
- Subject is required and must be a non-empty string
- All validation errors are returned in a standardized format

---

## External Service (`/external`)

---

## Lectures (`/lecture`)

The Lectures module provides access to lecture data for Institute Admins to use when creating events.

### Rate Limiting
- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
}
```

---

### Authentication

- **Requires:** Supervisor authentication for `GET /lecture` and `GET /lecture/:id` endpoints
- Higher roles (Institute Admin, Super Admin) are also allowed via `requireSupervisor`
- **Note:** POST, PATCH, DELETE endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

---

### Get All Lectures

**GET** `/lecture`

**Requires:** Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns all lectures available in the system. This endpoint is accessible to supervisors and higher roles.

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
- `403 Forbidden`: User does not have `supervisor`, `instituteAdmin`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Lecture by ID

**GET** `/lecture/:id`

**Requires:** Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns a specific lecture by ID. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Lecture UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "lectureTitle": "1.2.1: Introduction to Neurosurgery",
    "google_uid": "lecture-001",
    "mainTopic": "neurosurgery basics",
    "level": "msc",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `supervisor`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Lecture not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Create Lecture

**POST** `/lecture`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Creates a new lecture in the system.

**Request Body:**
```json
{
  "lectureTitle": "1.2.1: Introduction to Neurosurgery",
  "google_uid": "lecture-001",
  "mainTopic": "neurosurgery basics",
  "level": "msc"
}
```

**Field Requirements:**
- `lectureTitle` (required): Title of the lecture
- `google_uid` (required): Google Sheets unique identifier
- `mainTopic` (required): Main topic of the lecture
- `level` (required): Level of the lecture - must be `"msc"` or `"md"`

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "lectureTitle": "1.2.1: Introduction to Neurosurgery",
    "google_uid": "lecture-001",
    "mainTopic": "neurosurgery basics",
    "level": "msc",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (missing required fields, invalid level value)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Update Lecture

**PATCH** `/lecture/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Updates an existing lecture. The `id` parameter must be a valid UUID format. All fields in the request body are optional.

**URL Parameters:**
- `id` (required): Lecture UUID

**Request Body:**
```json
{
  "lectureTitle": "1.2.1: Introduction to Neurosurgery (Updated)",
  "google_uid": "lecture-001-updated",
  "mainTopic": "neurosurgery basics updated",
  "level": "md"
}
```

**Field Requirements:**
- `lectureTitle` (optional): Title of the lecture
- `google_uid` (optional): Google Sheets unique identifier
- `mainTopic` (optional): Main topic of the lecture
- `level` (optional): Level of the lecture - must be `"msc"` or `"md"` if provided

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "lectureTitle": "1.2.1: Introduction to Neurosurgery (Updated)",
    "google_uid": "lecture-001-updated",
    "mainTopic": "neurosurgery basics updated",
    "level": "md",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format or invalid level value
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Lecture not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Delete Lecture

**DELETE** `/lecture/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Deletes a lecture from the system. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Lecture UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Lecture deleted successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Lecture not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Bulk Create Lectures from External

**POST** `/lecture/postBulk`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Bulk creates lectures from external data source (Google Sheets). The level (msc/md) is automatically detected from the data.

**Request Body:**
```json
{
  "spreadsheetName": "Lectures Spreadsheet",
  "sheetName": "Sheet1",
  "row": 1,
  "mainTopic": "neurosurgery basics"
}
```

**Field Requirements:**
- `spreadsheetName` (optional): Name of the Google Spreadsheet
- `sheetName` (optional): Name of the sheet within the spreadsheet
- `row` (optional): Row number to start from (must be a positive integer, minimum 1)
- `mainTopic` (required): Main topic for the lectures

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
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

**Error Responses:**
- `400 Bad Request`: Validation errors (missing mainTopic, invalid row number)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error or external data source error

---

## Journals (`/journal`)

The Journals module provides access to journal data for candidates and higher roles to use when creating events.

### Rate Limiting
- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
}
```

---

### Authentication

- **Requires:** Candidate authentication for `GET /journal` and `GET /journal/:id` endpoints
- Higher roles (Supervisor, Institute Admin, Super Admin) are also allowed via `requireCandidate`
- **Note:** POST, PATCH, DELETE endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

---

### Get All Journals

**GET** `/journal`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns all journals available in the system. This endpoint is accessible to candidates and higher roles.

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
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Journal by ID

**GET** `/journal/:id`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns a specific journal by ID. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Journal UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "journalTitle": "Neurosurgery Journal - Volume 1",
    "pdfLink": "https://example.com/journal1.pdf",
    "google_uid": "journal-001",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Journal not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Create Journal

**POST** `/journal`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Creates a new journal in the system.

**Request Body:**
```json
{
  "journalTitle": "Neurosurgery Journal - Volume 1",
  "pdfLink": "https://example.com/journal1.pdf",
  "google_uid": "journal-001"
}
```

**Field Requirements:**
- `journalTitle` (required): Title of the journal
- `pdfLink` (required): Link to the journal PDF (must be a valid URL)
- `google_uid` (required): Google Sheets unique identifier

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "journalTitle": "Neurosurgery Journal - Volume 1",
    "pdfLink": "https://example.com/journal1.pdf",
    "google_uid": "journal-001",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (missing required fields, invalid URL format)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Update Journal

**PATCH** `/journal/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Updates an existing journal. The `id` parameter must be a valid UUID format. All fields in the request body are optional.

**URL Parameters:**
- `id` (required): Journal UUID

**Request Body:**
```json
{
  "journalTitle": "Neurosurgery Journal - Volume 1 (Updated)",
  "pdfLink": "https://example.com/journal1-updated.pdf",
  "google_uid": "journal-001-updated"
}
```

**Field Requirements:**
- `journalTitle` (optional): Title of the journal
- `pdfLink` (optional): Link to the journal PDF (must be a valid URL if provided)
- `google_uid` (optional): Google Sheets unique identifier

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "journalTitle": "Neurosurgery Journal - Volume 1 (Updated)",
    "pdfLink": "https://example.com/journal1-updated.pdf",
    "google_uid": "journal-001-updated",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format or invalid URL format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Journal not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Delete Journal

**DELETE** `/journal/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Deletes a journal from the system. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Journal UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Journal deleted successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Journal not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Bulk Create Journals from External

**POST** `/journal/postBulk`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Bulk creates journals from external data source (Google Sheets).

**Request Body:**
```json
{
  "spreadsheetName": "Journals Spreadsheet",
  "sheetName": "Sheet1",
  "row": 1
}
```

**Field Requirements:**
- `spreadsheetName` (optional): Name of the Google Spreadsheet
- `sheetName` (optional): Name of the sheet within the spreadsheet
- `row` (optional): Row number to start from (must be a positive integer, minimum 1)

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
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

**Error Responses:**
- `400 Bad Request`: Validation errors (invalid row number)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error or external data source error

---

## Conferences (`/conf`)

The Conferences module provides access to conference data for candidates and higher roles to use when creating events.

### Rate Limiting
- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
}
```

---

### Authentication

- **Requires:** Candidate authentication for `GET /conf` and `GET /conf/:id` endpoints
- Higher roles (Supervisor, Institute Admin, Super Admin) are also allowed via `requireCandidate`
- **Note:** POST endpoint requires Institute Admin, Supervisor, Clerk, or Super Admin authentication
- **Note:** PATCH and DELETE endpoints require Super Admin authentication

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

---

### Get All Conferences

**GET** `/conf`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns all conferences available in the system. This endpoint is accessible to candidates and higher roles.

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
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Conference by ID

**GET** `/conf/:id`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns a specific conference by ID. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Conference UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "confTitle": "Annual Neurosurgery Conference 2024",
    "google_uid": "conf-001",
    "presenter": {
      "_id": "6905e9dc719e11e810a0453c",
      "fullName": "Dr. John Supervisor",
      "email": "supervisor@example.com"
    },
    "date": "2024-06-15T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Conference not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Create Conference

**POST** `/conf`

**Requires:** Institute Admin, Supervisor, Clerk, or Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Creates a new conference in the system.

**Request Body:**
```json
{
  "confTitle": "Annual Neurosurgery Conference 2024",
  "google_uid": "conf-001",
  "presenter": "6905e9dc719e11e810a0453c",
  "date": "2024-06-15T00:00:00.000Z"
}
```

**Field Requirements:**
- `confTitle` (required): Title of the conference
- `google_uid` (required): Google Sheets unique identifier
- `presenter` (required): Supervisor UUID (must be a valid UUID format)
- `date` (required): Date of the conference (must be a valid ISO 8601 date)

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "confTitle": "Annual Neurosurgery Conference 2024",
    "google_uid": "conf-001",
    "presenter": "6905e9dc719e11e810a0453c",
    "date": "2024-06-15T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors (missing required fields, invalid UUID format, invalid date format)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `instituteAdmin`, `supervisor`, `clerk`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Update Conference

**PATCH** `/conf/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Updates an existing conference. The `id` parameter must be a valid UUID format. All fields in the request body are optional.

**URL Parameters:**
- `id` (required): Conference UUID

**Request Body:**
```json
{
  "confTitle": "Annual Neurosurgery Conference 2024 (Updated)",
  "google_uid": "conf-001-updated",
  "presenter": "6905e9dc719e11e810a0453d",
  "date": "2024-07-15T00:00:00.000Z"
}
```

**Field Requirements:**
- `confTitle` (optional): Title of the conference
- `google_uid` (optional): Google Sheets unique identifier
- `presenter` (optional): Supervisor UUID (must be a valid UUID format if provided)
- `date` (optional): Date of the conference (must be a valid ISO 8601 date if provided)

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "confTitle": "Annual Neurosurgery Conference 2024 (Updated)",
    "google_uid": "conf-001-updated",
    "presenter": "6905e9dc719e11e810a0453d",
    "date": "2024-07-15T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format or invalid date format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Conference not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Delete Conference

**DELETE** `/conf/:id`

**Requires:** Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:**  
Deletes a conference from the system. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Conference UUID

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "message": "Conf deleted successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `superAdmin` role
- `404 Not Found`: Conference not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Events (`/event`)

The Events module allows **Institute Admins** to schedule lectures, journals, and conferences on a shared calendar, with associated presenters and candidate attendance.

**📋 Frontend Implementation Guide:** For comprehensive frontend requirements and implementation details, see `FRONTEND_EVENTS_CALENDAR_REQUIREMENTS.md`.

### Rate Limiting
- **GET endpoints**: 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests, please try again later."
}
```

---

### Authentication

- **Requires:** Authentication varies by endpoint:
  - **GET endpoints** (`GET /event`, `GET /event/:id`): Candidate, Supervisor, Clerk, Institute Admin, or Super Admin
  - **POST/PATCH/DELETE endpoints**: Clerk, Institute Admin, or Super Admin (varies by specific endpoint)
  - **Attendance management endpoints**: Conditional authorization based on role and event presenter
- Higher roles can access lower privilege endpoints by default (hierarchical access)

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

**Requires:** Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Requires:** Candidate, Supervisor, Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

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

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `clerk`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Event not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Event by ID

**GET** `/event/:id`

**Requires:** Candidate, Supervisor, Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns a specific event by ID with populated references. The `id` parameter must be a valid UUID format.

**URL Parameters:**
- `id` (required): Event UUID

**Response (200 OK):**
Same structure as a single item in the `GET /event` response.

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `clerk`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Event not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Attendance Management

The following endpoints allow managing candidate attendance for events with points tracking and flagging capabilities.

### Add Candidate to Attendance

**POST** `/event/:eventId/attendance/:candidateId`

**Requires:** Authentication (varies by role)

**Rate Limit:** 50 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**Rate Limit:** 50 requests per 15 minutes per user

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

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

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

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token, or no candidate ID found in token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Notes:**
- The candidate ID is automatically extracted from the JWT token
- Candidates, Supervisors, Institute Admins, and Super Admins can access this endpoint
- Returns 0 if the candidate has no event attendance records
- Points are calculated from all events where the candidate is in the attendance list

---

### Get Candidate Total Points by ID

**GET** `/event/candidate/:candidateId/points`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

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
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Candidate not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Bulk Import Attendance from External Spreadsheet

**POST** `/event/bulk-import-attendance`

**Requires:** Institute Admin or Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Requires:** Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

**Requires:** Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

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

### Rate Limiting
- **All endpoints**: 50 requests per 15 minutes per user

Rate limiting uses the authenticated user's ID from the JWT token. If no valid token is available, rate limiting falls back to IP address tracking.

**Rate Limit Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

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

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** Generates a PDF report showing submission count analysis for all supervisors, excluding any supervisor with the name "Tester_Supervisor" (case-insensitive matching).

**Query Parameters (optional):**
- `startDate` (ISO 8601): Filter submissions by start date. Must be a valid ISO 8601 date format.
- `endDate` (ISO 8601): Filter submissions by end date. Must be a valid ISO 8601 date format.

**Validation Rules:**
- If both `startDate` and `endDate` are provided, `endDate` must be greater than or equal to `startDate`
- Date format must be ISO 8601 (e.g., `2024-01-01T00:00:00.000Z`)

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

**400 Bad Request - Validation Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "startDate must be a valid ISO 8601 date",
      "path": "startDate",
      "location": "query"
    }
  ]
}
```

**400 Bad Request - Date Range Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "endDate must be greater than or equal to startDate",
      "path": "",
      "location": "query"
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
  "error": "Unauthorized: No token provided"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to generate PDF report: <error message>"
}
```

---

#### Candidates Submission Count Report
**GET** `/instituteAdmin/reports/candidates/submission-count`

**Requires:** Institute Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** Generates a PDF report showing submission count analysis for all candidates, excluding any candidate with email or fullName containing "tester" (case-insensitive).

**Query Parameters (optional):**
- `startDate` (ISO 8601): Filter submissions by start date. Must be a valid ISO 8601 date format.
- `endDate` (ISO 8601): Filter submissions by end date. Must be a valid ISO 8601 date format.

**Validation Rules:**
- If both `startDate` and `endDate` are provided, `endDate` must be greater than or equal to `startDate`
- Date format must be ISO 8601 (e.g., `2024-01-01T00:00:00.000Z`)

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

**400 Bad Request - Validation Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "startDate must be a valid ISO 8601 date",
      "path": "startDate",
      "location": "query"
    }
  ]
}
```

**400 Bad Request - Date Range Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "endDate must be greater than or equal to startDate",
      "path": "",
      "location": "query"
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
  "error": "Unauthorized: No token provided"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to generate PDF report: <error message>"
}
```

---

#### Calendar Procedures Hospital Analysis Report
**GET** `/instituteAdmin/reports/calendar-procedures/hospital-analysis`

**Requires:** Institute Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** Generates a PDF report showing hospital-based procedure analysis for calendar procedures. The report algorithmically determines which hospitals have procedures and generates sections for each.

**Query Parameters (optional):**
- `hospitalId` (UUID): Filter by specific hospital. Must be a valid UUID format.
- `month` (integer, 1-12): Filter by month. Must be an integer between 1 and 12.
- `year` (integer, 2000-2100): Filter by year. Must be an integer between 2000 and 2100.
- `startDate` (ISO 8601): Filter by start date. Must be a valid ISO 8601 date format.
- `endDate` (ISO 8601): Filter by end date. Must be a valid ISO 8601 date format.
- `groupBy` (`title` | `alphaCode`): Group procedures by title or alphaCode. Default: `title`. Must be either "title" or "alphaCode".

**Validation Rules:**
- `hospitalId` must be a valid UUID format
- `month` must be an integer between 1 and 12
- `year` must be an integer between 2000 and 2100
- Date format must be ISO 8601 (e.g., `2024-01-01T00:00:00.000Z`)
- If both `startDate` and `endDate` are provided, `endDate` must be greater than or equal to `startDate`
- `groupBy` must be either "title" or "alphaCode"

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

**400 Bad Request - Validation Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "hospitalId must be a valid UUID",
      "path": "hospitalId",
      "location": "query"
    }
  ]
}
```

**400 Bad Request - Invalid Month/Year:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "month must be an integer between 1 and 12",
      "path": "month",
      "location": "query"
    }
  ]
}
```

**400 Bad Request - Invalid groupBy:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "groupBy must be either 'title' or 'alphaCode'",
      "path": "groupBy",
      "location": "query"
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
  "error": "Unauthorized: No token provided"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to generate PDF report: <error message>"
}
```

**Notes:**
- Hospital matching is flexible (case-insensitive, handles variations in naming)
- If no procedures found, returns a PDF with a message indicating no data available
- The comparison between total procedures and total submissions is clearly stated
- All query parameters are validated before processing

---

#### Canceled Events Report
**GET** `/instituteAdmin/reports/events/canceled/pdf`

**Requires:** Institute Admin authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** Generates a PDF report containing **all events with `status = "canceled"`**, including key details (date/time, type, resource title + google UID, presenter, location, attendance count). Supports optional date filtering on `event.dateTime`.

**Query Parameters (optional):**
- `startDate` (ISO 8601): Include events with `dateTime >= startDate`. Must be a valid ISO 8601 date format.
- `endDate` (ISO 8601): Include events with `dateTime <= endDate`. Must be a valid ISO 8601 date format.

**Validation Rules:**
- Date format must be ISO 8601 (e.g., `2024-01-01T00:00:00.000Z`)
- If both `startDate` and `endDate` are provided, `endDate` must be greater than or equal to `startDate`

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

**400 Bad Request - Validation Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "startDate must be a valid ISO 8601 date",
      "path": "startDate",
      "location": "query"
    }
  ]
}
```

**400 Bad Request - Date Range Error:**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "endDate must be greater than or equal to startDate",
      "path": "",
      "location": "query"
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
  "error": "Unauthorized: No token provided"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden",
  "error": "Forbidden: Insufficient permissions"
}
```

**429 Too Many Requests:**
```json
{
  "status": "error",
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too many requests from this user, please try again later."
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal Server Error",
  "error": "Failed to generate PDF report: <error message>"
}
```

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
| `/instituteAdmin/*` | Yes | Super Admin (POST /, DELETE /:id) / Institute Admin or Super Admin (GET /, GET /:id, PUT /:id, dashboard endpoints) |
| `/clerk/*` | Yes | Super Admin or Institute Admin (all endpoints) |
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
| `/event` (GET) | Yes | Candidate, Supervisor, Clerk, Institute Admin, or Super Admin |
| `/event/:id` (GET) | Yes | Candidate, Supervisor, Clerk, Institute Admin, or Super Admin |
| `/event` (POST) | Yes | Clerk, Institute Admin, or Super Admin |
| `/event/:id` (PATCH) | Yes | Clerk, Institute Admin, or Super Admin |
| `/event/:id` (DELETE) | Yes | Clerk, Institute Admin, or Super Admin |
| `/event/bulk-import-attendance` (POST) | Yes | Institute Admin or Super Admin |
| `/event/candidate/points` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin |
| `/event/candidate/:candidateId/points` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin |
| `/event/:eventId/attendance/:candidateId` (POST) | Yes | Conditional (Candidate self, Institute Admin, Super Admin, Supervisor if presenter) |
| `/event/:eventId/attendance/:candidateId` (DELETE) | Yes | Conditional (Institute Admin, Super Admin, Supervisor if presenter) |
| `/event/:eventId/attendance/:candidateId/flag` (PATCH) | Yes | Conditional (Institute Admin, Super Admin, Supervisor if presenter) |
| `/event/:eventId/attendance/:candidateId/unflag` (PATCH) | Yes | Conditional (Institute Admin, Super Admin, Supervisor if presenter) |
| `/lecture` (GET) | Yes | Supervisor, Institute Admin, or Super Admin (via `requireSupervisor`) |
| `/lecture/:id` (GET) | Yes | Supervisor, Institute Admin, or Super Admin (via `requireSupervisor`) |
| `/lecture` (POST) | Yes | Super Admin only |
| `/lecture/:id` (PATCH) | Yes | Super Admin only |
| `/lecture/:id` (DELETE) | Yes | Super Admin only |
| `/lecture/postBulk` (POST) | Yes | Super Admin only |
| `/journal` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin (via `requireCandidate`) |
| `/journal/:id` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin (via `requireCandidate`) |
| `/journal` (POST) | Yes | Super Admin only |
| `/journal/:id` (PATCH) | Yes | Super Admin only |
| `/journal/:id` (DELETE) | Yes | Super Admin only |
| `/journal/postBulk` (POST) | Yes | Super Admin only |
| `/conf` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin (via `requireCandidate`) |
| `/conf/:id` (GET) | Yes | Candidate, Supervisor, Institute Admin, or Super Admin (via `requireCandidate`) |
| `/conf` (POST) | Yes | Institute Admin, Supervisor, Clerk, or Super Admin |
| `/conf/:id` (PATCH) | Yes | Super Admin only |
| `/conf/:id` (DELETE) | Yes | Super Admin only |
| `/supervisor/*` | Yes | Super Admin (POST /, POST /resetPasswords, DELETE /:id) / Super Admin, Institute Admin, Supervisor, Candidate (GET /, GET /:id) / Super Admin, Institute Admin, Supervisor (PUT /:id) / Supervisor (GET /candidates) |
| `/sub/*` | Yes | Super Admin (POST /postAllFromExternal, PATCH /updateStatusFromExternal, DELETE /:id) / Candidate, Supervisor, Institute Admin, Super Admin (GET /candidate/stats, GET /candidate/submissions, GET /candidate/submissions/:id) / Supervisor (GET /supervisor/submissions, GET /supervisor/submissions/:id, GET /supervisor/candidates/:candidateId/submissions, PATCH /supervisor/submissions/:id/review) |
| `/sub/candidate/stats` | Yes | Candidate, Supervisor, Institute Admin, or Super Admin |
| `/sub/candidate/submissions` | Yes | Candidate, Supervisor, Institute Admin, or Super Admin |
| `/sub/candidate/submissions/:id` | Yes | Candidate, Supervisor, Institute Admin, or Super Admin |
| `/sub/supervisor/submissions` | Yes | Supervisor |
| `/sub/supervisor/submissions/:id` | Yes | Supervisor |
| `/sub/supervisor/submissions/:id/review` | Yes | Validator Supervisor only (canValidate: true) |
| `/sub/supervisor/candidates/:candidateId/submissions` | Yes | Supervisor |
| `/sub/submissions/:id/generateSurgicalNotes` | ⚠️ DISABLED | ~~Institute Admin or Super Admin~~ (Endpoint disabled) |
| `/sub/:id` (DELETE) | Yes | Super Admin |
| `/supervisor/candidates` | Yes | Supervisor |
| `/cand/*` | Partial | Super Admin or Institute Admin (GET /, GET /:id) / Super Admin (POST /createCandsFromExternal, PATCH /:id/resetPassword, DELETE /:id) |
| `/calSurg/*` | Partial | Super Admin, Institute Admin, Clerk, Supervisor, or Candidate (GET /getById, GET /getAll) / Super Admin, Institute Admin, or Clerk (PATCH /:id, DELETE /:id) / Super Admin (POST /postAllFromExternal) |
| `/diagnosis/*` | Partial | Super Admin or Institute Admin (GET /) / Super Admin (POST /postBulk, POST /post, PATCH /:id, DELETE /:id) |
| `/procCpt/*` | Partial | Super Admin or Institute Admin (GET /) / Super Admin (POST /postAllFromExternal, POST /upsert, DELETE /:id) |
| `/mainDiag/*` | Partial | Super Admin, Institute Admin, Supervisor, or Candidate (GET /, GET /:id) / Super Admin (POST, PUT /:id, DELETE /:id) |
| `/arabProc/*` | Partial | Super Admin, Institute Admin, or Clerk (GET /getAllArabProcs) / Super Admin (POST /createArabProc, POST /createArabProcFromExternal, DELETE /:id) |
| `/hospital/*` | Partial | Super Admin (POST /create) / No (GET, PUT, DELETE) |
| `/mailer/*` | Yes | Institute Admin or Super Admin |
| `/mailer/send` | Yes | Institute Admin or Super Admin |
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
