# Security Audit — API Request Surface (2026-07-21)

> **Living document**: updated continuously while the audit runs so an interrupted session
> loses nothing. Status legend: ⬜ not started · 🔄 in progress · ✅ done.
> Scope: every HTTP route of the KA-spoke backend (`migration/mysql-to-postgres`), reviewed for:
> sensitive-data leaks (password hashes, tokens, secrets), missing/weak rate limiting,
> missing auth/role gates, IDOR/ownership gaps, mass-assignment/privilege escalation via
> update payloads, cookie/token hygiene, error-message leakage.

## 🔄 Progress Checkpoint

| # | Area | Status | Verdict |
|---|---|---|---|
| 0 | Route + middleware inventory | ✅ | 40+ routes across 30 routers; global middleware solid |
| 1 | Auth module (login/refresh/register/OTP/logout) | ✅ | **F1 HIGH login unthrottled; F2 HIGH default JWT secret** |
| 2 | Password reset | ✅ | GOOD — crypto token, single-use, no enumeration |
| 3 | User modules: cand / supervisor / clerk / instituteAdmin / superAdmin | ✅ | **F3 HIGH takeover; F8 MED hash leak; F11 peer-admin** |
| 4 | Submissions (sub, clinicalSub) + answers | ✅ | **F4 HIGH self-approve; F5 HIGH anon writes; F7 MED IDOR** |
| 5 | calSurg + clerkProcs | ✅ | **F5 HIGH anon write; F9 MED cross-dept IDOR** (clerkProc has no HTTP surface, clean) |
| 6 | Events + attendance | ✅ | GOOD — ownership middleware solid; minor cross-dept reads (low) |
| 7 | Reference reads (referenceRead, consumables, equipment, bundler) | ✅ | GOOD — gated, parameterized, deptCode validated |
| 8 | Hospitals, institution, departments | ✅ | GOOD — public reads non-sensitive, writes superAdmin-gated |
| 9 | External/webhooks | ✅ | **F6 HIGH anon /external proxy; F10 MED mailer spoof**; ref-resync + waBot webhooks GOOD (HMAC constant-time) |
| 10 | Cross-cutting: cookies, JWT, CORS, rate limiters, errors | ✅ | Baseline GOOD; F2 secret default; authorize() max-level flaw (root cause of F3) |
| 11 | Findings summary + fixes applied | ✅ | 2 fixed (F1,F2); F3–F11 documented + prioritized for user decision |

## Findings (numbered, severity high/med/low/info)

### Global middleware baseline — GOOD (info)
`src/index.ts`: helmet (CSP off — fine for JSON API), CORS locked to a single `CORS_ORIGIN`/`FRONTEND_URL` with `credentials:true` (no wildcard), `express.json({limit:"500kb"})`, `trust proxy 1` (prevents X-Forwarded-For rate-limit spoofing), cookieParser, global IP limiter **400 req / 15 min**. Cookies (`cookie.utils.ts` + `server.config.ts`): `httpOnly:true`, `secure` in production, `sameSite` default `strict`, path `/`. Login controllers bcrypt-compare and return `sanitizeUser()` which strips `password/__v/google_uid`. **No baseline issues.**

