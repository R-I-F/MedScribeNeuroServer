# MedScribe Neuro Server API Documentation

**Base URL**: `http://localhost:3001` (or your configured server URL)

**🏥 SINGLE-INSTITUTION ARCHITECTURE:** This API serves exactly **one institution** (Kasr Al Ainy / Cairo University — the "KA spoke"). The legacy multi-tenant machinery (institution selection, per-institution databases, the `X-Institution-Id` header, `institutionId` in request bodies and JWTs) has been **removed**. The frontend fetches the institution's identity and feature flags once from **`GET /institution`**. Data visibility inside the institution is scoped by **department** — see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

**🆔 IDs and database:** All entity IDs in the API are **UUIDs** (strings). The backend uses **PostgreSQL** with **TypeORM**. Reference data (departments, main diagnoses, diagnoses, CPT procedures, lectures, equipment, consumables) is a **read-only mirror** synced from the central Reference API ("hub") and cannot be written through this API.

---
## Health and security (bots / scanners)

**Health check:** Use **GET /health** for load balancer and Kubernetes probes. It returns `200` with `{ "status": "ok" }` and is rate-limited (60 requests per 15 minutes per IP). Do **not** use GET / or POST / for health checks; those paths are unhandled and return **404**.

**Bot and scanner mitigation:** The server uses best practices to limit abuse: (1) **GET /health** only for probes; unknown paths (e.g. GET /, POST /) return 404 so bots don’t get 200. (2) **Global IP rate limit** (400 requests per 15 minutes per IP) to throttle scanners. (3) **Security headers** (Helmet) and **body size limit** (500kb) to reduce DoS. (4) **404 responses** are logged briefly without stack traces; only a generic "Not Found" message is returned. Configure your LB/ingress to use **GET /health** as the health check path.

---

## Load testing

A JMeter test plan and scripts are provided to load-test the candidate dashboard and login flow (e.g. 100 concurrent candidates: landing, login, dashboard GETs). **Prerequisites:** Apache JMeter 5.x installed; optional: set `JMETER_HOME` or add JMeter `bin` to PATH. From the project root:

- **Run test:** `.\scripts\jmeter\run-login-test.ps1` — runs the test in non-GUI mode and writes `scripts/jmeter/results.jtl`. See `scripts/jmeter/README.md` for prerequisites (e.g. seeded test candidates, server running, host/port in the test plan).
- **Generate HTML report:** After the test, run `.\scripts\jmeter\generate-report.ps1` — generates the dashboard from `results.jtl` into `scripts/jmeter/report/`. Open `scripts/jmeter/report/index.html` in a browser.

Results file: `scripts/jmeter/results.jtl`. For full details (JMETER_HOME, CSV credentials, User Defined Variables), see [scripts/jmeter/README.md](./scripts/jmeter/README.md).

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
    "id": "550e8400-e29b-41d4-a716-446655440000",
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
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user1@example.com"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "email": "user2@example.com"
    }
  ]
}
```
**Note:** Entity identifiers in the API are UUIDs. Responses use the `id` field; some legacy examples may show `_id`, which should be treated as the same UUID.

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
    "_id": "507f1f77bcf86cd799439011",
    "departmentId": "c9a1..."
  }
}
```

**Note:** The `departmentId` claim is present only when the user is assigned to a department. There is no `institutionId` claim (single-institution server).

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

## Single-Institution Architecture & Department Scoping

### Overview

The server is the **KA spoke**: one institution, one database. There is no institution selection and no institution routing anywhere in the API surface:

- **`GET /institution`** (public) returns the single institution's identity and feature flags (`isAcademic`, `isPractical`, `isClinical`).
- Login and registration bodies do **not** take `institutionId` (if sent, it is ignored).
- JWTs do **not** carry an `institutionId` claim (old tokens that still have one keep working — the claim is ignored).
- The `X-Institution-Id` header is ignored.

### JWT Tokens

