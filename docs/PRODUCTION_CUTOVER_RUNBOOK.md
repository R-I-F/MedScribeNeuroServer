# Production Cutover Runbook — Legacy "ain" (MySQL) → KA Spoke (Postgres)

> **Status: PRE-CUTOVER.** Do NOT push to `main` until steps 1–5 are done.
> `main` is the live production app; merging the branches + deploying = the cutover itself.
>
> **Confirmed context (2026-07-21):**
> - `ka-institute` (Aiven PG `ka-psql-logbooknative.j.aivencloud.com`) **is the production database.**
> - Hub is live at `libelusrefapi-production.up.railway.app`.
> - `SERVER_TOKEN_SECRET` has been added to the production API.
> - Full pre-cutover delta sync done → prod parity (a final sync still runs during the freeze, step 5).
> - Data at parity: cal_surgs 5703, submissions 3664, clinical_sub 88, events 102, attendance 1264.
> - Branches: backend `migration/mysql-to-postgres`, frontend `design-integration`.
> - Backup of ka-institute before delta: `F:\DB_BACKUPS\ka-institute-pre-delta-20260721174318.json.gz`.

---

## 1. Env vars to ADD to the production backend

Legacy "ain" (MySQL) never had these — they are the new-stack requirements. Copy the **values**
from `.env.staging` (which already points at the production hub + the ka-institute DB).

**Postgres (the production DB = ka-institute):**
```
PSQL_HOST          (= ka-psql-logbooknative.j.aivencloud.com)
PSQL_PORT
PSQL_DB_NAME       (= ka-institute)
PSQL_USERNAME
PSQL_PASSWORD
PSQL_POOL_MAX      (= 8 — Aiven plan max_connections is 15)
SSL_CA_PATH        (= ca-defaultdb-staging.pem — see the ⚠️ cert note below)
```

**Hub (reference API):**
```
REF_API_URL        (= libelusrefapi-production.up.railway.app)
REF_API_KEY
REF_API_KA
REF_DEPT_CODE      (= NS)
REF_API_TIMEOUT_MS (= 30000)
HUB_WEBHOOK_SECRET (must match the hub's — for the /admin/ref-resync re-mirror broadcast)
```

**Auth secrets:** ✅ RESOLVED — all three already existed in the legacy production env, carried over. No action.
```
SERVER_TOKEN_SECRET          (must be a STRONG, non-default value)
SERVER_TOKEN_ISSUER
SERVER_REFRESH_TOKEN_SECRET  (optional; derives from SERVER_TOKEN_SECRET+"_refresh" if unset)
```

**AI runtime (fires when a new surgery is created — patient-name transliteration + clerk-proc translation):**
```
GEMINI_API_KEY       ← REQUIRED, no default. Without it, new surgeries get no bilingual name /
                       translation (background job fails gracefully — not a crash). CONFIRM it is set.
GEMINI_MODEL_NAME    ✅ OPTIONAL — code defaults to gemini-2.5-flash. Safe to skip.
GEMINI_API_VERSION   ✅ OPTIONAL — code defaults to v1. Safe to skip.
```

**Email (OTP verification + password reset):**
```
MAILGUN_API_KEY      ← REQUIRED
MAILGUN_DOMAIN       ← REQUIRED (domain only, e.g. mailer.example.com)
MAILGUN_API_BASE     ✅ OPTIONAL — code defaults to the EU endpoint (https://api.eu.mailgun.net).
                       Staging emails sent fine without it → the account is EU → default is correct.
                       Only set it (to https://api.mailgun.net) if the Mailgun account moves to US.
```

## 2. Env vars to SET specifically for production
```
NODE_ENV = production   ← CRITICAL: secure cookies ON, super-admin login DISABLED, and the
                          SERVER_TOKEN_SECRET boot guard is armed. Existed in legacy prod — CONFIRM
                          the value is exactly "production".
FRONTEND_URL = <production frontend URL>   ← existed in legacy prod; CONFIRM it is the prod frontend
                          origin (used for CORS + email links).
CORS_ORIGIN              ✅ NOT NEEDED — code falls back to FRONTEND_URL when CORS_ORIGIN is absent.
                          Just ensure FRONTEND_URL is correct.
```

## 3. Env vars that MUST NOT exist in production (leave them out)
- `OTP_DEV_LOG` — would print OTP codes to the server logs.
- `MIGRATION_API_KEY` — leave **unset** so the `*FromExternal` bulk-import routes and the `/external`
  sheet proxy stay disabled (they return 503, fail-closed). Data is already synced; these must not be
  reachable in production.
