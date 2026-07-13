# Module Upgrade Audit: passwordReset
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Password-reset token store + flow (exposed via the auth surface). Owns `password_reset_tokens` (**87 prod rows — ephemeral/expiring**). Only the entity changed main→branch (1 line). It **delegates** email lookup to `cand`/`supervisor`/`instituteAdmin`/`clerk` services (the `getXByEmail` methods) — whose `SUBSTRING_INDEX`→`split_part` bug is **already fixed** in the shipped/committed work (superAdmin excluded from reset by design). **Recommend NOT migrating the tokens** (short-lived; let them expire). Its own 17 `institutionId` refs route to the static institution.

**Verdict counts:** **7 ✅ · 0 🔁 · 1 ❓** (the only decision is skip-vs-migrate tokens).

## 1. Scope & component map
`src/passwordReset/` (both sides) — controller/service/provider/interface + `passwordReset.mDbSchema.ts` (1-line change). No mounted router (exposed through `/auth/forgotPassword` + `/auth/resetPassword`). `findUserByEmail` fans out candidate→supervisor→instituteAdmin→clerk (first-match; superAdmin excluded — see the cross-role note in the supervisor audit). **Table owned:** `password_reset_tokens`.

## 2. Tables affected
| Table | prod | Rows | ka | Verdict |
|---|---|---|---|---|
| `password_reset_tokens` | ✅ | 87 (ephemeral) | 0 | ❓ recommend **skip ETL** (tokens expire) |

## 3. Variables & env keys
Token TTL / mailer config (via mailer). Uses static institution. No `departmentId`.

## 4. Production reality
`password_reset_tokens` — `id`, token hash, `userId char(36)`, `userRole enum(candidate,supervisor,superAdmin,instituteAdmin)`, `expiresAt`, `usedAt?`, timestamps. **87 rows** — historical/expired/used tokens.

## 5. New-system state
KA `password_reset_tokens` (`InitKaSchema`): uuid id, `password_reset_tokens_userrole_enum(candidate,supervisor,superAdmin,instituteAdmin)`, timestamps. Live rows: **0**. Delegated `getXByEmail` methods are PG-fixed.

## 6. Gap analysis
1. **Schema** — ✅ live (uuid, enum, timestamps).
2. **Tenancy** — ✅ `institutionId` resolves to static institution (no per-tenant routing).
3. **Dept scoping** — n/a.
4. **Reference boundary** — none.
5. **In-workspace services** — mailer (sends reset email) stays local.
6. **PG-portability** — ✅ **no own SQL idioms**; delegates to the (already-fixed) `getXByEmail` methods. **Note:** institute-admin reset works only after the `getInstituteAdminByEmail` fix (implemented, uncommitted in this session).
7. **ETL** — ❓ tokens are **ephemeral** → recommend **skip** (users request a fresh reset; migrating expired tokens is pointless and mildly sensitive).
8. **API contract** — ✅ unchanged (`/auth/forgotPassword`, `/auth/resetPassword`).

## 7. Upgrade plan (proposed)
1. **No ETL** for `password_reset_tokens` (start empty).
2. Ensure the 3 shipped/pending `getXByEmail` PG fixes are deployed (cand ✅, supervisor ✅, instituteAdmin ✅-uncommitted) so all reset flows work on PG.
3. Verify mailer env in KA deployment.

## 8. Risks & mitigations
- Migrating expired tokens = needless PII-ish data → skip.
- If any `getXByEmail` fix is missing, that role's forgot-password throws on PG — all three are addressed.

## 9. Open questions
1. **Migrate `password_reset_tokens`?** Recommend **no** (ephemeral). Confirm.

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Ephemeral-table skip approved
- [ ] `getXByEmail` PG fixes deployed (cand/supervisor/instituteAdmin)
- [ ] Approved to implement
