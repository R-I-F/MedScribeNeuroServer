# Data Normalization Plan

Status: **N1 built and verified locally (2026-11-20), uncommitted. No data changed yet.** Every production write needs a verified backup first and an explicit go-ahead on the exact before/after list.
Inspection was done read-only on a local restore of `F:\DB_BACKUPS\ka-institute-pre-d-ahmed-r20-import-20261108142325.sql.gz` (container `ka-cert`, port 54329). Counts below are from that snapshot and must be re-checked on production before any write.

## Checkpoint table

| # | Stage | Status | Notes |
|---|-------|--------|-------|
| N1 | Stop the causes in code (no lowercasing of names, phone normalization + validation, nationality list) | **built, verified locally 2026-11-20** | uncommitted; see N1 build log |
| N2 | Person names: proper-case only the badly cased ones | not started | dry-run list for approval |
| N3 | Phones to `+201XXXXXXXXX` | not started | dry-run list; collision check first |
| N4 | Nationality: fixed list + map existing | not started | needs the list wired into signup/profile |
| N5 | Patient names: 1,112 full names to initials; English style "Ahmed M Kh" everywhere | not started | privacy fix; irreversible except from backup |
| N6 | Equipment / consumables to link tables | not started | migration + submission path + reports |
| N7 | Hub reference titles: sentence case + acronym list, then re-mirror | not started | work happens in LibelusRefApi / defaultdb |
| N8 | Duplicate people (Sameh, Hady, Elsharkawy) | **DONE on production 2026-11-20** (all three) | see N8 log |
| N9 | Small items: hospital names, email lowercase, event locations | not started | defaults proposed below |

## Decisions (user, 2026-11-20). Do not re-litigate.

1. **Phones** are stored as **`+201XXXXXXXXX`** (E.164). Displayed locally as `0101 234 5678`. Foreign numbers keep their own country code.
2. **Names**: proper-case **only** names that are all lowercase, ALL CAPS or badly spaced. Names a person typed in mixed case stay exactly as typed.
3. **Patient names**: the 1,112 records holding full names are converted to the initials privacy format, Arabic and English.
4. **Duplicates handled**: Sameh, Hady, Elsharkawy. **Sameh: the OLDER account merges INTO the NEWER one** (keep `ba86f9f5-2ed1-44cd-abd0-59f2c1add224` "Sameh Hamdi", remove `b3a2c3db-5e0b-42c7-a490-138ea5a91497` "Sameh Hamdy Abdelbary"). Mario and Ahmed Abdelrahman phone clashes: **not selected, leave alone**.
5. **Nationality**: fixed list in signup/profile, and existing values mapped to one spelling each.
6. **Reference titles**: fixed **in the hub data** with a curated acronym list (EVD, ETV, VP, CSF, CNS, ...), then re-mirrored. One source of truth.
7. **Equipment / consumables**: move to **proper link tables** referencing the equipment/consumables reference lists.
8. **English patient-name style**: **"Ahmed M Kh"** (no dots) for every record.

## Findings (from the inspection)

### Causes in code
- `cand.provider.ts:257` (legacy bulk import) lowercases `fullName` and `nationality`.
- `sub.provider.ts` lowercases `insUsed`, `consUsed`, `consDetails`, `otherSurgName`, `otherSurgRank`, `preOpClinCond`, `roleInSurg`.
- Journals (`postBulk`) and conferences (`createConf`) titles are lowercased on save.
- Phone and nationality validators only check "non-empty string" (`createCand.validator.ts`, others), so every format is accepted.
- The WhatsApp bot matches `msg.from` digits against `phoneNum` (`waBot.provider.ts`, `getCandByPhoneDigits`); the phone change must keep that lookup working (WhatsApp sends `201...`).

