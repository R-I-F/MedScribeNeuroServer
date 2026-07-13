# Module Upgrade Audit: equipment
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Tiny lookup `equipment` (names used in submissions) — **11 prod rows**. Only entity changed main→branch (charset). No FKs, no idioms, no tenancy. Trivial ETL. prod-cts 7.
**Verdict:** **7 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/equipment/` (both sides), route `/equipment`. Only `equipment.mDbSchema.ts` changed. **Table owned:** `equipment`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `equipment` | ✅ | 11 | 7 | ✅ (0) | 🔁 tiny ETL |

## 3. Variables & env keys — none module-specific. No `departmentId`.
## 4. Production reality
`equipment` — `id char(36)` PK, `equipment varchar(100)` (name), timestamps. **11 rows.** prod-cts 7.
## 5. New-system state — `InitKaSchema`: uuid id, varchar name. Live rows: **0**.
## 6. Gap analysis
1. Schema — ✅ (char36→uuid, charset dropped). 2–6 — none/portable. 7. **🔁 ETL 11 rows**. 8. API — ✅ unchanged.
## 7. Upgrade plan — ETL 11 equipment; rollback `TRUNCATE equipment CASCADE`.
## 8. Risks — CTS(7)/prod(11) overlap → dedupe by id.
## 9. Open questions
1. prod-cts 7 vs prod 11 — load prod only (recommended) or merge CTS-only names?
## 10. Approval checklist
- [ ] Scope · [ ] Mapping · [ ] ETL · [ ] Implement
