# LECTURES AUDIT — ENT (Otolaryngology) · الأنف والأذن والحنجرة

**Reference (cited, web-found):** *Curriculum: Otolaryngology, Appendix 2: Otolaryngology Syllabus* —
**Intercollegiate Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct 2020).
URL: `https://www.iscp.ac.uk/media/1173/appendix-2-otolaryngology-syllabus.pdf` (standalone Appendix 2;
part of the full Otolaryngology Curriculum `…/media/1106/otolaryngology-curriculum-aug-2021-approved-oct-20.pdf`).
Same issuing body / format as the PEDSURG lectures work (Category → Topic, each Topic with an Objective +
Knowledge/Clinical Skills/Technical Skills). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the syllabus is "organised by topics which are the presenting
conditions." Mapping onto the framework (same as PEDSURG): **lecture_topics = the CATEGORIES (the ENT
subspecialty areas), lectures = the Topic entries** (each has its own Objective — a teachable unit),
numbered `<topic>.1.<n>`. Each topic's Knowledge/Clinical/Technical bullets are the lecture content.
The syllabus's Category field collapses to **4 subspecialty areas — Paediatric Otolaryngology, Otology,
Rhinology, Head and Neck** — with Laryngology and Thyroid/Parathyroid filed under Head and Neck. A few
anomalous singleton Category values (Sinonasal neoplasms, Advanced Rhinology, Surgical Management of
Epiphora, a blank) are all competence-marked **"SI = Rh"** in the source, so were placed under Rhinology;
"Skin cancer" (Head and Neck). One duplicate ("orbital disorders", listed under two Category labels) was
deduped. Topic titles were stripped of their "P2 P3 SI = XX" competence-marker suffix.

**No Egyptian MSc source retrievable:** no openly-published Egyptian medical-faculty ENT MSc course-spec
surfaced. Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The ISCP P2/P3/SI competence markers are training-phase
tiers, NOT the Egyptian MSc/MD construct, so level is left NULL (never guessed). Consistent with the
other depts. (query.js shows `🔴 NO_LEVEL` flags — expected. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-10
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP Otolaryngology Syllabus (Aug 2021, Appendix 2)
- **Migration:** 1750000000214 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (ENT fresh: 0 topics)
  - [x] Phase 2A — 4 topics (subspecialty categories) extracted (EN+AR)
  - [x] Phase 2B — 60 lectures (Topic entries) transcribed (parser + validated; suffix stripped, dedup)
  - [x] Phase 2C — Arabic authored (all 60 + 4 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian ENT MSc source.)

## ✅ Final result (verified on staging 2026-07-10)
**4 topics / 60 lectures** (msc:0 md:0 null:60), **0 missing arTitle**. Per-topic counts match the plan
exactly: paediatric otolaryngology 18, otology 10, rhinology 16, head and neck 16. down()/re-apply
cycle clean (ENT→0→60 identical). `npx tsc --noEmit` clean. All `level = NULL` (ISCP P2/P3/SI training-
phase tiers, not MSc/MD — `🔴 NO_LEVEL` flags expected). Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE/CLINICAL**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (4 ISCP subspecialty categories)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | paediatric otolaryngology | أنف وأذن وحنجرة الأطفال | 18 |
| 2 | otology | طب الأذن | 10 |
| 3 | rhinology | طب الأنف | 16 |
| 4 | head and neck | الرأس والرقبة | 16 |

**Σ = 4 topics / 60 lectures (msc:0 md:0 null:60).** One migration: **214**.

## Migration log
- 214 AuthorEntLectures — [applied ✅] 4 topics + 60 lectures (Topic entries)

## Still-open
- `level` MSc/MD backfill for all 60 rows (from an Egyptian ENT MSc/MD source once located; never guessed).
- Each topic's detailed Knowledge/Clinical/Technical bullets remain in the cited source if a finer curriculum is wanted.