JWT payloads carry `email`, `role`, `id`/`_id` (the user's UUID), and — when the user is assigned to a department — a **`departmentId`** claim that drives department-scoped reads (candidates and supervisors always have one; clerks and institute admins may; super admins never do). There is no `institutionId` claim. Full payload details: [JWT Token Structure](#jwt-token-structure) in the Authentication section.

Tokens are delivered as **httpOnly cookies** (`auth_token`, `refresh_token`). The server prefers the `auth_token` **cookie** over the `Authorization: Bearer` header when both are present. When a user switches department via their profile-update endpoint, the server re-signs both tokens and re-sets both cookies with the new claim.

### Department Scoping

The institution hosts **15 departments** (NS, CTS, GS, HBP, MFS, OBGYN, OPHTHAL, ORTHO, ENT, PEDSURG, PRS, SOC, TRS, UROL, VASC). Public list: **`GET /departments`**.

Department-scoped reads resolve the effective department from:

1. the JWT `departmentId` claim and/or an explicit **`?deptCode=<CODE>`** query override (case-insensitive; unknown code → 404, malformed → 400 on reference reads),
2. falling back to the default department **NS** (legacy behavior for sessions without a department claim).

**Department-scoped endpoints include:** reference reads (`/mainDiag`, `/diagnosis`, `/procCpt`, `/lecture`, `/equipment`, `/consumables`, the `/references` bundle), calendar surgeries (`/calSurg/getAll` family, `/calSurg/dashboard`, `/calSurg/clerkProcs`, and creation stamping), the supervisors list (`GET /supervisor`), events (`GET /event`, `GET /event/dashboard`, creation stamping), rankings (`GET /sub/submissionRanking`, `GET /event/academicRanking`), and the institute-admin dashboard reads (scoped by the **admin's own DB-row department**; a NULL department = institution-wide admin).

Institute-admin "by-id" reads (candidate dashboard/report/submissions, supervisor submissions/report) reject cross-department targets with 404.

---

## Disabled, Gated & Removed Routes

### Disabled routes (registered, always return `410 Gone`)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/auth/get/all` | Returned all users; unauthenticated. |
| POST | `/auth/resetCandPass` | Bulk reset candidate passwords. |
| POST | `/cand/createCandsFromExternal` | Create candidates from external source. |
| POST | `/mailer/send` | Caller-controlled email send; disabled in the 2026-07 security audit (phishing vector). |

**Response when calling a disabled route:** `410 Gone` with body `{ "error": "This endpoint is disabled.", "code": "ENDPOINT_DISABLED", "reference": "docs/DISABLED_ROUTES.md" }`.

### Migration-key-gated routes (operator import tooling)

These require the **`X-Migration-Key`** header matching the `MIGRATION_API_KEY` env var (constant-time compare). When the env var is **unset** (the production default) they fail closed with **503**; a wrong key returns **401**. They are IP rate-limited (50 / 15 min).

| Method | Path |
|--------|------|
| POST | `/sub/postAllFromExternal` |
| PATCH | `/sub/updateStatusFromExternal` |
| POST | `/calSurg/postAllFromExternal` |
| GET | `/external` |

### Environment-gated routes

| Method | Path | Gate |
|--------|------|------|
| POST | `/auth/superAdmin/login` | Allowed when `NODE_ENV` is `development`/`staging`, and in production only when `SUPERADMIN_LOGIN_ENABLED=true`; otherwise `403`. Dedicated limiter 10/15min per IP. |
| POST | `/supervisor/resetPasswords` | Allowed only when `NODE_ENV` is `development`/`staging`; production → `410` (mass supervisor password reset). |

### Removed routes (no longer registered — plain 404)

| Route(s) | Replacement / reason |
|----------|----------------------|
| `GET /institutions` | `GET /institution` (single institution) |
| `/arabProc/*` (all routes) | Retired; calendar surgeries use `procCpt` + free-text `procedureText` |
| `DELETE /hospital/:id` | Hospitals are add/edit only (referenced by surgery history) |
| `POST /superAdmin`, `PUT /superAdmin/:id`, `DELETE /superAdmin/:id` | Security hardening; super admins are provisioned DB-side |
| Reference-data writes (`POST`/`PUT`/`PATCH`/`DELETE`) on `/mainDiag`, `/diagnosis`, `/procCpt`, `/lecture`, `/positions`, `/approaches`, `/regions` | Reference data is a read-only hub mirror |
| `GET /positions`, `GET /approaches`, `GET /regions` (standalone) | Served inside the `GET /references` bundle |
| `/additionalQuestions/*` (legacy six-flag module) | `GET /mainDiag/:mainDiagId/questions` (scaled framework) |
| `GET /instituteAdmin/arabicProcedures` | Retired with arabProc |
| `POST /sub/submissions/:id/generateSurgicalNotes` | Removed (the voice variant remains) |

---

## Table of Contents

1. [Disabled, Gated & Removed Routes](#disabled-gated--removed-routes)
2. [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping)
3. [Institution & Departments](#institution--departments)
4. [Authentication](#authentication)
5. [User Management](#user-management)
   - [Super Admins](#super-admins-superadmin)
   - [Institute Admins](#institute-admins-instituteadmin)
   - [Clerks](#clerks-clerk)
6. [Submissions](#submissions-sub)
7. [Clinical Submissions](#clinical-submissions-clinicalsub)
8. [Activity Timeline](#activity-timeline-activitytimeline)
9. [Candidates](#candidates-cand)
10. [Supervisors](#supervisors-supervisor)
11. [Calendar Surgery](#calendar-surgery-calsurg)
12. [Diagnosis — read-only](#diagnosis-diagnosis)
13. [Procedure CPT — read-only](#procedure-cpt-proccpt)
14. [Main Diagnosis — read-only](#main-diagnosis-maindiag)
15. [Additional Questions](#additional-questions-additionalquestions)
16. [Consumables — read-only](#consumables-consumables)
17. [Equipment — read-only](#equipment-equipment)
18. [Positions / Approaches / Regions](#positions-positions)
19. [References](#references-references)
20. [Candidate Dashboard](#candidate-dashboard-candidate-dashboard)
21. [Hospitals](#hospitals-hospital)
22. [Demo Requests](#demo-requests-demorequest)
23. [Mailer — disabled](#mailer-mailer)
23. [External Service](#external-service-external)
24. [Lectures — read-only](#lectures-lecture)
25. [Journals](#journals-journal)
26. [Conferences](#conferences-conf)
27. [Events](#events-event)
28. [WhatsApp Bot](#whatsapp-bot-wabot)
29. [Admin / Hub Webhook](#admin--hub-webhook-adminref-resync)
30. [PDF Report Generation Endpoints](#pdf-report-generation-endpoints)
31. [Active Users Analytics](#active-users-analytics-activeusers)
32. [Error Responses](#error-responses)
33. [Authentication Requirements Summary](#authentication-requirements-summary)
34. [Load testing](#load-testing)

---

## Institution & Departments

### Get the Institution
**GET** `/institution`

**Status:** ✅ **PUBLIC ENDPOINT** (no authentication) · **Rate Limit:** 200 requests per 15 minutes per IP

Returns the single institution's identity and feature flags. The frontend fetches this once at bootstrap to gate academic/practical/clinical UI. Replaces the retired multi-tenant `GET /institutions`.

**Response (200 OK)** — standard wrapper; `data` contains:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "cairo-university",
  "name": "Kasr El Ainy / Cairo University",
  "department": "neurosurgery",
  "isAcademic": true,
  "isPractical": true,
  "isClinical": true,
  "signupsOpen": true
}
```

`signupsOpen` is derived live from the Active-Users cap (see [Active Users Analytics](#active-users-analytics-activeusers)): it is `false` when the rolling quarterly distinct active-users count meets or exceeds the configured `maxActiveUsers`, and `true` otherwise (or when no cap is set). It is computed fail-open (any internal error yields `true`), and only the boolean is exposed here (never the count or cap). The public signup pages use it to show a "registrations closed" state.

### Get All Departments
**GET** `/departments`

**Status:** ✅ **PUBLIC ENDPOINT** (no authentication) · **Rate Limit:** 200 requests per 15 minutes per IP

Lists the 15 mirrored departments. Used by the signup department pickers and as the source of valid `?deptCode` values.

**Response (200 OK):** array of:
```json
{
  "id": "uuid",
  "code": "NS",
  "name": "Neurosurgery",
  "arName": "جراحة المخ والأعصاب",
  "isAcademic": true,
  "isPractical": true
}
```

---
## Authentication

### JWT Token Structure

Access-token payload:
```json
{
  "email": "user@example.com",
  "role": "candidate" | "supervisor" | "superAdmin" | "instituteAdmin" | "clerk",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "_id": "550e8400-e29b-41d4-a716-446655440000",
  "departmentId": "uuid — present only when the user has a department"
}
```

**Important Notes:**
- `id` / `_id`: the user's UUID (same value; `_id` kept for backward compatibility). Use it directly in API calls.
- `departmentId`: drives department-scoped reads. A fresh token (and fresh cookies) is issued when a user switches department via their profile-update endpoint.
- There is **no** `institutionId` claim (single-institution server). Stale tokens carrying one keep working — the claim is ignored.
- The refresh token carries the same fields plus `type: "refresh"`.

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
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "_id": "550e8400-e29b-41d4-a716-446655440000",
    "departmentId": "c9a1..."
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

Four isolated role logins. All of them:

- take **only** `{ "email", "password" }` — `institutionId` is retired (accepted and ignored if an old client still sends it);
- are protected by the **strict IP rate limiter** (50 requests / 15 min per IP) — added in the 2026-07 security audit;
- set the JWT as **httpOnly cookies** (`auth_token` + `refresh_token`) and also return `token` in the body **for testing purposes only**;
- return a trimmed `user` object (no `google_uid`, `createdAt`, `updatedAt`, never a password hash) that includes **`departmentId`** when the user is assigned to a department (the JWT then carries the same claim).

#### Login (Candidate & Supervisor)
**POST** `/auth/login`

Shared login endpoint for candidates and supervisors. The system automatically detects whether the credentials belong to a candidate or a supervisor.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK) - Candidate:**
`data` also includes top-level `regDeg` and `rank` (duplicating the values inside `user` for convenience).
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "phoneNum": "+1234567890",
      "regNum": "REG123456",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": false,
      "departmentId": "c9a1...",
      "role": "candidate"
    },
    "role": "candidate",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "regDeg": "msc",
    "rank": "professor"
  }
}
```

**Response (200 OK) - Supervisor:**
`data` also includes top-level `position`.
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "supervisor@example.com",
      "fullName": "Dr. Jane Smith",
      "phoneNum": "+1234567890",
      "approved": true,
      "canValidate": true,
      "departmentId": "c9a1...",
      "position": "professor",
      "role": "supervisor"
    },
    "role": "supervisor",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "position": "professor"
  }
}
```

**Error Responses:**

**401 Unauthorized - Invalid Credentials:**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: Invalid credentials"
}
```

**429 Too Many Requests:** strict IP rate limit exceeded.

**Notes:**
- This endpoint only accepts candidate and supervisor credentials. Admins and clerks must use their isolated login endpoints below.

#### Super Admin Login
**POST** `/auth/superAdmin/login`

**⚠️ ENVIRONMENT-GATED (fail-closed):** allowed when `NODE_ENV` is `development` or `staging`, and in production ONLY when `SUPERADMIN_LOGIN_ENABLED=true`. Otherwise (production without the flag, or a missing/unknown environment without the flag) the route returns **403** `"Super Admin login is disabled in this environment"`. The flag can be unset to disable instantly without a redeploy. Rate limit: dedicated `superAdminLoginRateLimiter` (10 requests / 15 min per IP). See `docs/SUPERADMIN_PRODUCTION_ENABLEMENT_PLAN.md`.

**Request Body:** `{ "email", "password" }`

**Response (200 OK):** `data` = `{ user, role: "superAdmin", token }` (cookies set as usual). **401** on invalid credentials.

#### Institute Admin Login
**POST** `/auth/instituteAdmin/login`

**Request Body:** `{ "email", "password" }`

**Response (200 OK):** `data` = `{ user, role: "instituteAdmin", token }`. The `user` (and JWT claim) include `departmentId` when the admin is department-scoped; a NULL department means an institution-wide admin. **401** on invalid credentials.

#### Clerk Login
**POST** `/auth/clerk/login`

**Request Body:** `{ "email", "password" }`

**Response (200 OK):** `data` = `{ user, role: "clerk", token }`. The clerk's `departmentId` (when assigned) becomes the JWT claim that scopes calendar-surgery reads and the procedure typeahead. **401** on invalid credentials.

---

### Register Candidate (OTP-verified)
**POST** `/auth/registerCand`

**Rate Limit:** strict, 50 requests / 15 min per IP

Registration is **staged**: this endpoint does **NOT** create the account. It stages the signup (password already bcrypt-hashed at rest) and emails a **6-digit verification code**. The real candidate row is created only by [`POST /auth/verifySignupOtp`](#verify-signup-otp).

**Defaults (set by server):** `role: "candidate"`, `approved: false`, `termsAcceptedAt: now`.

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
  "regDeg": "msc",
  "departmentId": "c9a1..."
}
```

**Request Body Fields:**
- `email` (string, required) · `password` (string, required, ≥8 chars) · `fullName` (string, required) · `phoneNum` (string, required) · `regNum` (string, required) · `nationality` (string, required) · `rank` (string, required)
- `regDeg` (string, optional): one of `msc`, `doctor of medicine (md)`, `egyptian fellowship`, `self registration`, `other`.
- `departmentId` (string UUID, **required**): the candidate's department — pick from public `GET /departments`. Unknown ids are rejected.

**Response (201 Created):**
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": {
    "signupId": "uuid",
    "expiresAt": "2026-07-22T12:15:00.000Z",
    "email": "candidate@example.com"
  }
}
```

**Response (409 Conflict):** the email already belongs to an existing account.

**Response (403 Forbidden):** `{ "error": "Registrations are currently closed. Please check back later." }`. New signups are closed because the rolling quarterly active-users count has reached the configured cap (see [Active Users Analytics](#active-users-analytics-activeusers)). This gate is fail-open (a cap-check error never blocks registration), and it reopens automatically when the count falls below the cap.

---

### Register Supervisor (OTP-verified)
**POST** `/auth/registerSupervisor`

**Rate Limit:** strict, 50 requests / 15 min per IP

Same staged OTP flow as candidate registration (no account row until the code is verified).

**Defaults (set by server):** `role: "supervisor"`, `approved: false`, `canValidate: false`, `termsAcceptedAt: now`.

**Request Body Fields:**
- `email`, `password` (≥8), `fullName`, `phoneNum` — required.
- `departmentId` (string UUID, **required**): from `GET /departments`.
- `position` (string, optional): one of `Professor`, `Assistant Professor`, `Lecturer`, `Assistant Lecturer`, `Guest Doctor`, `Consultant`, `unknown` (default `unknown`).

**Response (201 Created):** same staged shape as Register Candidate (`signupId`, `expiresAt`, `email`). **409** if the email already exists. **403** if signups are closed by the active-users cap (see Register Candidate above).

---

### Verify Signup OTP
**POST** `/auth/verifySignupOtp`

**Rate Limit:** strict, 50 requests / 15 min per IP

Completes a staged signup: on a correct code the real (unapproved) candidate/supervisor account is created transactionally (with an email-uniqueness race guard).

**Request Body:**
```json
{
  "signupId": "uuid",
  "code": "123456"
}
```
(`code` must match `/^\d{6}$/`.)

**Responses:**
- **201 Created** — account created; `data` contains the new (unapproved) user.
- **400 Bad Request** — wrong code; body includes `attemptsRemaining`. After **5 wrong attempts** the signup is rejected and the user must register again.
- **410 Gone** — the staged signup `expired` (15-minute window; resending does NOT extend it) or was `rejected`; body includes `reason`.
- **404 Not Found** — unknown `signupId` (also returned after the periodic purge sweep removes stale signups).

---

### Resend Signup OTP
**POST** `/auth/resendSignupOtp`

**Rate Limit:** strict, 50 requests / 15 min per IP

**Request Body:** `{ "signupId": "uuid" }`

**Responses:**
- **200 OK** — a new email was sent; `data` = `{ sendsRemaining, expiresAt }`. Max **3 sends** per signup, **60-second cooldown** between sends; the 15-minute expiry is **not** extended.
- **429 Too Many Requests** — cooldown active (body includes `retryInSeconds`) or send quota exhausted.
- **410 Gone** — signup expired. · **404 Not Found** — unknown `signupId`.

---

### Reset All Candidate Passwords
**POST** `/auth/resetCandPass`

**Status:** DISABLED — returns `410 Gone`. See [Disabled, Gated & Removed Routes](#disabled-gated--removed-routes) and [docs/DISABLED_ROUTES.md](./docs/DISABLED_ROUTES.md).

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

**Status:** ✅ **ENABLED**

**Authentication Required:** No

**Rate Limit:** 
- Router-level: 50 requests per 15 minutes per IP address
- Application-level: Maximum 3 password reset tokens per user per hour

Allows users to request a password reset link via email. The system searches for the email in **candidate, supervisor, instituteAdmin, and clerk** only. **SuperAdmins cannot use forgot/reset password** (they must use the authenticated change-password flow).

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
- Email is searched in candidate, supervisor, instituteAdmin, and clerk only (not superAdmin)
- If user exists, a secure reset token is generated and sent via email
- Reset link expires in 1 hour
- Always returns success message to prevent email enumeration attacks
- **Reset link format:** `{FRONTEND_URL}/reset-password?token={token}`.
- **Rate Limiting**: Two-layer protection:
  - Router-level: 50 requests per 15 minutes per IP address (prevents rapid-fire abuse)
  - Application-level: Maximum 3 password reset tokens per user per hour (prevents token flooding per user)
- If rate limit is exceeded, the request silently fails (no error message to prevent email enumeration)

---

### Reset Password
**POST** `/auth/resetPassword`

**Status:** ✅ **ENABLED**

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

---

## User Management

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

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

**Status:** ❌ **REMOVED** (security hardening) — the route is not registered (404). Super-admin accounts are provisioned directly in the database (DB/ETL-side); there is no API creation path. Note that `POST /auth/superAdmin/login` itself is environment-gated (development/staging only).

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

### Update / Delete Super Admin

**Status:** ❌ **REMOVED** (security hardening) — `PUT /superAdmin/:id` and `DELETE /superAdmin/:id` are not registered (404). Only `GET /superAdmin` and `GET /superAdmin/:id` remain (Super Admin auth).

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
- `departmentId` (UUID, optional): scopes the admin to a department (validated against the mirrored `departments`); omitted = institution-wide admin. All institute-admin dashboard reads are scoped by this value (read from the admin's DB row, not the JWT).
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

**Requires:** Institute Admin (**own account only**) or Super Admin (any account) · **Rate Limit:** 50 / 15 min per user

**Request Body** (all optional): `email`, `password` (≥8, bcrypt-hashed), `fullName` (≤100), `phoneNum` (≥11), `approved` (boolean), `departmentId` (UUID — must exist in the mirrored `departments`; UUID only, an admin cannot null their own scope to institution-wide).

**Behavior:**
- An institute admin may update **only their own** record (403 otherwise); super admins may update any (2026-07 security audit, F11 — peer-admin updates removed).
- **Self department switch:** when an institute admin changes their own `departmentId`, the server re-signs **both** access and refresh tokens with the new `departmentId` claim, re-sets the `auth_token`/`refresh_token` cookies, and includes `token` in the response. The frontend must adopt the new token and invalidate cached queries (all department-scoped reads change).
- The bcrypt password hash is **never** returned (stripped from GET and PUT responses).

**Response (200 OK):** the updated admin (password stripped; plus `token` on a self department switch). **404** if not found.

---

### Delete Institute Admin
**DELETE** `/instituteAdmin/:id`

**Requires:** **Super Admin only** · **Rate Limit:** 50 / 15 min per user

**Response (200 OK):** `{ "message": "..." }`. **404** if not found.

---

### Institute Admin Dashboard – Main Diagnosis

Reference data is now a **read-only hub mirror** — the dashboard can browse main diagnoses but can no longer create, update, or delete them (those routes return 404).

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| List all | GET | `/mainDiag` | Department-scoped list (`?deptCode` → JWT claim → NS) |
| Get one | GET | `/mainDiag/:id` | Get a main diagnosis by ID |
| Questions | GET | `/mainDiag/:mainDiagId/questions` | Per-diagnosis dynamic questions with narrowed options |

Full details in [Main Diagnosis (`/mainDiag`)](#main-diagnosis-maindiag).

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

### Download Supervisors Report PDF (Dashboard)
**GET** `/instituteAdmin/supervisors/report`

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

**Description:** Generates and returns a PDF report of **all supervisors** for the current institution. The PDF uses the same layout and style as the candidate summary report: E-Certificate header, institution name and department, report-generated date, line dividers, footer (LIBELUSpro / www.libeluspro.com), and page numbers. Content includes:

1. **Supervisors Summary** – Total count and a table with: #, Full Name, Email, Position, Val. (can validate surgical submissions), Clin. (can validate clinical), Approved.

**Response (200 OK):** Binary PDF file (not wrapped in the standard JSON envelope). Response headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Supervisors - Ecertificate - <InstitutionName> - <Department>.pdf"`

**Notes:**
- This endpoint returns the PDF bytes directly; do not expect a `{ status, statusCode, message, data }` wrapper.
- Accessible to Institute Admins and Super Admins (same as other institute admin dashboard reports).
- The report lists only supervisors within the admin's department scope.

**Errors:**
- 401 Unauthorized, 403 Forbidden, or 429 Too Many Requests same as other institute admin endpoints.

---

### Generate Supervisor Report PDF (Dashboard)
**GET** `/instituteAdmin/supervisors/:supervisorId/report`

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
- `supervisorId` (required): Supervisor UUID. Must be within the admin's department scope (cross-department targets return 404).

**Description:** Generates and returns a PDF report for a specific supervisor. The report uses the same layout system as the candidate E-Certificate report (header, footer, typography, line dividers) but with supervisor-focused content:

1. **Supervisor information** – Name, email, position, flags for `canValidate` and `canValClin`, total own logged surgical cases, and a summary of supervised surgical submissions (approved/pending/rejected).
2. **AI summary** – 2–3 short paragraphs summarizing the supervisor's surgical, clinical, and academic activity, generated by the AI agent from the analytics data.
3. **Surgical supervision analytics** (when `canValidate = true`) – Counts of approved/pending/rejected supervised submissions; procedures-per-role breakdown for approved submissions (supervised + own); hospital distribution; annual surgical supervision volume; and a table of supervised candidates with their case counts.
4. **Clinical supervision** (when `canValClin = true` and institution is clinical) – Count of approved supervised clinical cases.
5. **Academic participation** – List of all events where the supervisor is the presenter (lecture/conf), including event title, type, date, and attendance count, sorted by date.

**Response (200 OK):** Binary PDF file (not wrapped in the standard JSON envelope). Response headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="SupervisorReport_<supervisorId>.pdf"` (actual filename includes supervisor and institution names).

**Notes:**
- This endpoint returns the PDF bytes directly; do not expect a `{ status, statusCode, message, data }` wrapper.
- Accessible to Institute Admins and Super Admins. Institution name and department on the report come from the single KA institution.

**Errors:**
- 400 if `supervisorId` is not a valid UUID.
- 404 if the supervisor does not exist or does not belong to the requested institution.
- Otherwise same as other institute admin endpoints (401, 403, 429).

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
- `supervisorId` (required): Supervisor UUID

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
        "procCpt": {
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
      "msg": "Supervisor ID must be a valid UUID",
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

### Get Candidate Dashboards (Paginated, Admin)
**GET** `/instituteAdmin/candidates/dashboard`

**Requires:** Authentication (Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Query Parameters:**

- `page` (optional, integer, default `1`): Page number (1-based).
- `pageSize` (optional, integer, default `20`, max `100`): Number of candidates per page.

**Description:** Returns a paginated list of candidate dashboard snapshots for the current institution.  
Each snapshot contains candidate identity plus submission-based analytics, and conditionally academic and clinical sections depending on institution configuration (`isPractical`, `isAcademic`, `isClinical`).

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "items": [
      {
        "candidate": {
          "id": "c0b9a9d2-5c7f-4a1c-9e3f-8bf0c18c9e11",
          "fullName": "Dr. Alice Example"
        },
        "stats": {
          "totalApproved": 42,
          "totalRejected": 3,
          "totalPending": 5,
          "totalApprovedAndPending": 47
        },
        "submissions": [],
        "cptAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
        "icdAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
        "supervisorAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
        "points": { "totalPoints": 87 },
        "clinicalSubCand": []
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalItems": 37
  }
}
```

**Notes:**
- Accessible only to Institute Admins.
- **`candidate`** in each snapshot includes all candidate entity fields (e.g. `id`, `fullName`, `email`, `regNum`, `phoneNum`, `nationality`, `rank`, `regDeg`, `approved`, `role`, `timeStamp`, `google_uid`, `termsAcceptedAt`, `createdAt`, `updatedAt`) **except `password`**—the password is never returned.
- Respects institution configuration:
  - Practical core (stats, submissions, CPT/ICD/supervisor analytics) is always included.
  - `points` is present only when the institution is academic.
  - `clinicalSubCand` is present only when the institution is clinical.

---

### Get Candidate Summary List (Lightweight, Admin)
**GET** `/instituteAdmin/candidates/summary`

**Requires:** Authentication (Institute Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Query Parameters:**
- `search` (optional, string): When present and non-empty, filter candidates server-side by `fullName`, `regNum`, `rank`, `regDeg`, and `email`. Trimmed; empty/whitespace is treated as no search (returns full list).

**Description:** Returns the full list of candidates (both **approved** and **not yet approved**) for the current institution with summary data only (identity + submission stats + academic points when applicable + clinical approved count when applicable). No pagination; one response contains all matching candidates. Use this for the Institute Admin candidates table. No full submissions, CPT/ICD/supervisor analytics, or full clinical arrays.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "items": [
      {
        "candidate": {
          "id": "c0b9a9d2-5c7f-4a1c-9e3f-8bf0c18c9e11",
          "fullName": "Dr. Alice Example",
          "approved": true,
          "regNum": "REG123",
          "rank": "professor",
          "regDeg": "msc",
          "email": "alice@example.com"
        },
        "stats": {
          "totalApproved": 42,
          "totalPending": 5,
          "totalRejected": 3,
          "totalApprovedAndPending": 47
        },
        "totalPoints": 87,
        "clinicalApprovedCount": 2
      }
    ]
  }
}
```

**Field Rules:**
- `candidate`: At least `id`, `fullName`, `approved` (boolean); `regNum`, `rank`, `regDeg`, `email` included when available.
- `stats`: Same semantics as dashboard snapshot (counts for that candidate's submissions).
- `totalPoints`: Present only when the institution is academic (`institution.isAcademic === true`). Omit when not academic.
- `clinicalApprovedCount`: Present only when the institution is clinical (`institution.isClinical === true`). Count of approved clinical submissions for that candidate. Omit or 0 when not clinical.

**Notes:**
- The list includes both approved and not-yet-approved candidates. Each item's `candidate` object always includes `approved` (boolean) so the client can filter or display approval status.

**Errors:** Same as other institute admin endpoints (401 Unauthorized, 403 Forbidden, 429 Too Many Requests).

---

### Get Full Dashboard Snapshot for One Candidate (Admin)
**GET** `/instituteAdmin/candidates/:candidateId/dashboard`

**Requires:** Authentication (Institute Admin)

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
- `candidateId` (required): Candidate UUID. Must be within the admin's department scope (cross-department targets return 404).

**Description:** Returns the full dashboard snapshot for a single candidate—same structure as one element of **GET /instituteAdmin/candidates/dashboard** `items[]`. Use when the user opens a candidate's detail/snapshot page (by click or direct URL). Includes `candidate`, `stats`, `submissions`, `cptAnalytics`, `icdAnalytics`, `supervisorAnalytics`; `points` when institution is academic; `clinicalSubCand` when institution is clinical.

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "candidate": { "id": "<uuid>", "fullName": "Dr. Alice Example", "regNum": "REG123", "rank": "professor", "regDeg": "msc", "email": "alice@example.com" },
    "stats": { "totalApproved": 42, "totalRejected": 3, "totalPending": 5, "totalApprovedAndPending": 47 },
    "submissions": [],
    "cptAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
    "icdAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
    "supervisorAnalytics": { "totalApprovedSubmissions": 42, "items": [] },
    "points": { "totalPoints": 87 },
    "clinicalSubCand": []
  }
}
```
The `data` object has the same shape as one item in **GET /instituteAdmin/candidates/dashboard** `data.items[]` (see that endpoint for full field descriptions). The **`candidate`** object includes all candidate entity fields **except `password`**—the password is never returned.

**Errors:**
- 400 if `candidateId` is not a valid UUID.
- 404 if the candidate does not exist or does not belong to the requested institution.
- Otherwise same as other institute admin endpoints (401, 403, 429).

---

### Generate Candidate Report PDF (Admin)
**GET** `/instituteAdmin/candidates/:candidateId/report`

**Requires:** Authentication (Institute Admin)

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
- `candidateId` (required): Candidate UUID. Must be within the admin's department scope (cross-department targets return 404).

**Description:** Generates and returns a PDF report for the specified candidate. The report header shows the brand **LIBELUSpro** and uses the institution name and department (from the resolved institution). The report includes:

1. **Candidate information** – Name, registration number, rank, degree.
2. **Approved surgical submissions analytics** – Total count; **role-based** stacked bar charts (by role in surgery: Operator, Operator (Assisted), Assistant, Supervising, Observer) for ICD code, CPT code, supervisor, main diagnosis, and hospital; plus submissions by year, consumables, and equipment (all categories included). Chart colors align with the Institute Admin dashboard (indigo for CPT, pink for ICD, slate for generic).
3. **Academic activity** (when institution is academic) – Uses the same data as **GET /event/candidate/:candidateId/points** (events + totalPoints). Lists all attended events (topic, lecturer, points, date) and total academic points. Section is shown whenever the institution is academic, even if the list is empty.
4. **Clinical activity** (when institution is clinical) – Total accepted clinical submissions; analysis by activity type (typeCA) with counts.

**Response (200 OK):** Binary PDF file (not wrapped in the standard JSON envelope). Response headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="LIBELUSpro_candidate_report_<candidateId>.pdf"`

**Notes:**
- This endpoint returns the PDF bytes directly; do not expect a `{ status, statusCode, message, data }` wrapper.
- Accessible only to Institute Admins. Institution name and department on the report come from the single KA institution.

**Errors:**
- 400 if `candidateId` is not a valid UUID.
- 404 if the candidate does not exist or does not belong to the requested institution.
- Otherwise same as other institute admin endpoints (401, 403, 429).

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
- `candidateId` (required): Candidate UUID

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
        "procCpt": {
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
      "msg": "Candidate ID must be a valid UUID",
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
- `candidateId` (required): Candidate UUID
- `submissionId` (required): Submission UUID

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
      "procCpt": {
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
      "msg": "Candidate ID must be a valid UUID",
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
- All ID references are populated with their full entity data where applicable
- Returns 404 if submission doesn't exist or doesn't belong to the candidate
- Returns 400 if either ID format is invalid

---

### Get Submission Case Report PDF (Admin)
**GET** `/instituteAdmin/submissions/:submissionId/report`

**Requires:** Authentication (Institute Admin or Super Admin)

**Rate Limit:** 50 requests per 15 minutes per user (strict, same as other PDF endpoints)

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `submissionId` (required): Submission UUID. Must be within the admin's department scope (404 otherwise).

**Query Parameters (optional):**
- `inline=1` or `view=1`: When present, the response uses `Content-Disposition: inline` so the PDF opens in the browser instead of downloading. Omit for attachment (download) behavior.

**Description:** Generates and returns a **submission-specific case report PDF** for a single submission. The report is built with React-PDF on the backend and includes:

1. **Header** – Institution name and department (from resolved institution), submission ID, status.
2. **Candidate** – Full name, email, registration number, phone, rank.
3. **Supervisor** – Full name, email, phone.
4. **Procedure (Cal. Surgery)** – Procedure date, hospital, Arabic procedure (title/code), patient name, DOB, gender.
5. **Main Diagnosis** – Title.
6. **ICD (Diagnoses)** – Code and name for each linked diagnosis.
7. **CPT (Procedures)** – Title, alpha code, and num code for each linked procedure.
8. **Submission details** – Submission type, timestamp, role in surgery, assistant role description, other surgeon rank/name, revision surgery, pre-op condition, instruments/consumables, diagnosis names, procedure names.
9. **Anatomy & approach** (when present) – Region, approach, position, spinal/cranial.
10. **Clinical & free-text** (when present) – Clinical presentation, diagnosis names, procedure names.
11. **Notes & events** (when present) – Surgical notes, intraoperative events.
12. **Review** (when present) – Review comment, reviewed at.

**Response (200 OK):** Binary PDF file (not wrapped in the standard JSON envelope). Response headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Submission-Report-<shortId>-<InstitutionName>.pdf"` (default), or `Content-Disposition: inline; ...` when `?inline=1` or `?view=1` is used.

**Example – download PDF:**
```
GET /instituteAdmin/submissions/8fd9b7dc-e62a-4ddf-b0d7-a56110927328/report
Authorization: Bearer <token>
```

**Example – view PDF in browser (no download):**
```
GET /instituteAdmin/submissions/8fd9b7dc-e62a-4ddf-b0d7-a56110927328/report?inline=1
Authorization: Bearer <token>
```

**Notes:**
- This endpoint returns the PDF bytes directly; do not expect a `{ status, statusCode, message, data }` wrapper.
- Accessible to Institute Admins and Super Admins; the submission must be within the admin's department scope.
- Use `?inline=1` or `?view=1` to display the PDF in the browser; omit for attachment (download).

**Errors:**
- 400 if `submissionId` is not a valid UUID.
- 404 if the submission does not exist or is outside the admin's department scope.
- Otherwise same as other institute admin endpoints (401, 403, 429).

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

**Description:** Returns all calendar procedures (calSurg) with optional filtering capabilities. Supports filtering by hospital, procedure (procCpt title or numCode), and timestamp (month/year). Results are scoped to the admin's department (institution-wide for unscoped admins).

**Query Parameters (all optional):**
- `hospitalId` (optional): Filter by hospital UUID
- `procTitle` (optional): Filter by procedure (CPT) title (partial match, case-insensitive)
- `procNumCode` (optional): Filter by procedure (CPT) numCode (exact or partial match)
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
      "procCpt": {
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

**Status:** ❌ **REMOVED** — the `arab_procs` module was retired (2026-07-15); the route returns 404. Procedure names now come from the CPT catalog (`procCpt`, with Arabic `arTitle`) and the learned clerk-phrase table (`clerkProc`).

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
- `hospitalId` (optional): Filter by specific hospital UUID. If omitted, returns analysis for all hospitals.
- `month` (optional): Filter by month (1-12). When provided, filters calSurg entries within that month
- `year` (optional): Filter by year (e.g., 2025). When provided, filters calSurg entries within that year
- `startDate` (optional): Filter by start date (ISO 8601 format). When provided with `endDate`, filters calSurg entries within the date range
- `endDate` (optional): Filter by end date (ISO 8601 format). When provided with `startDate`, filters calSurg entries within the date range
- `groupBy` (optional): Grouping method. Valid values: `title` (group by procCpt title) or `alphaCode` (group by procCpt alphaCode). Default: `title`

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
- `approved` (boolean) is **required**; `departmentId` (UUID, optional) scopes the clerk to a department (validated against the mirrored `departments`; omitted = institution-scoped clerk). The clerk's department becomes their JWT claim at login and scopes calendar-surgery work.
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

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

**Optional field `subGoogleUid`:** In all submission response bodies (GET/POST/PATCH), the field `subGoogleUid` is **optional** and may be `null`. Submissions created via the webapp (POST candidate/submissions or POST supervisor/submissions) do not set this field; it will be `null` in the response. It is present (non-null) for submissions imported from external sources (e.g. Google Sheets). The request body for creating submissions does not include `subGoogleUid`. Example for webapp-created submissions: `"subGoogleUid": null`.

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

**Status:** 🔐 **Migration-key-gated** (operator import tooling — not for app use)

**Auth:** `X-Migration-Key: <MIGRATION_API_KEY>` header (constant-time compare), **no JWT**. When `MIGRATION_API_KEY` is unset (the production default) → **503**; wrong key → **401**.

**Rate Limit:** 50 / 15 min per IP (strict)

**Body:** `{ "row"?: number, "startRow"?: number }` — imports submission rows from the configured Google Sheet (all rows when omitted).

---

### Update Submission Status from External
**PATCH** `/sub/updateStatusFromExternal`

**Status:** 🔐 **Migration-key-gated** — same auth, gating, rate limit, and body as `POST /sub/postAllFromExternal`.

---

### Create Submission (Candidate)
**POST** `/sub/candidate/submissions`

Creates a new surgical experience submission. Only authenticated candidates can submit. The candidate ID is taken from the JWT; the request body supplies procedure, supervisor, diagnosis, and submission details. New submissions are created with status `pending` and must be reviewed by a supervisor.

**Email notification:** After the submission is saved, the server sends an email to the assigned supervisor (`supervisorDocId`) to notify them that a new submission requires review. The email includes the candidate name, submission ID, procedure info, and a link to the review page. Sending is done in the background (non-blocking); the API responds immediately. If the supervisor has no email address, no email is sent.

**Requires:** Candidate authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <candidate_token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `procDocId` | string (UUID) | Yes | Calendar procedure ID (calSurg) |
| `supervisorDocId` | string (UUID) | Yes | Supervisor ID |
| `mainDiagDocId` | string (UUID) | Yes | Main diagnosis ID |
| `roleInSurg` | string | Yes | One of: `operator`, `operator with supervisor scrubbed (assisted)`, `supervising, teaching a junior colleague (scrubbed)`, `assistant`, `observer (Scrubbed)` |
| `otherSurgRank` | string | Yes | One of: `professor`, `assistant professor`, `lecturer`, `assistant lecturer`, `resident (cairo university)`, `guest specialist`, `guest resident`, `consultant`, `specialist`, `other` |
| `otherSurgName` | string | Yes | Name of other surgeon (max 255 chars) |
| `isItRevSurg` | boolean | Yes | Whether it is a revision surgery |
| `insUsed` | string | Yes | Instrument used (e.g. `microscope`, `endoscope`, `none`) |
| `consUsed` | string | Yes | Consumable used (e.g. `bone cement`, `none`) |
| `diagnosisName` | string[] | Yes | Array of diagnosis names (labels selected from the main diagnosis’ diagnosis list) |
| `procedureName` | string[] | Yes | Array of procedure names (labels selected from the main diagnosis’ procedure list) |
| `assRoleDesc` | string | No | Assistant role description |
| `preOpClinCond` | string | No | Pre-operative clinical condition |
| `consDetails` | string | No | Consumable details |
| `surgNotes` | string | No | Surgical notes |
| `IntEvents` | string | No | Intraoperative events |
| `spOrCran` | string | No | `spinal` or `cranial` |
| `pos` | string | No | Position: `supine`, `prone`, `lateral`, `concorde`, `other` |
| `approach` | string | No | Approach description |
| `clinPres` | string | No | Clinical presentation |
| `region` | string | No | `craniocervical`, `cervical`, `dorsal`, or `lumbar` |

**Example Request Body:**
```json
{
  "procDocId": "550e8400-e29b-41d4-a716-446655440001",
  "supervisorDocId": "550e8400-e29b-41d4-a716-446655440002",
  "mainDiagDocId": "550e8400-e29b-41d4-a716-446655440003",
  "roleInSurg": "operator",
  "otherSurgRank": "professor",
  "otherSurgName": "Dr. Smith",
  "isItRevSurg": false,
  "insUsed": "microscope",
  "consUsed": "none",
  "diagnosisName": ["meningioma"],
  "procedureName": ["craniotomy for tumor"],
  "surgNotes": "Uncomplicated procedure.",
  "IntEvents": "None"
}
```

**Response (201 Created):**
Returns the created submission document with populated relations. Same shape as a single item in Get Candidate Submissions. The response is wrapped: `{ status, statusCode, message, data }` where `data` is the submission object. The server does **not** generate `subGoogleUid` for webapp-created submissions; `data.subGoogleUid` may be `null`.

**Populated structure in `data`:**

| Path | Fields |
|------|--------|
| **calSurg** (procedure) | `id`, `patientName`, `patientDob`, `gender`, `hospital` (`id`, `engName`), `procCpt` (`id`, `title`, `arTitle`, `alphaCode`, `numCode`, `description`), `procDate` |
| **supervisor** | `id`, `fullName`, `position` only |
| **mainDiag** | `id`, `title` only |
| **procCpts** | Each: `id`, `title`, `alphaCode`, `numCode`, `description` |
| **icds** | Each: `id`, `icdCode`, `icdName` |

**Omitted:** `candidate`; supervisor `password`, `email`, `phoneNum`, etc.; redundant IDs; timestamps from nested objects. See Get Candidate Submissions for full response example.

**Error Response (400 Bad Request - validation):**
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    {
      "type": "field",
      "msg": "procDocId (calendar procedure ID) is required.",
      "path": "procDocId",
      "location": "body"
    }
  ]
}
```

**Error Response (400 Bad Request - main diagnosis not found):**
```json
{
  "error": "Main diagnosis not found"
}
```

**Error Response (400 Bad Request - submission limits per procedure):**

The backend enforces two rules per candidate per procedure (`procDocId`): at most 2 submissions per procedure, and no duplicate role. Only **pending** and **approved** submissions count; **rejected** submissions do not count toward the limit.

*Max 2 per procedure (400):*
```json
{
  "error": "This procedure already has 2 submissions from you. You cannot add more entries for this procedure."
}
```

*Duplicate role for same procedure (400):*
```json
{
  "error": "You have already submitted an entry for this procedure with this role. Please select a different role (e.g. Assistant, Observer) for this submission."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: No candidate ID found in token"
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
- Only candidates can create submissions; the candidate ID is taken from the JWT.
- **Submission limits per procedure:** A candidate may create at most **2 submissions** for the same `procDocId`. The two must have **different** `roleInSurg` values (no duplicate role per procedure). Rejected submissions do not count toward these limits. When violated, the API returns 400 with one of the messages above; the frontend should display that message to the user.
- Submissions are created with `subStatus: "pending"` and must be reviewed by a validator supervisor.
- The assigned supervisor receives an email (subject: "Review submission from [candidate name] · [shortId]") with a link to review the submission. Email is sent asynchronously; the API does not wait for it. If the supervisor has no email, the email is skipped.
- All submission endpoints operate on the single KA institution's database.
- Standard rate limit for POST: 50 requests per 15 minutes per user.
- `subGoogleUid` is not in the request body and is not generated by the server; the response may have `subGoogleUid: null`.

---

### Create Supervisor Submission (Supervisor's Own Surgical Experience)
**POST** `/sub/supervisor/submissions`

Creates a new surgical experience submission for the **supervisor's own** surgical experience. Only authenticated supervisors can submit. The supervisor ID is taken from the JWT (the supervisor is the surgeon); **do not send `supervisorDocId`**. These submissions are auto-approved with `subStatus: "approved"` and do not require review.

**Requires:** Supervisor authentication

**Rate Limit:** 50 requests per 15 minutes per user

**Headers:**
```
Authorization: Bearer <supervisor_token>
```
OR
```
Cookie: auth_token=<token>
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `procDocId` | string (UUID) | Yes | Calendar procedure ID (calSurg) |
| `mainDiagDocId` | string (UUID) | Yes | Main diagnosis ID |
| `roleInSurg` | string | Yes | One of: `operator`, `operator with supervisor scrubbed (assisted)`, `supervising, teaching a junior colleague (scrubbed)`, `assistant`, `observer (Scrubbed)` |
| `otherSurgRank` | string | Yes | One of: `professor`, `assistant professor`, `lecturer`, `assistant lecturer`, `resident (cairo university)`, `guest specialist`, `guest resident`, `consultant`, `specialist`, `other` |
| `otherSurgName` | string | Yes | Name of other surgeon (max 255 chars) |
| `isItRevSurg` | boolean | Yes | Whether it is a revision surgery |
| `insUsed` | string | Yes | Instrument used (e.g. `microscope`, `endoscope`, `none`) |
| `consUsed` | string | Yes | Consumable used (e.g. `bone cement`, `none`) |
| `diagnosisName` | string[] | Yes | Array of diagnosis names |
| `procedureName` | string[] | Yes | Array of procedure names |
| `assRoleDesc` | string | No | Assistant role description |
| `preOpClinCond` | string | No | Pre-operative clinical condition |
| `consDetails` | string | No | Consumable details |
| `surgNotes` | string | No | Surgical notes |
| `IntEvents` | string | No | Intraoperative events |
| `spOrCran` | string | No | `spinal` or `cranial` |
| `pos` | string | No | Position: `supine`, `prone`, `lateral`, `concorde`, `other` |
| `approach` | string | No | Approach description |
| `clinPres` | string | No | Clinical presentation |
| `region` | string | No | `craniocervical`, `cervical`, `dorsal`, or `lumbar` |

**Important:** Do **not** send `supervisorDocId`. The supervisor ID is taken from the JWT (the logged-in supervisor is the surgeon).

**Example Request Body:**
```json
{
  "procDocId": "550e8400-e29b-41d4-a716-446655440001",
  "mainDiagDocId": "550e8400-e29b-41d4-a716-446655440003",
  "roleInSurg": "operator",
  "otherSurgRank": "professor",
  "otherSurgName": "Dr. Smith",
  "isItRevSurg": false,
  "insUsed": "microscope",
  "consUsed": "none",
  "diagnosisName": ["meningioma"],
  "procedureName": ["craniotomy for tumor"]
}
```

**Response (201 Created):**
Returns the created submission with `submissionType: "supervisor"`, `subStatus: "approved"`, and no candidate. Same shape as a single item in Get Supervisor Submissions. The response is wrapped: `{ status, statusCode, message, data }` where `data` is the submission object. The server does **not** generate `subGoogleUid` for webapp-created submissions; `data.subGoogleUid` may be `null`.

**Error Response (400 Bad Request - validation):**
Same as Create Candidate Submission.

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: No supervisor ID found in token"
}
```

**Notes:**
- Supervisor submissions are auto-approved; no review flow.
- Use `POST /sub/candidate/submissions` for candidate submissions (requires `supervisorDocId`).
- `subGoogleUid` is not in the request body and is not generated by the server; the response may have `subGoogleUid: null`.

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

### CPT Analytics
**GET** `/sub/cptAnalytics`

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns CPT-based analytics for the logged-in user's **approved** submissions. Categories submissions by CPT code, with **role-based** count and percentage for each code. Each item includes a total (count, percentage) and a `byRole` breakdown by surgery role.

**Who sees what:** Identity and role are taken from the JWT. **Candidates** see analytics for approved submissions that belong to their candidate ID and have **submission type = candidate** (submissions they created via `POST /sub/candidate/submissions`). **Supervisors** see analytics for approved submissions that belong to their supervisor ID and have **submission type = supervisor** (submissions they created via `POST /sub/supervisor/submissions`). Institute admins and super admins have no user-scoped submissions and receive empty analytics.

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
    "totalApprovedSubmissions": 12,
    "items": [
      {
        "cptCode": "61070",
        "alphaCode": "ABC",
        "title": "Craniotomy for tumor",
        "total": { "count": 5, "percentage": 41.67 },
        "byRole": [
          { "role": "Operator", "count": 3, "percentage": 60 },
          { "role": "Operator (Assisted)", "count": 1, "percentage": 20 },
          { "role": "Assistant", "count": 1, "percentage": 20 }
        ]
      },
      {
        "cptCode": "61850",
        "alphaCode": "XYZ",
        "title": "Implantation of neurostimulator",
        "total": { "count": 3, "percentage": 25 },
        "byRole": [
          { "role": "Operator", "count": 2, "percentage": 66.67 },
          { "role": "Observer", "count": 1, "percentage": 33.33 }
        ]
      }
    ]
  }
}
```

**Response schema:** `data` has `totalApprovedSubmissions` (number) and `items` (array). Each item has:
- `cptCode`, `alphaCode`, `title`: procedure identifiers
- `total`: `{ count, percentage }` — total submissions with this CPT; percentage of all approved submissions
- `byRole`: array of `{ role, count, percentage }` — breakdown by surgery role; percentage is within this CPT (roles sum to 100% per code). Only roles with count > 0 are included.

**Role labels:** `role` in `byRole` uses display labels: `"Operator"`, `"Operator (Assisted)"`, `"Supervising"`, `"Assistant"`, `"Observer"`. Unmapped values appear as stored (e.g. `"Other"`).

**Notes:**
- `total.count`: number of approved submissions that contain this CPT code
- `total.percentage`: (total.count / totalApprovedSubmissions) × 100, rounded to two decimal places
- `byRole[].percentage`: (count / total.count for this CPT) × 100
- `items` are sorted by `total.count` descending


---

### ICD Analytics
**GET** `/sub/icdAnalytics`

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns ICD-based analytics for the logged-in user's **approved** submissions. Categories submissions by ICD code, with **role-based** count and percentage for each code. Each item includes a total (count, percentage) and a `byRole` breakdown by surgery role.

**Who sees what:** Identity and role are taken from the JWT. **Candidates** see analytics for approved submissions that belong to their candidate ID and have **submission type = candidate** (submissions they created via `POST /sub/candidate/submissions`). **Supervisors** see analytics for approved submissions that belong to their supervisor ID and have **submission type = supervisor** (submissions they created via `POST /sub/supervisor/submissions`). Institute admins and super admins receive empty analytics when they have no user-scoped submissions.

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
    "totalApprovedSubmissions": 12,
    "items": [
      {
        "icdCode": "G30.9",
        "icdName": "Alzheimer disease, unspecified",
        "total": { "count": 4, "percentage": 33.33 },
        "byRole": [
          { "role": "Operator", "count": 2, "percentage": 50 },
          { "role": "Supervising", "count": 1, "percentage": 25 },
          { "role": "Assistant", "count": 1, "percentage": 25 }
        ]
      },
      {
        "icdCode": "C71.1",
        "icdName": "Malignant neoplasm of frontal lobe",
        "total": { "count": 2, "percentage": 16.67 },
        "byRole": [
          { "role": "Operator (Assisted)", "count": 1, "percentage": 50 },
          { "role": "Observer", "count": 1, "percentage": 50 }
        ]
      }
    ]
  }
}
```

**Response schema:** `data` has `totalApprovedSubmissions` (number) and `items` (array). Each item has:
- `icdCode`, `icdName`: diagnosis identifiers
- `total`: `{ count, percentage }` — total submissions with this ICD; percentage of all approved submissions
- `byRole`: array of `{ role, count, percentage }` — breakdown by surgery role; percentage is within this ICD (roles sum to 100% per code). Only roles with count > 0 are included.

**Role labels:** `role` in `byRole` uses display labels: `"Operator"`, `"Operator (Assisted)"`, `"Supervising"`, `"Assistant"`, `"Observer"`. Unmapped values appear as stored (e.g. `"Other"`).

**Notes:**
- `total.count`: number of approved submissions that contain this ICD code
- `total.percentage`: (total.count / totalApprovedSubmissions) × 100, rounded to two decimal places
- `byRole[].percentage`: (count / total.count for this ICD) × 100
- `items` are sorted by `total.count` descending


---

### Supervisor Analytics
**GET** `/sub/supervisorAnalytics`

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns analytics for the logged-in user's **approved** submissions, grouped by supervisor. Only **approved submissions created by the logged-in user** (as candidate) are included. Submissions are grouped by supervising doctor; each group includes supervisor id, name, count, and percentage of the user's total approved submissions. Percentages use largest-remainder rounding so they sum to 100%. Accessible by candidates (own data), supervisors, institute admins, and super admins. Non-candidates receive empty analytics.

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
    "totalApprovedSubmissions": 24,
    "items": [
      {
        "supervisorId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "supervisorName": "Dr. Jane Smith",
        "count": 12,
        "percentage": 50
      },
      {
        "supervisorId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "supervisorName": "Dr. John Doe",
        "count": 8,
        "percentage": 33
      },
      {
        "supervisorId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "supervisorName": "Dr. Alice Brown",
        "count": 4,
        "percentage": 17
      }
    ]
  }
}
```

**Response schema:** `data` has `totalApprovedSubmissions` (number) and `items` (array). Use `data.items` for the analytics list.

| Field | Type | Description |
|-------|------|-------------|
| `totalApprovedSubmissions` | number | Total approved submissions created by the user |
| `items` | array | One entry per supervisor |
| `items[].supervisorId` | string (UUID) | Supervisor identifier |
| `items[].supervisorName` | string | Full name or email when name unavailable |
| `items[].count` | number | Approved submissions under this supervisor |
| `items[].percentage` | number | Share of total (integer); items sum to 100 |

**Notes:**
- Percentages are integers and always sum to 100 (largest-remainder method).
- `items` are sorted by `count` descending.

---

### Submission Ranking (Surgical Experience)
**GET** `/sub/submissionRanking`

**Department-scoped:** ranks only candidates of the caller's department (JWT `departmentId` claim; NS default for legacy sessions without the claim).

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Scope:** department-scoped — only candidates of the caller's department are ranked (JWT `departmentId` claim; NS default).

Returns a **ranking** by approved submission count (surgical experience). The endpoint returns **only**:
- The **top 10** ranked candidates (by approved count, descending), and
- The **logged-in candidate** (if the user is a candidate and not already in the top 10), as an additional entry with their actual rank.

No other candidates are returned. Ties are broken by `candidateId`. Computation and candidate loading are limited to those returned (top 10 + logged-in when applicable). Accessible by candidates, supervisors, institute admins, and super admins.

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
      "candidateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "candidateName": "Dr. Ahmed Ali",
      "rank": 1,
      "approvedCount": 24,
      "regDeg": "msc"
    },
    {
      "candidateId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "candidateName": "Dr. Sara Mohamed",
      "rank": 2,
      "approvedCount": 18,
      "regDeg": "doctor of medicine (md)"
    }
  ]
}
```

**Response schema:** `data` is an array of:
| Field | Type | Description |
|-------|------|-------------|
| `candidateId` | string (UUID) | Candidate identifier |
| `candidateName` | string | Candidate full name |
| `rank` | number | Rank (1 = top) |
| `approvedCount` | number | Count of approved submissions |
| `regDeg` | string | Registered degree (e.g. `msc`, `doctor of medicine (md)`) |

**Notes:** Top 10 are sorted by `approvedCount` descending; tie-breaker is `candidateId`. If the logged-in user is a candidate and outside the top 10, they appear as an extra entry with their true rank. Deterministic and idempotent; no client-side ranking or filtering.

---

### Get Candidate Submissions
**GET** `/sub/candidate/submissions`

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns all submissions for the logged-in candidate with all related data populated. Accessible by candidates (for their own data), supervisors, institute admins, and super admins. Clerk role cannot access this endpoint.

Each submission includes `submissionType`: `"candidate"` (candidate submissions always have this value).

**Populated structure per submission item (strict whitelist—sensitive/redundant fields omitted):**

| Path | Fields returned |
|------|-----------------|
| **calSurg** (procedure) | `id`, `patientName`, `patientDob`, `gender`, `hospital` (`id`, `engName` only), `procCpt` (`id`, `title`, `arTitle`, `alphaCode`, `numCode`, `description`), `procDate` |
| **supervisor** | `id`, `fullName`, `position` only |
| **mainDiag** | `id`, `title` only |
| **procCpts** | Each item: `id`, `title`, `alphaCode`, `numCode`, `description` |
| **icds** | Each item: `id`, `icdCode`, `icdName` |

**Optional review fields** (when submission has been reviewed): `review` (supervisor comments), `reviewedAt` (ISO datetime), `reviewedBy` (supervisor UUID).

**Omitted for security/redundancy:** `candidate` (removed entirely); `procDocId`, `supervisorDocId`, `mainDiagDocId`; from calSurg: `hospitalId`, `procCptId`, `google_uid`, `formLink`, `createdAt`, `updatedAt`; from hospital: `location`, `createdAt`, `updatedAt`; from supervisor: `email`, `password`, `phoneNum`, `approved`, `role`, `canValidate`, `termsAcceptedAt`, `createdAt`, `updatedAt`; from mainDiag: `procs`, `diagnosis`, `createdAt`, `updatedAt`; from procCpts/icds: `createdAt`, `updatedAt`, `neuroLogName`.

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
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "submissionType": "candidate",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "candDocId": "550e8400-e29b-41d4-a716-446655440012",
      "calSurg": {
        "id": "550e8400-e29b-41d4-a716-446655440013",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "hospital": { "id": "...", "engName": "Cairo University Hospital" },
        "procCpt": { "id": "...", "title": "اسم الإجراء بالعربية", "alphaCode": "ABC", "numCode": "61070", "description": "Procedure description" },
        "procDate": "2025-07-14T04:49:35.286Z"
      },
      "supervisor": { "id": "...", "fullName": "Dr. Jane Smith", "position": "professor" },
      "mainDiag": { "id": "...", "title": "cns tumors" },
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
      "procCpts": [ { "id": "...", "title": "...", "alphaCode": "ABC", "numCode": "12345", "description": "..." } ],
      "icds": [ { "id": "...", "icdCode": "G93.1", "icdName": "Diagnosis Title" } ],
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

**Note:** `candidate` is not returned. Supervisor `password`, `email`, `phoneNum` and other sensitive fields are never exposed. See populated structure table above for exact whitelist. In the response examples above, `subGoogleUid` is shown as a string; for submissions created via the webapp it may be `null`.

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
- `id` (required): Submission UUID

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
      "procCpt": {
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
      "msg": "Submission ID must be a valid UUID",
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

Returns **candidate submissions** where the logged-in supervisor is the approver (submissions to review). Does **not** include the supervisor's own submissions. For the supervisor's own surgical experience, use **GET /sub/supervisor/own/submissions**.

All returned items have `submissionType: "candidate"` and include a populated `candidate` object. Optionally filter by submission status.

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
The API returns a **trimmed** payload: nested objects (`calSurg`, `candidate`, `supervisor`, `mainDiag`, `procCpts`, `icds`) omit sensitive or redundant fields.
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "ee63669b-423d-4084-8f0a-c0d0dd5a0103",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "submissionType": "candidate",
      "candDocId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "candidate": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "email": "candidate@example.com",
        "fullName": "John Doe",
        "regNum": "REG123456",
        "phoneNum": "+1234567890",
        "nationality": "Egyptian",
        "rank": "professor",
        "regDeg": "msc",
        "approved": true,
        "role": "candidate"
      },
      "procDocId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "calSurg": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "timeStamp": "2025-07-14T04:49:35.286Z",
        "patientName": "John Patient",
        "patientDob": "1980-01-15T00:00:00.000Z",
        "gender": "male",
        "procDate": "2025-07-14",
        "createdAt": "2025-07-14T04:49:35.286Z",
        "hospital": {
          "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
          "arabName": "مستشفى جامعة القاهرة",
          "engName": "Cairo University Hospital"
        },
        "procCpt": {
          "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
          "title": "Procedure Title",
          "alphaCode": "ABC",
          "description": "Procedure description"
        }
      },
      "supervisorDocId": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "supervisor": {
        "fullName": "Dr. Jane Smith"
      },
      "roleInSurg": "operator",
      "subStatus": "pending",
      "procedureName": ["Procedure A", "Procedure B"],
      "diagnosisName": ["Diagnosis X"],
      "mainDiag": {
        "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
        "title": "Main Diagnosis Title"
      },
      "procCpts": [
        {
          "id": "a7b8c9d0-e1f2-3456-0123-567890123456",
          "title": "CPT Title",
          "alphaCode": "ABC",
          "numCode": "12345",
          "description": "CPT Description"
        }
      ],
      "icds": [
        {
          "id": "b8c9d0e1-f2a3-4567-1234-678901234567",
          "icdCode": "I10",
          "icdName": "ICD Description"
        }
      ]
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
- All returned submissions are candidate submissions (`submissionType: "candidate"`); `candidate` is always populated
- Reviewed submissions include optional `review`, `reviewedAt`, `reviewedBy` (stored in DB)
- If `status` query parameter is provided, only submissions with that status are returned
- Valid status values are: `approved`, `pending`, `rejected`
- If `status` is omitted, all candidate submissions for the supervisor are returned regardless of status

---

### Get Supervisor Own Submissions
**GET** `/sub/supervisor/own/submissions`

**Authentication Required:** Yes (Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

Returns submissions **submitted by** the logged-in supervisor (the supervisor's own surgical experience). These have `submissionType: "supervisor"`, are auto-approved, and have no candidate. For candidate submissions (to review), use **GET /sub/supervisor/submissions**.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**Query Parameters:**
- `status` (optional): Filter submissions by status. Valid values: `approved`, `pending`, `rejected`. If omitted, returns all supervisor-owned submissions.

**Examples:**
- Get all own submissions: `GET /sub/supervisor/own/submissions`
- Get approved own submissions: `GET /sub/supervisor/own/submissions?status=approved`

**Response (200 OK):**  
Same trimmed shape as Get Supervisor Submissions. Each item has `submissionType: "supervisor"`, `candidate` / `candDocId` is `null`, and `subStatus` is typically `"approved"`.
**Notes:**
- Institute admins and super admins can access this endpoint; they typically receive an empty array unless they have a linked supervisor identity
- Supervisors use **GET /sub/cptAnalytics** and **GET /sub/icdAnalytics** for analytics of their supervisor-owned approved submissions

---

### Get Single Supervisor Submission by ID
**GET** `/sub/supervisor/submissions/:id`

**Authentication Required:** Yes (Supervisor role)

**Rate Limit:** 200 requests per 15 minutes per user

Returns a single submission by ID, verifying that it belongs to the logged-in supervisor. The submission may be a candidate submission (`submissionType: "candidate"`) or a supervisor submission (`submissionType: "supervisor"`). Use `submissionType` to determine whether to show the Review UI.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Submission UUID

**Response (200 OK):**  
The API returns a **trimmed** payload: nested objects omit sensitive or redundant fields.
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "ee63669b-423d-4084-8f0a-c0d0dd5a0103",
    "timeStamp": "2025-07-14T04:49:35.286Z",
    "submissionType": "candidate",
    "candDocId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "candidate": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "candidate@example.com",
      "fullName": "John Doe",
      "regNum": "REG123456",
      "phoneNum": "+1234567890",
      "nationality": "Egyptian",
      "rank": "professor",
      "regDeg": "msc",
      "approved": true,
      "role": "candidate"
    },
    "procDocId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "calSurg": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "timeStamp": "2025-07-14T04:49:35.286Z",
      "patientName": "John Patient",
      "patientDob": "1980-01-15T00:00:00.000Z",
      "gender": "male",
      "procDate": "2025-07-14",
      "createdAt": "2025-07-14T04:49:35.286Z",
      "hospital": {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "arabName": "مستشفى جامعة القاهرة",
        "engName": "Cairo University Hospital"
      },
      "procCpt": {
        "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
        "title": "Procedure Title",
        "alphaCode": "ABC",
        "description": "Procedure description"
      }
    },
    "supervisorDocId": "e5f6a7b8-c9d0-1234-ef01-345678901234",
    "supervisor": {
      "fullName": "Dr. Jane Smith"
    },
    "roleInSurg": "operator",
    "subStatus": "pending",
    "procedureName": ["Procedure A", "Procedure B"],
    "diagnosisName": ["Diagnosis X"],
    "mainDiag": {
      "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
      "title": "Main Diagnosis Title"
    },
    "procCpts": [
      {
        "id": "a7b8c9d0-e1f2-3456-0123-567890123456",
        "title": "CPT Title",
        "alphaCode": "ABC",
        "numCode": "12345",
        "description": "CPT Description"
      }
    ],
    "icds": [
      {
        "id": "b8c9d0e1-f2a3-4567-1234-678901234567",
        "icdCode": "I10",
        "icdName": "ICD Description"
      }
    ]
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
      "msg": "Submission ID must be a valid UUID",
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
- The submission ID parameter is validated as a UUID
- The endpoint verifies that the submission belongs to the logged-in supervisor
- Nested relations are populated but **trimmed**
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
- `candidateId` (required): Candidate UUID

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
        "procCpt": {
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
- All ID references are populated with their full entity data where applicable
- Returns empty array if no submissions found for the candidate-supervisor relationship (default behavior)
- When `all=true`, the `supervisorDocId` in returned submissions may be different from the logged-in supervisor (showing the actual assigned supervisor for each submission)

---

### Review Submission (Approve/Reject)
**PATCH** `/sub/supervisor/submissions/:id/review`

**Authentication Required:** Yes (Validator Supervisor role only)

**Rate Limit:** 50 requests per 15 minutes per user

**⚠️ Important:** Only **Validator Supervisors** (`canValidate: true`) can review submissions. Academic Supervisors (`canValidate: false`) will receive a 403 Forbidden error.

**⚠️ Only candidate submissions can be reviewed.** Supervisor submissions (`submissionType: "supervisor"`) cannot be reviewed and will return 400 Bad Request.

Allows a supervisor to review a **candidate** submission by approving or rejecting it. This endpoint:
1. Updates the submission status in the SQL database (`subStatus`, `review`, `reviewedAt`, `reviewedBy`)
2. Sends an email notification to the candidate with submission details and review comments
3. Returns the updated submission document

**Note:** Review comments are stored in the database. Google Sheets sync has been removed.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Submission UUID

**Request Body:**
```json
{
  "status": "approved",
  "review": "Excellent work on this procedure. All documentation is complete and accurate."
}
```

**Request Body Fields:**
- `status` (required): Submission status. Must be either `"approved"` or `"rejected"`
- `review` (optional): Review comments from the supervisor. Maximum 2000 characters. Stored in the database (`review` column) and included in the email sent to the candidate.

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
      "procCpt": {
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
    "review": "Excellent work on this procedure. All documentation is complete and accurate.",
    "reviewedAt": "2025-07-15T10:30:00.000Z",
    "reviewedBy": "507f1f77bcf86cd799439014",
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

**Error Response (400 Bad Request - Supervisor submission cannot be reviewed):**
When attempting to review a supervisor submission (`submissionType: "supervisor"`):
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Supervisor submissions cannot be reviewed"
}
```

**Error Response (400 Bad Request - Invalid submission ID):**
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
- **Only candidate submissions can be reviewed.** Supervisor submissions (`submissionType: "supervisor"`) return 400 Bad Request.
- The endpoint verifies that the submission belongs to the logged-in supervisor before allowing the review
- **Database update**: The submission status is updated in the database
- **Database Update**: The submission status, review comments, and review metadata are stored in the SQL database (`subStatus`, `review`, `reviewedAt`, `reviewedBy`). No Google Sheets sync.
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
  - If email sending fails, the operation continues (database update is not rolled back)
- **Review Comments**: The `review` field is optional. It is stored in the database (`review` column) and included in the email sent to the candidate
- Valid status values are: `"approved"` or `"rejected"`
- The review field has a maximum length of 2000 characters
- All ID references in the response are populated with their full entity data where applicable
- Returns 400 if the submission ID format is invalid or status is invalid
- Returns 404 if submission doesn't exist or doesn't belong to the supervisor

---

### Generate Surgical Notes using AI
**POST** `/sub/submissions/:id/generateSurgicalNotes`

**Status:** ❌ **REMOVED** — the text-based variant is no longer registered (404). Use the voice variant below.

---

### Generate Surgical Notes from Voice
**POST** `/sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice`

**Authentication Required:** Yes. **Candidates**, **supervisors**, **institute admins**, and **super admins** can call this endpoint.

**Rate Limit:** Same as other submission endpoints (user-based strict rate limiter).

**Description:** Generates surgical notes from a **voice recording** during **submission creation**, when no submission id exists yet. The client sends an audio file and the **calendar surgery (procedure) id** (`calSurgId`). The backend loads that procedure (patient, hospital, procedure name, date, etc.) and sends it plus the audio to Google Gemini; the AI returns surgical notes. The audio is not stored. This is the only voice-to-surgical-notes endpoint; use it on the **create submission** form once the user has selected a procedure (the frontend has `calSurgId` / `procDocId` at that point).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data      (set automatically by the browser when using FormData)
```

**URL Parameters:**
- `calSurgId` (required): Calendar surgery (procedure) UUID. The procedure the user has selected on the form. The backend fetches it (with hospital, procCpt, clerkProc) to build context for the AI.

**Request Body:** `multipart/form-data` with a single file field:
- **Field name:** `audio` (required)
- **Value:** The recorded audio file (binary). Allowed MIME types: `audio/webm`, `audio/mp3`, `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`, `audio/aac`. Maximum file size: **20 MB**.

**Response (200 OK):**
Standard wrapper; `data` contains the generated surgical notes:
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": {
    "surgicalNotes": "PREOPERATIVE DIAGNOSIS:\n...\n\nPROCEDURE PERFORMED:\n...\n\n[Full AI-generated surgical notes text]"
  }
}
```

**Error Response (400 Bad Request):** Missing or invalid audio (e.g. wrong field name or MIME type not in allowed list). Standard error wrapper: `{ "status": "error", "statusCode": 400, "message": "Bad Request", "error": "<message>" }`.

**Error Response (404 Not Found):** CalSurg not found (invalid id or wrong institution). Standard error wrapper: `{ "status": "error", "statusCode": 404, "message": "Not Found", "error": "<message>" }`.

**Error Response (500 Internal Server Error):** AI service not configured or Gemini failure. Standard error wrapper: `{ "status": "error", "statusCode": 500, "message": "Internal Server Error", "error": "<message>" }`.

**Notes:**
- **Candidates**, **supervisors**, **institute admins**, and **super admins** can call this endpoint; other roles receive 403.
- Use on the **create submission** form: the frontend has `calSurgId` (or `procDocId`) as soon as the user selects a procedure; no submission needs to be saved first.
- Audio is not stored (multer memory storage).

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

## Clinical Submissions (`/clinicalSub`)

Clinical activities logged by candidates and reviewed by their **assigned** supervisor. Available when the institution's `isClinical` flag is true.

### Rate Limiting

- **GET endpoints:** 200 requests per 15 minutes per user
- **POST/PUT endpoints:** 50 requests per 15 minutes per user

### Get All Clinical Submissions
**GET** `/clinicalSub`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin

Role-scoped transparently: admins see **all**; a **candidate** sees only their own rows (`candDocId` = caller); a **supervisor** sees only rows assigned to them (`supervisorDocId` = caller).

### Get Clinical Submissions for Signed-in Supervisor
**GET** `/clinicalSub/super`

**Requires:** Supervisor, Institute Admin, or Super Admin

Supervisor: own assigned rows only; admins: all. The embedded candidate/supervisor objects are **censored** (no password, email, or phone).

### Get Clinical Submissions for Signed-in Candidate
**GET** `/clinicalSub/cand`

**Requires:** Candidate, Institute Admin, or Super Admin

Candidate: own rows only; admins: all. Censored relations as above.

### Get Clinical Sub by ID
**GET** `/clinicalSub/:id`

**Requires:** any of the roles above — but the row is returned only if the caller is an admin, the **owner candidate**, or the **assigned supervisor** (403 otherwise).

### Create Clinical Sub
**POST** `/clinicalSub`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin

**Request Body:** `candDocId` (UUID), `supervisorDocId` (UUID), `dateCA` (ISO 8601), `typeCA` (clinical-activity-type enum), `description?` (string).

When the caller is a **candidate**, `candDocId` is forced from the JWT (any body value is ignored) — a candidate can only create their own clinical submissions.

### Update / Review Clinical Sub
**PUT** `/clinicalSub/:id`

**Requires:** the **assigned supervisor** (`supervisorDocId` = caller) or an admin.

- Candidates **cannot** review/approve their own clinical submissions, and non-assigned supervisors cannot touch them (2026-07 security audit, F4/F7 — self-approval fixed).
- Non-admin callers cannot reassign `candDocId` / `supervisorDocId` (the fields are stripped from their updates).

---

## Activity Timeline (`/activityTimeline`)

Chronological timeline of the **candidate** user's recent activity (submissions and event attendance). Only candidates receive data; other roles receive an empty list.

### Rate Limiting
- **GET** `/activityTimeline`: 200 requests per 15 minutes per user (user-based rate limiting).

### Get Activity Timeline
**GET** `/activityTimeline`

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Scope:** the timeline is scoped to the signed-in candidate's submissions and attendance.

Returns the latest **10** activities for the logged-in **candidate** user, merged from submissions and attendance records, ordered by datetime descending (newest first). Only activity **created by** the candidate (their submissions, their attendance) is included. Supervisors, institute admins, and super admins may call the endpoint but receive an empty list unless logged in as a candidate.

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
    "items": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "type": "submission",
        "datetime": "2025-01-20T14:30:00.000Z",
        "title": "Surgery submission (approved)",
        "metadata": {
          "submissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "subStatus": "approved",
          "patientName": "John Patient",
          "procedureName": ["Craniotomy for tumor", "Tumor resection"]
        }
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "type": "attendance",
        "datetime": "2025-01-19T10:00:00.000Z",
        "title": "Attended lecture: Neuroanatomy Basics",
        "metadata": {
          "eventId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
          "eventType": "lecture",
          "eventTitle": "Neuroanatomy Basics",
          "points": 1
        }
      }
    ]
  }
}
```

**Response schema:** `data` has `items` (array). Use `data.items` for the activity list.

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Latest 10 activities, newest first |
| `items[].id` | string (UUID) | Unique activity id (submission or attendance record id) |
| `items[].type` | string | `"submission"` or `"attendance"` |
| `items[].datetime` | string (ISO 8601) | When the activity occurred |
| `items[].title` | string | Human-readable title |
| `items[].metadata` | object | Type-specific fields. For `submission`: `submissionId`, `subStatus`, `patientName`, `procedureName` (array). For `attendance`: `eventId`, `eventType`, `eventTitle`, `points`. |

**Role-based access:** Logged-in users, supervisors, institution admins, and super admins may call this endpoint. Only **candidates** receive non-empty `items`; others receive `items: []`.

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

**Status:** DISABLED — returns `410 Gone`. See [Disabled, Gated & Removed Routes](#disabled-gated--removed-routes) and [docs/DISABLED_ROUTES.md](./docs/DISABLED_ROUTES.md).

**Requires (when re-enabled):** No authentication

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

### Update Candidate Approved
**PUT** `/cand/:id/approved`

**Requires:** Authentication (Super Admin or Institute Admin only)

**Rate Limit:** 200 requests per 15 minutes per user (user-based)


**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Candidate UUID

**Request Body:**
```json
{
  "approved": true
}
```
- `approved` (boolean, required): New approval status for the candidate.

**Response (200 OK):** Returns the updated candidate document (same shape as GET `/cand/:id`).

**Response (404 Not Found):** Candidate not found in the institution.

**Response (403 Forbidden):** Caller is not Super Admin or Institute Admin.

---

### Update Candidate
**PUT** `/cand/:id`

**Requires:** Super Admin, Institute Admin, or the candidate themself · **Rate Limit:** 50 / 15 min per user

**Request Body** (all optional): `email`, `password` (≥8), `fullName`, `phoneNum` (≥11), `regNum`, `nationality`, `rank`, `regDeg`, `approved`, `departmentId` (UUID, validated against the mirrored `departments`; unknown ids rejected).

**Behavior:**
- **Candidate:** may update **only their own** record (403 otherwise), restricted to `regDeg`, `regNum`, `phoneNum`, and a **`departmentId` self-switch**.
- **Department self-switch:** the response carries a fresh `token`, and **both** `auth_token`/`refresh_token` cookies are re-set with the new `departmentId` claim. The frontend must adopt the token and invalidate all cached queries (every department-scoped read changes).
- Clerks and supervisors are explicitly rejected (403) even though the role hierarchy would otherwise admit them (2026-07 security audit, F3 — candidate account-takeover fix).
- **Admins:** full field control; `password` is bcrypt-hashed; `departmentId` validated.
- The password hash is stripped from every response.

**Response (200 OK):** the updated candidate (password stripped; plus `token` on a self department switch). **404** if not found.

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

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

**Response format:** Success responses return the **raw** body (array or object). There is no wrapper like `{ status, data }` unless otherwise noted for specific endpoints.

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

**Note:** Both types can participate in events. Only validator supervisors can review submissions. **Password is never returned** in any supervisor response (censored or uncensored).

### Supervisor Model

```ts
interface ISupervisor {
  email: string;
  password: string;        // Never returned in API responses
  fullName: string;
  phoneNum: string;
  approved: boolean;
  role: "supervisor";
  canValidate?: boolean;  // true = validator (default), false = academic only
  canValClin?: boolean;   // true = can validate clinical submissions (clinical sub), false = cannot (default false)
  position?: TSupervisorPosition;
  termsAcceptedAt?: Date;
}

// position is one of:
// "Professor" | "Assistant Professor" | "Lecturer" | "Assistant Lecturer" | "Guest Doctor" | "Consultant" | "unknown"

// Censored response (GET /supervisor and GET /supervisor/:id for Clerk, Supervisor, Candidate):
// No email, phone, or password.
interface ISupervisorCensoredDoc {
  id: string;
  fullName: string;
  position?: TSupervisorPosition;
  canValidate?: boolean;
  canValClin?: boolean;   // true = can validate clinical submissions (clinical sub)
  approved: boolean;
  role?: string;
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

**Department-scoped:** returns only supervisors of the resolved department (JWT claim → `?deptCode` → NS default). Feeds the candidate submission-form supervisor picker and the calendar-manager event presenter picker. Results are censored (no email/phone/password) for non-admin viewers.

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
Returns a list of all supervisors in the institution. Response body is the **raw array** of supervisor objects (no wrapper). Accessible to Super Admin, Institute Admin, Supervisor, and Candidate.

**Response shape by role:**
- **Super Admin, Institute Admin:** Full supervisor data (uncensored), excluding `password`, `createdAt`, `updatedAt`. Fields: `id`, `email`, `fullName`, `phoneNum`, `approved`, `role`, `canValidate`, `canValClin`, `position`, `termsAcceptedAt`.
- **Clerk, Supervisor, Candidate:** Censored data only (no email, phone, or password). Fields: `id`, `fullName`, `position`, `canValidate`, `canValClin`, `approved`, `role`.

**Response (200 OK) – Uncensored (Super Admin / Institute Admin):**  
Body is a JSON **array**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "supervisor@example.com",
    "fullName": "Dr. Jane Smith",
    "phoneNum": "+1234567890",
    "approved": true,
    "role": "supervisor",
    "canValidate": true,
    "canValClin": false,
    "position": "Professor"
  }
]
```

**Response (200 OK) – Censored (Clerk / Supervisor / Candidate):**  
Body is a JSON **array** (no email, phone, or password):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Dr. Jane Smith",
    "position": "Professor",
    "canValidate": true,
    "canValClin": false,
    "approved": true,
    "role": "supervisor"
  }
]
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
- Accessible to Super Admins, Institute Admins, Clerks, Supervisors, and Candidates. Clerks, Supervisors, and Candidates receive censored data only.
- All endpoints are protected with user-based rate limiting (see Rate Limiting section above)

---

### Get Supervisor by ID
**GET** `/supervisor/:id`

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

**URL Parameters:**
- `id` (required): Supervisor UUID (must be a valid UUID format)

**Description:**  
Returns a specific supervisor by ID. Response body is the **raw** supervisor object or `null` if not found (no wrapper). Accessible to Super Admin, Institute Admin, Clerk, Supervisor, and Candidate.

**Response shape by role:**
- **Super Admin, Institute Admin:** Full supervisor data (uncensored), excluding `password`, `createdAt`, `updatedAt`.
- **Clerk, Supervisor, Candidate:** Censored data only. Fields: `id`, `fullName`, `position`, `canValidate`, `approved`, `role`. Password is never returned.

**Response (200 OK) – Uncensored (Super Admin / Institute Admin):**  
Body is a single **object**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "supervisor@example.com",
  "fullName": "Dr. Jane Smith",
  "phoneNum": "+1234567890",
  "approved": true,
  "role": "supervisor",
  "canValidate": true,
  "canValClin": false,
  "position": "Professor"
}
```

**Response (200 OK) – Censored (Clerk / Supervisor / Candidate):**  
Body is a single **object** (no email, phone, or password):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "Dr. Jane Smith",
  "position": "Professor",
  "canValidate": true,
  "canValClin": false,
  "approved": true,
  "role": "supervisor"
}
```

---

### Update Supervisor Approved
**PUT** `/supervisor/:id/approved`

**Requires:** Authentication (Super Admin or Institute Admin only)

**Rate Limit:** 200 requests per 15 minutes per user (user-based)


**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```

**URL Parameters:**
- `id` (required): Supervisor UUID

**Request Body:**
```json
{
  "approved": true
}
```
- `approved` (boolean, required): New approval status for the supervisor.

**Response (200 OK):** Returns the updated supervisor document (same shape as GET `/supervisor/:id` for admins).

**Response (404 Not Found):** Supervisor not found in the institution.

**Response (403 Forbidden):** Caller is not Super Admin or Institute Admin.

---

### Update Supervisor
**PUT** `/supervisor/:id`

**Requires:** Super Admin, Institute Admin, or the supervisor themself · **Rate Limit:** 50 / 15 min per user

**Request Body** (all optional): `email`, `password` (≥8), `fullName`, `phoneNum` (≥11), `approved`, `canValidate`, `canValClin`, `position` (enum), `departmentId` (UUID, validated against the mirrored `departments`).

**Behavior:**
- **Supervisor:** may update **only their own** record (403 otherwise), restricted to `phoneNum`, `position`, and a **`departmentId` self-switch**.
- **Department self-switch:** the response carries a fresh `token`, and **both** `auth_token`/`refresh_token` cookies are re-set with the new `departmentId` claim — the frontend must adopt it and invalidate cached queries. A switched supervisor disappears from other departments' supervisor pickers (`GET /supervisor` is department-scoped).
- **Admins:** full field control (including `approved`, `canValidate`, `canValClin`); `password` bcrypt-hashed.
- The password hash is stripped from every response.

**Response (200 OK):** the updated supervisor (password stripped; plus `token` on a self department switch). **404** if not found.

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

**⚠️ DISABLED IN PRODUCTION:** returns **410 Gone** (`{ "error": "This endpoint is disabled in production.", "code": "ENDPOINT_DISABLED" }`) whenever `NODE_ENV` is not `development` or `staging`. This is the highest-blast-radius operation (it resets EVERY supervisor's password at once), disabled in production alongside enabling super-admin there. See `docs/SUPERADMIN_PRODUCTION_ENABLEMENT_PLAN.md`.

**Requires (dev/staging only):** Super Admin authentication

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

Calendar surgeries are **department-scoped** (see [Department Scoping](#single-institution-architecture--department-scoping)). Rows carry three procedure representations plus bilingual patient-name slots:

- `clerkProc { _id, title, titleAr, titleEn }` — the clerk's learned free-text phrase (what the calendar shows);
- `procCpt { _id, title, arTitle, numCode, alphaCode }` — the mapped CPT procedure;
- `patientNameAr` / `patientNameEn` — bilingual patient-name slots (initials-aware transliteration).

### Rate Limiting

- **GET endpoints:** 200 requests per 15 minutes per user
- **POST/PATCH/DELETE endpoints:** 50 requests per 15 minutes per user
- **External import:** 50 requests per 15 minutes per IP (strict)

### Create CalSurg (webapp)
**POST** `/calSurg`

**Requires:** Clerk, Institute Admin, or Super Admin

**Request Body:**
```json
{
  "hospital": "0b808c24-ab60-43ce-8a5e-ce3aa86730d2",
  "patientName": "أحمد م خ",
  "gender": "male",
  "procedureText": "شفط دم من المخ",
  "surgeryDate": "2026-07-15",
  "patientDob": "1980-01-01",
  "departmentId": "c9a1..."
}
```

**Field Requirements:**
- `hospital` (required): hospital UUID
- `patientName` (required, ≤255): privacy format (first name + initials) is enforced server-side
- `gender` (required): `"male"` or `"female"`
- `procedureText` (required, free text ≤500): the clerk's own words — **NOT a UUID**. The first time a phrase is seen in a department it is learned (`clerk_procs`): resolved to a CPT via the hub's semantic procedure search and translated to bilingual titles; repeats are free.
- `surgeryDate` (required, ISO 8601) · `patientDob` (optional; defaults to `surgeryDate`)
- `departmentId` (optional UUID): department resolution = body → JWT claim → NS default

**Behavior:**
- **Instant save** (~1–2 s): CPT resolution and bilingual enrichment complete in the background after the response.
- `clerkId` is stamped from the JWT when the caller is a clerk.

**Response (201 Created):** the created row (hospital relation loaded; `procCpt`/`clerkProc`/bilingual name slots may fill in asynchronously).

### Create CalSurg from External
**POST** `/calSurg/postAllFromExternal`

**Status:** 🔐 **Migration-key-gated** (`X-Migration-Key`; **503** when `MIGRATION_API_KEY` is unset, **401** on a wrong key). Operator sheet-import: body `{ "row"?, "startRow"? }`; matches procedures by exact `proc_cpts` title/arTitle; dedupes by `google_uid`.

### Get CalSurg by ID
**GET** `/calSurg/getById?_id=<uuid>`

**Requires:** any authenticated role. Returns the row with `hospital`, `procCpt`, and `clerkProc` relations. Unscoped by-id read.

### Get Clerk Procedure Phrases (typeahead)
**GET** `/calSurg/clerkProcs`

**Requires:** Clerk, Institute Admin, or Super Admin · department-scoped (JWT claim → `?deptCode` → NS)

Feeds the surgery-create typeahead: the department's previously learned clerk phrases with their bilingual titles and mapped CPTs.

### Get CalSurg Dashboard (Trimmed)
**GET** `/calSurg/dashboard`

**Requires:** any authenticated role · department-scoped (JWT claim → `?deptCode` → NS)

This is the calendar feed for the candidate dashboard and supervisor logbook. Last **60 days**, max 1000 rows, `procDate DESC`. Each row: `_id`, `patientName`, `patientNameAr`, `patientNameEn`, `gender`, `procDate`, `hospital { _id, engName, arabName }`, `procCpt { _id, title, arTitle, numCode, alphaCode }`, `clerkProc { _id, title, titleAr, titleEn }` (`formLink`, `google_uid`, `createdAt`, `updatedAt` stripped).

### Get All CalSurg with Filters
**GET** `/calSurg/getAll`

**Requires:** any authenticated role · department-scoped (JWT claim → `?deptCode` → NS)

**Query modes:**
- `?recent=<1–200>` — **work-queue mode**: latest created/edited first (`updatedAt DESC`), bounded. Used by the calendar-manager surgeries list.
- `?month=YYYY-MM` · `?year=YYYY` · `?day=YYYY-MM-DD` · `?startDate=&endDate=` — date-scoped (bounded to the last 2 years, not future). The month mode is what the calendar views use (unscoped getAll of all rows is ~10 MB; a month is ~200 KB).
- No filters — all rows, `procDate DESC` (avoid; prefer a mode above).

Rows carry `hospital`, `procCpt`, `clerkProc` relations plus the bilingual patient-name slots.

### Update CalSurg
**PATCH** `/calSurg/:id`

**Requires:** Clerk, Institute Admin, or Super Admin

A **clerk** may only edit rows of their own department (JWT claim / `?deptCode` vs. the row's department; 403 otherwise); admins are institution-wide. A `patientName` edit re-derives the bilingual name slots in the background (slots never go stale). A `procedureText` edit re-runs the phrase-learning pipeline.

### Delete CalSurg
**DELETE** `/calSurg/:id`

**Requires:** Clerk (**own department only**), Institute Admin, or Super Admin.

---

## Diagnosis (`/diagnosis`)

**Read-only** reference data mirrored from the hub. All write routes (`POST /post`, `POST /postBulk`, `PATCH /:id`, `DELETE /:id`) are **gone (404)**.

### Get All Diagnoses
**GET** `/diagnosis`

**Requires:** Super Admin · **Rate Limit:** 200 / 15 min per user · department-scoped (`?deptCode` → JWT claim → NS)

Returns the diagnoses linked to the department (via `department_diagnoses`).

**Response (200 OK):** array of:
```json
{
  "id": "uuid",
  "icdCode": "8B01",
  "icdName": "subarachnoid hemorrhage",
  "icdArName": "نزيف تحت العنكبوتية",
  "neuroLogName": "SAH",
  "createdAt": "…",
  "updatedAt": "…"
}
```
(ICD-11 codes; `icdArName` = Arabic name, present on all mirrored rows.)

---

## Procedure CPT (`/procCpt`)

**Read-only** mirrored CPT catalog. All write routes (`POST`, `POST /upsert`, `POST /postAllFromExternal`, `PUT/PATCH /:id`, `DELETE /:id`) are **gone (404)**.

### Get All Procedure CPT Codes
**GET** `/procCpt`

**Requires:** Super Admin, Institute Admin, or Clerk · **Rate Limit:** 200 / 15 min per user · department-scoped (`?deptCode` → JWT claim → NS, via the department's main-diagnosis links)

**Response (200 OK):** array of:
```json
{
  "id": "uuid",
  "title": "craniotomy for evacuation of hematoma",
  "arTitle": "…",
  "alphaCode": "CRAN",
  "numCode": "61312",
  "description": "…",
  "createdAt": "…",
  "updatedAt": "…"
}
```

---

## Main Diagnosis (`/mainDiag`)

**Read-only** mirrored diagnosis categories with their linked diagnoses and procedures. All write routes (`POST`, `PUT /:id`, `POST /:id/procs/remove`, `POST /:id/diagnosis/remove`, `DELETE /:id`) are **gone (404)**.

### Get All Main Diagnoses
**GET** `/mainDiag`

**Requires:** any authenticated role · **Rate Limit:** 200 / 15 min per user · department-scoped (`?deptCode` → JWT claim → NS)

Each row loads the `procs` and `diagnosis` relations as full bilingual mirror entities (`arTitle`, `arDescription`, `icdArName`, descriptions — everything the hub carries).

### Get Main Diagnosis by ID
**GET** `/mainDiag/:id`

**Requires:** any authenticated role. Unscoped by-id read. **404** if not found.

### Get Additional Questions for a Main Diagnosis
**GET** `/mainDiag/:mainDiagId/questions`

**Requires:** any authenticated role

The scaled per-department additional-questions framework (replaces the legacy six-flag `/additionalQuestions` module). Option lists are already narrowed per main diagnosis where narrowing is configured.

**Response (200 OK):** array of:
```json
{
  "id": "uuid",
  "key": "approach",
  "label": "Surgical approach",
  "arLabel": "…",
  "inputType": "single_choice",
  "isRequired": true,
  "sortOrder": 1,
  "options": [
    { "id": "uuid", "value": "open", "arValue": "…", "sortOrder": 1 }
  ]
}
```
`inputType` ∈ `single_choice | multi_choice | free_text`; `free_text` questions have empty `options`. Submission answers are posted inside `POST /sub/candidate/submissions` as the `answers[]` array keyed by question id.

---

## Additional Questions (`/additionalQuestions`)

**Status:** ❌ the legacy six-flag `/additionalQuestions` module is **no longer mounted** (404). Per-diagnosis dynamic questions are served by **`GET /mainDiag/:mainDiagId/questions`** (see [Main Diagnosis](#main-diagnosis-maindiag)).

---

## Consumables (`/consumables`)

**Read-only** mirror. Write routes are **gone (404)**.

### Get All Consumables
**GET** `/consumables`

**Requires:** any authenticated role · **Rate Limit:** 200 / 15 min per user · department-scoped (`?deptCode` → JWT claim → NS)

**Response (200 OK):** array of `{ "id", "consumables", "arName" }` (`consumables` = English name, `arName` = Arabic name — populated on all mirrored rows).

### Get Consumable by ID
**GET** `/consumables/:id`

**Requires:** any authenticated role. Returns `{ "id", "consumables", "arName" }`. **404** if not found.

---

## Equipment (`/equipment`)

**Read-only** mirror. Write routes are **gone (404)**.

### Get All Equipment
**GET** `/equipment`

**Requires:** any authenticated role · **Rate Limit:** 200 / 15 min per user · department-scoped (`?deptCode` → JWT claim → NS)

**Response (200 OK):** array of `{ "id", "equipment", "arName" }`.

### Get Equipment by ID
**GET** `/equipment/:id`

**Requires:** any authenticated role. Returns `{ "id", "equipment", "arName" }`. **404** if not found.

---

## Positions (`/positions`)

**Status:** ❌ the standalone `GET /positions` routes are **not registered** (404), and all position write routes are gone. The positions lookup list is served inside the **`GET /references`** bundle (array `positions`). It is a fallback option list used only when a main diagnosis has no configured question options.

---

## Approaches (`/approaches`)

**Status:** ❌ same as Positions — no standalone routes (404); served as the `approaches` array of the **`GET /references`** bundle.

---

## Regions (`/regions`)

**Status:** ❌ same as Positions — no standalone routes (404); served as the `regions` array of the **`GET /references`** bundle.

---

## References (`/references`)

### Get All References (Aggregated)
**GET** `/references`

**Requires:** any authenticated role · **Rate Limit:** 200 / 15 min per user

One-shot bundle for the submission form. Response object keys (arrays): **`consumables`, `equipment`, `approaches`, `regions`, `positions`**. Equipment and consumables are department-scoped (JWT claim → NS default) and include `arName`.

**Caching:** served with **`Cache-Control: private, no-cache`** — browsers must revalidate on every use (ETag 304s keep this cheap). Do **not** rely on long-lived HTTP caching of this bundle; it previously used `max-age=86400`, which made Chrome serve stale bodies from disk cache for a day.

---

## Candidate Dashboard (`/candidate/dashboard`)

This endpoint is implemented by the **bundler** module (same module as GET /references). The bundler module provides aggregated responses to reduce round-trips: **GET /references** (reference lists) and **GET /candidate/dashboard** (candidate dashboard bundle).

**Implementation note:** The dashboard is optimized for throughput: one submission load per request (candidate submissions fetched once), with stats, CPT/ICD/supervisor analytics and the submissions list derived in memory. Event points and submission/academic rankings use batched candidate and supervisor lookups to avoid N+1 queries. There is no server-side caching; each request computes fresh data for the authenticated candidate. The bundled CPT/ICD analytics items carry the Arabic labels (`arTitle` on CPT items, `icdArName` on ICD items) for bilingual dashboard cards.

**GET** `/candidate/dashboard` returns a single response whose **shape depends on the institution's feature flags** (from `GET /institution`):

- **Academic + practical + clinical:** full bundle with **ten** keys — the nine below plus `clinicalSubCand` (same as GET /clinicalSub/cand: the signed-in candidate's clinical subs with censored candidate/supervisor).
- **Academic + practical:** full bundle — **nine** keys (stats, points, submissions, cptAnalytics, icdAnalytics, supervisorAnalytics, activityTimeline, submissionRanking, academicRanking).
- **Practical only:** practical bundle — **seven** keys (no `points`, no `academicRanking`).

**Access:** Logged-in **candidates only**, and only when the institution has **practical** enabled (`isPractical: true`; otherwise **403**). Rankings inside the bundle are **department-scoped** to the candidate's department.

### Rate Limiting

- **GET** `/candidate/dashboard`: 200 requests per 15 minutes per user

### Get Candidate Dashboard (Aggregated)
**GET** `/candidate/dashboard`

**Requires:** Authentication (Candidate only). Institution must have `isPractical: true`.

**Response (200 OK) – Full bundle** (institution is academic and practical):
A single JSON object with **nine** keys (or **ten** when the institution is also clinical). Body returned directly; no top-level `status`/`data` wrapper:

- `stats` – same as GET /sub/candidate/stats
- `points` – same as GET /event/candidate/points
- `submissions` – same as GET /sub/candidate/submissions
- `cptAnalytics` – same as GET /sub/cptAnalytics (items include `arTitle`)
- `icdAnalytics` – same as GET /sub/icdAnalytics (items include `icdArName`)
- `supervisorAnalytics` – same as GET /sub/supervisorAnalytics
- `activityTimeline` – same as GET /activityTimeline (object with `items` array)
- `submissionRanking` – same as GET /sub/submissionRanking (department-scoped)
- `academicRanking` – same as GET /event/academicRanking (department-scoped)
- `clinicalSubCand` – *(only when `isClinical: true`)* same as GET /clinicalSub/cand

**Response (200 OK) – Practical-only bundle:** seven keys (no `points`, no `academicRanking`).

**Error Responses:** 401 Unauthorized, 403 Forbidden (not a candidate, or the institution does not have practical enabled), 429 Too Many Requests, 500 Internal Server Error. On 403 the front end should fall back to calling the individual endpoints.

---

## Arabic Procedures (`/arabProc`)

**Status:** ❌ **RETIRED** (2026-07-15). The `arab_procs` table and every `/arabProc/*` route were removed — all paths return **404**. Replacements:

- Calendar-surgery creation takes free-text **`procedureText`** (the clerk's phrase, learned and auto-mapped to a CPT via semantic search).
- Arabic display names come from `procCpt.arTitle` and `clerkProc.titleAr`.
- The clerk typeahead is **`GET /calSurg/clerkProcs`**.

---

## Hospitals (`/hospital`)

Tenant data (not hub-mirrored): hospitals/units, each scoped to one department. **Add + edit only — DELETE was removed** (hospitals are referenced by calendar-surgery history and must never be deleted through the API).

### Rate Limiting

- **GET endpoints:** 200 / 15 min per user · **POST/PUT:** 50 / 15 min per user

### Get All Hospitals
**GET** `/hospital`

**Requires:** any authenticated role (candidate and up)

**Response (200 OK):** array of hospitals `{ id, engName, arabName, location?, departmentId, … }`.

### Get Hospital by ID
**GET** `/hospital/:id`

**Requires:** any authenticated role. **404** if not found.

### Create Hospital
**POST** `/hospital/create`

**Requires:** **Super Admin**

**Request Body:**
- `engName` (required, ≤100) · `arabName` (required, ≤100)
- `departmentId` (required UUID — every hospital is scoped to one department)
- `location.long` / `location.lat` (optional floats; validated ranges ±180/±90)

**Response (201 Created):** the created hospital.

### Update Hospital
**PUT** `/hospital/:id`

**Requires:** **Super Admin**. Same fields as create (all optional on update). **404** if not found.

### Delete Hospital
**DELETE** `/hospital/:id`

**Status:** ❌ **REMOVED** — the route is not registered (404).

---

## Demo Requests (`/demoRequest`)

### Submit a Demo Request
**POST** `/demoRequest`

**Status:** ✅ **PUBLIC ENDPOINT** (no authentication) — powers the landing page's "Book a demo" form.

**Rate Limit:** dedicated limiter — **5 requests per 15 minutes per IP** (429 beyond), plus the global IP limiter.

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith",
  "email": "jane@hospital.org",
  "organization": "Cairo University Hospital",
  "phoneNum": "+201000000000",
  "message": "We'd like to see the logbook workflow.",
  "website": "",
  "elapsedMs": 8400
}
```

- `fullName` (required, 2–120) · `email` (required, valid email, ≤255)
- `organization` (optional ≤160) · `phoneNum` (optional ≤32) · `message` (optional ≤2000)
- `website`: **honeypot** — the frontend renders it invisibly and always sends `""`; any non-empty value marks the request as a bot.
- `elapsedMs`: milliseconds between form render and submit (minimum-fill-time heuristic).

**Response (201 Created)** — ⚠️ **intentionally identical on every non-validation path** (anti-bot: no oracle reveals whether the request was stored, emailed, or silently discarded):
```json
{
  "status": "success",
  "statusCode": 201,
  "message": "Created",
  "data": { "message": "Thanks — we'll be in touch soon." }
}
```

**Other responses:** **400** validator format errors · **429** rate limited.

**Behavior (server-side, opaque to callers):** accepted requests are stored in the `demo_requests` table first (leads are never lost), then a notification email is sent to `DEMO_REQUEST_NOTIFY_EMAIL` (default `contact@medscribe.health`) via Mailgun. Silent-discard layers: honeypot, fill-time < 3 s, per-email cap (1/24 h), per-IP cap (3/24 h). A **global budget of 20 notification emails per UTC day** stores further leads without emailing (inbox + Mailgun reputation protection). No auto-reply is ever sent to the requester. Env knobs: `DEMO_REQUEST_MIN_FILL_MS`, `DEMO_REQUEST_PER_EMAIL_PER_DAY`, `DEMO_REQUEST_PER_IP_PER_DAY`, `DEMO_REQUEST_EMAIL_BUDGET_PER_DAY`, `DEMO_REQUEST_DEV_LOG` (dev only). See `docs/BOOK_A_DEMO_PLAN.md`.

---

## Mailer (`/mailer`)

### Send Email
**POST** `/mailer/send`

**Status:** ❌ **DISABLED — always returns `410 Gone`** (2026-07 security audit, F10: caller-controlled from/to/html was a phishing vector, and the route had zero frontend usage). Transactional email (signup OTP codes, password-reset links) is sent server-side via Mailgun and needs no API route.

---

## External Service (`/external`)

### Get Sheet Data
**GET** `/external?spreadsheetName=<name>&sheetName=<name>[&row=<n>]`

**Status:** 🔐 **Migration-key-gated** (operator tooling — not for app use)

Requires the `X-Migration-Key` header matching `MIGRATION_API_KEY`; **503** when the env var is unset (the production default), **401** on a wrong key. No JWT. IP rate-limited (strict).

Generic Google-Sheets read proxy used by the operator migration scripts (formerly documented as "Get Arab Procedure Data").

---

## Lectures (`/lecture`)

**Read-only** mirror of the hub's per-department curriculum (`departments → lecture_topics → lectures`). All write routes (`POST`, `PATCH /:id`, `DELETE /:id`, `POST /postBulk`) are **gone (404)**.

### Rate Limiting

- 200 requests per 15 minutes per user

### Get All Lectures
**GET** `/lecture`

**Requires:** Supervisor, Clerk, Institute Admin, or Super Admin · department-scoped (`?deptCode` → JWT claim → NS)

**Response (200 OK):** array of:
```json
{
  "id": "uuid",
  "lectureTitle": "Anatomy of the skull base",
  "mainTopic": "cns tumors",
  "level": "msc",
  "lectureNumber": "1.3.2",
  "arTitle": "…"
}
```
- `lectureTitle` / `mainTopic` are legacy-shape aliases of the scaled schema's lecture `title` and parent-topic title.
- `level` ∈ `msc | md | null`.
- `lectureNumber` + `arTitle` are additive fields used by the bilingual lecture pickers.

### Get Lecture by ID
**GET** `/lecture/:id`

**Requires:** Supervisor, Clerk, Institute Admin, or Super Admin

**Response (200 OK):** `{ id, lectureTitle, mainTopic, arTitle, lectureNumber, sortOrder, level, topicId, google_uid: null, createdAt, updatedAt }`. **404** if not found.

---

## Journals (`/journal`)

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

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
- `_id` (string, required): Journal UUID (use `id` in responses)
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

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

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
- `_id` (string, required): Conference UUID (use `id` in responses)
- `confTitle` (string, required): Title of the conference
- `google_uid` (string, required): Google Sheets unique identifier
- `presenter` (string, required): UUID reference to Supervisor
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

**Note:** Single-institution server — all data belongs to the one KA institution (no institution routing). Department-scoped behavior, where present, is described per endpoint; see [Single-Institution Architecture & Department Scoping](#single-institution-architecture--department-scoping).

The Events module lets clerks and admins schedule lectures, journals, and conferences on a shared calendar, with associated presenters and candidate attendance.

**Department scoping:** `GET /event` and `GET /event/dashboard` return only the resolved department's events (JWT claim → `?deptCode` → NS default) and `POST /event` stamps the creator's department; by-presenter and by-id reads are unscoped. Event responses embed the lecture in legacy shape (`lecture.lectureTitle`, `lecture._id`) plus additive `arTitle` and `lectureNumber`.


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

All IDs are UUIDs (strings). The API accepts `lecture`, `journal`, `conf`, and `presenter` in request bodies; the backend maps these to `lectureId`, `journalId`, `confId`, and `presenterId` internally.

```ts
type TEventType = "lecture" | "journal" | "conf";
type TEventStatus = "booked" | "held" | "canceled";
type TAttendanceAddedByRole = "instituteAdmin" | "supervisor" | "candidate";

interface IEventAttendance {
  id?: string;                   // UUID (for populated records)
  candidateId: string;           // UUID ref: Candidate
  addedBy: string;               // UUID ref: User (who added the candidate)
  addedByRole: TAttendanceAddedByRole;
  flagged: boolean;              // Default: false
  flaggedBy?: string;            // UUID ref: User (who flagged, if flagged)
  flaggedAt?: Date;
  points: number;                // +1 if not flagged, -2 if flagged
  createdAt: Date;
}

interface IEvent {
  type: TEventType;
  lectureId?: string;            // UUID when type = "lecture" (input: "lecture")
  journalId?: string;            // UUID when type = "journal" (input: "journal")
  confId?: string;               // UUID when type = "conf" (input: "conf")
  dateTime: Date;
  location: string;
  presenterId: string;           // UUID: Supervisor (lecture/conf) or Candidate (journal) (input: "presenter")
  attendance: IEventAttendance[];
  status: TEventStatus;          // "booked" (default) | "held" | "canceled"
}

// Response/doc shape includes:
interface IEventDoc extends IEvent {
  id: string;                     // UUID
  createdAt: Date;
  updatedAt: Date;
  lecture?: any;                  // Populated when loaded
  journal?: any;
  conf?: any;
  presenter?: any;
  attendance?: IEventAttendance[];
}
```

#### Presenter Rules

- `type = "lecture"` or `type = "conf"` → `presenter` **must** be a valid Supervisor `_id`
- `type = "journal"` → `presenter` **must** be a valid Candidate `_id`

These rules are enforced in the backend (provider) by checking existence in the appropriate collection.

**Note:** In API responses, the `presenter` field is populated with the following (see `docs/EVENT_PRESENTER_POPULATION_UPDATE.md` for details):
- For **lecture** and **conf** events (presenter = Supervisor): `{ id, name, position? }` — `name` from supervisor `fullName`, `position` from supervisor academic position.
- For **journal** events (presenter = Candidate): `{ id, name, rank? }` — `name` from candidate `fullName`, `rank` from candidate academic rank.
- If the presenter entity is missing or lookup fails, `presenter` is still returned with `id` and `name: "—"`.

#### Attendance Rules

The `attendance` field is an array of attendance records with metadata:

- **`candidateId`**: UUID of the Candidate who is attending (request body). In responses, **`candidate`** may be populated with the full candidate object.
- **`addedBy`**: UUID of the User who added the candidate to attendance
- **`addedByRole`**: Role of who added (`"instituteAdmin"`, `"supervisor"`, or `"candidate"`)
- **`flagged`**: Boolean indicating if the candidate was flagged (default: `false`)
- **`flaggedBy`**: UUID of the User who flagged the candidate (if flagged)
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
- **`"canceled"`**: Event was canceled. This status is set only when explicitly sent in a PATCH request; it is not set automatically.

**Automatic Status Updates:**
- When `attendance` is updated and has entries → status automatically becomes `"held"`
- When `attendance` is updated to empty, status is not automatically changed (remains as-is unless `status` is sent in the request)
- Status can be set to `"booked"`, `"held"`, or `"canceled"` manually via the update endpoint

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
- `lecture` (required if `type = "lecture"`): valid UUID (Lecture)
- `journal` (required if `type = "journal"`): valid UUID (Journal)
- `conf` (required if `type = "conf"`): valid UUID (Conference)
- `dateTime`: required, ISO8601, converted to `Date`
- `location`: required string
- `presenter`: required, valid UUID (`Supervisor` for lecture/conf, `Candidate` for journal)
- `attendance` (optional): array of attendance objects or candidate UUIDs; defaults to empty array
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

### Get Event Dashboard (Trimmed)
**GET** `/event/dashboard`

**Requires:** Candidate, Supervisor, Clerk, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Dashboard endpoint returning events from **last 30 days** through **all future**. Optimized for candidate dashboard (isAcademic & isPractical institutions). Each item excludes `createdAt` and `updatedAt` for reduced payload size.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "id": "507f1f77bcf86cd799439020",
    "type": "lecture",
    "status": "held",
    "dateTime": "2025-01-15T10:00:00.000Z",
    "location": "main auditorium",
    "lecture": {
      "_id": "507f1f77bcf86cd799439011",
      "lectureTitle": "1.2.1: Introduction to Neurosurgery"
    },
    "journal": null,
    "conf": null,
    "presenter": {
      "_id": "6905e9dc719e11e810a0453c",
      "fullName": "Dr. John Doe"
    },
    "attendance": [
      {
        "candidate": {
          "_id": "692727ac12025d432235f620",
          "fullName": "Candidate A"
        },
        "flagged": false,
        "points": 1,
        "createdAt": "2025-01-15T09:00:00.000Z"
      }
    ]
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Insufficient permissions
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Events by Presenter (Supervisor ID)
**GET** `/event/by-presenter/:supervisorId`

**Requires:** Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**  
Returns all events where the given supervisor ID was the presenter. Each event includes aggregated attendance (candidates who attended, flagged status, points). Use this endpoint for the "My Events" supervisor dashboard or for admins to view a specific supervisor's presented events.

**Access rules:**
- **Supervisor:** Can only request their own events. Pass their own ID (from JWT) as `supervisorId`. Requests for another supervisor's ID return 403 Forbidden.
- **Institute Admin / Super Admin:** Can pass any supervisor ID to view that supervisor's presented events.

**Headers:**
```
Authorization: Bearer <token>
```
OR
```
Cookie: auth_token=<token>
```


**URL Parameters:**
- `supervisorId` (required): Supervisor UUID. Must be a valid UUID format.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "id": "507f1f77bcf86cd799439020",
    "type": "lecture",
    "status": "held",
    "dateTime": "2025-01-15T10:00:00.000Z",
    "location": "main auditorium",
    "lecture": {
      "_id": "507f1f77bcf86cd799439011",
      "lectureTitle": "1.2.1: Introduction to Neurosurgery"
    },
    "journal": null,
    "conf": null,
    "presenter": {
      "_id": "6905e9dc719e11e810a0453c",
      "fullName": "Dr. John Doe"
    },
    "attendance": [
      {
        "candidate": {
          "_id": "692727ac12025d432235f620",
          "fullName": "Candidate A"
        },
        "flagged": false,
        "points": 1,
        "createdAt": "2025-01-15T09:00:00.000Z"
      }
    ]
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid or missing supervisor ID (must be valid UUID)
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Supervisor attempting to request another supervisor's events
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
Same structure as a single item in the `GET /event` response. The `presenter` object is populated by event type:
- **Lecture/conf:** `presenter: { id: string, name: string, position?: string }` (Supervisor: fullName, position).
- **Journal:** `presenter: { id: string, name: string, rank?: string }` (Candidate: fullName, rank).

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
- `eventId`: Event UUID
- `candidateId`: Candidate UUID

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
- `eventId`: Event UUID
- `candidateId`: Candidate UUID

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
- `eventId`: Event UUID
- `candidateId`: Candidate UUID

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
- `eventId`: Event UUID
- `candidateId`: Candidate UUID

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
Returns all attended events for the logged-in candidate plus total academic points. The candidate ID is taken from the JWT. The response includes an `events` array (one object per attended event) and `totalPoints` (server-side sum of each event’s `points`).

**Points rules (per event):**

| Condition | Points |
|-----------|--------|
| Attended event | +1 |
| Flagged event | −2 (overrides positive points for that event) |
| Journal presenter only | +2 |
| Journal presenter + attendee | +3 (not cumulative with +1) |

Journal presenter status is determined from event participation records (presenter = journal event’s `presenterId`). Flagged events always yield −2. Points are computed per event; no double-counting of attendance and presentation.

**Event title resolution:** Lecture → lecture id + title; Journal → journal id + title; Conference → conference id + title.

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
    "events": [
      {
        "eventId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "type": "lecture",
        "presenter": {
          "presenterId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
          "name": "Dr. Jane Smith",
          "role": "supervisor",
          "position": "Professor"
        },
        "event": { "id": "lec-uuid-1", "title": "Neuroanatomy Basics" },
        "points": 1
      },
      {
        "eventId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "type": "journal",
        "presenter": {
          "presenterId": "d4e5f6a7-b8c9-0123-def0-123456789013",
          "name": "Dr. Ahmed Ali",
          "role": "candidate",
          "rank": "resident"
        },
        "event": { "id": "jour-uuid-1", "title": "Spinal Tumors Review" },
        "points": 3
      }
    ],
    "totalPoints": 4
  }
}
```

**Response schema:** `data` has `events` (array) and `totalPoints` (number). Each `events[]` item:

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string (UUID) | Event identifier |
| `type` | string | `"lecture"` \| `"journal"` \| `"conference"` |
| `presenter` | object | Presenter info |
| `presenter.presenterId` | string (UUID) | Presenter user id |
| `presenter.name` | string | Full name |
| `presenter.role` | string | `"candidate"` \| `"supervisor"` |
| `presenter.rank` | string (optional) | Present when `role === "candidate"` |
| `presenter.position` | string (optional) | Present when `role === "supervisor"` |
| `event` | object | Reference entity (lecture/journal/conf) |
| `event.id` | string (UUID) | Lecture, journal, or conference id |
| `event.title` | string | Lecture/journal/conference title |
| `points` | number | Points for this event (−2, +1, +2, or +3) |

**Error Response (401 Unauthorized):**
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized: No candidate ID found in token"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid JWT token, or no candidate ID found in token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Notes:**
- Candidate ID is taken from the JWT. Use `data.events` for the list and `data.totalPoints` for the sum.
- Calculation is server-side, deterministic, and idempotent; no client-side recalculation.

---

### Get Candidate Total Points by ID

**GET** `/event/candidate/:candidateId/points`

**Requires:** Candidate, Supervisor, Institute Admin, or Super Admin authentication

**Rate Limit:** 200 requests per 15 minutes per user

**Description:**
Same as **Get My Academic Points**, but for a specific candidate via `candidateId`. Returns `events` (all attended events for that candidate) and `totalPoints`. Points rules, event shape, and title resolution are identical.

**URL Parameters:**
- `candidateId`: Candidate UUID

**Response (200 OK):** Same structure as `GET /event/candidate/points`: `data.events` (array) and `data.totalPoints` (number).

**Error Responses:**
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User does not have `candidate`, `supervisor`, `instituteAdmin`, or `superAdmin` role
- `404 Not Found`: Candidate not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Academic Ranking (Academic Points)

**GET** `/event/academicRanking`

**Department-scoped:** ranks only candidates of the caller's department (JWT `departmentId` claim; NS default).

**Authentication Required:** Yes (Candidate, Supervisor, Institute Admin, or Super Admin)

**Rate Limit:** 200 requests per 15 minutes per user

**Scope:** department-scoped — only candidates of the caller's department are ranked (JWT `departmentId` claim; NS default).

Returns a **ranking** of academic (attendance) points. The endpoint returns **only**:
- The **top 10** ranked candidates (by total points, descending), and  
- The **logged-in candidate** (if the user is a candidate and not already in the top 10), as an additional entry with their actual rank.

No other candidates are returned. Points use the same per-event rules as **Get My Academic Points** (attendance +1, flagged −2, journal presenter +2, journal presenter+attendee +3). Ties are broken by `candidateId`. Computation and candidate loading are limited to those returned (top 10 + logged-in when applicable). Accessible by candidates, supervisors, institute admins, and super admins.

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
      "candidateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "candidateName": "Dr. Ahmed Ali",
      "rank": 1,
      "academicPoints": 42,
      "regDeg": "msc"
    },
    {
      "candidateId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "candidateName": "Dr. Sara Mohamed",
      "rank": 2,
      "academicPoints": 38,
      "regDeg": "doctor of medicine (md)"
    }
  ]
}
```

**Response schema:** `data` is an array of:
| Field | Type | Description |
|-------|------|-------------|
| `candidateId` | string (UUID) | Candidate identifier |
| `candidateName` | string | Candidate full name |
| `rank` | number | Rank (1 = top) |
| `academicPoints` | number | Total attendance points |
| `regDeg` | string | Registered degree (e.g. `msc`, `doctor of medicine (md)`) |

**Notes:** Top 10 are sorted by `academicPoints` descending; tie-breaker is `candidateId`. If the logged-in user is a candidate and outside the top 10, they appear as an extra entry with their true rank. Deterministic and idempotent; no client-side ranking or filtering.

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
- `id`: Event UUID

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
- If attempting to change dateTime of a "held" event → returns `400 Bad Request` with a simple error body:

**Error Response (400 Bad Request) - DateTime Validation Failed:**
```json
{
  "error": "Cannot change date of an event that has already been held"
}
```

**Note:** When `attendance` is updated:
- If `attendance` has entries → status automatically becomes `"held"`
- If `attendance` is empty, status is not automatically changed; set `status` in the request to change it
- Status can also be manually updated independently

**Status Change Validation:**
The backend enforces strict rules when changing event status based on attendance:

1. **Events with Unflagged Candidates**: If an event has at least one candidate with `flagged === false`, the status **must** be `"held"`. Cannot be changed to `"booked"` or `"canceled"`.

2. **Events with No Candidates**: If an event has no candidates in attendance, the status can only be `"booked"` or `"canceled"`. Cannot be changed to `"held"`.

3. **Events with Only Flagged Candidates**: If an event has candidates but all are flagged (`flagged === true`), all statuses are allowed (`"booked"`, `"held"`, or `"canceled"`).

**Error Response (400 Bad Request) - Status Validation Failed (unflagged candidates present):**
```json
{
  "error": "Cannot change status: Event has unflagged candidates and must remain as \"held\""
}
```

OR

```json
{
  "error": "Cannot change status to \"held\": Event has no candidates. Allowed statuses: \"booked\" or \"canceled\""
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
- `id`: Event UUID

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


## WhatsApp Bot (`/waBot`)

The `waBot` module exposes the Meta WhatsApp Cloud API webhook endpoints used as the **Callback URL** in the Meta App dashboard (`Customize use case > Configuration > Webhook`). Both endpoints are public (no JWT) because they are called server-to-server by Meta, but they are protected by request validation, IP rate limiting, and provider signature verification.

### Required Environment Variables

| Variable | Where to find it | Used by |
| --- | --- | --- |
| `WA_PHONE_NUMBER_ID` | Meta App > WhatsApp > API Setup ("Phone number ID") | Outbound (future), test scripts |
| `WA_API_KEY` | Meta App > WhatsApp > API Setup ("Temporary access token" or your permanent token) | Outbound (future) |
| `WA_VERIFY_TOKEN` | Random string you choose; paste the same value into Meta's "Verify token" field | `GET /waBot/webhook` handshake |
| `WA_APP_SECRET` | Meta App > Settings > Basic > "App Secret" | `POST /waBot/webhook` HMAC signature verification |

The webhook fails closed (returns `503 Service Unavailable`) if `WA_VERIFY_TOKEN` or `WA_APP_SECRET` is missing.

### Rate Limiting

Both routes use the strict IP-based limiter: **50 requests per 15 minutes per IP** on top of the global limiter (400 / 15 min per IP).

---

### Verify Webhook (Meta handshake)

**GET** `/waBot/webhook`

**Authentication:** None (called by Meta).

**Description:**
Meta calls this endpoint once when you click **"Verify and save"** on the Configuration page, and any time the Callback URL is re-verified. The server compares `hub.verify_token` against `WA_VERIFY_TOKEN` (constant-time) and echoes back the raw `hub.challenge` value as plain text.

**Query Parameters:**
- `hub.mode` (required): must be `subscribe`.
- `hub.verify_token` (required): must equal the `WA_VERIFY_TOKEN` env var.
- `hub.challenge` (required): non-empty string Meta expects echoed back verbatim.

**Response (200 OK):**
- `Content-Type: text/plain`
- Body: the raw value of `hub.challenge` (no JSON wrapper). This is intentional and required by Meta - the standard response wrapper does not apply to this endpoint.

**Error Responses:**
- `400 Bad Request`: missing or malformed query parameters.
- `403 Forbidden`: wrong `hub.mode` or `hub.verify_token`.
- `429 Too Many Requests`: rate limit exceeded.
- `503 Service Unavailable`: server is missing `WA_VERIFY_TOKEN`.
- `500 Internal Server Error`: unexpected error.

---

### Receive Webhook Events

**POST** `/waBot/webhook`

**Authentication:** None for the user, but the request **must** carry a valid `X-Hub-Signature-256` header signed with the Meta App Secret.

**Description:**
Meta delivers inbound message and message-status events here. The server:
1. Verifies the HMAC-SHA256 signature against the **raw** request body using `WA_APP_SECRET` (constant-time comparison).
2. Parses the payload into messages and statuses.
3. Logs structured info for each event.
4. Acknowledges quickly with `200 OK { "received": true }` (Meta retries on non-2xx).

**Headers:**
- `Content-Type: application/json` (required).
- `X-Hub-Signature-256: sha256=<hex>` (required) - HMAC-SHA256 of the request body using the Meta App Secret.

**Request Body Shape:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "201234567890",
              "phone_number_id": "1143759322143647"
            },
            "contacts": [
              { "wa_id": "201090650946", "profile": { "name": "Jane Doe" } }
            ],
            "messages": [
              {
                "id": "wamid.XXXX",
                "from": "201090650946",
                "timestamp": "1714000000",
                "type": "text",
                "text": { "body": "hello" }
              }
            ],
            "statuses": [
              {
                "id": "wamid.YYYY",
                "status": "delivered",
                "timestamp": "1714000001",
                "recipient_id": "201090650946"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "OK",
  "data": { "received": true }
}
```

**Error Responses:**
- `400 Bad Request`: payload does not match the expected shape (`object`, `entry`).
- `401 Unauthorized`: missing or invalid `X-Hub-Signature-256` header (`error: "missing_signature"` or `"invalid_signature"`).
- `429 Too Many Requests`: rate limit exceeded.
- `503 Service Unavailable`: server is missing `WA_APP_SECRET`.
- `500 Internal Server Error`: unexpected error.

**Notes:**
- `src/index.ts` captures the raw request body via `express.json({ verify })` so HMAC can be computed over the exact bytes Meta sent. Do not modify or remove that hook unless you also rework the signature path.
- This endpoint currently logs events only. Persistence and per-type handlers (text, button, interactive) will be added in follow-up work.

---

## Admin / Hub Webhook (`/admin/ref-resync`)

### Trigger Reference Re-mirror
**POST** `/admin/ref-resync`

**Auth:** HMAC — header **`X-Hub-Signature`** = `sha256=<HMAC-SHA256(rawBody, HUB_WEBHOOK_SECRET)>` (constant-time compare). Not JWT — this is called by the central reference hub when reference data changes; it is not for frontend use.

**Payload:** `{ "dataVersion": "…", "triggeredAt": "…" }`

**Responses:**
- **200** `{ "synced": true, …sync report }` — mirror re-sync ran
- **401** invalid signature · **400** missing raw body
- **503** `HUB_WEBHOOK_SECRET` not configured · **500** sync failure

---

## Active Users Analytics (`/activeUsers`)

**All routes require a Super Admin JWT** (chain: `extractJWT → institutionResolver → userBasedRateLimiter → requireSuperAdmin`). Non-super-admin tokens get **403**; no token gets **401**.

**What "active" means.** A user is *active* in a period if they performed at least one tracked action in it:
- **Candidate:** submission created, event attendance recorded, clinical submission created, login
- **Supervisor:** surgical review/approval, clinical review, login
- **Calendar Manager (clerk):** calSurg created, event created, login
- **Institute Admin:** login

**Data model (single source of truth preserved).** These figures are computed from a read-only Postgres **view** `activity_read_model` that unifies the existing operational tables (`submissions`, `event_attendance`, `clinical_sub`, `cal_surgs`, `events`) plus one new append-only table, **`login_events`** (logins are recorded nowhere else). Nothing is duplicated: the operational tables stay authoritative and are read live. **superAdmin activity is excluded** from every count and from the cap (the owner viewing the dashboard must not inflate the user base). Logins accrue only from deployment forward (they had no history), surfaced via `loginTrackingStartedAt`. Two supporting writes were added: every successful login appends a `login_events` row (fail-open) that also records the client **IP** and **user-agent** for tracing, and `POST /event` now stamps `createdBy`/`createdByRole` so event creation can be attributed. NB: IP/user-agent capture only accrues from the deploy that added it; earlier logins carry NULL `ip`/`userAgent`.

- **Active Users** = `COUNT(DISTINCT actor)` in the period (distinct people; NOT additive across sub-periods).
- **Activity Volume** = `COUNT(events)` in the period (additive; the by-type breakdown).

### Get Analytics
**GET** `/activeUsers/analytics`

**Query params:** `granularity` = `daily|weekly|monthly|quarterly` (default `monthly`) · `scope` = `institution|department` (default `institution`) · `deptCode` (required when `scope=department`; validated against `departments`, defaults to `REF_DEPT_CODE`/NS).

**Response (200 OK)** (standard wrapper; `data` contains):
```json
{
  "granularity": "monthly",
  "scope": "institution",
  "deptCode": null,
  "dataStartDate": "2025-11-08",
  "loginTrackingStartedAt": null,
  "summary": { "daily": 3, "weekly": 8, "monthly": 48, "quarterly": 82 },
  "series": [ { "bucket": "2026-07-01", "activeUsers": 25, "byRole": { "candidate": 20, "supervisor": 4, "clerk": 1 } } ],
  "byActivityType": { "calsurg_create": 5703, "submission": 3664, "event_attendance": 1264, "surgical_review": 1222, "clinical_submission": 88 },
  "byDepartment": [ { "deptCode": "NS", "name": "Neurosurgery", "arName": "جراحة المخ والأعصاب", "activeUsers": 82 } ],
  "cap": { "maxActiveUsers": null, "currentCount": 82, "signupsOpen": true }
}
```
- `summary`: distinct active users over fixed trailing windows (1 day / 7 days / 30 days / 3 months).
- `series`: gap-filled buckets for the selected granularity (daily=30, weekly=12, monthly=12, quarterly=8), each with a per-role breakdown.
- `byActivityType`: event volume in the granularity window.
- `byDepartment`: distinct active users per department over the trailing 3 months (institution scope only; rows with no department are excluded).
- `cap`: the live signup gate (see below).

### List Active Users (drill-down)
**GET** `/activeUsers/list`

**Query params:** `window` = `today|week|month|quarter` (default `quarter`, mapping to 1 day / 7 days / 30 days / 3 months) · `scope` · `deptCode` (as above).

Returns every distinct active user in the window, resolved to their person (name/email via role-specific joins), most-recently-active first.

**Response (200 OK):** `data` =
```json
{
  "window": "quarter", "scope": "institution", "deptCode": null, "count": 82,
  "users": [
    { "actorId": "uuid", "role": "candidate", "name": "…", "email": "…",
      "deptCode": "NS", "deptName": "Neurosurgery", "deptArName": "…",
      "activityCount": 31, "lastActive": "2026-07-23T06:37:39.442Z" }
  ]
}
```

### Get One User's Activity (drill-down)
**GET** `/activeUsers/user`

**Query params:** `actorId` (required) · `role` (optional; scopes the lookup) · `window` (as above).

Returns that user's activity breakdown by type, the total, and a capped recent timeline (last 50, newest first). On `login` events the recent items also carry `ip` and `userAgent` (both NULL for other activity types, and for logins that predate IP capture); the super-admin drill-down surfaces these to trace a suspicious login to a device/location.

**Response (200 OK):** `data` =
```json
{
  "actorId": "uuid", "role": "candidate", "window": "quarter", "total": 31,
  "byType": { "submission": 23, "event_attendance": 7, "clinical_submission": 1 },
  "recent": [
    { "activityType": "submission", "occurredAt": "2026-07-23T06:37:39.442Z", "ip": null, "userAgent": null },
    { "activityType": "login", "occurredAt": "2026-07-24T05:10:02.113Z", "ip": "196.221.5.9", "userAgent": "Mozilla/5.0 (Windows NT 10.0) ... Chrome/120" }
  ]
}
```

### Set the Signup Cap
**PATCH** `/activeUsers/cap`

**Request Body:** `{ "maxActiveUsers": number | null }` (a non-negative integer to cap, or `null`/blank to remove the cap and go unlimited). Invalid values → **400**.

The cap watches the **rolling quarterly** distinct active-users count (trailing 3 months, institution-wide, superAdmin excluded). When that count meets or exceeds the cap, new signups **lock**; when it falls below, they **unlock automatically** (self-regulating). The open/closed state is derived live, never stored, and surfaced publicly as the `signupsOpen` boolean on `GET /institution`. Because verifying an OTP does not make an account "active" (only acting/logging in does), the gate lives only at signup-start; there is no verify-time race.

**Response (200 OK):** `data` = `{ "maxActiveUsers": 500, "currentCount": 82, "signupsOpen": true }`.

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

All PDF report endpoints require **Institute Admin** (or Super Admin) authentication via JWT token in Authorization header or httpOnly cookie; the main-diagnosis-links-map report requires **Super Admin**.

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

#### Main Diagnosis Links Map Report
**GET** `/instituteAdmin/reports/main-diagnosis-links-map`

**Requires:** **Super Admin** authentication (the only report restricted above Institute Admin)

**Rate Limit:** 50 requests per 15 minutes per user

**Description:** Generates a PDF report showing all main diagnoses for the current institution and their linked procedure CPTs and ICD-11 diagnoses, mirroring the data used by the Main Diagnosis Links Map page.

**Request Parameters:** None.

Operates on the single KA institution's mirrored reference data.

**PDF Content:**
1. **Report Header** with MedScribe branding (logo, "MedScribe" text, report title, generated date/time)
2. **Title:** `Main Diagnosis Links Map`
3. **Subtitle:** `Overview of main diagnoses and their linked procedure CPTs and ICD-11 diagnoses.`
4. **For each main diagnosis** (sorted alphabetically by title):
   - Main diagnosis header with title in title case
   - Summary line: `N procedures • M diagnoses`
   - **Procedures section** — heading `Procedure CPTs`, table:
     - Columns: `CPT Code` (from `numCode`), `Alpha Code` (from `alphaCode`), `Title`, `Description`
     - Sorted by `numCode` ascending, then `alphaCode` ascending
   - **Diagnoses section** — heading `Diagnoses (ICD-11)`, table:
     - Columns: `ICD Code` (from `icdCode`), `Diagnosis Title`
     - `Diagnosis Title` uses `icdName` if present, otherwise `title`, rendered in title case
     - Sorted by `icdCode` ascending
   - Layout:
     - Sections may span multiple pages
     - The report may start a new page for each main diagnosis to keep sections readable

**Empty States:**
- If there are **no main diagnoses** for the institution, the PDF still renders the header and a message:
  - `No main diagnoses configured for this institution.`
- If a main diagnosis has no linked procedures or diagnoses:
  - The section is still included with:
    - `No procedures linked.` and/or
    - `No diagnoses linked.`

**Response (200 OK):**
- PDF file with `Content-Type: application/pdf`
- Filename format: `main-diagnosis-links-map-<timestamp>.pdf`

**Error Responses:**

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

All authenticated endpoints operate on the single KA institution. "Dept-scoped" = the effective department is resolved from the JWT `departmentId` claim / `?deptCode` override, defaulting to NS.

| Endpoint | Auth | Roles / Notes |
|---|---|---|
| `GET /health`, `GET /institution`, `GET /departments` | No | Public, IP rate-limited |
| `POST /auth/login`, `/auth/instituteAdmin/login`, `/auth/clerk/login` | No | Body `{email, password}`; strict IP rate limit |
| `POST /auth/superAdmin/login` | No | **dev/staging only** (403 elsewhere) |
| `POST /auth/registerCand`, `/auth/registerSupervisor` | No | OTP-staged; `departmentId` **required** |
| `POST /auth/verifySignupOtp`, `/auth/resendSignupOtp` | No | `signupId` from the register response |
| `GET /auth/validate` | JWT | Any role |
| `POST /auth/refresh` / `POST /auth/logout` | Cookie / No | `refresh_token` cookie / clears cookies |
| `POST /auth/requestPasswordChangeEmail`, `PATCH /auth/changePassword` | Yes | All roles |
| `POST /auth/forgotPassword`, `/auth/resetPassword` | No | candidate, supervisor, instituteAdmin, clerk (**not** superAdmin) |
| `GET /auth/get/all`, `POST /auth/resetCandPass` | — | **DISABLED (410)** |
| `GET /superAdmin`, `GET /superAdmin/:id` | Yes | Super Admin (POST/PUT/DELETE **removed**) |
| `GET /activeUsers/analytics`, `/activeUsers/list`, `/activeUsers/user`, `PATCH /activeUsers/cap` | Yes | **Super Admin only**; active-users analytics + signup cap |
| `POST /instituteAdmin` | Yes | Super Admin (`departmentId` optional; omitted = institution-wide admin) |
| `GET /instituteAdmin`, `GET /instituteAdmin/:id` | Yes | Institute Admin or Super Admin |
| `PUT /instituteAdmin/:id` | Yes | Super Admin, or Institute Admin (**own record only**); self dept-switch re-issues tokens |
| `DELETE /instituteAdmin/:id` | Yes | **Super Admin only** |
| `/instituteAdmin` dashboard reads (supervisors, candidates, summary, dashboards, calendarProcedures, hospitals, submission reports) | Yes | Institute Admin or Super Admin; **dept-scoped by the admin's DB-row department** (NULL = institution-wide); cross-dept by-id reads → 404 |
| `GET /instituteAdmin/reports/*` (PDF) | Yes | Institute Admin or Super Admin; `main-diagnosis-links-map` **Super Admin only** |
| `/clerk` (POST /, GET /, GET /:id, PUT /:id, DELETE /:id) | Yes | Super Admin or Institute Admin; responses password-stripped; create takes optional `departmentId` |
| `POST /sub/postAllFromExternal`, `PATCH /sub/updateStatusFromExternal`, `POST /calSurg/postAllFromExternal`, `GET /external` | `X-Migration-Key` | 503 when `MIGRATION_API_KEY` unset; 401 on wrong key |
| `POST /sub/candidate/submissions` | Yes | Candidate (candidate id forced from JWT) |
| `POST /sub/supervisor/submissions` | Yes | Supervisor (own surgical experience; auto-approved) |
| `GET /sub/candidate/stats`, `/sub/candidate/submissions`, `/sub/candidate/submissions/:id` | Yes | Candidate+ (own data; ownership-checked) |
| `GET /sub/cptAnalytics`, `/sub/icdAnalytics`, `/sub/supervisorAnalytics` | Yes | Candidate, Supervisor, Institute Admin, Super Admin (scoped by caller role) |
| `GET /sub/submissionRanking` | Yes | Candidate+; **dept-scoped** |
| `GET /sub/supervisor/submissions[/:id]`, `/sub/supervisor/candidates/:candidateId/submissions` | Yes | Supervisor (own) |
| `GET /sub/supervisor/own/submissions` | Yes | Supervisor, Institute Admin, Super Admin |
| `PATCH /sub/supervisor/submissions/:id/review` | Yes | Validator supervisor only (`canValidate: true`) |
| `POST /sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice` | Yes | Candidate+; multipart `audio` ≤20 MB |
| `DELETE /sub/:id` | Yes | Super Admin |
| `/clinicalSub/*` | Yes | Role-scoped lists; by-id restricted to admin/owner/assigned; review (PUT) only by **assigned supervisor** or admin |
| `GET /activityTimeline` | Yes | Candidate+ (data only for candidates) |
| `GET /cand`, `GET /cand/:id` | Yes | All roles (censored for clerk/supervisor/candidate viewers) |
| `PUT /cand/:id/approved` | Yes | Super Admin or Institute Admin |
| `PUT /cand/:id` | Yes | Admins full control; candidate self-restricted (regDeg/regNum/phoneNum + dept switch); clerks/supervisors rejected |
| `PATCH /cand/:id/resetPassword`, `DELETE /cand/:id` | Yes | Super Admin |
| `POST /cand/createCandsFromExternal` | — | **DISABLED (410)** |
| `GET /supervisor` | Yes | All roles; **dept-scoped**; censored for non-admins |
| `GET /supervisor/:id` / `GET /supervisor/candidates` | Yes | All roles (censored) / Supervisor |
| `PUT /supervisor/:id/approved` | Yes | Super Admin or Institute Admin |
| `PUT /supervisor/:id` | Yes | Admins full control; supervisor self-restricted (phoneNum/position + dept switch) |
| `POST /supervisor`, `DELETE /supervisor/:id` | Yes | Super Admin |
| `POST /supervisor/resetPasswords` | Yes | Super Admin (dev/staging only; **410 in production**) |
| `POST /calSurg` | Yes | Clerk, Institute Admin, Super Admin (`procedureText` learning pipeline) |
| `GET /calSurg/getAll`, `GET /calSurg/dashboard` | Yes | All roles; **dept-scoped** |
| `GET /calSurg/getById` | Yes | All roles (unscoped by-id) |
| `GET /calSurg/clerkProcs` | Yes | Clerk, Institute Admin, Super Admin; **dept-scoped** typeahead |
| `PATCH /calSurg/:id`, `DELETE /calSurg/:id` | Yes | Clerk (**own department only**), Institute Admin, Super Admin |
| `GET /diagnosis` | Yes | Super Admin; **dept-scoped**; read-only |
| `GET /procCpt` | Yes | Super Admin, Institute Admin, Clerk; **dept-scoped**; read-only |
| `GET /mainDiag`, `GET /mainDiag/:id`, `GET /mainDiag/:mainDiagId/questions` | Yes | All roles; list dept-scoped; read-only |
| `GET /consumables[/:id]`, `GET /equipment[/:id]` | Yes | All roles; **dept-scoped**; read-only (include `arName`) |
| `GET /references` | Yes | All roles; `Cache-Control: private, no-cache` |
| `GET /candidate/dashboard` | Yes | Candidate only; institution must have `isPractical` |
| `GET /hospital`, `GET /hospital/:id` | Yes | All roles |
| `POST /hospital/create`, `PUT /hospital/:id` | Yes | Super Admin (DELETE **removed**) |
| `POST /demoRequest` | No | Public "Book a demo" form; dedicated 5/15min/IP limiter; anti-bot layers respond with an opaque generic 201 |
| `POST /mailer/send` | — | **DISABLED (410)** |
| `GET /lecture`, `GET /lecture/:id` | Yes | Supervisor, Clerk, Institute Admin, Super Admin; **dept-scoped**; read-only |
| `/journal` | Yes | Reads: Candidate+; writes (POST, PATCH, DELETE, postBulk): Super Admin |
| `/conf` | Yes | Reads: Candidate+; create: Supervisor/Clerk/Institute Admin/Super Admin; update/delete: Super Admin |
| `GET /event`, `GET /event/dashboard` | Yes | All roles; **dept-scoped** |
| `GET /event/by-presenter/:supervisorId`, `GET /event/:id` | Yes | Supervisor (own id) / admins; all roles (unscoped) |
| `POST /event`, `PATCH /event/:id`, `DELETE /event/:id` | Yes | Clerk, Institute Admin, Super Admin (create stamps the department) |
| `POST /event/bulk-import-attendance` | Yes | Institute Admin or Super Admin |
| `GET /event/candidate/points`, `GET /event/candidate/:candidateId/points` | Yes | Candidate+ |
| `GET /event/academicRanking` | Yes | Candidate+; **dept-scoped** |
| `/event/:eventId/attendance/:candidateId` (+ `/flag`, `/unflag`) | Yes | Conditional: candidate self (add only), admins, presenter supervisor |
| `/waBot/webhook` (GET, POST) | No | Meta webhook (verify token / HMAC `X-Hub-Signature-256`) |
| `POST /admin/ref-resync` | HMAC | `X-Hub-Signature` (reference-hub webhook) |

---

## Important Notes

1. **JWT Token Structure**: tokens carry `id`/`_id` (the same UUID) and `departmentId` when the user has one; there is **no** `institutionId`. Tokens are delivered as httpOnly cookies, and the `auth_token` cookie wins over the `Authorization` header when both are present.

2. **Token Usage**: `Authorization: Bearer <token>` also works for API clients and testing.

3. **User Roles** (five): `candidate`, `supervisor`, `clerk`, `instituteAdmin`, `superAdmin`. Most reads use hierarchical role checks ("this role or higher"); sensitive writes use explicit allowlists with ownership checks.

4. **Admin Creation**: institute admins are created by super admins (`POST /instituteAdmin`, optional `departmentId`); clerks by super/institute admins (`POST /clerk`). Super admins have **no** API creation path (provisioned DB-side), and their login is environment-gated.

5. **Data Formats**: ISO 8601 timestamps; UUID ids as strings; password hashes are never returned in responses.

6. **External/import endpoints** (`*FromExternal`, `GET /external`): operator migration tooling gated by the `X-Migration-Key` header; they fail closed (503) when `MIGRATION_API_KEY` is unset — which is the deliberate production state.

7. **Response Format**: all endpoints wrap responses in `{status, statusCode, message, data|error}` except the documented special cases (`/auth/validate`, refresh/logout, the candidate dashboard bundle, PDF endpoints, and the Meta/hub webhooks).

8. **Reference data is a read-only mirror** synced from the central reference hub; all reference write routes were removed. Content updates arrive via the hub broadcast (`POST /admin/ref-resync`) and a periodic poll.

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

**Ranking Endpoints:** `GET /sub/submissionRanking` and `GET /event/academicRanking` both return `data` as an **array** of ranked items. Use `data` directly (e.g. `const items = json.data`); each element has `candidateId`, `candidateName`, `rank`, `regDeg`, and either `approvedCount` (submission ranking) or `academicPoints` (academic ranking).

**Analytics & Activity Timeline:** CPT (`GET /sub/cptAnalytics`), ICD (`GET /sub/icdAnalytics`), and supervisor analytics (`GET /sub/supervisorAnalytics`) return `data` as `{ totalApprovedSubmissions, items }`. Use `data.items` for the analytics array. Activity timeline (`GET /activityTimeline`) returns `data` as `{ items }`; use `data.items` for the activity list.

**Candidate points:** `GET /event/candidate/points` and `GET /event/candidate/:candidateId/points` return `data` as `{ events, totalPoints }`. Use `data.events` for the attended-events list and `data.totalPoints` for the sum.

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
- `clerk`: Calendar/data clerks

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
