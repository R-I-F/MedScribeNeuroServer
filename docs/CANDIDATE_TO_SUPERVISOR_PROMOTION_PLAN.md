# Candidate to Supervisor promotion (real-life promotion, history preserved)

Living plan + build log. READ THIS FIRST if the session was cleared.

**Branch:** `feat/promote-candidate-to-supervisor` (off `main`, 2026-08-04).
**Repos:** backend (this repo) now; frontend (`F:\WebDev\NeuroLogBookFront`) is Stage G, not started.
**Nothing is committed and nothing is written to `ka-institute` (production) without the user's explicit ask.**

## Problem

A candidate got promoted to supervisor in real life. He must become a supervisor user
**without losing any of his candidate history** (submissions, clinical submissions, event
attendance, academic points).

## Why the obvious approaches do not work

`candidates` and `supervisors` are two separate tables with separate UUID PKs, not one
`users` table with a role column.

- Flipping `candidates.role` to `supervisor` does nothing: every supervisor surface
  (`submissions.supervisorDocId`, reviews, the supervisor picker, `GET /supervisor`)
  reads the `supervisors` table. He would hold a role label with no supervisor identity.
- Moving the history is impossible: `submissions.candDocId` and `clinical_sub.candDocId`
  are `ON DELETE RESTRICT` FKs to `candidates.id`, `event_attendance.candidateId` is
  `ON DELETE CASCADE`, and `activity_read_model` projects those same columns. The
  candidate row can never be deleted or repointed without destroying the logbook.

## Chosen design: add a supervisor identity, archive the candidate identity

The candidate row stays exactly where it is (every FK stays valid, nothing is migrated).
A new `supervisors` row is created and the candidate row is marked archived + linked.

| Concern | Resolution |
|---|---|
| History | Untouched. Still owned by the candidate id. |
| Login | Login checks `candidates` FIRST (`auth.controller.ts:145`), so the archived row must be skipped or he can never log in as a supervisor. |
| Identity link | `candidates.promotedToSupervisorId` (unique). Reverse lookup gives the supervisor his old logbook. |
| Rankings | Archived candidates drop out (he must not keep competing with residents). |
| Signup cap | The promoted person collapses to ONE identity in the cap count. |
| Analytics history | Deliberately NOT collapsed: his candidate-era activity stays attributed to the candidate actor, which is historically accurate. |

### Schema (migration `1783782610250-AddCandidatePromotion`)

```
candidates.archivedAt              timestamp NULL
candidates.promotedToSupervisorId  uuid NULL REFERENCES supervisors(id) ON DELETE SET NULL, UNIQUE
```

