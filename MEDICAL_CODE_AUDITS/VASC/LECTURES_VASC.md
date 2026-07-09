# LECTURES AUDIT — VASC (Vascular Surgery) · جراحة الأوعية الدموية

**Reference (cited, web-found):** *Appendix 2: Vascular Surgery Syllabus* — **Intercollegiate
Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct 2020). URL:
`https://www.iscp.ac.uk/media/1123/appendix-2-vascular-surgery-syllabus.pdf` (standalone Appendix 2;
part of the full Vascular Surgery Curriculum `…/media/1113/vascular-surgery-curriculum-aug-2021-approved-oct-20.pdf`).
Same issuing body / structure as the CTS, GS, ORTHO and PRS lectures work. The syllabus is organised
into **section groupings** (each with a "Phase 2 Phase 3" header), each containing ALL-CAPS **topics**
each with OBJECTIVES (knowledge + clinical + technical). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the reference's own two-level structure maps directly onto the
framework — **lecture_topics = the 5 SECTION groupings, lectures = the 47 ALL-CAPS topics** (each a
discrete teachable unit: e.g. "carotid artery disease", "aneurysm - elective", "vascular ultrasound").
The per-topic OBJECTIVES (competency statements like "To be able to undertake the assessment and
management of …") are the **content of each lecture, not separate lectures** — same reasoning that
scoped GS/ORTHO/PRS to teachable units rather than competency-statement granularity. The section names
are the reference's own groupings (incl. the slightly awkward "Generic Procedures 1/2") — kept
faithful, not re-taxonomised.

**No Egyptian MSc source retrievable:** unlike some depts, no openly-published Cairo/Assiut/Minia
vascular-surgery MSc course-spec surfaced in a genuine search (Minia only exposes CTS/other MD specs).
Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The ISCP Phase-2/Phase-3 markers are training-phase
tiers, **NOT the Egyptian MSc/MD construct**, so they cannot set `level` (that would be a guess).
Left NULL, consistent with CTS, GS, ORTHO and PRS. (query.js shows `🔴 NO_LEVEL` flags — expected.
Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP Vascular Surgery Syllabus (Aug 2021, Appendix 2)
- **Migration:** 1750000000204 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (VASC fresh: 0 topics)
  - [x] Phase 2A — 5 topics (sections) extracted (EN+AR)
  - [x] Phase 2B — 47 lectures (ALL-CAPS topics) transcribed (47 OBJECTIVEs verified)
  - [x] Phase 2C — Arabic authored (all 47 + 5 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian vascular MSc bylaw.)

## ✅ Final result (verified on staging 2026-07-09)
**5 topics / 47 lectures** (msc:0 md:0 null:47), **0 missing arTitle**. Per-topic counts match the
plan exactly: generic topics 12, imaging 5, generic procedures 1 = 1, generic procedures 2 = 18,
abdominal & general surgery 11. down()/re-apply cycle clean (VASC→0→47 identical). `npx tsc --noEmit`
clean. All `level = NULL` (ISCP Phase-2/Phase-3 markers are training-phase tiers, not MSc/MD —
`🔴 NO_LEVEL` flags expected). Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (5 ISCP section groupings, document order)
| # | EN title | AR title | topics |
|---|----------|----------|--------|
| 1 | vascular surgery generic topics | الموضوعات العامة لجراحة الأوعية الدموية | 12 |
| 2 | vascular surgery imaging | التصوير في جراحة الأوعية الدموية | 5 |
| 3 | vascular surgery generic procedures 1 | الإجراءات العامة في جراحة الأوعية الدموية (1) | 1 |
| 4 | vascular surgery generic procedures 2 | الإجراءات العامة في جراحة الأوعية الدموية (2) | 18 |
| 5 | vascular surgery abdominal and general surgery topics | موضوعات جراحة البطن والجراحة العامة في جراحة الأوعية | 11 |

**Σ = 5 topics / 47 lectures (msc:0 md:0 null:47).** One migration: **204**.

## Migration log
- 204 AuthorVascLectures — [applied ✅] 5 topics + 47 lectures (all ALL-CAPS topics)

## Still-open
- `level` MSc/MD backfill for all 47 rows (from an Egyptian vascular MSc/MD bylaw once located; never guessed).
- The per-topic OBJECTIVES competency bullets remain in the cited source if a finer curriculum is wanted.
