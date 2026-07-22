# Super-Admin in Production: Safety Check + Enablement Plan (Living Doc)

> **LIVING DOCUMENT.** Update the checkpoint table after every step (and mid-step if interrupted). If a session is interrupted, READ THIS FIRST to see what was done and what was not. No em-dashes anywhere in this repo (standing rule).

**Status: IMPLEMENTED + VERIFIED (2026-07-23) on branch `feat/superadmin-prod` (uncommitted, BOTH repos). Go-live = user commits/pushes + sets env vars. Nothing is live until then (default stays fail-closed).**

### Locked decisions (2026-07-23)
1. Mechanism: **env-flag gated** (`SUPERADMIN_LOGIN_ENABLED` backend, `VITE_SUPERADMIN_ENABLED` frontend). Fail-closed, reversible without redeploy.
2. Secret rotation (P1): **SKIP for now** (user accepts the weak-secret forgery risk; can rotate later). Not a blocker.
3. Mass supervisor password reset (`POST /supervisor/resetPasswords`): **DISABLE in production** (410 when not dev/staging; stays usable in dev/staging).
4. Hardening: **P3 (tighter super-admin login limiter) YES; P2 (min-length floor) NO.**

Branches when work starts: `feat/superadmin-prod` off `main` in both repos (backend `MedScribeNeuroServer`, frontend `NeuroLogBookFront`). Commit/push only on explicit user ask. Pushing `main` deploys (backend to Railway, frontend to Netlify).

---

## Checkpoint table

| Step | What | Status | Notes |
|------|------|--------|-------|
| 0 | Safety audit of the super-admin surface (both repos) | DONE (2026-07-23) | Findings below. Verdict: no app-breaking/config surfaces reachable by any role; residual power is recoverable data ops |
| 1 | User decisions (enablement mechanism, secret rotation, brute-force) | DONE (2026-07-23) | See Locked decisions above |
| P1 | Strengthen `SERVER_TOKEN_SECRET` (+ separate refresh secret) on Railway | SKIPPED (user choice) | Weak-secret forgery risk accepted; can rotate later |
| P2 | Add min-length/entropy floor to `validateSecurityConfig` | SKIPPED (user choice) | |
| P3 | Tighten super-admin login brute-force (dedicated limiter) | DONE | `superAdminLoginRateLimiter` 10/15min IP added + wired on the login route |
| MR | Disable `POST /supervisor/resetPasswords` in production (410 outside dev/staging) | DONE | `supervisor.router.ts`: 410 when NODE_ENV not dev/staging |
| B1 | Backend: `SUPERADMIN_LOGIN_ENABLED` flag on the login gate (fail-closed) | DONE | `auth.router.ts` gate now allows dev/staging OR flag |
| F1 | Frontend: flag at the 7 `import.meta.env.DEV` sites | DONE | New `src/lib/featureFlags.ts` (`SUPERADMIN_ENABLED`) used at LoginPage/SuperAdminLoginPage/CalendarManagerDashboardSwitcher; App.tsx route block uses an INLINE `import.meta.env` expr + `vite.config.ts` `define` default so it TREE-SHAKES out when off (verified: 60KB smaller without the flag) |
| E1 | Set env: Railway `SUPERADMIN_LOGIN_ENABLED=true`, Netlify `VITE_SUPERADMIN_ENABLED=true` | NOT STARTED (user does this) | The actual "go live" toggle. Nothing is exposed until BOTH are set |
| V1 | Verification | DONE | Backend alt-port: prod+no-flag login→403; prod+flag login→401 (gate passed); prod resetPasswords with minted super-admin JWT→410. Frontend: tsc + build clean; super-admin page bundle present only with the flag |
| D1 | Docs: API_DOCUMENTATION.md + CLAUDE.md + finalize this doc | DONE | API doc super-admin login row updated; `.env` documents the flag; CLAUDE.md updated |