- `DISABLE_RATE_LIMIT` — load-testing switch; never in production.
  ✅ RESOLVED — was set in legacy production (rate limiting was OFF!); deleted. Protection now ON.
- Migration-only vars: `SQL_*` (legacy MySQL), `MONGODB_*`, `PSQL_*_DEFAULT`, `*_B_KA` — read only by
  the offline ETL/delta scripts, never the running API.
  ✅ RESOLVED — all `SQL_*` and `MONGODB_*` deleted from production. (Verified: the live app reads none.)
- Not needed by the running app: `INSTITUTION_*` (now inert — institution is a DB row),
  `TESTING_*_BEARERTOKEN`, `WHO_*`, `TELEGRAM*`, `EMAIL_*` (legacy IMAP).

### ⚠️ Still to confirm were ADDED (the app fails without these — none were noted as present):
`PSQL_HOST/PORT/DB_NAME/USERNAME/PASSWORD/POOL_MAX`, `SSL_CA_PATH` (+ the cert file),
`REF_API_URL`, `REF_API_KEY`, `REF_API_KA`, `REF_DEPT_CODE`, `REF_API_TIMEOUT_MS`, `HUB_WEBHOOK_SECRET`,
`GEMINI_API_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`.

## ⚠️ The SSL certificate FILE (the #1 thing people miss)
`SSL_CA_PATH` points to `ca-defaultdb-staging.pem` — a **file**, not just a setting. The Aiven CA cert
must physically exist on the production server at that path or every Postgres connection fails at boot.
It is gitignored, so it is not in the repo. On Railway (no easy file mount) the clean pattern is to
store the cert contents in a base64 env var and write it to a file at boot.
**Action:** either deploy the `.pem` to the prod filesystem at `SSL_CA_PATH`, or ask for the base64-env
boot step to be added to the backend (small change, removes this blocker).

---

## Cutover sequence (order matters)

1. **Env + cert** — set everything in sections 1–3 on the production backend; get the CA cert onto the
   server (or add the base64-env boot step).
2. **Frontend** — set `VITE_API_URL` to the production backend URL; build `design-integration`.
   (The super-admin routes are `import.meta.env.DEV`-gated and correctly excluded from the prod build.)
3. **Hub webhook** — update the hub's `SPOKE_WEBHOOKS` to the production spoke URL (currently points at
   localhost), so re-mirror broadcasts reach production.
4. **Freeze legacy "ain"** — put the old app in maintenance / stop writes. This begins the cutover window.
5. **Final delta sync** — during the freeze, run the sync one last time to capture anything users added
   since the pre-cutover run (idempotent, fast, no wipe):
   ```
   node scripts/delta-sync-prod-to-ka.cjs            # dry-run: review NEW/CHANGED counts
   node scripts/delta-sync-prod-to-ka.cjs --apply    # cal_surgs + submissions (+ approvals)
   node scripts/etl-events-clinical-prod-to-ka.cjs   # clinical_sub + events + attendance
   ```
   (Take a fresh ka-institute backup first — same one-off Node dump used before, ~1.75 MB.)
6. **Merge + deploy** — merge `migration/mysql-to-postgres` → `main` (backend) and `design-integration`
   → `main` (frontend); deploy both from `main`.
7. **Smoke-test on production** — `GET /health`; log in as each role; one signup → OTP → verify;
   load a dashboard; create a test surgery; confirm reference data (diagnoses/procedures) loads from
   the hub; check bilingual/RTL toggle.
8. **Flip traffic / DNS** to the new app.

## Rollback
Legacy "ain" MySQL was never modified (read-only throughout the whole migration), so the old app is
fully intact. If anything breaks after the flip, point traffic straight back to the legacy app. Keep
"ain" running until the new stack is proven stable in production.

## Post-cutover checklist
- [ ] Confirm the app booted (the `SERVER_TOKEN_SECRET` guard passed, DB + CA connected).
- [ ] Confirm reference reads work (hub reachable from prod).
- [ ] Confirm OTP + password-reset emails send (Mailgun).
- [ ] Confirm super-admin login returns 403 in production (expected — dev/staging only).
- [ ] Confirm the bulk-import routes return 503 (MIGRATION_API_KEY unset — expected).
- [ ] Consider strengthening `SERVER_TOKEN_SECRET` to 32+ random chars if it isn't already
      (the staging value was only 10 chars; a rotation logs everyone out once — harmless).