`archivedAt IS NULL` is the "active candidate" predicate everywhere. No new table.
`src/migrations-ka/` is globbed by `ka-migrations.config.ts`, so no list registration is
needed (that explicit list is the hub's `staging-migrations.config.ts`).

### Endpoint contract

`POST /cand/:id/promote` (superAdmin + instituteAdmin, i-admin restricted to its own department scope)

Body (all optional): `{ position?, canValidate?, canValClin? }`
Defaults: `canValidate: true`, `canValClin: false`, `position: unknown`.

Transaction:
1. Load candidate. 404 if missing, 409 `already_promoted` if `archivedAt` is set.
2. 409 `supervisor_email_exists` / `supervisor_phone_exists` if a supervisor row already
   holds either (both are UNIQUE on `supervisors`).
3. Insert the supervisor row: same `email`, same bcrypt hash (he keeps his password),
   `fullName`, `phoneNum`, `departmentId`, `termsAcceptedAt`; `approved: true`.
4. `UPDATE candidates SET archivedAt = now(), promotedToSupervisorId = <new id>`.
5. Return the new supervisor (password stripped) + counts of the history carried over.

**The promotion closes out his candidate logbook** (user decision, 2026-08-04). Every
still-`pending` submission and clinical submission is approved in the same transaction and
counted under `autoApproved`. `rejected` rows are left as they are: a supervisor made that
call deliberately and the promotion must not silently reverse it.

Approved rows get the note `Auto-approved on promotion to supervisor.` (existing review
text preserved). **No reviewer is fabricated:** `activity_read_model` derives a supervisor
'surgical_review' from `submissions.reviewedBy` + `reviewedAt` and a 'clinical_review' from
`clinical_sub.supervisorDocId` + `reviewedAt`. So `reviewedBy` is never stamped, submission
`reviewedAt` is filled only where it was empty, and clinical `reviewedAt` is left NULL.
Stamping either would invent review activity that never happened and inflate that
supervisor's active-user counts and the signup cap.

### Read exclusions (`archivedAt IS NULL`)

- `CandService.getAllCandidates` (default excludes; `includeArchived` opt-in kept for reports)
- institute-admin candidate list / summary / dashboards (`instituteAdmin.provider.ts`)
- submission ranking (`sub.provider.ts:1367`) and academic ranking (`event.provider.ts:592`)
- login (`auth.controller.ts:145`) and forgot-password (`CandService.getCandByEmail`)
- signup cap (`activeUsers.provider.getSignupGate`): collapses a promoted person to one
  identity via `COALESCE(c.promotedToSupervisorId, actorId)`, so he is not counted twice
  for the trailing quarter.

Deliberately NOT filtered: `getCandsByIds` (name resolution for already-filtered ids) and
the Active-Users analytics breakdowns (historical attribution stays truthful).

### Previous logbook (read-only)

`GET /supervisor/previousLogbook` (supervisor, self only): resolves the archived candidate
via `promotedToSupervisorId = jwt.id` and returns his candidate-era submissions, clinical
submissions and attendance/points. Read-only, nothing editable, nothing re-counted.

## Checkpoint

| Stage | What | Status |
|---|---|---|
| A | Plan doc | ✅ done |
| B | Migration `1783782610250-AddCandidatePromotion` + entity/interface fields | ✅ done (NOT applied anywhere yet) |
| C | Promote endpoint (validator/controller/service/provider/router) | ✅ done |
| D | Auth paths skip archived candidates | ✅ done (login + forgot-password + WA-bot phone lookup) |
| E | Read exclusions (lists, rankings, cap) | ✅ done |
| F | Previous-logbook endpoint | ✅ done |
| G | Frontend (admin promote action + supervisor previous-logbook view) | ✅ built, tsc + vite clean; **user click-test pending** |
| H | tsc + E2E on throwaway PG17 | ✅ **52 passed / 0 failed**, tsc clean, DI resolves |
| J | Auto-approve pending work on promotion + enum-LIKE search fix | ✅ done |
| I | API_DOCUMENTATION.md + CLAUDE.md "Where we stopped" | ✅ done |

### Stage H results (throwaway Docker PG17, `ka-institute` never touched)

Harness: `scripts/tmp-promotion-e2e.ts` (gitignored; refuses to start unless `PSQL_HOST` is
localhost). Migration apply / revert / re-apply clean, partial index present, promotion
carries email + hash + department, `carriedOver` counts exact (3 subs / 1 pending / 1
clinical / 1 attendance), history still resolves, login and forgot-password both fall
through to the supervisor, exclusions hold, cap folds the two identities, conflicts return
`already_promoted` and `supervisor_email_exists`, and a failed promotion rolls back with
the candidate left un-archived.

**One real bug was caught by the run and fixed:** the `archivedAt IS NULL` filter added to
`CandService.getCandByEmail` was being swallowed by operator precedence. TypeORM
concatenates where-strings verbatim, so `A OR B` + `andWhere` produced
`A OR (B AND archivedAt IS NULL)` and forgot-password still resolved the archived
candidate. Fixed by parenthesizing the whole email condition; the test now passes.

**Pre-existing defect found and FIXED (user asked for it, 2026-08-04):**
`InstituteAdminProvider.getCandidateSummaryList` compared the `rank` and `regDeg` **enum**
columns with `LIKE`, which Postgres rejects
(`operator does not exist: candidates_rank_enum ~~ text`), so
`GET /instituteAdmin/candidates/summary?search=...` 500'd in production for ANY search term.
Both are now cast with `"c"."rank"::text` / `"c"."regDeg"::text`. **The quoting is
load-bearing:** TypeORM only rewrites bare `alias.property` tokens, so an unquoted
`c.regDeg::text` reaches Postgres lowercased as `c.regdeg` and still fails. Regression
covered by three E2E cases, including search by the enum rank itself.

### Second round findings (2026-08-04), all caught by the harness

1. `query()` on an `UPDATE ... RETURNING` returns `[rows, affectedCount]`, so counting its
   result directly always reported 2. The pending ids are now SELECTed first and updated by
   id, which is unambiguous.
2. The first enum cast was written unquoted and still failed (see above).
3. Two earlier "drops him" assertions were **vacuous**: summary items are
   `{ candidate: { id }, stats }`, so `item.id` was always undefined and the negative check
   passed for the wrong reason. Now asserted through `item.candidate.id`, with positive
   controls (an active candidate must still be found) so the check cannot pass vacuously
   again.

### Files touched (Stage B to F)

| File | Change |
|---|---|
| `src/migrations-ka/1783782610250-AddCandidatePromotion.ts` | new: `archivedAt`, `promotedToSupervisorId` (FK + UNIQUE), partial index |
| `src/cand/cand.mDbSchema.ts`, `cand.interface.ts` | the two new fields |
| `src/cand/cand.provider.ts` | `promoteToSupervisor` (transactional), `getPromotedFromCandidate`, `PromoteCandidateError` |
| `src/cand/cand.service.ts` | passthroughs; `getAllCandidates` excludes archived (`includeArchived` opt-in); `getCandByEmail` + `getCandByPhoneDigits` skip archived |
| `src/cand/cand.controller.ts` + `cand.router.ts` | `POST /cand/:id/promote`, admin dept scope from the admin's DB row, status mapping per error code |
| `src/validators/promoteCandidate.validator.ts` | new |
| `src/auth/auth.controller.ts` | candidate-first login lookup filters `archivedAt IS NULL` |
| `src/instituteAdmin/instituteAdmin.provider.ts` | summary list + paged dashboards exclude archived (by-id dashboard/report deliberately still resolve) |
| `src/sub/sub.provider.ts`, `src/event/event.provider.ts` | both rankings exclude archived |
| `src/activeUsers/activeUsers.provider.ts` | signup cap folds the promoted identity into one |
| `src/supervisor/supervisor.controller.ts` + `supervisor.router.ts` | `GET /supervisor/previousLogbook` (self only, above `/:id`) |

## E2E matrix (Stage H, throwaway Docker PG17, never `ka-institute`)

1. Migration apply / revert / re-apply clean.
2. Promote a seeded candidate: supervisor row created, candidate archived + linked.
3. Login with his email after promotion resolves to the SUPERVISOR (the regression this
   whole design turns on).
4. Forgot-password resolves to the supervisor too.
5. Second promote of the same candidate returns 409 `already_promoted`.
6. Promote when a supervisor already owns the email returns 409.
7. Archived candidate is gone from the candidate list, both rankings, the i-admin summary.
8. His submissions / clinical / attendance rows still resolve (0 FK breakage).
9. Signup-cap count treats him as one person, not two.
10. `GET /supervisor/previousLogbook` returns his candidate history; a supervisor who was
    never a candidate gets an empty payload, not a 500.
11. i-admin from another department cannot promote him.

## Stage G: frontend (`F:\WebDev\NeuroLogBookFront`, branch `feat/promote-candidate-to-supervisor`)

The unrelated marketing-capture working tree there is parked in its own
`git stash` ("marketing-demo capture wip").

| File | Change |
|---|---|
| `src/utils/api.ts` | `promoteCandidateToSupervisor`, `getSupervisorPreviousLogbook` |
| `src/types/api.ts` | `PromoteCandidateResult`, `SupervisorPreviousLogbook` (discriminated on `promoted`) |
| `src/queries/instituteAdminQueries.ts` | `usePromoteCandidateMutation` (broad invalidation: candidate summary, dashboards, supervisor lists) |
| `src/queries/supervisorQueries.ts` | `useSupervisorPreviousLogbookQuery` (30 min staleTime; the history is frozen) |
| `src/components/PromoteCandidateModal.tsx` | new: consequences spelled out BEFORE the button, position + canValidate/canValClin, result panel reporting what was auto-approved |
| `src/pages/InstituteAdminCandidatesPage.tsx` | new "Promotion" column; the action opens the modal and never fires from a row click |
| `src/pages/SupervisorPreviousLogbookPage.tsx` | new: read-only trainee history (counts, surgical, clinical, academic) |
| `src/components/SupervisorDashboardLayout.tsx` | nav entry, rendered only when the query says `promoted: true` |
| `src/App.tsx`, `src/lib/pageTitles.ts` | `/dashboard/supervisor/previous-logbook` route, title, parent path |
| `src/content/dashboard.i18n.ts` | `instituteAdmin.promote*` (24 keys) + `supervisor.prev*`/`navPreviousLogbook` (21 keys), EN + AR, 0 em-dashes |

The modal states the four consequences (same credentials, history kept, pending work
approved, leaves the trainee rankings) plus an explicit "cannot be undone" warning, so an
admin cannot trigger this without seeing what it does. Empty table cells use `-` rather
than the em-dash placeholder the older pages use, per the standing no-em-dash rule.

tsc + vite build clean in both repos. **Not click-tested in a browser.**

## Production snapshot + migration rehearsal (2026-08-04, before any live apply)

**Backup: `F:\DB_BACKUPS\ka-institute-pre-promotion-20260804184444.sql.gz`** (2,692,409 bytes).

Real `pg_dump` this time, not the JSON export used in July: there is still no local pg_dump,
so the `postgres:17` client image runs it through Docker (client must be >= the PG 17.10
server). Connection was **verify-ca** TLS with `ca-ka-staging.pem`; the script refuses to
dump over an unverified connection. Read-only against production, `pg_dump` only.
Reusable script: `scripts/backup-ka-prod.sh <label>` (gitignored).

Gotcha worth keeping: Docker Desktop needs a **Windows-style** `-v` path. Git Bash's
`$(pwd)` (`/f/WebDev/...`) is accepted silently and mounts nothing, which surfaces as
"root certificate file /ca.pem does not exist". The script uses `pwd -W` + `MSYS_NO_PATHCONV=1`.

Verified: gzip integrity OK, 48 `CREATE TABLE`, 48 `COPY` blocks, and every COPY row count
equals the live count (candidates 111, supervisors 56, submissions 3721, clinical_sub 88,
event_attendance 1265, cal_surgs 5848, events 104).

**Restore-tested** into a throwaway PG17: restored with zero errors, all counts match, 48
tables / 1 view / 59 FKs / 101 indexes, `migrations` has 36 rows ending at
`CreateInAppSearchEvents1783782610240`, which confirms production is exactly one migration
behind 250.

**Rehearsal on that restored production copy** (not a synthetic seed): 250 applied, reverted
and re-applied cleanly; columns + `IDX_cand_active` + FK + UNIQUE all created; candidates
111/111 still ACTIVE (`archivedAt IS NULL`, so the migration archives nobody); and
candidates / submissions / clinical_sub / event_attendance / activity_read_model counts were
byte-identical before, after up, after down and after re-up.

## Open decisions

- Whether reports (`reports.provider.ts`, all-candidates PDF) should include archived
  candidates. Currently they follow the default and exclude them.
- Nothing is committed in either repo, and the migration is still unapplied outside the
  throwaway DB.