### Update (2026-07-23): secret rotation DONE after all
The user chose to rotate `SERVER_TOKEN_SECRET` after this plan (originally P1 was skipped). Done: new 256-bit access + separate refresh secret, set on Railway, production login verified. Runbook: `docs/ROTATE_TOKEN_SECRET.md`. This removes the main residual risk (offline forgery of a super-admin token via the old weak secret). The weak-secret concern in this doc is now resolved.

### Remaining to actually enable super-admin in production
Code is committed. To turn it ON: set `SUPERADMIN_LOGIN_ENABLED=true` on Railway AND `VITE_SUPERADMIN_ENABLED=true` on Netlify (then Netlify rebuilds). Until BOTH are set, production behaves exactly as before (super-admin login 403, UI absent from the build). Unset either to disable.

---

## Goal

The super-admin login is currently blocked in production (allowed only when `NODE_ENV` is `development` or `staging`). The user wants super-admin usable in production. This doc first verifies that is safe (the reference data that drives the app is a read-only hub mirror, so a super-admin should not be able to break the app or its data), then plans the enablement.

## Safety verdict (the check the user asked for)

**Confirmed: no role, super-admin included, can reach an app-breaking or config-breaking surface. Those routes do not exist.** Verified in the current `dev` code of both repos.

Removed / 404 / disabled for EVERYONE (cannot be reached even by super-admin):
- **Reference-data writes** (`mainDiag`, `diagnosis`, `procCpt`, `lecture`, `positions`, `approaches`, `regions`, `consumables`, `equipment`): no router files exist, nothing mounted in `routes.config.ts`. Reads are mirror-backed (`referenceRead` module, GET only). Reference truth lives in the hub; the spoke only re-mirrors via the HMAC webhook `POST /admin/ref-resync`. So a super-admin cannot edit or delete the data that controls the app. This matches the user's understanding.
- **Institution feature flags** (`isAcademic` / `isPractical` / `isClinical`): no write route. Only `GET /institution`. `institution.service.ts` is read-only. Nobody can flip them via the API.
- **Institution row edit/delete**: no institution router mounted. No route.
- **Departments** create/delete/rename: no route. Only public `GET /departments`.
- **Hospital delete**: route removed (`hospital.router.ts:126-129`). Create/edit only.
- **Super-admin self-provisioning**: `POST /superAdmin` commented out, `PUT`/`DELETE /superAdmin/:id` removed. Only `GET /` and `GET /:id` remain. A super-admin cannot create/modify/delete super-admins through the API.
- **Mass candidate password reset**: `POST /auth/resetCandPass` disabled (410).

**Conclusion:** enabling super-admin login in production cannot damage the reference data, the institution config, the department structure, or the app's ability to run. The user's safety claim holds.

## Residual risk (what a prod super-admin CAN still do)

These are recoverable, data-level, high-impact operations (not app-breaking config). Most are super-admin-only, so enabling super-admin genuinely widens who can do them:
- Delete a candidate / supervisor / clerk / submission / event / calendar-surgery (individual DELETEs, mostly `requireSuperAdmin`).
- Reset a single candidate's password; and notably **`POST /supervisor/resetPasswords` = reset ALL supervisor passwords at once** (super-admin only). This is the highest-blast-radius residual op: it would lock every supervisor out until they reset. Consider whether this endpoint should stay reachable in prod at all.
- Provisioning: create institute-admins and clerks, create/edit hospitals.

None of these break the app; all are individually recoverable. But they are destructive to tenant data, so the account must be well protected.

## Two hardening gaps that matter MORE once super-admin is prod-reachable

1. **`SERVER_TOKEN_SECRET` has no strength floor.** `validateSecurityConfig` only rejects an unset or literal-default secret; a weak non-default value (current prod secret is about 10 chars) passes boot. Because the per-route authorization gates do NOT check `NODE_ENV` (only the login endpoint does), a FORGED super-admin JWT would already be accepted in production today. A short secret makes forgery cheaper, and super-admin is the highest-value forgery target. **Strengthening the secret is the most important prerequisite.** Caveat: rotating the secret invalidates every existing session (all users logged out); do it during low traffic and communicate it.
2. **No brute-force lockout on login.** The super-admin login has only IP rate limiting (`strictRateLimiter`, 50 / 15 min per IP) plus the global 400/15min. No per-account lockout, no backoff, no CAPTCHA; parallelizable across IPs. For a single high-value account this is weak. The password itself is bcrypt-hashed (good), so real protection rests on password strength; a tighter dedicated limiter is a cheap improvement.

