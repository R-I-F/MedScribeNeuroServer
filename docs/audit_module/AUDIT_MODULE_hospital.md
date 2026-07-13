# Module Upgrade Audit: hospital
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Small local lookup `hospitals` — **7 prod rows**. A **root parent** of `cal_surgs.hospitalId`. Entity is **unchanged main→branch** (already declares `location` as JSON). One real transform: prod `location` is `longtext` but KA is native **`json`** → ETL must coerce to valid JSON. Arabic `arabName` (utf8mb4). No idioms, no tenancy.

**Verdict counts:** **6 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/hospital/` (both sides; **no service diff, entity unchanged**), route `/hospital`. Controller/service/router identical. Parent of `cal_surgs.hospitalId`; read by `instituteAdmin` (`/hospitals`). **Table owned:** `hospitals`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `hospitals` | ✅ | 7 | 7 (likely same 7) | ✅ (0 rows) | 🔁 small ETL + longtext→json coercion |

## 3. Variables & env keys
None module-specific. No `departmentId` (institute-wide lookup).

## 4. Production reality
**`hospitals`** — `id char(36)` PK. Columns: `arabName varchar(100)` (Arabic — all 7 non-ASCII), `engName varchar(100)` (0 null), `location longtext` (JSON string), `createdAt/updatedAt datetime`. No FKs. **7 rows.** **prod-cts:** 7 (same set — confirm ids match; likely identical, so load prod, ignore CTS).

## 5. New-system state
KA `hospitals` (`InitKaSchema`): `id uuid`, `arabName`/`engName varchar`, **`location json`** (native), timestamps. Live rows: **0**.

## 6. Gap analysis
1. **Schema** — ✅ mostly; ⚠ `location longtext (json string)` → **`json`**: ETL must `JSON.parse`/validate (fallback null on invalid).
2. **Tenancy** — ✅ none.
3. **Dept scoping** — ✅ n/a (institute-wide).
4. **Reference boundary** — local lookup (not hub reference); owned here. ✅
5. **Services** — none.
6. **PG-portability** — ✅ no idioms.
7. **🔁 ETL — `hospitals` (7 prod):** id char36→uuid; `location` → valid json (or null); Arabic preserved. prod-cts 7 assumed identical → load prod only (confirm ids). Load **before `cal_surgs`**.
8. **API contract** — ✅ unchanged.

## 7. Upgrade plan
1. ETL 7 hospitals (before cal_surgs), coercing `location`→json. Verify 7 rows, Arabic intact, all `location` valid json.
2. Rollback: `TRUNCATE hospitals CASCADE` on staging.

## 8. Risks
- Invalid JSON in `location` → insert fails: validate/coerce per row (only 7).
- CTS vs prod overlap: confirm same ids (dedupe by id).

## 9. Open questions
1. **prod-cts 7 hospitals** — same as prod's 7 (dedupe by id) or distinct? Recommend load prod, treat CTS as duplicate/test.
2. `location` semantics — free-text vs structured JSON? (drives the coercion). Recommend: parse if valid JSON else wrap as string/null.

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Mapping approved (longtext→json)
- [ ] ETL approved (7 rows, before cal_surgs)
- [ ] Approved to implement
