# Module Upgrade Audit: event
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) 2026-07-14 — 102 events / 1,264 attendance → NS
**✅ Implemented:** dept-scoped `departmentId` (nullable, migration `1783782610080`); ETL **102** events + **1,264** attendance → all NS (attendance dept via candidate), **0 FK orphans**, points sum 1,264. **`events.lectureId` nulled for 81 lecture-events** — prod's legacy lectures are disjoint from the KA hub-mirror catalog (**0/80** match on id/title/google_uid), so the dead pointer was dropped (events + attendance preserved; injecting legacy lectures would pollute the hub mirror, skipping would orphan attendance). `conf`/`journal` links resolve (same prod ids, loaded first).
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Events + attendance. Owns **two tables**: `events` (**102 prod rows**) and `event_attendance` (**1,264 prod rows**). Only the two entities changed main→branch; no MySQL idioms, no tenancy. The interest is **FK load order**: `events` → confs + journals + lectures; `event_attendance` → candidates (✅) + events. prod-cts empty.

**Verdict counts:** **7 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/event/` (both sides), route `/event`. Entities `event.mDbSchema.ts` + `eventAttendance.mDbSchema.ts` (both changed — type conversions only). Controller/service/provider/router identical. `event_attendance` drives candidate activity points (read by `activityTimeline`/`instituteAdmin`/`reports`). **Tables owned:** `events`, `event_attendance`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `events` | ✅ | 102 | 0 | ✅ (0) | 🔁 ETL after confs/journals/lectures |
| `event_attendance` | ✅ | 1,264 | 0 | ✅ (0) | 🔁 ETL after candidates + events |

## 3. Variables & env keys
None module-specific. No `departmentId` (events are institute/dept-agnostic; `main_diags`/`lecture_topics` carry dept, events don't).

## 4. Production reality
**`events`** — `id char(36)` PK. FKs: `confId`→confs, `journalId`→journals, `lectureId`→lectures (all nullable — one set per `type`). Columns: `type enum(lecture,journal,conf)`, `dateTime datetime`, `location varchar(255)`, `presenterId char(36)` (free — no FK), `status enum(booked,held,canceled)`, timestamps. **102 rows.**
**`event_attendance`** — `id char(36)` PK. FKs: `candidateId`→candidates, `eventId`→events. Columns: `addedBy char(36)`, `addedByRole enum(instituteAdmin,supervisor,candidate)`, `flagged tinyint(1)`, `flaggedBy char(36)`, `flaggedAt datetime`, `points int`, timestamps. **1,264 rows.**
**prod-cts:** 0 for both.

## 5. New-system state
`InitKaSchema`: `events` — uuid ids, `events_type_enum`, `events_status_enum`, datetime→timestamp; FKs `confId`/`journalId`/`lectureId` (nullable) RESTRICT. `event_attendance` — uuid ids, `flagged` boolean, `points int`, `event_attendance_addedbyrole_enum(instituteAdmin,supervisor,candidate)`; FKs `candidateId`/`eventId` RESTRICT. Live rows: **0 / 0**.

## 6. Gap analysis
1. **Schema** — ✅ live (uuid FK shadows, enums, `flagged tinyint→boolean`, `points int`).
2. **Tenancy** — ✅ none.
3. **Dept scoping** — ✅ n/a.
4. **Reference boundary** — reads `lectures` (mirror-backed) + confs/journals (local); owns none of them.
5. **Services** — none material.
6. **PG-portability** — ✅ no idioms.
7. **🔁 ETL — FK-ordered:**
   - `events` (102): char36→uuid; enums pass through; `dateTime`→timestamp. Load **after `confs` + `journals` + `lectures`** (nullable FKs — but a row with a set `confId`/`journalId`/`lectureId` needs its parent present).
   - `event_attendance` (1,264): char36→uuid; `flagged`→bool; `points` int. Load **after `candidates` (✅) + `events`**.
   - **Verify:** counts 102 / 1,264; `type`/`status`/`addedByRole` distributions; 0 FK violations; `points` sums sane.
8. **API contract** — ✅ unchanged.

## 7. Upgrade plan
1. ETL `events` (after confs/journals/lectures), then `event_attendance` (after events). Idempotent upsert on `id`, batched (attendance 1,264).
2. Rollback: `TRUNCATE event_attendance, events CASCADE` on staging.

## 8. Risks
- FK order: confs/journals/lectures before events; events + candidates before attendance.
- `presenterId` is a free char(36) (no FK) — carry as uuid, no integrity check.

## 9. Open questions
1. **`lectures` availability** — events with `lectureId` need the mirror `lectures` present; confirm lecture mirror synced before events ETL.
2. prod-cts empty — nothing to merge.

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Mapping approved (both tables)
- [ ] ETL + FK order approved
- [ ] Approved to implement
