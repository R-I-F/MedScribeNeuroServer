# Module Upgrade Audit: additionalQuestions
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Legacy per-main_diag six-flag config `additional_questions` (spOrCran/pos/approach/region/clinPres/intEvents). **Key difference from every other table: KA is NOT empty — it already has 196 seeded rows** (via the `SeedKaSixFlags` migration), while prod has only **10** and prod-cts **17**. So this is **not a straight ETL** — it's a **reconciliation**: the spoke seeded defaults for all mirror main_diags; the 10 prod rows are legacy custom overrides. Decision needed on whether to preserve prod's overrides.

**Verdict counts:** **6 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/additionalQuestions/` (both sides), route `/additionalQuestions`. Entity `additional_questions.mDbSchema.ts` changed (7/7 lines — the six tinyint→boolean flags + charset). FK `mainDiagDocId`→main_diags. Read by the submission flow (which six extra fields to require per diagnosis). **Table owned:** `additional_questions`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `additional_questions` | ✅ | 10 | 17 | ✅ **196 (seeded)** | 🔁 **reconcile** prod overrides vs seeded defaults |

## 3. Variables & env keys
None module-specific. No `departmentId` (keyed by main_diag).

## 4. Production reality
`additional_questions` — `mainDiagDocId char(36)` FK→main_diags; six flags `spOrCran/pos/approach/region/clinPres/intEvents tinyint(1)`. **prod: 10 rows** (explicit per-diagnosis overrides). **prod-cts: 17 rows** (the CTS clone's own overrides).

## 5. New-system state
KA `additional_questions` (`InitKaSchema` + **`SeedKaSixFlags`**): flags as **boolean**, `mainDiagDocId` uuid FK→main_diags. **Live rows: 196** — one seeded default per mirror `main_diags` entry (the new system defaults every diagnosis rather than storing sparse overrides).

## 6. Gap analysis
1. **Schema** — ✅ live (six tinyint→boolean, mainDiagDocId char36→uuid, charset dropped).
2. **Tenancy** — ✅ none.
3. **Dept scoping** — ✅ n/a (keyed by main_diag; main_diags carry dept).
4. **Reference boundary** — FK to mirror `main_diags`. ✅
5. **Services** — none.
6. **PG-portability** — ✅ no idioms.
7. **🔁 RECONCILE (not a straight ETL):** KA already seeded 196 defaults. Options for prod's 10 legacy overrides: **(a)** ignore them — seeded defaults are authoritative (recommended if the 10 match defaults or are stale); **(b)** overlay them — for the 10 `mainDiagDocId`s, copy prod's flag values onto the seeded row (preserves intentional custom config). Requires comparing prod's 10 rows' flags to the seeded defaults. prod-cts 17 excluded (test).
8. **API contract** — ✅ unchanged (endpoint returns the per-diagnosis flags).

## 7. Upgrade plan (proposed)
1. **Compare** prod's 10 rows to the KA seeded rows for the same `mainDiagDocId`. If any differ → decide overlay vs keep-seeded (Q1).
2. If overlay: `UPDATE additional_questions SET <flags> = prod values WHERE mainDiagDocId = ...` for the 10 (staging).
3. Rollback: re-run `SeedKaSixFlags` (idempotent) to restore defaults.

## 8. Risks
- Silently losing intentional prod overrides if we ignore the 10 — mitigate by comparing first.
- `mainDiagDocId` mismatch: prod's 10 `mainDiagDocId`s must exist in the mirror `main_diags` (they should, being real diagnoses).

## 9. Open questions
1. **Preserve prod's 10 overrides or trust the 196 seeded defaults?** Recommend: compare; overlay only where prod intentionally differs. (Need to see the 10 vs defaults.)
2. prod-cts 17 — exclude (test clone).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Mapping approved (tinyint→boolean flags)
- [ ] Reconciliation rule approved (overlay vs seeded)
- [ ] Approved to implement
