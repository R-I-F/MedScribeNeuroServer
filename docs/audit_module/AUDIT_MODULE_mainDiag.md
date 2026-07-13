# Module Upgrade Audit: mainDiag
**Date**: 2026-07-13 · **Status**: ✅ MIRROR-BACKED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Main-diagnosis category module. **Legacy router removed** (3 files, +6/−340; entity kept). `main_diags` is **hub-mirrored** with **196 KA rows** (prod had 10) plus the **join tables `main_diag_diagnoses` and `main_diag_procs`** (main_diag↔diagnoses / ↔proc_cpts links). Carries **department association** (main_diags are dept-scoped). **No prod ETL** — hub-synced via `refApi`. It is the FK parent of `submissions.mainDiagDocId` and `additional_questions.mainDiagDocId`.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/mainDiag/` — entity/service (**router removed**). Read via `referenceRead` (`GET /mainDiag`, `/mainDiag/:id`). FK parent of `submissions.mainDiagDocId` (RESTRICT) + `additional_questions.mainDiagDocId`. **Tables owned (mirror):** `main_diags` (+ join tables `main_diag_diagnoses`, `main_diag_procs`).

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `main_diags` | 10 (superseded) | ✅ **196 (hub-synced)** | ✅ mirror |
| `main_diag_diagnoses` | — | ✅ (join, hub) | ✅ mirror |
| `main_diag_procs` | — | ✅ (join, hub) | ✅ mirror |

## 3. Variables & env keys — none directly (hub sync). Dept scoping via `referenceRead`.
## 4. Production reality — prod `main_diags` = 10 (per-tenant). Superseded by the hub's 196.
## 5. New-system state — `main_diags` (196) + join tables populated from hub; dept-associated. Consumed by submissions + additionalQuestions + referenceRead.
## 6. Gap analysis
1. Schema — ✅ mirror (hub ids, PG-native) + join tables. 2. Tenancy — ✅ none. 3. **Dept scoping — ✅ main_diags carry department** (drives referenceRead + additionalQuestions six-flags). 4. **Reference boundary — ✅ hub-owned, mirrored; write-path retired.** 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none from prod** (hub-synced). 8. **API — router retired**; reads via referenceRead.
## 7. Upgrade plan — **nothing to migrate** (196 + joins live). Keep hub sync running. Note: `submissions.mainDiagDocId` FKs require these present — they are.
## 8. Risks — submissions ETL depends on main_diags being present (it is, hub-synced).
## 9. Open questions — none (prod 10 superseded by hub 196).
## 10. Approval checklist
- [x] Scope confirmed (mirror + joins, router retired) · [x] 196 live · [x] No prod ETL · [x] FK parent verified
