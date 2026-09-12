# Journal-club eliminator (candidate dashboard)

Living record for the candidate-facing journal-club reservation feature. Read this first
before touching `src/journalEliminator/` or `CandidateJournalClubPage.tsx`.

**Status: BUILT + VERIFIED, NOT DEPLOYED, NOTHING COMMITTED, migration NOT applied to production.**
Date: 2026-09-04.

---

## What it does

Candidates reserve the journal club they will present, from their dashboard. It is the
candidate twin of the supervisor lecture eliminator (`src/eliminator/`) and rides on that
feature's campaign, so both use the **same Thursdays and the same on-site/online mode per
date**, stated once and unable to drift.

The rules, and where each is actually enforced:

| Rule | Enforced by |
|---|---|
| One journal per candidate | `UNIQUE(campaignId, candidateId)` on `journal_reservations` |
| One journal per Thursday | `eliminator_slots.journalCapacity`, claimed by conditional UPDATE |
| A taken journal leaves everyone's list | `UNIQUE(campaignId, journalId)` + the pool query |
| A taken date leaves everyone's list | `journalReservedCount < journalCapacity` in the pool query |
| No repeating a paper you presented before | `events` where `type='journal'`, this candidate, `status <> 'canceled'` |
| Super-admin open/close for all users | `eliminator_campaigns.journalsOpen` |