### Counts (snapshot)
- Candidate names all lowercase **86 / 118** (Sept/Oct 2025 import), 1 ALL CAPS, 1 bad spacing. Supervisors all lowercase 2 / 71.
- Phones: candidates 106 local, 6 `+20`, 2 `0020`, 1 `20`, 2 missing leading 0, 1 other; supervisors 61 local, 7 `+20`, 1 `0020`, 1 `20`, 1 broken (`+1271904123`). Placeholders: 1 candidate (`+20000000099`), 3 supervisors (`010000000NN`). **Phones are UNIQUE per table**: normalization would collide for 3 pairs (the Sameh duplicate, candidate `01276599396` vs `00201276599396`, supervisor `01090650946` vs `201090650946` test rows), so duplicates and test rows are resolved before N3.
- Emails with uppercase: 5 (cosmetic; login already compares lower(trim(email))).
- Nationality: 10 spellings of Egyptian, plus lower/Title variants of others.
- Hospitals: PEDSURG copies all lowercase; same building named differently per department (`Emergency 185` vs `kasr al aini-emergency 185 hospital`).
- Reference titles used in NS logbooks: procedures 88 / 98 all lowercase, diagnoses 108 / 108 all lowercase; lectures, categories, journals almost entirely lowercase.
- Patient names: English 3,399 "Ahmed M Kh", 2,260 "Ahmed M. F.", about 1,300 full names; Arabic raw 1,112 full names (all created Feb to Apr 2026; **0 after the July cutover**), 79 single word.
- Consumables / equipment: comma-joined text; the reference item "csf drainage system, otherwise than vp, lp and evd" splits into 3 fake items (about 94 cases); legacy rows joined with spaces ("microscope high speed drill"); typo "omaya resevoir".
- Event locations: `dept`, `online`, `lrc`, `abo al reesh hospital (6th floor)`.

### Duplicate people
| Case | Rows | Proposed action |
|------|------|-----------------|
| Sameh | sup `b3a2c3db...` "Sameh Hamdy Abdelbary" (legacy ETL 2025-12-15, phone `01028230805`, 0 cases) and sup `ba86f9f5...` "Sameh Hamdi" (signup 2026-09-21, `+201028230805`, 0 cases) | Merge older INTO newer with `scripts/tmp-merge-supervisors.cjs --from b3a2c3db... --into ba86f9f5...` (dry run first). Ask which display name to keep. |
| Hady | cand `81e63c3b...` "hady mohamed hesham" (93 cases, active) and sup `0e6eddd4...` "Hadi Elsayed" (signup 2026-09-15, same email) | Link as a promotion: archive the candidate row and set `promotedToSupervisorId` to the existing supervisor; pending cases follow the promotion rule (auto-approve, no fabricated reviewer). Needs a variant of the promote flow that adopts an existing supervisor row. |
| Elsharkawy | cand `33bb404a...` "ahmed abbas elsharkawy" (0 cases, active) and sup `4fc1dc0f...` "Ahmed Elsharkawy" (signup 2026-09-16, same email) | Same as Hady. |

## N1 build log (2026-11-20)

**Backend** (working tree of branch `feat/logbook-record-and-cert-fixes`; split into its own commit by path):
- New `src/utils/personData.ts`: `normalizePhone` (E.164, Egyptian mobiles `+201XXXXXXXXX`, rejects placeholders), `phoneMatchKey` / `phoneKeySql` (last-10-digit comparison), `formatPhoneForDisplay`, `normalizePersonName` (re-cases only all-lower / ALL-CAPS names), `NATIONALITIES` + `canonicalNationality` (aliases for the spellings found).
- New `src/validators/personFields.ts`, wired into 12 validators: createCand, registerSupervisor, aiOffice, updateCand, and create/update of supervisor, clerk, institute admin, super admin. The old "at least 11 characters" phone rule is replaced by the canonical check.
- `cand.provider.ts` bulk import: no longer lowercases name or nationality; phone normalized. Promotion phone-conflict check compares by last 10 digits.
- `sub.provider.ts` legacy sheet import: other surgeon's name no longer lowercased.
- **WhatsApp lookup fixed**: `getCandByPhoneDigits` / supervisor twin compared all digits, so WhatsApp's `201...` never matched a stored `01...` (most users). Now last-10-digit comparison.
- AI Office duplicate-phone check compares by last 10 digits.
- API_DOCUMENTATION.md: new "Person Data Normalization" section.

**Frontend** (branch `feat/logbook-record`, same working tree as the Logbook Record button):
- New `src/lib/personData.ts` (frontend copy of the phone rule + `formatPhoneDisplay` + `phoneHref` + nationality list, Egyptian first).
- Candidate signup and AI Office signup: nationality is a select (`selectNationality` EN + AR); `validatePhoneInput` applies the same phone rule before submit.
- Phones shown as `0101 234 5678` on the i-admin candidates table (tel: link E.164), supervisors list, profile, submission detail.

**Verified** on the local restore (backend :3018, never production): 10/10 HTTP checks (messy name/phone/nationality stored canonical, mixed-case name kept, bad phone / placeholder / unknown nationality 400 with readable messages, signup validation rejects both, WhatsApp-style key matches a local-format number, test row restored exactly). Backend tsc clean; frontend tsc + vite build clean; 0 em-dashes.

