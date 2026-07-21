# OTP-Verified Signup — Plan & Living Progress Record

> **⚠️ AGENT RULE (user-mandated): update the `## 🔄 Progress Checkpoint` table at the bottom
> IMMEDIATELY after every stage (and mid-stage for Stage B, per file). If a session crashes,
> the next agent resumes from this table. Never batch checkpoint updates.**

Date started: 2026-07-21 · Branch: `migration/mysql-to-postgres` (backend) + `design-integration` (frontend)
Approved decisions (user): **Email OTP (6-digit)** · **15-min expiry, no extension on resend** ·
**resend: 60s cooldown, max 3 sends** · **max 5 wrong attempts → pending signup rejected** ·
**staging-table approach** (`pending_signups`; real account row created only on successful verification).

## Why

Public signups currently create real (unapproved) `candidates`/`supervisors` rows immediately, with
no proof the email is real. OTP verification gates account creation on email ownership; unverified
signups self-destruct after 15 minutes and the user must re-register.

## Design summary

- **New table `pending_signups`** (migration `1783782610160-CreatePendingSignups.ts`, auto-globbed):
  `id` uuid PK (= client `signupId` handle) · `role` enum(candidate|supervisor) · `email` (lowercased,
  indexed) · `payload` jsonb (registration payload with password ALREADY bcrypt-hashed) · `otpHash`
  (bcrypt of 6-digit code) · `attempts` int (cap 5) · `sendCount` int (cap 3) · `lastSentAt` (60s
  cooldown) · `expiresAt` (createdAt + 15 min, indexed) · timestamps. Entity registered in BOTH
  `src/config/database.config.ts` and `src/config/ka-migrations.config.ts` entity arrays.
