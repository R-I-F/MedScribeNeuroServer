# LECTURES AUDIT — MFS (Maxillofacial Surgery) · جراحة الوجه والفكين

**Reference (cited, web-found):** *Curriculum: Oral and Maxillofacial Surgery* — **Intercollegiate
Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct 2020), **Appendix 2:
Oral and Maxillofacial Surgery Syllabus** (p.43+). URL:
`https://www.iscp.ac.uk/media/1105/oral-maxillofacial-surgery-curriculum-aug-2021-approved-oct-20.pdf`
Same issuing body / format as the ORTHO and GS lectures work (Module → sub-headers → competence-
graded topic-lines). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the syllabus "is arranged into twelve modules." Mapping onto
the framework (same as ORTHO/GS): **lecture_topics = the 12 clinical MODULES, lectures = each module's
competence-graded syllabus topic-lines** (numbered `<topic>.1.<n>`). The generic sub-group headers
(Anatomy, Pathology, Physiology, Diagnostics, Clinical Skills, Operative Management, etc.) are groupers,
not lectures. The separate **"Common Content Module"** (explicitly labelled *Core Surgical Training –
Phase 1*: generic basic-science content shared across all surgical specialties, in a different
bulleted format) is **excluded** as non-OMFS-specific (documented). Two modules lack the "Module"
suffix in the source ("Conditions of the oral mucosa", "Conditions of the skin module") — included.

Extraction via a parser (competence-line detection + wrapped-line joining + grouper skip + a
lowercase-continuation heuristic to separate sub-headers from wrapped topics); validated against the
raw text. Corrections: fixed the salivary/oral-mucosa module boundary, 4 uppercase sub-header merges
(Non-Surgical & Adjuvant Treatments / Perioperative management / Conservative management / Classification
of craniofacial conditions), and dropped 7 PDF-extraction fragments (bare parentheticals / slash lead-ins).

**No Egyptian MSc source retrievable:** OMFS in Egypt is typically a dental-faculty specialty; no
openly-published medical-faculty OMFS MSc course-spec surfaced. Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The ISCP P2/P3/SI markers are training-phase tiers,
NOT the Egyptian MSc/MD construct, so level is left NULL (never guessed). Consistent with the other
depts. (query.js shows `🔴 NO_LEVEL` flags — expected. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP OMFS Syllabus (Aug 2021, Appendix 2)
- **Migrations:** 1750000000208 / 209 / 210 — all applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (MFS fresh: 0 topics)
  - [x] Phase 2A — 12 topics (clinical modules) extracted (EN+AR)
  - [x] Phase 2B — 675 lectures (topic-lines) transcribed (parser + validated; boundary/merge/fragment fixes)
  - [x] Phase 2C — Arabic authored (EN→AR map; generator reports 0 missing)
  - [x] Phase 3 — 3 migrations generated
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian OMFS MSc source.)

## ✅ Final result (verified on staging 2026-07-09)
**12 topics / 675 lectures** (msc:0 md:0 null:675), **0 missing arTitle** — the largest department.
Actual per-topic counts: airway 41, craniofacial trauma 56, jaw deformity 67, facial pain & tmj 40,
head and neck 63, salivary glands 45, oral mucosa 46, skin 49, restoration of aesthetic form 69,
cleft lip and palate 65, craniofacial 78, dentoalveolar 56. down()/re-apply cycle clean
(MFS→0→675 identical). `npx tsc --noEmit` clean. All `level = NULL` (ISCP P2/P3/SI are training-phase
tiers, not MSc/MD — `🔴 NO_LEVEL` flags expected). Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (12 ISCP OMFS clinical modules, document order)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | airway | مجرى الهواء | 41 |
| 2 | craniofacial trauma | إصابات القحف والوجه | 56 |
| 3 | jaw deformity | تشوه الفكين | 67 |
| 4 | facial pain and tmj | ألم الوجه والمفصل الفكي الصدغي | 40 |
| 5 | head and neck | الرأس والرقبة | 66 |
| 6 | conditions of the salivary glands | حالات الغدد اللعابية | 45 |
| 7 | conditions of the oral mucosa | حالات الغشاء المخاطي للفم | 46 |
| 8 | conditions of the skin | حالات الجلد | 49 |
| 9 | restoration of normal aesthetic form and function | استعادة الشكل والوظيفة الجمالية الطبيعية | 69 |
| 10 | cleft lip and palate | الشفة الأرنبية وشق الحنك | 65 |
| 11 | craniofacial | القحف والوجه | 75 |
| 12 | dentoalveolar | السنخي السني | 56 |

**Σ = 12 topics / 675 lectures (msc:0 md:0 null:675).** Migrations: 208 (204) / 209 (203) / 210 (268).

## Migration log
- 208 AuthorMfsLecturesAirwayTraumaJawFacialpain — [applied ✅] airway/craniofacial trauma/jaw deformity/facial pain & tmj (204)
- 209 AuthorMfsLecturesHeadneckSalivaryMucosaSkin — [applied ✅] head & neck/salivary/oral mucosa/skin (203)
- 210 AuthorMfsLecturesRestorationCleftCraniofacialDentoalveolar — [applied ✅] restoration/cleft/craniofacial/dentoalveolar (268)

## Still-open
- `level` MSc/MD backfill for all 675 rows (from an Egyptian OMFS MSc/MD source once located; never guessed).
- The generic Common Content Module (CST Phase-1 basic science) and per-line competence values remain in the source.
