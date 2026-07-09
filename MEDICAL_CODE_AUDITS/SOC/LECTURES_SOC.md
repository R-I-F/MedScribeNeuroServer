# LECTURES AUDIT — SOC (Surgical Oncology) · جراحة الأورام

**Reference (cited, web-found):** *The ESSO core curriculum committee update on surgical oncology*
(the **ESSO Core Curriculum**) — **European Society of Surgical Oncology (ESSO)**, core curriculum
committee, published in the **European Journal of Surgical Oncology, 2021** (van der Hage et al.);
PDF hosted by ESSO. URL: `https://www.essoweb.org/wp-content/uploads/2025/01/ESSO-core-curriculum.pdf`
(also EJSO `doi:10.1016/j.ejso.2021.10.028`). Chosen because SOC (Surgical Oncology) is a
**subspecialty**, not a standalone ISCP specialty — the ESSO core curriculum is the authoritative
European specialty-society curriculum (built for the EBSQ / European Board of Surgery Qualification
in Surgical Oncology). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the ESSO curriculum is a **numbered outline** (Section →
numbered Subsection → detailed two-column knowledge tables). Its five top-level sections are:
**1. Basic Principles of Oncology, 2. Disease Site Specific Oncology, 3. Generic Clinical Skills,
4. Training Recommendations, 5. Eligibility for the EBSQ exam.** Mapping onto the framework using the
reference's OWN outline numbers: **lecture_topics = the 2 academic-content sections, lectures = their
numbered subsections** (1.1–1.10 and 2.1–2.11; the `lectureNumber` is the reference's own number).
The per-subsection two-column Basic/Advanced knowledge tables are the content of each lecture, not
separate lectures (they interleave in the PDF and cannot be cleanly split — same reasoning that
scoped ORTHO/HBP to reliable structural units, not noisy deep detail). **Excluded (non-lecture
content, documented):** §3 Generic Clinical Skills (an empty stub in the source — author name only,
no enumerated content), §4 Training Recommendations (programme-design recommendations — MDT meetings,
clinic, appraisal, teaching — not academic lecture subjects), §5 Eligibility (pure EBSQ admin
criteria: licence, certificate, logbook).

**No Egyptian MSc source retrievable:** no openly-published NCI-Cairo / Egyptian surgical-oncology
MSc course-spec surfaced in a genuine search. Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The ESSO curriculum uses no MSc/MD tiering (it targets
the European EBSQ fellowship qualification), so `level` cannot be set from it (that would be a guess).
Left NULL, consistent with the other depts. (query.js shows `🔴 NO_LEVEL` flags — expected. Load-
bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ESSO Core Curriculum (EJSO 2021)
- **Migration:** 1750000000207 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (SOC fresh: 0 topics)
  - [x] Phase 2A — 2 topics (academic sections) extracted (EN+AR)
  - [x] Phase 2B — 21 lectures (numbered subsections) transcribed (reference's own numbers 1.1–2.11)
  - [x] Phase 2C — Arabic authored (all 21 + 2 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian surgical-oncology MSc bylaw.)

## ✅ Final result (verified on staging 2026-07-09)
**2 topics / 21 lectures** (msc:0 md:0 null:21), **0 missing arTitle**. Per-topic counts match the
plan exactly: basic principles of oncology 10 (1.1–1.10), disease site specific oncology 11 (2.1–2.11).
Lectures carry the ESSO outline numbers; ordering correct (1.10 after 1.9 by numeric sortOrder).
down()/re-apply cycle clean (SOC→0→21 identical). `npx tsc --noEmit` clean. All `level = NULL`
(ESSO curriculum has no MSc/MD tiering — `🔴 NO_LEVEL` flags expected). Compact by design — a faithful
transcription of the ESSO curriculum's two academic pillars; each subsection's detailed knowledge
table remains in the source. Nothing committed — awaiting user's explicit ask.

## Numbering & structure
Lectures carry the **reference's own outline numbers** (`1.1`…`1.10`, `2.1`…`2.11`);
`sortOrder = section*1e6 + subsection*1e3`. All `level = NULL`.

## 2A. Topics (2 ESSO academic sections)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | basic principles of oncology | المبادئ الأساسية لعلم الأورام | 10 |
| 2 | disease site specific oncology | علم الأورام حسب موقع المرض | 11 |

**Σ = 2 topics / 21 lectures (msc:0 md:0 null:21).** One migration: **207**.

## Migration log
- 207 AuthorSocLectures — [applied ✅] 2 topics + 21 lectures (ESSO subsections 1.1–2.11)

## Still-open
- `level` MSc/MD backfill for all 21 rows (from an Egyptian surgical-oncology MSc/MD bylaw once located; never guessed).
- Each subsection's detailed two-column knowledge table (and §3/§4 generic/training content) remains in
  the cited source if a finer per-disease-site curriculum is ever wanted.
