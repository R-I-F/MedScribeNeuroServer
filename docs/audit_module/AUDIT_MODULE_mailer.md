# Module Upgrade Audit: mailer
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED — no ETL (owns no table)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Outbound email service at `/mailer`. **Owns no table, no MySQL idioms, no tenancy** (grep = 0). One of the per-institution in-workspace services (stays here, never moves to the hub). Used by sub (supervisor notifications), passwordReset (reset emails), auth. Nothing to migrate — only env/config to confirm.

**Verdict counts:** **all ✅ · 0 🔁 · 1 ❓** (env only).

## 1. Scope & component map
`src/mailer/` — controller/service/router/interface (**no entity**). Route `/mailer`. (`src/mailgun/` is an empty/unused sibling.) Consumed by sub/passwordReset/auth. **Tables owned:** none.

## 2. Tables affected — none.
## 3. Variables & env keys
Mail provider credentials (SMTP/Mailgun API key, from-address, `FRONTEND_URL` for links) — must exist in the KA deployment env.
## 4. Production reality — N/A.
## 5. New-system state — pure service; no entity/migration.
## 6. Gap analysis
1. Schema — n/a. 2. Tenancy — ✅ none. 3. Dept — n/a. 4. Reference — n/a. 5. **Services — ✅ stays local** (per-institution mailing system). 6. PG-portability — ✅ clean. 7. ETL — none. 8. API — ✅ unchanged.
## 7. Upgrade plan — **nothing to implement**; confirm mail-provider env in KA deployment.
## 8. Risks — missing mail credentials → notifications/reset emails silently fail; verify.
## 9. Open questions
1. Confirm the KA deployment mail provider + credentials (and whether `src/mailgun/` empty dir should be removed).
## 10. Approval checklist
- [x] Scope confirmed · [x] No table · [ ] Mail env confirmed · [x] No DB implementation
