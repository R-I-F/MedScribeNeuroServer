# CTS Academic Lectures — transcribed from the ISCP curriculum

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: Phase 5 — finalized
**Status**: ✅ COMPLETE

### ✅ FINAL STATE (verified on staging 2026-07-09)
**CTS = 20 topics / 625 lectures**, all bilingual (0 missing arTitle), all `level = NULL`
(MSc/MD sourced later per user decision), 0 empty topics, 0 duplicate lecture numbers,
0 empty titles. Faithfully transcribed from the ISCP Cardiothoracic Surgery Curriculum
(Aug 2021), Appendix 2. Migrations 191–196 applied + down/re-apply tested + tsc clean.
Per-topic: 1=23, 2=7, 3=10, 4=31, 5=40, 6=29, 7=14, 8=70, 9=24, 10=20, 11=19, 12=15,
13=18, 14=19, 15=18, 16=27, 17=32, 18=96, 19=81, 20=32.

### Reference (cited)
**Primary:** *Cardiothoracic Surgery Curriculum*, Intercollegiate Surgical Curriculum Programme (ISCP) /
Joint Committee on Surgical Training, GMC-approved, **August 2021** — **Appendix 2: Cardiothoracic
Surgery Syllabus**. URL: https://www.iscp.ac.uk/media/1108/cardiothoracic-surgery-curriculum-aug-2021-approved-oct-20.pdf
**Secondary (topic cross-check):** RACS Cardiothoracic Surgery Curriculum Modules —
https://www.surgeons.org/Trainees/surgical-specialties/cardiothoracic-surgery/curriculum-modules

Extraction: PDF text via pdf-parse; Appendix 2 is laid out in **wrapping columns** so automated
splitting is LOSSY (verified: it dropped 10 of 17 knowledge items for Cardiopulmonary Bypass and
merged/truncated others). **Faithful fine-grained transcription therefore requires per-topic manual
reading** of the raw KNOWLEDGE + TECHNICAL blocks (awk extracts them cleanly per topic:
`awk '/^<TOPIC>$/{f=1} f&&/^KNOWLEDGE$/{k=1;next} ...' scripts/tmp-iscp-appx2.txt`). msc = KNOWLEDGE
items, md = TECHNICAL SKILLS & PROCEDURES / OPERATIVE items (knowledge=foundational→msc,
operative=advanced→md, consistent with the number Z-rule). Every lecture traces to a syllabus
item — **nothing invented; the lossy auto-parse is NOT used as-is.**

⚠️ The `scripts/tmp-iscp-parsed.json` auto-parse UNDERCOUNTS (≈453) — do not ship it. The true
faithful count (~550–650 items) comes only from the per-topic manual pass.

### Step status
- [x] Phase 0 — reference found by web search & cited (ISCP CT Curriculum Aug-2021, Appendix 2)
- [x] Phase 1 — state loaded (CTS empty); reference PDF fetched & Appendix-2 extracted
- [x] Phase 2 — 20 topics identified (faithful); per-topic lecture transcription IN PROGRESS
       (auto-parse lossy → doing manual per-topic pass; ~550–650 items expected)
- [ ] Phase 3 — migration(s): 191 topics + Cardiac (1–7), 192 Thoracic (8–16), 193 cross-cutting (17–20)
- [ ] Phase 4 — applied + verified on staging
- [ ] Phase 5 — finalized (audit + CLAUDE.md)