**Deploy order matters**: ship the FRONTEND first (its nationality select only sends list values, which the old backend also accepts), then the backend. The other order would reject free-text nationality from the old signup form.

**Follow-up after user review (same day): bilingual, searchable nationality + signup form usability.**
- New `NationalityPicker` (NeuroLogBookFront `src/components/NationalityPicker.tsx`) replaces the plain select on candidate and AI Office signup: type in English or Arabic, country names work too ("UK", "السعودية", "مصر"), Arabic letter variants / diacritics / the article "ال" are ignored, results ranked exact word, then label prefix, then word prefix (so "ليبي" gives Libyan before Liberian, "سودان" Sudanese before South Sudanese). Every option shows both languages, page language first, aligned to the page side. Keyboard (arrows, Enter, Escape, Tab), mouse, ARIA combobox with labelled options. The stored value stays the English list value.
- `NATIONALITY_AR` (Arabic label for all 180 values) and search aliases in `src/lib/personData.ts`.
- Signup pages (candidate, supervisor, AI Office): field errors were shown in English, in red, on page load before anything was typed. Now they appear only after the field is left or on submit, in the page language (validators take a `lang` argument; the Arabic phone message keeps the example numbers in left-to-right isolates). Phone placeholder `+1234567890` replaced by `01012345678` (also on the profile page).
- Click-tested in Chrome on the local vite server, AR and EN: no errors on load; invalid phone shows the Arabic / English message after blur; "السعودية" and "egy" and "سود" find the right nationality; Enter and mouse choose; switching language re-labels the chosen value. tsc + vite build clean.
- **Still English on the Arabic signup page (not changed, offered)**: the "Registration number" and "First and last name" placeholders and the rank / degree option labels.

Existing data unchanged until N2 to N5.

## N8 log

- **Sameh, APPLIED to production 2026-11-20** (user: "merge the old into the new account"; surviving row keeps its own name, email and phone). `scripts/tmp-merge-supervisors.cjs --from b3a2c3db-5e0b-42c7-a490-138ea5a91497 --into ba86f9f5-2ed1-44cd-abd0-59f2c1add224 --apply`. Moved 3 `events.presenterId` (his lectures), 1 `events.createdBy`, 1 `eliminator_reservations.supervisorId`; deleted the old row ("Sameh Hamdy Abdelbary", `sameh.h.ns.ka@gmail.com`, legacy ETL 2025-12-15, 0 submissions). Surviving: "Sameh Hamdi" `sameh-hamdi@kasralainy.edu.eg` `+201028230805`. Verified by the tool (0 references to the old id) and by a separate read-only query (3 presented events on the new id, 0 left on the old). Row-level rollback: `F:\DB_BACKUPS\ka-supervisor-merge-b3a2c3db-into-ba86f9f5-20261120184351.json`. He now logs in only with the newer account.

- **Hady and Elsharkawy, APPLIED to production 2026-11-20** (user: "yup" after the dry run). New gitignored tool `scripts/tmp-link-promotion.cjs --cand <id> --sup <id> [--apply]`: the app's promotion, but adopting a supervisor row the person already created (archive candidate, set `promotedToSupervisorId`, auto-approve pending with the promotion note, no reviewer stamped; guards on same email, same department, not already linked). Neither had pending items, so the only change was archive + link.
  - Hady: candidate `81e63c3b...` "hady mohamed hesham" linked to supervisor `0e6eddd4...` "Hadi Elsayed"; his 93 approved submissions and 8 attendances stay on the archived row (supervisor "Previous logbook" page). Rollback: `F:\DB_BACKUPS\ka-link-promotion-81e63c3b-to-0e6eddd4-20261120184948.json`.
  - Elsharkawy: candidate `33bb404a...` (empty) linked to supervisor `4fc1dc0f...` "Ahmed Elsharkawy". Rollback: `F:\DB_BACKUPS\ka-link-promotion-33bb404a-to-4fc1dc0f-20261120184950.json`.
  - Verified by a separate read-only query: both archived and linked, history counts unchanged.

## Proposed defaults for N9 (confirm when we get there)
- Hospital names: each department's copy uses the same proper name as the NS row for the same building.
- Emails: stored lowercase and trimmed.
- Event locations: keep `dept` / `online` codes (they are labels in the UI), title-case the free-text ones on display.

## Safety rules
- `.env` `PSQL_*` is production. Build and dry-run on the local restore; production writes only after a verified backup and the user's go-ahead on the exact list.
- Each data stage: dry run prints every before/after value; apply in one transaction with row counts asserted; row-level rollback JSON in `F:\DB_BACKUPS\`.
- No em-dashes anywhere.