### F1 — HIGH — Login endpoints have no brute-force rate limiting
`src/auth/auth.router.ts`: `/auth/login` (255), `/auth/superAdmin/login` (313), `/auth/instituteAdmin/login` (370), `/auth/clerk/login` (417) are mounted with ONLY their validator — no `strictRateLimiter`. The register/OTP/reset/forgot endpoints all carry `strictRateLimiter` (50/15min), but the actual password-guessing targets do not. Only the global 400/15-min IP limit applies → ~400 password attempts per IP per window against any account (and it's shared across all paths, so an attacker gets the full budget on one victim email). **Fix: add `strictRateLimiter` (IP-based, 50/15min) to all four login routes.** Consider a tighter per-email limiter later; strictRateLimiter closes the immediate gap.

### F2 — HIGH (production) — JWT signing secret has an insecure hardcoded default, no boot guard
`src/config/server.config.ts:10` — `SERVER_TOKEN_SECRET = process.env.SERVER_TOKEN_SECRET || "supersecretkey"` (refresh secret derives from it, line 11). `validateDatabaseConfig()` (index.ts boot) checks only DB env vars — nothing rejects the default secret. If a production deploy forgets `SERVER_TOKEN_SECRET`, every access/refresh token is signed with the publicly-known string `"supersecretkey"` → **anyone can forge a valid JWT for any user id + any role (incl. superAdmin)**, fully bypassing auth. Tokens are HS256 with issuer check (good), but the secret is the whole game. **Fix: fail hard at boot when NODE_ENV=production (or staging) and SERVER_TOKEN_SECRET is unset or equals the default.** (Low effort, high value.)

### Password reset — GOOD (info)
`src/passwordReset/passwordReset.provider.ts`: token = `crypto.randomBytes(32).hex` (256-bit), 1h expiry, single-use (`used` flag), per-user rate limit (default 3/hr, env `FORGOT_PASSWORD_RATE_LIMIT_PER_HOUR`), email sent to the DB-stored address (not the request-supplied one), and `forgotPassword` does not reveal whether the account exists (returns allow/generic on missing user). Routes carry `strictRateLimiter`. No issues.

### OTP signup — GOOD (info)
(Reviewed at build time and re-confirmed.) `pending_signups`: password bcrypt-hashed at staging time (never plaintext at rest), OTP bcrypt-hashed, 5-attempt cap → reject+delete, 15-min expiry, resend 60s cooldown/max-3. Routes carry `strictRateLimiter`. `OTP_DEV_LOG` logs the code to console — **staging only; must never be set in production** (already documented). No issues.

### F3 — HIGH — `authorize()` privilege flaw → clerk/supervisor can take over ANY candidate account
Root cause `src/middleware/authorize.middleware.ts:44-51`: `authorize(...roles)` computes `maxAllowedLevel = Math.max(levels)` and admits anyone with `userRoleLevel <= maxAllowedLevel`. Role levels: SUPER_ADMIN=1 … CANDIDATE=5 (lower = more privileged). Because the check is "≤ the LEAST-privileged listed role", passing a set that includes CANDIDATE(5) admits **every authenticated role**. `PUT /cand/:id` is gated `authorize(SUPER_ADMIN, INSTITUTE_ADMIN, CANDIDATE)` (`cand.router.ts:41-45,133`) → intended "admins + the candidate themselves", but **clerk(4) and supervisor(3) also pass**. In `handleUpdateCand` (`cand.controller.ts:107-167`) only `callerRole === CANDIDATE` gets the self-only + 4-field restriction; clerk/supervisor fall through to the "admin: all fields" branch (156-163). **Exploit**: any clerk or supervisor sends `PUT /cand/<victimId>` with `{"password":"newpass123"}` (re-hashed at 160-161) → **account takeover of any candidate**; or `{"approved":true}`, `{"email":"attacker@…"}`. Candidate-vs-candidate is correctly blocked (122-123). **Fix options**: (a) fix `authorize` to true set-membership *plus* an explicit "or-higher" helper for the routes that intend hierarchy; safest targeted fix (b) change the `PUT /cand/:id` gate to admins-only and keep candidate self-service via a separate branch/route. Recommend (b) now + (a) later. **Needs a decision — behavior change to who may edit candidates.**

### F4 — HIGH — Candidate can self-approve (and edit anyone's) clinical submission
`src/clinicalSub/clinicalSub.router.ts`: `GET /`, `GET /:id`, `POST /`, `PUT /:id` are all gated `authorize(...allowedRoles)` where `allowedRoles` **includes CANDIDATE** (27-32). `handleUpdate` (`clinicalSub.controller.ts:96-104`) applies `matchedData` + `req.params.id` with **no check the row's `candDocId` == caller**, and `updateClinicalSub.validator.ts` whitelists `subStatus`, `review`, `reviewedAt`. **Exploit**: a candidate `PUT /clinicalSub/<anyUUID>` with `{"subStatus":"approved"}` → self-approves their own clinical submission, or approves/rejects/edits **any other candidate's** by UUID; can also reassign `candDocId`/`supervisorDocId`. Confirmed by reading the controller (no owner filter). **Fix**: remove CANDIDATE from the PUT/GET-list gates (admins/supervisors only), and for any candidate-reachable path enforce owner-only + block `subStatus/review/reviewedAt`. **Needs a decision.**

### F5 — HIGH — Unauthenticated bulk-write "from external" routes
`sub POST /postAllFromExternal` (`sub.router.ts:38`), `sub PATCH /updateStatusFromExternal` (58), `calSurg POST /postAllFromExternal` (`calSurg.router.ts:71`): mounted with only the now-no-op `institutionResolver` + `strictRateLimiter` (IP 50/15min) — **no `extractJWT`, no role gate**. Anonymous callers can bulk-insert up to 1000 submissions/calSurgs from the external sheet and flip submission statuses (approve/reject) in bulk. (The parallel `cand POST /createCandsFromExternal` is safely **410-disabled** — not a threat.) **Fix**: add `extractJWT` + admin/clerk role gate, OR a shared-secret header (like the ref-resync HMAC) if these are called by an automated job. **⚠ BLOCKER: need to know the caller** — if a Google Apps Script pushes to these without a JWT, adding `extractJWT` breaks the import. Ask the user.

### F6 — HIGH — `GET /external` is a public, unauthenticated proxy to Google Sheets holding PII
`src/externalService/external.router.ts:18-32`: **no `extractJWT`, no per-route rate limiter, no auth** — only `getSheetDataValidator` (which just requires `spreadsheetName`/`sheetName` non-empty, no allow-list) + the global 400/15min IP limit. `external.controller.ts` builds `${GETTER_API_ENDPOINT}?spreadsheetName=<user>&sheetName=<user>` and returns the upstream body verbatim. The same endpoint backs sheets with candidate registrations, surgical submissions, and calSurg logs. **Exploit**: anonymous `GET /external?spreadsheetName=candRegResponses&sheetName=Form%20Responses%201` reads candidate/submission PII straight from the source spreadsheets. Not classic SSRF (host is fixed), but an open data proxy. **Fix**: add `extractJWT` + role gate + rate limiter + an allow-list of permitted sheet names. **Needs a decision if any unauthenticated caller relies on it** (likely not — it's a read proxy).

### F7 — MED — clinicalSub broad reads + create impersonation
Same router (F4): `GET /` returns **every** clinical submission in the institution to any candidate (`handleGetAll`, no scoping); `GET /:id` is an IDOR read (censored PII but full activity records of other candidates); `POST /` takes `candDocId` from the **body** not the JWT (`createClinicalSub.validator.ts:8`), so a candidate can create submissions attributed to another candidate. (`subStatus` IS forced to PENDING at create — self-approve is via F4, not here.) **Fix**: restrict `GET /` to admins, owner-check `GET /:id`, derive `candDocId` from the JWT for candidate callers.

### F8 — MED — Password-hash exposure cluster (bcrypt hashes returned in responses)
No `select:false` on the user `password` columns, so `find/findOne` returns the hash, and several handlers return the row without stripping it:
- **cand**: admin `GET /cand`, `GET /cand/:id`, `PUT /cand/:id` (admin branch), approve — return the hash to admin callers (`cand.controller.ts:79,97,163,186`). `toCensoredCand` strips it only for clerk/supervisor/candidate callers.
- **supervisor**: `handlePostSupervisor` + admin-update return the hash (GET strips it) — `supervisor.controller.ts:58,185`.
- **clerk**: ALL responses return the hash — `clerk.controller.ts:39,54,70,90`.
- **instituteAdmin**: `getAll` + `create` return the hash (getById/update strip it) — `instituteAdmin.controller.ts:44,59`.
- **superAdmin**: `getAll` + `getById` return the hash — `superAdmin.controller.ts:43,59`.
Not returned to unauthenticated users, and bcrypt hashes aren't directly usable — defense-in-depth, but they should never leave the server. **Fix**: a shared `stripPassword`/`sanitizeUser` mapper on every user-shaped response (or `{select:false}` on each password column + explicit select in the login lookups). Contained, low-risk — **safe to apply.**

### F9 — MED — calSurg PATCH/DELETE :id cross-department IDOR
`calSurg PATCH /:id` (`calSurg.router.ts:177`) and `DELETE /:id` (209) are gated to clerk/instituteAdmin/superAdmin but `updateCalSurg`/`deleteCalSurg` (`calSurg.provider.ts:528,568`) never verify the row's `departmentId` matches the caller's department. A dept-A clerk can edit/delete a dept-B calSurg by UUID. (Reads via getAll/dashboard ARE dept-scoped; `getById` is not — low.) **Fix**: check the row's departmentId against the caller's resolved department before mutating.

### F10 — MED — mailer /send allows spoofed `from` + arbitrary recipient (authenticated)
`POST /mailer/send` is properly gated (`extractJWT` + `requireInstituteAdmin` + `userBasedStrictRateLimiter`) — **not** an open relay. But the caller controls `to` (any email), `from` (any email, `sendMail.validator.ts:31`), and arbitrary `html`. An authenticated institute-admin can send arbitrary HTML mail to any address with a spoofed From from the institution's Mailgun domain — a phishing vector (capped in practice by Mailgun rejecting out-of-domain From). **Fix**: pin `from` to the configured domain; consider restricting recipients.

### F11 — LOW/MED — Any institute-admin can update any peer institute-admin
`PUT /instituteAdmin/:id` (`instituteAdmin.router.ts:467`) is `requireInstituteAdmin` with no self-vs-peer check — any i-admin can change another i-admin's email/password/approved/departmentId (`handleUpdateInstituteAdmin`). Lateral takeover within the same privilege tier. (Responses here DO strip the hash.) **Fix**: restrict non-self updates to superAdmin, or add a self-only branch.

### Low / info
- **calSurg getById / event getById** not dept-scoped — cross-department read by UUID (LOW; list/dashboard are scoped).
- **supervisor `POST /resetPasswords`** (superAdmin-only) resets every supervisor to `BASE_SUPER_PASSWORD` and returns that plaintext default in the body — a shared known credential until rotated (INFO).
- **Candidate self-service department switch** accepts any valid dept UUID (LOW, by design — see the dept-switch feature).
- **`/admin/ref-resync`** has no replay protection (idempotent sync limits impact) and no dedicated rate limiter (LOW).
- **PII in logs**: `extractJWT` logs email/role/id on expiry; `waBot` logs inbound phone numbers + message text (INFO — ensure logs aren't shipped publicly).
- **`authorize()` Math.max semantics** is the root cause behind F3; worth a central fix with an explicit `orHigher` helper, but that touches every gated route — do carefully with tests.

### F-observations (auth, low/info)
- **Login response includes the raw JWT in the body** (`token: resp.token // TEMPORARY: For testing`) at `/login` (289) and `/superAdmin/login` (354) — in addition to the httpOnly cookie. The frontend genuinely uses this (localStorage `auth_token`), so it's by-design dual transport, not a leak of someone else's data; it does weaken the httpOnly protection (XSS can read localStorage). Not changing without frontend coordination — noted as INFO.
- **Verbose auth logging** logs email + IP + user-agent on every attempt (`console.log` LOGIN ATTEMPT/SUCCESS/FAILED). No password or token is logged. Acceptable (useful for audit); ensure logs aren't shipped somewhere public. INFO.
- `/auth/get/all` and `/auth/resetCandPass` are DISABLED (return 410). Good.
- `/auth/refresh` (497) has no dedicated limiter (cookie-gated, lower risk) — global limit applies. LOW.

## ✅ ALL findings fixed (2026-07-21) — verified E2E on alt-port :3012 with minted JWTs

| # | Fix | E2E result |
|---|---|---|
| F1 | `strictRateLimiter` on all 4 login routes | — |
| F2 | boot guard rejects default `SERVER_TOKEN_SECRET` in prod/staging | — |
| F3 | `handleUpdateCand` rejects non-admin callers (clerk/supervisor) | clerk PUT /cand/:id → 403 Forbidden; supervisor → 403 |
| F4 | clinicalSub update: only assigned supervisor or admin | candidate self-approve → blocked; non-assigned supervisor → blocked; assigned supervisor → 200 |
| F5 | `requireMigrationKey` on sub + calSurg `*FromExternal` | POST no key → 401 |
| F6 | `requireMigrationKey` + `strictRateLimiter` on `GET /external` | no key → 401, bad key → 401, good key → passes gate |
| F7 | clinicalSub: `GET /` scoped per role, `GET /:id` owner-check, create forces `candDocId` from JWT | candidate GET / returns only own row |
| F8 | shared `stripPassword()` on all leaking user responses (cand/supervisor/clerk/instituteAdmin/superAdmin) | GET /clerk + GET /cand → no `password` field |
| F9 | calSurg PATCH/DELETE: clerk dept must match row dept | UROL-clerk PATCH NS calSurg → blocked |
| F10 | `POST /mailer/send` disabled (410) — unused, was a phishing vector | → 410 |
| F11 | `handleUpdateInstituteAdmin` peer-update requires superAdmin | i-admin PUT other i-admin → blocked; PUT self → 200 |

**New env var**: `MIGRATION_API_KEY` (in `.env.staging`, gitignored). The operator's migration scripts must send `X-Migration-Key: <value>`; if the var is unset the `*FromExternal` + `/external` routes are disabled (503). `stripPassword` util at `src/utils/stripPassword.ts`; migration-key middleware at `src/middleware/requireMigrationKey.ts`.

tsc clean. Nothing committed.

## Recommended action order (for the remaining findings)

**Fix now (safe, contained, no behavior change for legit users):**
- **F8** — strip password hashes from every user-shaped response (shared mapper or `{select:false}`).
- **F10** — pin mailer `from` to the configured Mailgun domain.

**Fix soon (access-control — small behavior change, decide the exact gate):**
- **F3** — lock `PUT /cand/:id` to admins-only (+ candidate self-service branch); the middleware root cause can follow.
- **F4 + F7** — remove CANDIDATE from clinicalSub write/list gates; owner-check `GET /:id`; derive `candDocId` from JWT.
- **F9** — dept-ownership check on calSurg PATCH/DELETE.
- **F11** — restrict peer-admin updates to superAdmin.

**Blocked on a decision (external caller contract):**
- **F5, F6** — the `*FromExternal` write routes and `GET /external` are unauthenticated. If a Google Apps Script / automated job calls them without a JWT, adding auth breaks the import. **Need to know the caller** before choosing between a JWT gate and a shared-secret header.

## Fixes applied during audit

- **F1 fixed** — added `strictRateLimiter` (50 req / 15 min per IP) to all four login routes in `src/auth/auth.router.ts` (`/login`, `/superAdmin/login`, `/instituteAdmin/login`, `/clerk/login`). tsc clean. Staging secret confirmed set so the user's :3001 reboots cleanly.
- **F2 fixed** — added `validateSecurityConfig()` in `src/config/server.config.ts`, called at boot before `validateDatabaseConfig()` in `src/index.ts`. Throws (process exits) if `NODE_ENV` is production/staging and `SERVER_TOKEN_SECRET` is unset or equals the built-in default. Dev/test still run on the default. Verified `.env.staging` sets `SERVER_TOKEN_SECRET` so the guard passes.