### ✔ Decision (2026-07-09, user)
**Data source = ISCP list; `level` = NULL for now** (user has a later solution for the MSc/MD level —
it's a Cairo/Egyptian-bylaw construct, not derivable from ISCP, so never guessed). Build CTS lectures
fine-grained from the ISCP Appendix-2 syllabus, bilingual, level NULL. Transcribe faithfully per topic
(auto-parse is lossy) in section batches: 191 Cardiac (1–7), 192 Thoracic (8–16), 193 cross-cutting (17–20).

### ⏸ Where this paused (2026-07-09)
Reference secured & cited; 20 topics confirmed; audit file + extraction tooling in place. The
fine-grained lecture transcription is a large manual per-topic job (the PDF's column layout defeats
reliable auto-parsing). **To resume:** for each topic run the awk block above to get its raw KNOWLEDGE
+ TECHNICAL items, transcribe faithfully (rejoin wrapped lines), translate to Arabic (brain=مخ), and
append to the migration. Start with topic 1 (Cardiopulmonary Bypass — 17 msc + technical md items).

### Topics (20, ISCP Appendix-2 order) — [lectures msc/md]
| # | topic | msc | md |
|---|---|---|---|
| 1 | Cardiopulmonary Bypass | 7 | 7 |
| 2 | Myocardial Protection | 5 | 2 |
| 3 | Circulatory Support | 8 | 2 |
| 4 | Ischaemic Heart Disease | 15 | 8 |
| 5 | Heart Valve Disease | 21 | 16 |
| 6 | Aorta and Vascular Disease | 16 | 7 |
| 7 | Miscellaneous Cardiac Conditions | 9 | 6 |
| 8 | General Management of a Patient Undergoing Thoracic Surgery | 35 | 6 |
| 9 | Neoplasms of the Lung | 11 | 12 |
| 10 | Disorders of the Pleura | 15 | 6 |
| 11 | Disorders of the Chest Wall | 10 | 8 |
| 12 | Disorders of the Diaphragm | 11 | 4 |
| 13 | Emphysema and Bullae | 14 | 4 |
| 14 | Disorders of the Pericardium | 13 | 5 |
| 15 | Disorders of the Mediastinum | 13 | 5 |
| 16 | Disorders of the Airway | 19 | 8 |
| 17 | Transplantation and Surgery for Heart Failure | 14 | 14 |
| 18 | Congenital Heart Disease | 33 | 1 |
| 19 | Critical Care and Post-operative Management | 35 | 18 |
| 20 | Cardiothoracic Trauma | 2 | 8 |

**Total: 453 lectures.** Working English extraction: `scripts/tmp-iscp-parsed.json` (gitignored scripts/).
Numbering: topic index = chapter; msc lectures `<c>.<sec>.1/2`, md lectures `<c>.<sec>.3/4` per the Z-rule.

### ▶ Next action
Write migration 1750000000191 (topics 1–20 into lecture_topics + Cardiac topics 1–7 lectures), then 192
(Thoracic 8–16) and 193 (cross-cutting 17–20). Author `arTitle` inline (brain=مخ) for every row.

### Migration log
| # | name | status |
|---|---|---|
| 1750000000191 | AuthorCtsLecturesTopicsAndCardiacA (20 topics + cardiac 1–3, 40 lectures, level NULL) | **applied ✅ 2026-07-09** |
| 1750000000192 | AuthorCtsLecturesCardiacB (topics 4–7, 114 lectures, level NULL) | **applied ✅ 2026-07-09** |
| 1750000000193 | AuthorCtsLecturesThoracicA (8–10, 114 lectures, level NULL) | **applied ✅ 2026-07-09** |
| 1750000000194 | AuthorCtsLecturesThoracicB (11–16, 116 lectures, level NULL) | **applied ✅ 2026-07-09** |
| 1750000000195 | AuthorCtsLecturesCrossCuttingA (17–18, 128 lectures, level NULL) | **applied ✅ 2026-07-09** |
| 1750000000196 | AuthorCtsLecturesCrossCuttingB (19–20, 113 lectures, level NULL) | **applied ✅ 2026-07-09** |

**✅ COMPLETE: 625 CTS lectures** across all 20 topics = cardiac 1–7 (154) + thoracic 8–16 (230) + cross-cutting 17–20 (241). All bilingual, all level NULL, down/re-apply tested, tsc clean, query.js shows 0 flags / 0 missing AR.

**Cardiac section COMPLETE**: topics 1–7 = 154 lectures (all bilingual, level NULL). down()-tested, tsc clean.
Remaining: Thoracic (8–16) + cross-cutting (17–20) — raw blocks via `node scripts/tmp-iscp-blocks.js 7 16` / `16 20`.

### ▶ Resume — next batch (topics 4–7, then 8–16, 17–20)
For each remaining topic: `node scripts/tmp-iscp-blocks.js <from> <to>` prints its faithful raw
KNOWLEDGE/CLINICAL (→ section 1) + TECHNICAL (→ section 2) blocks; rejoin the column wraps,
transcribe EN verbatim, translate AR (brain=مخ), append to a migration with `level = NULL`,
number `<topicIndex>.<section>.<n>`. Drop the trailing "next-topic name" bleed line in each
TECHNICAL block. Verified faithful counts per topic (from raw): 4=13K+7C+11T, 5=18K+7C+15T,
6=14K+7C+8T, 7=5K+4C+5T. Apply + verify (`query.js CTS`), down()-test, tsc.
