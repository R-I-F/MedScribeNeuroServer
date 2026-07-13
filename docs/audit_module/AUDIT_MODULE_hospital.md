# Module Upgrade Audit: hospital
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) — dept-scoped + 7 → NS
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `696c87f`+ PG `ka-institute`

## ✅ Implementation record (2026-07-13)
First ETL module. Applied to `migration/mysql-to-postgres` + `ka-institute` staging. Prod MySQL read-only; `main` untouched.

| # | Item | Where | Status |
|---|---|---|---|
| A | Add `departmentId` FK → departments (dept-scoped) | entity `hospital.mDbSchema.ts` + `IHospital` + migration `1783782609990-AddHospitalDepartment` | ✅ column + `FK_hospitals_department` live |
| B | `departmentId` NOT NULL | migration `1783782610000-HospitalDepartmentNotNull` | ✅ `is_nullable = NO` |
| C | `POST /hospital` requires `departmentId` (isUUID) | `validators/createHospital.validator.ts` | ✅ tsc clean |
| D | ETL 7 prod hospitals → NS (+ `location` text→json) | `scripts/etl-hospitals-prod-to-ka.cjs` | ✅ 7 loaded |

**ETL verification:** total **7** ✅ · `departmentId=NS` **7** · NULL dept **0** ✅ · `location` valid json **7/7** (0 unparseable) · Arabic `arabName` preserved **7/7**. NS dept id = `65bda505-…`.

**Decisions applied:** hospitals are **department-scoped** (simple `departmentId` FK, one dept per row; same name may repeat across departments → no name-unique). `departmentId` **NOT NULL**. Create requires it. **Deferred (follow-on):** dept-scoped hospital *reads* (`/hospital` + bundle filtered by requester's department) — new functionality, not part of this migration step. Load order: hospitals done → next `arab_procs` → `cal_surgs`.

## ⚠️ Revision note (2026-07-13) — hospitals are DEPARTMENT-SCOPED
User: *"hospitals need to be department scoped — each department has its own hospitals/units where they perform surgeries; they may not be unique across departments. The 7 hospitals in production are NS-scoped."*
So `hospitals` is **first-party operational data** (KA's own, from prod — NOT hub reference), but the KA table is currently **flat with no department dimension**. It needs a **`departmentId`** so each hospital belongs to one department, different departments keep their own rows, and the same name can repeat across departments (no global name-unique).

## 0. TL;DR
Small operational table `hospitals` (surgery venues) — **7 prod rows, all NS**. Needs: **(1)** add `departmentId` FK → departments (schema change), **(2)** ETL the 7 → `departmentId = NS`, **(3)** coerce `location` (stored text → json `{long,lat}`). Root parent of `cal_surgs.hospitalId`. No idioms, no tenancy coupling. Not hub-owned (unlike consumables/equipment) — it's prod ETL.

**Verdict:** **1 🔁 schema+ETL (add dept scoping) · 2 ❓ (NOT NULL? read-scoping now/later?)**.

## 1. Scope & component map
`src/hospital/` — entity/service/controller/router, route `/hospital`. Entity `@Entity("hospitals")` `@PrimaryGeneratedColumn("uuid")` + `arabName`/`engName varchar(100)` + `location json {long,lat}` (nullable) + timestamps. **Root parent** of `cal_surgs.hospitalId`; read by `instituteAdmin` (`/hospitals`). **Table owned:** `hospitals`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka (now) | Verdict |
|---|---|---|---|---|---|
| `hospitals` | ✅ (flat, no dept) | 7 (all NS) | 7 (same set) | 0 (flat, no `departmentId`) | 🔁 **add `departmentId` FK** + ETL 7 → NS + location→json |

## 3. Variables & env keys
None module-specific. **New:** `departmentId` (FK → mirror `departments`).

## 4. Production reality
`hospitals` — `id char(36)` PK, `arabName varchar(100)` (Arabic, all 7 non-ASCII), `engName varchar(100)`, `location longtext` (holds a JSON `{long,lat}` string), timestamps. **No department column in prod** → the 7 are implicitly the **NS** department's hospitals (per user). **7 rows.** prod-cts = 7 (same set).

## 5. New-system state (`ka-institute`)
`hospitals` (`InitKaSchema`): `id uuid`, `arabName`/`engName varchar`, `location json` (native), timestamps. **No `departmentId`** (gap — `AddDepartmentScoping` covered the user tables, not hospitals). Live rows: **0**. `cal_surgs.hospitalId` FK → `hospitals(id)`.

## 6. Gap analysis
1. **Schema** — 🔁 **add `departmentId uuid` FK → departments** (each hospital belongs to one department). `location longtext(json-string)` → **json** on load (validate/coerce; fallback null). No name-unique (hospitals may repeat across departments).
2. **Department scoping** — 🔁 **the core of this revision.** Hospital is dept-scoped via a simple `departmentId` FK (one dept per row), NOT a shared M2M (unlike hub reference tables). The 7 existing → NS. Reads should filter to the requester's department (see §7 note).
3. **Tenancy** — ✅ none.
4. **Reference boundary** — n/a (operational data, prod-owned; not hub).
5. **PG-portability** — ✅ no idioms.
6. **API** — `/hospital` reads currently return **all** hospitals; once dept-scoped they should filter by the requester's department (activation follow-on).

## 7. Upgrade plan (proposed)
1. **Migration** `<ts>-AddHospitalDepartment`: `ALTER TABLE hospitals ADD COLUMN "departmentId" uuid` + FK → `departments(id)`. (Nullable first for the backfill; then `SET NOT NULL` after the 7 are stamped — Q1.)
2. **Entity** `hospital.mDbSchema.ts`: add `departmentId` column.
3. **ETL** 7 prod hospitals → `departmentId = NS`; `location` text→json (coerce/validate, fallback null); Arabic preserved. Load **before `cal_surgs`**.
4. **(Follow-on) dept-scoped reads** — filter `/hospital` + `bundler` hospital reads by department (`?deptCode`/JWT `departmentId`), like `referenceRead`. New functionality — Q2 (now or later).
5. **Verify:** 7 rows, all `departmentId=NS`, Arabic intact, `location` valid json, `cal_surgs` FKs resolve.
6. Rollback: `TRUNCATE hospitals CASCADE` + drop the column/FK.

## 8. Risks & mitigations
- **`cal_surgs` load order** — hospitals (dept-stamped) before cal_surgs.
- **Making `departmentId` NOT NULL** — only after the 7 are backfilled (else fails). New hospital creation must then supply a department.
- **Invalid JSON in `location`** — validate/coerce per row (only 7).
- **Cross-dept name collisions are allowed** — do NOT add a unique on name.

## 9. Open questions
1. **`departmentId` NOT NULL after backfill?** — every hospital belongs to a department → recommend **yes** (like cand/supervisor). Confirm.
2. **Dept-scoped hospital reads** — implement now (filter `/hospital` by department) or defer as a follow-on? (Schema + ETL is the migration core; read-filtering is new functionality.)
3. **prod-cts 7** — same as prod's 7 (dedupe by id) → load prod only. Confirm.

## 10. Approval checklist
- [ ] Scope confirmed (hospitals = dept-scoped, prod ETL not hub)
- [ ] Add `departmentId` FK approved
- [ ] ETL 7 → NS + location→json approved
- [ ] `departmentId` NOT NULL decision
- [ ] Dept-scoped reads: now vs follow-on
- [ ] Approved to implement
