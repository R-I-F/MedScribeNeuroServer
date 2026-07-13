# Module Upgrade Audit: consumables
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Tiny lookup `consumables` (names used in submissions) — **14 prod rows**. Only entity changed main→branch (charset). No FKs, no idioms, no tenancy. Trivial ETL. prod-cts 8.
**Verdict:** **7 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/consumables/` (both sides), route `/consumables`. Only `consumables.mDbSchema.ts` changed. **Table owned:** `consumables`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `consumables` | ✅ | 14 | 8 | ✅ (0) | 🔁 tiny ETL |

## 3. Variables & env keys — none module-specific. No `departmentId`.
## 4. Production reality
`consumables` — `id char(36)` PK, `consumables varchar(100)` (name), timestamps. **14 rows.** prod-cts 8.
## 5. New-system state — `InitKaSchema`: uuid id, varchar name. Live rows: **0**.
## 6. Gap analysis
1. Schema — ✅ (char36→uuid, charset dropped). 2–6 — none/portable. 7. **🔁 ETL 14 rows** (char36→uuid). 8. API — ✅ unchanged.
## 7. Upgrade plan — ETL 14 consumables; rollback `TRUNCATE consumables CASCADE`.
## 8. Risks — CTS(8)/prod(14) overlap → dedupe by id.
## 9. Open questions
1. prod-cts 8 vs prod 14 — load prod only (recommended) or merge CTS-only names?
## 10. Approval checklist
- [ ] Scope · [ ] Mapping · [ ] ETL · [ ] Implement