Booking creates the real `events` row (type `journal`, presenter = the candidate,
`location` and start time taken from the date's mode) inside the same transaction, then
emails a confirmation after commit (a mail failure never rolls back a booking).

## Decisions taken with the user (2026-09-04)

- **The pool is the `journals` table**, dept-scoped, not a free-text "propose your own
  paper" field. The department uploads the year's papers the way it did on 2025-12-14.
- **The repeat rule is per candidate**, not global: a paper someone else presented last
  year is still offered. Confirmed against the user's own wording.
- Not asked for, so not built: cancelling or changing a reservation. Today only a DB edit
  can undo one (delete the `journal_reservations` row, decrement
  `eliminator_slots.journalReservedCount`, and delete or cancel the `events` row).

### Data reality worth knowing

`journals` is a log of papers presented, not a standing catalogue: all 27 production rows
were created on 2025-12-14, 19 were presented on 19 Thursdays last year (one candidate,
one paper each), 8 were never used. Against 110 active candidates and 38 Thursdays, **the
department must upload the 2026-2027 papers before opening the round**, or candidates will
see only the handful of unused ones. The super-admin console shows the available count per
campaign for exactly this reason.

## Files

**Backend (new)**
- `src/migrations-ka/1783782610320-CreateJournalEliminator.ts`
- `src/journalEliminator/` (interface, entity, service, provider, controller, router)
- `src/validators/journalReserve.validator.ts`
- `scripts/tmp-journal-eliminator-e2e.ts` (gitignored dir)

**Backend (edited)**
- `src/eliminator/eliminatorCampaign.mDbSchema.ts` (+ `journalsOpen`)
- `src/eliminator/eliminatorSlot.mDbSchema.ts` (+ `journalCapacity`, `journalReservedCount`)
- `src/config/{container,routes,database,ka-migrations}.config.ts` (wiring only)

**Frontend (new)**: `src/types/journalEliminator.ts`,
`src/queries/journalEliminatorQueries.ts`, `src/pages/CandidateJournalClubPage.tsx`,
`src/pages/SuperAdminJournalRoundsPage.tsx`.
**Frontend (edited)**: `src/utils/api.ts`, `src/content/dashboard.i18n.ts`,
`src/components/DashboardLayout.tsx`, `src/components/SuperAdminLayout.tsx`,
`src/App.tsx`, `src/lib/pageTitles.ts`.

## API

| Method | Route | Who |
|---|---|---|
| GET | `/journalEliminator/state` | candidate (JWT) |
| POST | `/journalEliminator/reservation` | candidate (JWT), body `{journalId, slotId}` |
| GET | `/journalEliminator/admin/campaigns` | super-admin |
| PATCH | `/journalEliminator/admin/campaigns/:campaignId/open` | super-admin, body `{open}` |

No user id is ever accepted from the client: the candidate is resolved from the JWT, then
from their DB row (never the JWT's department claim, which goes stale after a department
switch). `requireCandidate` is hierarchical and admits supervisors and admins, so the
provider narrows to a real, non-archived candidate row and returns 403 otherwise.

Conflict codes: `ALREADY_RESERVED`, `JOURNAL_TAKEN`, `SLOT_FULL`,
`JOURNAL_ALREADY_PRESENTED`, `JOURNALS_CLOSED`, `NO_CAMPAIGN`, `JOURNAL_NOT_FOUND`,
`SLOT_NOT_FOUND`, `CANDIDATE_NOT_FOUND`.

## Verification done (2026-09-04)

All against a **throwaway Docker PG17**, never `ka-institute`.

- Migration 320 apply / revert / re-apply clean; schema checked (2 unique indexes, 5 FKs,
  the CHECK, both new slot columns, `journalsOpen` defaulting to false).
- `scripts/tmp-journal-eliminator-e2e.ts`: **36 passed / 0 failed**, covering every rule
  above plus event shape (type, presenter, department stamp, location and start hour
  following the date's mode) and the fact that the lecture eliminator's own
  `reservedCount` is never touched.
- Live HTTP on port 3014 with minted JWTs: 401 unauthenticated, 200 candidate state,
  201 booking, 409 `ALREADY_RESERVED` on a second attempt, 400 on a malformed body,
  200 super-admin campaigns, 403 candidate on the admin route, PATCH open round-trips.
- Backend `tsc` clean; frontend `tsc` + `vite build` clean; 0 em-dashes in every new or
  edited file.

**User-tested locally on 2026-09-05 and it works**: booked as a real candidate, with the
exclusions behaving correctly. The environment was a restore of
`ka-institute-pre-lecture-relink-20260818122521.sql.gz` into a throwaway Docker PG17 on
port 55432, migrations 260-320 applied to that copy, backend on 3001 pointed at it with
Mailgun disabled. Production was never touched.

I still could not click-test it myself: the Chrome extension times out injecting into this
project's vite dev server, on port 3000 as it did earlier on 3007, so localhost is simply
not a permitted origin for the extension.

### UI fix from that review (2026-09-05)

The user called the Save and Open-PDF buttons sloppy, and they were. **`.ds-btn` ships with
no padding and no font-size** (only pill radius, inline-flex, font-weight); every call site
in the app adds `px-4 py-2 text-sm` itself. Without it a primary button collapses to a
cramped pill with the label against the rounded edge, and a ghost button reads as bare text
because its background and border have nothing to wrap. Both new pages now use named class
consts (primary `px-5 py-2.5 text-sm`, ghost `px-4 py-2 text-sm`, both with
`disabled:opacity-50 disabled:cursor-not-allowed` so a disabled Save actually dims). The
picker's Open-PDF stays a link rather than a button, since a second solid button there
would compete with Save, but at `text-sm` with a hover underline and real spacing.

### Pre-ship review and local re-test (2026-09-12)

Production `journals` now holds **41 rows, all NS** (the 14 new 2026-2027 papers were imported
the same day, see CLAUDE.md). The local copy (`ka-local`) was synced to those 41 first.

- **Code review**: no blocking defects. Every rule is enforced in the DB, identity comes only
  from the JWT + candidate row, the booking is one transaction with the email after commit.
  Cosmetic only: the date option reads `Thu, 24 Sept 2026 . Online` (a " . " separator where
  the lecture form uses "·"), and journal titles render all-lowercase (postBulk stores them so).
- **E2E script**: 36 passed / 0 failed again. ⚠️ It leaves `journalCapacity = 0` on 36 of the
  38 dates (it narrows to two bookable Thursdays and never restores), plus its seeded
  candidates and a `ZZ` department. Reset those before any other local test, or every later
  check sees only 2 dates.
- **HTTP test on :3014** (minted JWTs, local DB only): **33 passed / 0 failed**. 401 without a
  token, 403 for a supervisor and for a candidate on the admin route, closed round offers
  nothing and refuses with `JOURNALS_CLOSED`, admin row 0/38 seats + 41 journals, PATCH
  400/200, open round offers 41 journals + 38 dates, a candidate with past papers loses exactly
  those, `JOURNAL_ALREADY_PRESENTED`, booking 201 + correct event, `ALREADY_RESERVED`,
  `JOURNAL_TAKEN`, `SLOT_FULL`, the other candidate then sees 40/37, closing keeps the booking
  visible, both lecture-eliminator entry points still 200, lecture seats untouched,
  `GET /journal` still returns 41.
- **Real browser click-through** (candidate session, local copy): picker shows 41 journals and
  38 dates with modes, Open PDF opens the Drive file in a new tab, Save and close opens the
  confirmation dialog, "Yes, reserve it" shows "Reservation saved"; after a reload the page
  shows "Your journal club is booked" from the server; Arabic switches to RTL. DB row and
  event verified. Test booking removed afterwards, round closed again.
- **Local-only artifact**: event `dateTime` is stored with this Cairo-time machine's offset
  added (10:00 -> 13:00); production runs in UTC and stores the intended wall clock.

**⚠️ SHIP ORDER IS LOAD-BEARING.** The edited `EliminatorCampaignEntity` / `EliminatorSlotEntity`
map `journalsOpen`, `journalCapacity`, `journalReservedCount`. Deploy the backend before
migration 320 is applied and every TypeORM read of those entities fails with "column does not
exist", which **takes down the live lecture eliminator**. Apply 320 first (additive, safe under
the old code), then push. Migration 320 gives every existing date `journalCapacity = 1`.

## Gotchas found while building

- **The global response formatter nests error bodies under `.error`.** A conflict arrives
  as `{status:'error', error:{error, code, ...}}`, so `body.code` must be read one level
  down. `api.reserveJournalClub` unwraps it. **The older
  `api.reserveEliminatorLectures` does not**, so `EliminatorPage`'s specific conflict
  messages ("that lecture was just reserved") never fire and it shows the generic
  "Request failed (409)" instead. Pre-existing, left alone, worth fixing separately.
- A **booked but not yet held** journal event counts as "already presented" for that
  candidate. Inside one campaign that is redundant with the reservation, but it means
  deleting a reservation row without also clearing its event leaves the paper blocked for
  that candidate. Deliberate: the stricter side is the safe side.
- `eliminator_slots.journalCapacity` defaults to 1 in the schema, but the cap that matters
  is the per-row value, so a single Thursday can be raised to 2 with a one-row UPDATE and
  no migration. Same principle as the lecture capacity.
- The E2E disarms Mailgun (`delete process.env.MAILGUN_*`) before running. The first run
  did not, and sent two confirmation emails CC'd to the real notify address.

## To ship (when the user asks)

1. Back up production first (`scripts/backup-ka-prod.sh`), verify the dump.
2. `npm run db:ka:migrate` to apply 320. It is additive and defaults `journalsOpen` to
   false, so nothing becomes visible to candidates on apply.
3. Commit and push both repos (Railway + Netlify auto-deploy).
4. Load the 2026-2027 journals into `journals` (dept NS) BEFORE opening.
5. Open the round from the super-admin console at `/dashboard/super-admin/journal-rounds`.
