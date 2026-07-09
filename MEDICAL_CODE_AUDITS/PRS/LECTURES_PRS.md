# LECTURES AUDIT — PRS (Plastic & Reconstructive Surgery) · جراحة التجميل وإعادة التشكيل

**Reference (cited, web-found):** *Appendix 2: Plastic Surgery Syllabus* — **Intercollegiate
Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct 2020). URL:
`https://www.iscp.ac.uk/media/1180/appendix-2-plastic-surgery-syllabus.pdf` (standalone Appendix 2;
part of the full Plastic Surgery Curriculum `…/media/1109/plastic-surgery-curriculum-aug-2021-approved-oct-20.pdf`).
Same issuing body / structure as the CTS, GS and ORTHO lectures work. The syllabus opens with a
**"Summary of Plastic Surgery Syllabus: Module | Sub-section"** table — the reference's own two-level
enumeration — then details each sub-section with an OBJECTIVE + KNOWLEDGE/CLINICAL SKILLS/TECHNICAL
SKILLS bullets (Basic/Intermediate/Advanced). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the reference's two-level Module→Sub-section structure maps
directly onto the framework's two levels: **lecture_topics = the 19 Modules, lectures = the 63
Sub-sections** (each sub-section has its own OBJECTIVE — a discrete teachable unit). The per-sub-
section KNOWLEDGE/CLINICAL/TECHNICAL competency bullets (Basic/Intermediate/Advanced) are the
**content of each lecture, not separate lectures** — flattening them would yield ~800 hyper-granular
competency statements, mis-scaled for a lecture curriculum (same reasoning that scoped GS/ORTHO to
teachable units, not logbook/competency granularity). This is a granularity choice traceable to the
reference's own "Summary" table, not a trim-to-target. Single-sub-section modules (chest wall,
complex wound, craniomaxillofacial trauma, ear, pelvic floor, vascular anomalies, sarcoma,
psychological) faithfully yield one lecture each. Minor ISCP summary-vs-detail wording variance
exists for the two "basic sciences" sub-sections (head & neck; oncoplastic breast) — the canonical
Summary-table titles are used.

**Secondary Egyptian source (for future MSc/MD level backfill only):** *Master (MSc) Degree Program
and Courses Specifications for Plastic Surgery* — **Assiut University, Faculty of Medicine**
(`b.aun.edu.eg/medicine/.../plastic surgery/Master Plastic surgery program and courses
specification.edited.pdf`). To be used later to backfill the msc/md `level` from the Egyptian
ماجستير/دكتوراه taxonomy.

**Level policy:** every lecture `level = NULL`. The ISCP Basic/Intermediate/Advanced tiers are
**complexity levels, NOT the Egyptian MSc/MD construct**, so they cannot set `level` (that would be
a guess). Left NULL, consistent with CTS, GS and ORTHO. (query.js shows `🔴 NO_LEVEL` flags —
expected/correct. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP Plastic Surgery Syllabus (Aug 2021, Appendix 2)
- **Migration:** 1750000000203 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (PRS fresh: 0 topics)
  - [x] Phase 2A — 19 topics (modules) extracted (EN+AR)
  - [x] Phase 2B — 63 lectures (sub-sections) transcribed from the Summary table (63 OBJECTIVEs verified)
  - [x] Phase 2C — Arabic authored (all 63 + 19 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from the Assiut/CU plastic MSc bylaw;
  finer per-competency-bullet curriculum available in the source if ever wanted.)

## ✅ Final result (verified on staging 2026-07-09)
**19 topics / 63 lectures** (msc:0 md:0 null:63), **0 missing arTitle**. Per-topic counts match the
plan exactly (aesthetic 3, breast surgery 2, burns 6, chest wall 1, cleft 6, complex wound 1,
craniofacial 6, cmf trauma 1, ear 1, GU recon 3, hand 6, head & neck 6, lower limb 6, oncoplastic
breast 5, pelvic floor 1, skin surgery 6, vascular anomalies 1, sarcoma 1, psychological 1).
down()/re-apply cycle clean (PRS→0→63 identical). `npx tsc --noEmit` clean. All `level = NULL`
(ISCP Basic/Intermediate/Advanced are complexity tiers, not MSc/MD — `🔴 NO_LEVEL` flags expected).
Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (19 ISCP modules, Summary-table order)
| # | EN title | AR title | subs |
|---|----------|----------|------|
| 1 | aesthetic | الجراحة التجميلية | 3 |
| 2 | breast surgery | جراحة الثدي | 2 |
| 3 | burns | الحروق | 6 |
| 4 | chest wall reconstruction | إعادة بناء جدار الصدر | 1 |
| 5 | cleft | الشقوق (الشفة والحنك) | 6 |
| 6 | complex wound | الجروح المعقدة | 1 |
| 7 | craniofacial | الجراحة القحفية الوجهية | 6 |
| 8 | craniomaxillofacial trauma | إصابات القحف والوجه والفكين | 1 |
| 9 | ear reconstruction | إعادة بناء الأذن | 1 |
| 10 | genitourinary reconstruction | إعادة البناء البولي التناسلي | 3 |
| 11 | hand | اليد | 6 |
| 12 | head & neck | الرأس والرقبة | 6 |
| 13 | lower limb | الطرف السفلي | 6 |
| 14 | oncoplastic breast | جراحة الثدي الأورامية التجميلية | 5 |
| 15 | pelvic floor reconstruction | إعادة بناء قاع الحوض | 1 |
| 16 | skin surgery | جراحة الجلد | 6 |
| 17 | vascular anomalies | التشوهات الوعائية | 1 |
| 18 | sarcoma | الساركوما (الأورام اللحمية) | 1 |
| 19 | psychological aspect of plastic surgery | الجانب النفسي لجراحة التجميل | 1 |

**Σ = 19 topics / 63 lectures (msc:0 md:0 null:63).** One migration: **203**.

## Migration log
- 203 AuthorPrsLectures — [applied ✅] 19 topics + 63 lectures (all sub-sections)

## Still-open
- `level` MSc/MD backfill for all 63 rows (from the Assiut/Cairo ortho-equivalent plastic MSc bylaw; never guessed).
- The per-sub-section KNOWLEDGE/CLINICAL/TECHNICAL competency bullets remain in the cited source if a
  finer-grained curriculum is ever wanted.
