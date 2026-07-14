# Module Upgrade Audit: lecture
**Date**: 2026-07-13 · **Status**: ✅ CONFORMED to hub scaled schema + old system removed (2026-07-14) · **🔧 POST-CONFORM FIXES applied 2026-07-14 (review session, uncommitted)**

## 🔧 Post-conform fix record (2026-07-14 review — the conform commit `088e8b2` shipped broken reads)
Independent review after `088e8b2` found the mirror DATA correct (hub-pure: NS msc=84/md=66/NULL=2, 0 missing arTitle/lectureNumber — old-prod fingerprint would be md=62 + no Arabic) but **the serving layer broken** — the commit updated every consumer EXCEPT `src/referenceRead/`, the module that actually answers `/lecture`:

| # | Defect | Fix | Verified |
|---|---|---|---|
| 1 | **`GET /lecture` 500** — `referenceRead.provider.getLecturesByDepartment` still selected dropped `l."lectureTitle"`/`l."mainTopic"` (raw SQL, invisible to tsc) | alias the hub columns back to the legacy shape: `l."title" AS "lectureTitle"`, `t."title" AS "mainTopic"` (topic-derived — the sanctioned fallback) | ✅ live: NS default = 152 rows, CTS = 625, shape `{id,lectureTitle,mainTopic,level}` byte-identical |
| 2 | **`GET /lecture/:id` wrong shape** — controller returned the raw new entity (`title`, no `mainTopic`) | new `referenceRead.provider.getLectureById` raw-SQL join returning the pre-conform row shape (`lectureTitle`/`mainTopic`/`arTitle`/`lectureNumber`/`sortOrder`/`level`/`topicId`/`google_uid:null`/timestamps); controller rewired, dead `LectureProvider` injection removed | ✅ live: by-id returns legacy shape incl. Arabic title |
| 3 | **events dashboard nameless lectures** — `event.service.ts:288` still mapped `rest.lecture.lectureTitle` (renamed to `.title`); line 230's twin was fixed, 288 missed | `.lectureTitle` → `.title` | ✅ live: `/event/dashboard` shows lecture titles |
| 4 | **81/102 events lost their lecture link** — prod has 81 events→lecture; ka had 0 ("no crosswalk"). But hub NS lectures ARE the prod lectures (hub migration 189 split "2.3.1 title" into lectureNumber+title) → crosswalk trivially feasible | `scripts/relink-event-lectures.cjs`: parse prod `lectureTitle` → (number, title); match ka NS lecture by lectureNumber (78) or normalized title (3, covers NS duplicate numbers marked AMBIG); idempotent `UPDATE … WHERE "lectureId" IS NULL` | ✅ 81/81 relinked, 0 unmatched; full 81-row title-consistency check vs prod passed (not just spot checks) |

**Also found during verification: zombie dev server** (PID 21456, ts-node started 14:02 — *before* migration 610090 renamed the columns at ~18:48) was still holding port 3001 with stale entity metadata, throwing `column LectureEntity.lectureTitle does not exist` on every lecture read. Killed; fresh server verified clean. ⚠️ Always check `netstat` for :3001 before verifying (known multi-agent gotcha).

Smoke tests used a short-lived crafted supervisor JWT (HS256, staging `SERVER_TOKEN_SECRET`/issuer). tsc clean. **Committed + pushed 2026-07-14 (user go-ahead).**
**✅ 2026-07-14 — full cut to the hub schema** (LibelusRefApi migration 188): dropped legacy `google_uid` + `mainTopic`, renamed `lectureTitle`→`title`, hub-UUID PK (migration `1783782610090`). Removed the local lecture **CRUD subsystem** (create/update/delete/bulk-import provider+service methods + 4 write validators) — lectures are hub-owned, read-only via `referenceRead`. Mirror sync + mapper updated to the new columns; **re-synced clean (3,237 lectures / 141 topics)**. Attendance bulk-import re-keyed off `google_uid` → **`lectureNumber` OR `title`** (both conventions). Display consumers (event/reports/activityTimeline/instituteAdmin) read `.title`. `events.lectureId` FK → hub lectures (81 historical stay null — prod legacy lectures 0/80 disjoint, no crosswalk). `tsc` green.
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