---

## Recommended implementation

Use explicit, reversible **enable flags** rather than hardcoding "allow production". This keeps the default fail-closed and lets you turn super-admin off instantly by unsetting an env var, without a code change.

### P1 (prerequisite, strongly recommended): strengthen the token secret
On Railway (production), set `SERVER_TOKEN_SECRET` to a fresh long random value (>= 32 chars, e.g. `openssl rand -base64 48`) and set `SERVER_REFRESH_TOKEN_SECRET` to a DIFFERENT long random value (today it is derived from the access secret). No code change required. Expect all users to be logged out once. Do this first.

### P2 (optional): min-length floor in the boot check
`src/config/server.config.ts` `validateSecurityConfig()`: also throw in prod/staging if `SERVER_TOKEN_SECRET.length < 32`. Prevents silently shipping a weak secret again.

### P3 (optional): tighten super-admin login brute-force
Add a dedicated limiter (e.g. 10 / 15 min per IP) for `POST /auth/superAdmin/login` in `rateLimiter.middleware.ts`, or lower `strictRateLimiter` for this route. Optionally a per-email failed-attempt counter later.

### B1 (backend): flag-gate the login instead of hardcoding prod
`src/auth/auth.router.ts` (the `POST /auth/superAdmin/login` gate, currently lines 322-327). Change the condition to allow dev/staging as today, OR when an explicit flag is set:
```ts
const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
const enabledByFlag = process.env.SUPERADMIN_LOGIN_ENABLED === "true";
const devOrStaging = nodeEnv === "development" || nodeEnv === "staging";
if (!devOrStaging && !enabledByFlag) {
  return res.status(StatusCodes.FORBIDDEN).json({ error: "Super Admin login is disabled in this environment" });
}
```
Fail-closed: production without the flag stays 403 exactly as now. Setting `SUPERADMIN_LOGIN_ENABLED=true` on Railway is the deliberate, instantly-reversible switch.

### F1 (frontend): flag-gate the DEV-only super-admin surface
`NeuroLogBookFront`. Introduce a build-time flag `VITE_SUPERADMIN_ENABLED`. Replace each `import.meta.env.DEV` super-admin gate with `(import.meta.env.DEV || import.meta.env.VITE_SUPERADMIN_ENABLED === 'true')`. Exact sites (from the audit):
1. `src/App.tsx:205` master route block `{import.meta.env.DEV && (` (closes at `:238`) — mounts all super-admin routes + the login route. PRIMARY toggle.
2. `src/pages/SuperAdminLoginPage.tsx:24` effect redirect `if (!import.meta.env.DEV) navigate('/')`.
3. `src/pages/SuperAdminLoginPage.tsx:61` render guard `if (!import.meta.env.DEV) return null`.
4. `src/pages/LoginPage.tsx:18` `isAllowedRedirect` super-admin clause (`&& import.meta.env.DEV`).
5. `src/pages/LoginPage.tsx:97` default post-login target super-admin clause (`&& import.meta.env.DEV`).
6. `src/components/CalendarManagerDashboardSwitcher.tsx:27` redirect effect DEV clause.
7. `src/components/CalendarManagerDashboardSwitcher.tsx:61` same redirect in render body.

Cleanest: define a small helper `const SUPERADMIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_SUPERADMIN_ENABLED === 'true'` and use it at all 7 sites. Debug-only `console.log` DEV checks (`SuperAdminDashboardPage.tsx:70`, `InstituteAdminSettingsPage.tsx:81`) do not gate anything and can stay. `pageTitles.ts` already resolves super-admin paths unconditionally (no change). `api.ts` needs no change (endpoints already reachable; only the UI was hidden).

