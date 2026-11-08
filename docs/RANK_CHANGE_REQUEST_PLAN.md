# Candidate rank change requests

User ask (2026-11-08): candidates change their rank from profile settings, but the change only
takes effect after the institute admin approves it.

## Checkpoint

| Stage | State |
|---|---|
| Migration `1783782610340-CreateRankChangeRequests` | Apply / revert / re-apply verified on a throwaway PG17. **Applied to production 2026-11-08** by the user after backup `ka-institute-pre-rank-change-requests-20261108112251.sql.gz` (restore-tested); read-only check: table, 4 indexes, 4 constraints, 0 rows. |
| Backend module `src/rankChangeRequest/` | Built, tsc clean, 31/31 HTTP checks on the local copy |
| Frontend (NeuroLogBookFront) | Built, tsc + vite build clean, click-tested in Chrome (AR) against the local copy: request, admin badge, approve, candidate sees new rank |
| Commit / push | Pushed to main 2026-11-08 at the user's ask |

## Design

- Table `rank_change_requests`: `candidateId` (FK candidates, CASCADE), `fromRank`, `requestedRank`,
  `status` pending | approved | rejected | canceled, `reviewedById`, `reviewedByRole`, `reviewNote`,
  `reviewedAt`, timestamps. Partial unique index `UQ_rcr_one_pending`: one pending request per candidate.
  CHECKs on status and `fromRank <> requestedRank`. Purely additive.
- `candidates.rank` is written in exactly one place: `RankChangeRequestProvider.review()` on approve, in the
  same transaction that locks (`FOR UPDATE`) and closes the request.
- Candidate endpoints take no id from the client; the JWT subject must be an active (non-archived)
  candidate row, because `requireCandidate` is hierarchical and admits supervisors/admins.
- Admin scope comes from the admin's DB row (`getAdminDepartmentScope`), never the JWT claim. A request
  from another department answers 404, same as a missing id.
- The existing `PUT /cand/:id` still ignores `rank` from a candidate (unchanged), so there is no bypass.
- Admins can still set a rank directly through `PUT /cand/:id` (unchanged).

## Frontend

- `src/components/RankChangeRequestCard.tsx` on the candidate profile (`ProfileContent`): current rank,
  picker (options from `getCandidateRankOptions`, current rank excluded), pending banner with cancel,
  last decision with the admin note. Syncs the stored `user.rank` once an approval lands.
  The read-only Rank line in "Academic info" was removed (the card replaces it).
- `src/pages/InstituteAdminRankRequestsPage.tsx` at `/dashboard/i-admin/rank-requests`: Pending / All
  toggle, optional note, Approve / Reject. Sidebar entry "Rank Requests" with a pending-count badge.
- Copy: new `rankChange` block in `dashboard.i18n.ts`, EN + AR.

## Not built (offer if wanted)

- No email to the admin on a new request or to the candidate on a decision (the badge and the profile
  card carry it).

## To ship

1. Back up production (`scripts/backup-ka-prod.sh pre-rank-change`), verify it.
2. `npm run db:ka:migrate` (additive). Do this BEFORE pushing the backend, so the new entity never
   meets a database without its table.
3. Commit + push backend, then frontend (pushing `main` deploys Railway + Netlify).
