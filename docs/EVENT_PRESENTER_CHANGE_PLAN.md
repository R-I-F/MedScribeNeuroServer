# Event presenter change (institute admin)

Living record. Read the checkpoint table first after any interruption.

## Ask (2026-10-17)

The institute admin must be able to change the presenter of an existing event:
a supervisor for a lecture or conference, a candidate for a journal club. When the
event was booked through an eliminator, its reservation row must follow the
presenter in the same transaction and the eliminator rules must still hold.

## What exists today

- `PATCH /event/:id` (clerk or institute admin) already accepts `presenter` and
  only checks that the person exists. It writes `events.presenterId` and nothing
  else. No department check on the event or on the new presenter.
- `eliminator_reservations` (lectures): `supervisorId`, `eventId`, UNIQUE(campaign,
  lecture). Cap: `campaign.maxPerSupervisor` (5), checked in code under an advisory lock.
- `journal_reservations` (journals): `candidateId`, `eventId`, UNIQUE(campaign,
  candidate) = one paper per candidate. Also a code rule: a candidate cannot be
  given a paper they presented before (`candidateHasPresented`).
- The i-admin event detail page edits date and status only; the presenter is read-only.

## Design

New dedicated endpoint, not a widened generic PATCH, because the change needs a
transaction, rule checks and specific 409 codes.

`PATCH /event/:id/presenter` body `{ presenterId }`, institute admin (and superAdmin).

One transaction:
1. Lock the event row (`SELECT ... FOR UPDATE`). 404 if missing.
2. Scope: the caller's department (from the admin's DB row, never the JWT) must
   equal the event's department; a NULL-department admin is institution-wide.
3. New presenter must be the right kind for the event type, exist, not be archived
   (candidates), and belong to the event's department. Same person as now = 400 NO_CHANGE.
4. Lecture/conf with an `eliminator_reservations` row for this event:
   advisory lock on `campaign:newSupervisor`, count their reservations in that
   campaign, refuse at the cap (409 CAP_EXCEEDED), else move the row's `supervisorId`.
5. Journal with a `journal_reservations` row for this event:
   409 ALREADY_RESERVED if the new candidate already holds one in that campaign
   (the UNIQUE index backs this up), 409 JOURNAL_ALREADY_PRESENTED if they
   presented this paper before; else move the row's `candidateId`.
6. Update `events.presenterId`.

Generic `PATCH /event/:id`: a presenter value that DIFFERS from the current one on an
event that has a reservation row is refused (409, points at the new endpoint), so the
two tables can never drift through the old path. An unchanged presenter still passes.

Frontend: a "Change presenter" panel on `InstituteAdminEventDetailPage`, picker from
the existing dept-scoped `/supervisor` or `/cand` list, EN + AR, error codes mapped
to readable messages (formatter-nested `.error.error` unwrapped).

## Test plan (no test framework in repo; E2E script on throwaway Docker PG17 restored from the latest backup, never ka-institute)

- lecture with reservation: moved on both tables; over the cap still moves, with a CAP_EXCEEDED warning
- journal with reservation: moved on both; ALREADY_RESERVED; JOURNAL_ALREADY_PRESENTED
- event without reservation (CM-created): only the event changes
- wrong kind of presenter, other department, archived candidate, same person: 400
- admin of another department: 403/404; generic PATCH drift guard: 409
- rollback: a forced failure after the reservation update leaves both rows unchanged

## User decisions (2026-10-17, GATE 1)

- Lecture cap: ALLOW and warn (`warnings: [CAP_EXCEEDED]`), not refuse.
- Held events: presenter can be changed; academic points follow presenterId.
- No email to anyone.

## Checkpoints

| Stage | State |
|-------|-------|
| Plan + GATE 1 | done, decisions above |
| Backend endpoint + generic PATCH guard | done |
| E2E on throwaway PG17 (restored 2026-10-15 backup, port 55433, backend :3018, mail off) | 28 passed / 0 failed, container removed |
| Frontend panel (EN + AR) | done, tsc + vite build clean |
| Review | code-reviewer APPROVE (3 LOW, all fixed); security-reviewer 0 critical/high, MEDIUM fail-open admin scope FIXED (403 ADMIN_NOT_FOUND) |
| Browser click-test | NOT done |
| Commit + push to main | done 2026-10-17 on user ask (no migration needed) |

## Known, deliberately not changed (pre-existing)

- Generic `PATCH /event/:id` and `DELETE /event/:id` have no department check, and can
  still change type/lecture/journal/date of a reserved event (only presenter is guarded).
- A journal event created from the calendar-manager form has no reservation row, so the
  one-journal-per-candidate rule cannot apply to it.