Note: the super-admin login page has NO visible link anywhere (typed-URL only). That obscurity is a mild bonus but is NOT the security boundary. The real boundary is the backend gate (B1) plus the password/secret. Do not rely on the hidden URL.

### E1 (go live): set the env flags
- Railway (backend, production): `SUPERADMIN_LOGIN_ENABLED=true`.
- Netlify (frontend): `VITE_SUPERADMIN_ENABLED=true` (build-time; triggers a rebuild).
- To disable later: unset the Railway var (instant, no deploy) and/or the Netlify var (rebuild).

Local dev keeps working with no env set (dev branch still shows super-admin via `import.meta.env.DEV`). Local backend `NODE_ENV` is `staging`, so the login already works locally.

---

## Verification

- Backend unit-of-behaviour (alt-port instance):
  - `NODE_ENV=production` and NO flag: `POST /auth/superAdmin/login` returns 403 (unchanged).
  - `NODE_ENV=production` and `SUPERADMIN_LOGIN_ENABLED=true`: valid creds return a token + cookies; wrong creds 401.
  - Confirm strictRateLimiter (or the new P3 limiter) still applies.
- Frontend:
  - `npm run build` WITHOUT `VITE_SUPERADMIN_ENABLED`: super-admin routes absent from the bundle (grep the build output for `super-admin`), `/login/super-admin` does not resolve.
  - `VITE_SUPERADMIN_ENABLED=true npm run build`: routes present; login page renders.
- E2E on a prod-like instance: mint/login a real super-admin, land on `/dashboard/super-admin`, browse read-only reference pages (dept-scoped), confirm no write buttons on reference pages, confirm provisioning create pages work.
- After deploy: confirm `/login/super-admin` on the live site loads and a real super-admin can log in; confirm unsetting the Railway flag returns 403 without a redeploy.

## Rollback
- Backend: unset `SUPERADMIN_LOGIN_ENABLED` on Railway (instant 403). Or revert B1 commit.
- Frontend: unset `VITE_SUPERADMIN_ENABLED` on Netlify and redeploy (routes vanish from the build). Or revert F1 commit.
- Secret rotation (P1) is not rolled back with this feature; it stands on its own.

## Decisions for the user (needed before implementing)
1. **Enablement mechanism**: the recommended explicit env-flag approach (reversible without redeploy), or the simpler "just allow production in the NODE_ENV check" (less safe, requires a code change to turn off)?
2. **Secret rotation (P1)**: do it as a prerequisite (recommended; it logs everyone out once), or proceed without and accept the weak-secret risk?
3. **`POST /supervisor/resetPasswords`** (mass supervisor password reset): leave reachable for prod super-admin, or disable/guard it given the blast radius?
4. **Brute-force (P3)** and **min-length floor (P2)**: include now, or defer?

---

## Audit reference (evidence, 2026-07-23)
- Backend login gate: `src/auth/auth.router.ts:314-327`. Role hierarchy: `src/middleware/authorize.middleware.ts:16-57` (SUPER_ADMIN level 1 passes every gate). Boot check: `src/config/server.config.ts:20-29`. superAdmin router (writes removed): `src/superAdmin/superAdmin.router.ts`. Reference reads mirror-backed: `src/referenceRead/referenceRead.router.ts`. Institution read-only: `src/institution/institution.service.ts`, `routes.config.ts:90`.
- Frontend gates: `src/App.tsx:205-238`, `src/pages/SuperAdminLoginPage.tsx:24,61`, `src/pages/LoginPage.tsx:18,97`, `src/components/CalendarManagerDashboardSwitcher.tsx:27,61`. Reference write UI removed (no mutations in any super-admin reference page). Provisioning create-only pages: `SuperAdminCreateInstituteAdminPage.tsx`, `SuperAdminCreateCalendarManagerPage.tsx`. Hospitals add/edit only: `InstituteAdminHospitalsPage.tsx`, `InstituteAdminHospitalFormPage.tsx`.
