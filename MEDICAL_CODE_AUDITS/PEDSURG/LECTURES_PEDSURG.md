# LECTURES AUDIT — PEDSURG (Pediatric Surgery) · جراحة الأطفال

**Reference (cited, web-found):** *Paediatric Surgery Curriculum, Appendix 2: Syllabus* —
**Intercollegiate Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct
2020). URL: `https://www.iscp.ac.uk/media/1107/paediatric-surgery-curriculum-aug-2021-approved-oct-20.pdf`
(Appendix 2 at p.42+). Same issuing body / structure as the CTS, GS, ORTHO, PRS and VASC lectures
work. The syllabus is organised as **Category → Topic** entries (each Topic carries an Objective +
Knowledge/Clinical Skills/Technical Skills content). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the reference's own two-level structure maps directly onto the
framework — **lecture_topics = the 9 CATEGORIES, lectures = the 62 TOPICS** (each Topic has its own
Objective — a discrete teachable unit: e.g. "pyloric stenosis", "congenital diaphragmatic hernia",
"posterior urethral valves", "wilms tumour"). The per-topic Knowledge/Clinical/Technical bullets are
the **content of each lecture, not separate lectures** — same reasoning that scoped GS/ORTHO/PRS/VASC
to teachable units rather than competency-statement granularity. The categories are the reference's
own groupings (the "General surgery of childhood" casing variant normalised to "General Surgery of
Childhood"). Three topic titles were repaired from PDF line-wraps: "bladder exstrophy (to include
outlet anomalies e.g. epispadias)", "congenital and acquired lung abnormalities including management
of empyema", and "adrenal gland" (stray table-cell text stripped).

**No Egyptian MSc source retrievable:** no openly-published Cairo/Assiut/Mansoura paediatric-surgery
MSc course-spec surfaced in a genuine search. Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The ISCP phase/competence markers (1–4 knowledge
depth) are NOT the Egyptian MSc/MD construct, so they cannot set `level` (that would be a guess).
Left NULL, consistent with CTS, GS, ORTHO, PRS, VASC. (query.js shows `🔴 NO_LEVEL` flags — expected.
Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP Paediatric Surgery Syllabus (Aug 2021, Appendix 2)
- **Migration:** 1750000000205 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (PEDSURG fresh: 0 topics)
  - [x] Phase 2A — 9 topics (categories) extracted (EN+AR)
  - [x] Phase 2B — 62 lectures (topics) transcribed (62 "Topic" entries verified; 3 wrap-repairs)
  - [x] Phase 2C — Arabic authored (all 62 + 9 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian paediatric-surgery MSc bylaw.)

## ✅ Final result (verified on staging 2026-07-09)
**9 topics / 62 lectures** (msc:0 md:0 null:62), **0 missing arTitle**. Per-topic counts match the
plan exactly: general surgery of childhood 3, gastrointestinal 9, urology 12, neonatal surgery 13,
oncology 7, endocrine conditions 6, thoracic anomalies 4, operative skills 3, management 5.
down()/re-apply cycle clean (PEDSURG→0→62 identical). `npx tsc --noEmit` clean. All `level = NULL`
(ISCP competence numbers are knowledge-depth, not MSc/MD — `🔴 NO_LEVEL` flags expected). Nothing
committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (9 ISCP categories, document order)
| # | EN title | AR title | topics |
|---|----------|----------|--------|
| 1 | general surgery of childhood | الجراحة العامة للأطفال | 3 |
| 2 | gastrointestinal | الجهاز الهضمي | 9 |
| 3 | urology | المسالك البولية | 12 |
| 4 | neonatal surgery | جراحة حديثي الولادة | 13 |
| 5 | oncology | علم الأورام | 7 |
| 6 | endocrine conditions | حالات الغدد الصماء | 6 |
| 7 | thoracic anomalies | تشوهات الصدر | 4 |
| 8 | operative skills | المهارات الجراحية | 3 |
| 9 | management | الإدارة | 5 |

**Σ = 9 topics / 62 lectures (msc:0 md:0 null:62).** One migration: **205**.

## Migration log
- 205 AuthorPedsurgLectures — [applied ✅] 9 topics + 62 lectures (all Category→Topic entries)

## Still-open
- `level` MSc/MD backfill for all 62 rows (from an Egyptian paediatric-surgery MSc/MD bylaw once located; never guessed).
- The per-topic Knowledge/Clinical/Technical competency bullets remain in the cited source if a finer curriculum is wanted.