- **New module `src/pendingSignup/`** (mirrors `src/passwordReset/`): entity + service (repo) +
  provider (startSignup / verifyOtp / resendOtp / purgeExpired + inline OTP email HTML/text in the
  passwordReset email style). OTP code via `crypto.randomInt(100000, 999999)`. Emails via existing
  `MailerService.sendMail` (Mailgun). Env-gated dev aid `OTP_DEV_LOG=true` logs the code server-side
  (staging testing when Mailgun can't deliver to a test inbox).
- **Account creation reuse**: the row-creation halves of `auth.controller.registerCand/registerSupervisor`
  are extracted into `createCandidateAccount` / `createSupervisorAccount` (accepting a pre-hashed
  password) and called by the verify step inside a transaction with an email-uniqueness re-check.
- **Routes** (all `strictRateLimiter`; registerCand previously had NO limiter — fixed):
  `POST /auth/registerCand` + `POST /auth/registerSupervisor` keep URL+validator but now create a
  pending signup and respond `201 { signupId, expiresAt, email }` ·
  `POST /auth/verifySignupOtp { signupId, code }` → `201 { user }` | 400 wrong (+`attemptsRemaining`) |
  410 expired/rejected ·
  `POST /auth/resendSignupOtp { signupId }` → `200 { sendsRemaining, expiresAt }` | cooldown/exhausted errors.
- **Purge sweep**: `purgeExpired()` every `PENDING_SIGNUP_PURGE_MS` (default 10 min) + 30s boot sweep,
  both `.unref()`, started in `src/index.ts` (pattern: `RefDataService.startPolling`). Expiry is also
  enforced at read time — the sweep is hygiene.
- **Frontend**: `api.registerCand/registerSupervisor` return `{ signupId, expiresAt, email }`; new
  `api.verifySignupOtp` / `api.resendSignupOtp`; shared `src/components/landing/SignupOtpStep.tsx`
  (code input, mm:ss countdown, resend with cooldown, attempts feedback, expired→back-to-form);
  both signup pages get a `'form' | 'otp' | 'success'` step state; new `signupForms` i18n keys (EN+AR).

## Verification protocol (Stage G)

1. Migration apply → revert → re-apply clean (`npm run db:ka:migrate` / `db:ka:revert`, staging only).
2. `npx tsc --noEmit` both repos + `vite build`.
3. Live API against :3001 (OTP read from server log via `OTP_DEV_LOG=true`):
   register → pending row, NO real row, password hashed · duplicate-of-existing-account email → clean 4xx ·
   wrong code ×5 → 410 + row deleted · re-register replaces pending · resend cooldown + max-3 + old code
   invalidated · correct code → real row (approved:false, departmentId stamped) + pending deleted ·
   forced-expired row → 410 → purge sweep removes it · supervisor happy path.
4. User click-test both forms (EN + AR).

## Out of scope

Admin approval flow unchanged (verification precedes approval). No changes to login/password-reset/
existing users. WhatsApp channel not in this pass.

---

## 🔄 Progress Checkpoint (update after EVERY stage — crash recovery depends on this)

| Stage | Status | Verified | Notes |
|---|---|---|---|
| 0 — this doc created | ✅ | — | |
| A — migration + entity + config registration | ✅ | ✅ | `pendingSignup.mDbSchema.ts` + migration `1783782610160` applied→reverted→re-applied clean on ka-institute; entity added to BOTH config arrays |
| B — pendingSignup module + account-creation refactor | ✅ | ⬜ (tsc pending) | `pendingSignup.service.ts` (repo) + `pendingSignup.provider.ts` (startSignup/verifyOtp/resendOtp/purge + OTP email in passwordReset style + OTP_DEV_LOG); DI bound in container.config; auth.controller registerCand/registerSupervisor REPLACED with staging delegation (account creation now lives in provider, transaction + email race guard); verifySignupOtp/resendSignupOtp controller methods added. NOTE: old creation bodies deleted from auth.controller — no other callers existed (grepped) |
| C — routes + validators + rate limiters | ✅ | ✅ tsc | `signupOtp.validator.ts`; registerCand gained strictRateLimiter (was NONE); both register routes map email_exists→409; /verifySignupOtp (201/400+attemptsRemaining/410 expired|rejected/404) + /resendSignupOtp (200/429 cooldown|exhausted/410/404) added before /login |
| D — purge sweep wired in index.ts | ✅ | ✅ tsc | `startPurgeSweep(AppDataSource)` after refData.startPolling; PENDING_SIGNUP_PURGE_MS default 600000 + 30s boot sweep, both unref'd. Stage B also tsc-verified ✅ |
| E — frontend api.ts | ✅ | ⬜ (tsc with F) | registerCand/registerSupervisor → `{signupId,expiresAt,email}` (dead token-write removed); verifySignupOtp/resendSignupOtp return structured results (wrong/cooldown/exhausted/terminal NOT thrown — envelope-aware parsing `data.error ?? data`) |
| F — OTP UI + i18n (both signup pages) | ✅ | ✅ tsc+build | `SignupOtpStep.tsx` (code input, mm:ss expiry countdown w/ client-side terminal, resend cooldown/exhausted states, attempts feedback); 14 otp* i18n keys EN+AR in landingPage.i18n; both pages on `'form'\|'otp'\|'success'` step machine — terminal → back to FRESH form with the message shown. E also tsc-verified ✅ |
| G — E2E verification | ✅ | ✅ ALL GREEN | Alt-port ts-node instance (:3011, OTP_DEV_LOG) — full suite passed: register=201 staged (no real row, pw bcrypt-hashed, no plaintext in payload); wrong×4→400 w/ attemptsRemaining 4→1, 5th→410 rejected + row deleted; re-register replaces; immediate resend→429 retryInSeconds:60; post-cooldown resend→200 (sendsRemaining 1) + OLD code 400 + NEW code 201 → real row approved:false/dept NS/bcrypt + pending deleted; duplicate-of-existing→409; forced-expired verify→410 expired + row deleted; supervisor happy path 201/201 canValidate:false. Mailgun accepted sends (example.com recipients). All test artifacts cleaned from DB. Browser click-test by user pending |
| H — CLAUDE.md session log | ✅ | — | Entry added (see CLAUDE.md "Where we stopped"). `OTP_DEV_LOG: true` added to .env.staging for the user's click-testing — **must NOT be set in production env** |
