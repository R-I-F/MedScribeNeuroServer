# Module Upgrade Audit: lecture
**Date**: 2026-07-13 · **Status**: ✅ MIRROR-BACKED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Lectures + lecture-topics module. **Legacy router removed** (4 files, +53/−307; **two entities kept**). Both tables are **hub-mirrored**: KA `lectures` **3,237** (prod 152) and `lecture_topics` **141**. `lecture_topics` carries **department association** (dept-scoped); `lectures` link to topics (`FK_lectures_topic`) and add `arTitle`/`sortOrder`/`lectureNumber` columns (from `AddDepartmentScoping`). **No prod ETL** — hub-synced via `refApi`; reads via `referenceRead` (`GET /lecture`, `/lecture/:id`). Parent of `events.lectureId`.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/lecture/` — `lecture.mDbSchema.ts` + `lectureTopic` entity/service (**router removed**). Read via `referenceRead`; parent of `events.lectureId`. **Tables owned (mirror):** `lectures`, `lecture_topics`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `lectures` | 152 (superseded) | ✅ **3,237 (hub-synced)** | ✅ mirror |
| `lecture_topics` | — | ✅ **141 (hub, dept-scoped)** | ✅ mirror |

## 3. Variables & env keys — none directly (hub sync). Dept scoping via referenceRead + `lecture_topics.departmentId`.
## 4. Production reality — prod `lectures` = 152 (per-tenant); no separate `lecture_topics`. Superseded by hub (3,237 + 141 topics).
## 5. New-system state — `lectures` (3,237) + `lecture_topics` (141) populated from hub. `AddDepartmentScoping` added `lecture_topics`, `lectures.topicId`/`arTitle`/`sortOrder`/`lectureNumber`, and `FK_lectures_topic`. `lecture_topics` are dept-associated.
## 6. Gap analysis
1. Schema — ✅ mirror (two entities, hub ids, PG-native) + dept-scoping columns/FK. 2. Tenancy — ✅ none. 3. **Dept scoping — ✅ lecture_topics carry department.** 4. **Reference boundary — ✅ hub-owned, mirrored; write-path retired.** 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none from prod** (hub-synced). 8. **API — router retired**; reads via referenceRead. Note `events.lectureId` FKs require lectures present — they are.
## 7. Upgrade plan — **nothing to migrate** (3,237 + 141 live). Keep hub sync running.
## 8. Risks — events ETL depends on lectures present (satisfied, hub-synced).
## 9. Open questions — none (prod 152 superseded by hub 3,237).
## 10. Approval checklist
- [x] Scope confirmed (two mirror tables, router retired) · [x] 3,237 + 141 live · [x] No prod ETL · [x] Dept scoping + FK parent verified
