# Module Upgrade Audit: journal
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) 2026-07-14 — 27 → NS
**✅ Implemented:** dept-scoped `departmentId` (nullable, migration `1783782610080`); ETL **27** journals → NS. Loaded before events.
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Journal-club entries `journals` — **27 prod rows**. Only entity changed main→branch (1 line); no FKs, no idioms, no tenancy. Parent of `events.journalId`. Trivial ETL. prod-cts also 27 (likely same set).
**Verdict:** **7 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/journal/` (both sides), route `/journal`. Only `journal.mDbSchema.ts` changed (1 line). No FKs. Parent of `events.journalId`. **Table owned:** `journals`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `journals` | ✅ | 27 | 27 (likely same) | ✅ (0) | 🔁 tiny ETL (before events) |

## 3. Variables & env keys
None module-specific. No `departmentId`.

## 4. Production reality
`journals` — `id char(36)` PK, no FKs. Columns: `journalTitle varchar(255)`, `pdfLink text`, `google_uid varchar(255)`, timestamps. **27 rows.** prod-cts 27 (confirm same ids).

## 5. New-system state
`InitKaSchema`: uuid id, `pdfLink text`, timestamps. Live rows: **0**.

## 6. Gap analysis
1. Schema — ✅ live (char36→uuid, text, charset dropped). 2. Tenancy — ✅ none. 3. Dept — ✅ n/a. 4. Reference — none. 5. Services — none. 6. PG-portability — ✅ no idioms.
7. **🔁 ETL — `journals` (27):** char36→uuid. Load **before events**. Verify count 27.
8. API — ✅ unchanged.

## 7. Upgrade plan
1. ETL 27 journals (before events). 2. Rollback: `TRUNCATE journals CASCADE`.

## 8. Risks — CTS vs prod overlap (dedupe by id).
## 9. Open questions
1. prod-cts 27 — same as prod's 27 (dedupe by id) or distinct set? Recommend load prod, treat CTS as duplicate.
## 10. Approval checklist
- [ ] Scope · [ ] Mapping · [ ] ETL · [ ] Implement
