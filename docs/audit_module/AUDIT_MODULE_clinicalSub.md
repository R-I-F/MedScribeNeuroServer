# Module Upgrade Audit: clinicalSub
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) 2026-07-14 — 87 → NS
**✅ Implemented:** dept-scoped `departmentId` (nullable, migration `1783782610070`); ETL **87** rows → all NS (backfilled candidate→supervisor), **0 FK orphans**. (prod is 87 now; was 86 at audit time.)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Clinical (non-surgical) submissions `clinical_sub` — **86 prod rows**. Sibling of `sub`. Only the entity changed main→branch; no MySQL idioms; `institutionId` is the same **benign** email-link passthrough as `sub` (not DB routing). FKs → candidates + supervisors (both already loaded). prod-cts empty. Simple ETL.

**Verdict counts:** **8 ✅ · 1 🔁 · 0 ❓**.

## 1. Scope & component map
`src/clinicalSub/` (both sides), route `/clinicalSub`. Only `clinicalSub.mDbSchema.ts` changed. Controller passes `institutionId` (email link, benign). FKs → candidates, supervisors. Read by `instituteAdmin` dashboards. **Table owned:** `clinical_sub`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `clinical_sub` | ✅ | 86 | 0 | ✅ (0 rows) | 🔁 small ETL (after candidates+supervisors) |

## 3. Variables & env keys
`FRONTEND_URL` (email link, shared with sub). No `departmentId`. JWT role/id.

## 4. Production reality
**`clinical_sub`** — `id char(36)` PK. FKs: `candDocId`→candidates, `supervisorDocId`→supervisors. Columns: `dateCA date`, `typeCA enum(clinical round, outpatient clinic, workshop, other)`, `description varchar(2000)`, `subStatus enum(pending,approved,rejected)`, `review text`, `reviewedAt/createdAt/updatedAt datetime`.
**Distribution (86):** workshop/pending 42, clinical round/pending 22, outpatient/pending 14, clinical round/approved 7, other/pending 1. **prod-cts:** 0 (nothing to exclude).

## 5. New-system state
KA `clinical_sub` (`InitKaSchema`): `id`/FK ids uuid, `dateCA date`, `typeCA` → `clinical_sub_typeca_enum`, `description varchar(2000)` default '', `subStatus` → `clinical_sub_substatus_enum`, `review text`, timestamps. FKs live: `candDocId`/`supervisorDocId` RESTRICT. Live rows: **0**.

## 6. Gap analysis
1. **Schema** — ✅ live (uuid FK shadows, date preserved, enums, charset dropped).
2. **Tenancy** — ✅ `institutionId` is benign email-link passthrough (same as sub); optional cleanup.
3. **Dept scoping** — ✅ n/a (derived via candidate).
4. **Reference boundary** — none.
5. **Services** — mailer (notification, if any) stays local.
6. **PG-portability** — ✅ no idioms.
7. **🔁 ETL — `clinical_sub` (86 prod):** id/FK char36→uuid; date/enums pass through. Load **after candidates + supervisors** (both done). No CTS rows. Verify count 86 + (typeCA,subStatus) distribution + 0 FK violations.
8. **API contract** — ✅ unchanged.

## 7. Upgrade plan
1. ETL 86 clinical_sub (after candidates/supervisors). Idempotent upsert on `id`.
2. (Optional) `institutionId` email-link cleanup (shared with sub).
3. Rollback: `TRUNCATE clinical_sub CASCADE` on staging.

## 8. Risks
- FK order (candidates/supervisors first — already satisfied).

## 9. Open questions
- None material (prod-cts empty; institutionId cosmetic).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Mapping approved
- [ ] ETL approved (86 rows)
- [ ] Approved to implement
