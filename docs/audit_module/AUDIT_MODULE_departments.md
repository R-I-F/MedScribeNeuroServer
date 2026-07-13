# Module Upgrade Audit: departments
**Date**: 2026-07-13 · **Status**: ✅ MIRROR (hub-synced) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
The mirrored `departments` table (**hub UUID as PK** — `@PrimaryColumn({type:"uuid"})`, not generated). **New in the spoke** (1 file, +34 lines; no main table — `departments` does not exist in `kasr-el-ainy`). Populated from the hub by `refApi` — **KA has all 15 departments live**. The FK target for every user table's `departmentId`. No prod ETL, no idioms.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/departments/` — `department.mDbSchema.ts` only (schema; reads via `referenceRead`/`bundler`). **New on branch.** Referenced by `candidates`/`supervisors`/`institute_admins`/`clerks`.`departmentId` FKs, and by `main_diags`/`lecture_topics` dept associations. **Table owned:** `departments` (mirror).

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `departments` | — (not in KA MySQL) | ✅ **15 (hub-synced)** | ✅ mirror, no ETL |

## 3. Variables & env keys — none directly (populated via refApi's hub env). `REF_DEPT_CODE` used by readers.

## 4. Production reality — no `departments` table in `kasr-el-ainy` (the multi-tenant model had one DB per institution, not per department). Nothing to migrate.

## 5. New-system state
`departments` — **`id uuid` PRIMARY (hub UUID, not generated)**, code + name columns, timestamps. **15 rows** synced from the hub. FK target: `FK_candidates_department`, `FK_supervisors_department`, `FK_institute_admins_department`, `FK_clerks_department`, plus `main_diags`/`lecture_topics` dept links.

## 6. Gap analysis
1. **Schema** — ✅ mirror entity with hub-UUID PK (deliberate — ids must match the hub). 2. **Tenancy** — ✅ replaces per-tenant DBs with intra-institution departments. 3. **Department scoping** — ✅ **this is the scoping anchor.** 4. **Reference boundary** — ✅ owned by hub, mirrored here. 5. Services — none. 6. PG-portability — ✅. 7. **ETL** — ✅ **none from prod** (hub-synced; 15 live). 8. API — public `GET /departments` via referenceRead.

## 7. Upgrade plan
**Nothing to migrate** (15 departments already synced). Keep the hub sync running (refApi).

## 8. Risks — hub id drift would orphan user `departmentId` FKs; mirror keeps ids stable (hub-authoritative).
## 9. Open questions — none (15 departments live and are the FK anchor).
## 10. Approval checklist
- [x] Scope confirmed (mirror, hub UUID PK) · [x] 15 departments live · [x] No prod ETL · [x] FK anchor verified
