# LECTURES AUDIT — HBP (Hepatobiliary & Pancreatic Surgery) · جراحة الكبد والقنوات الصفراوية والبنكرياس

**Reference (cited, web-found):** *Curriculum for Hepato-Pancreato-Biliary Surgery Fellowships* —
**International Hepato-Pancreato-Biliary Association (IHPBA)**, Education and Training Committee,
**2008** (approved by IHPBA Council, May 1, 2008). URL: `https://www.ihpba.org/media/hpb_curriculum.pdf`.
Chosen because HBP is a **subspecialty**, not a standalone ISCP specialty — the IHPBA fellowship
curriculum is the authoritative international specialty-society HPB curriculum (better than slicing the
HPB module out of the ISCP General Surgery curriculum, which would overlap with the GS lectures).
Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the curriculum is explicitly built as **7 Major Units, some
with Subunits**, and each leaf Unit/Subunit is split into *Objectives / Content / Clinical Skills*.
The **Content** section is defined by the source as "the specific areas of study necessary to achieve
the unit objectives." Mapping onto the framework: **lecture_topics = the 7 UNITS, lectures = the
top-level Content study-areas** (e.g. "physiology of the liver", "gallstones", "pancreatitis",
"benign neoplasms of the liver"). The deeper Content nesting (the (1)/(a)/i. sub-bullets) is the
content of each lecture. The Subunit grouping (anatomy → non-neoplastic disease → neoplastic disease
→ surgery) is preserved by lecture ordering within each unit topic. This honors the document's
primary "7 Units" structure while giving a lecture-sized grain (same principle as scoping GS/ORTHO/
PRS/VASC/PEDSURG to teachable study-areas, not deep competency detail).

Extraction was via a parser keyed to the expected next content-letter (a, b, c…) to reject deep
re-used letters/roman-numerals; 3 manual corrections applied: dropped a spurious deep item
("sugiura procedure", a portal-hypertension sub-bullet that matched an expected 'd'), added
"organ preservation" + "transplantation" (Unit 7 was PDF-lettered a/d/e — broken sequence), and
trimmed a trailing "including" on one Imaging item.

**No Egyptian MSc source retrievable:** no openly-published Egyptian HBP/hepatobiliary MSc course-spec
surfaced in a genuine search (HBP is typically a subspecialty of General Surgery in Egyptian faculties).
Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The IHPBA curriculum is a fellowship (post-CCT
subspecialty) framework with **no MSc/MD tiering**, so `level` cannot be set from it (that would be a
guess). Left NULL, consistent with CTS, GS, ORTHO, PRS, VASC, PEDSURG. (query.js shows `🔴 NO_LEVEL`
flags — expected. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ IHPBA HPB Fellowship Curriculum (2008)
- **Migration:** 1750000000206 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (HBP fresh: 0 topics)
  - [x] Phase 2A — 7 topics (units) extracted (EN+AR)
  - [x] Phase 2B — 65 lectures (Content study-areas) transcribed (parser + 3 manual corrections, verified against raw)
  - [x] Phase 2C — Arabic authored (all 65 + 7 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian HBP MSc bylaw.)

## ✅ Final result (verified on staging 2026-07-09)
**7 topics / 65 lectures** (msc:0 md:0 null:65), **0 missing arTitle**. Per-topic counts match the
plan exactly: the liver 20, the biliary tract including gallbladder 13, the pancreas and duodenum 19,
imaging 3, oncology 4, trauma 3, transplantation 3. down()/re-apply cycle clean (HBP→0→65 identical).
`npx tsc --noEmit` clean. All `level = NULL` (IHPBA fellowship curriculum has no MSc/MD tiering —
`🔴 NO_LEVEL` flags expected). Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (7 IHPBA units, document order)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | the liver | الكبد | 20 |
| 2 | the biliary tract including gallbladder | القناة الصفراوية بما في ذلك المرارة | 13 |
| 3 | the pancreas and duodenum | البنكرياس والاثني عشر | 19 |
| 4 | imaging | التصوير | 3 |
| 5 | oncology | علم الأورام | 4 |
| 6 | trauma | الإصابات | 3 |
| 7 | transplantation | زراعة الأعضاء | 3 |

**Σ = 7 topics / 65 lectures (msc:0 md:0 null:65).** One migration: **206**.

## Migration log
- 206 AuthorHbpLectures — [applied ✅] 7 topics + 65 lectures (Content study-areas)

## Still-open
- `level` MSc/MD backfill for all 65 rows (from an Egyptian HBP MSc/MD bylaw once located; never guessed).
- The deeper Content detail (sub-bullets) and per-unit Clinical Skills remain in the cited source if a finer curriculum is wanted.
