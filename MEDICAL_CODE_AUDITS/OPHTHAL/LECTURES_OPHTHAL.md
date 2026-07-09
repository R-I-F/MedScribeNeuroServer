# OPHTHAL — Academic Lectures Curriculum (scaled lectures framework)

**Reference:** *Master (MSC) Degree Program and Courses Specifications for Ophthalmology* · Department of Ophthalmology, Faculty of Medicine, Assiut University — Quality Assurance Unit · 2021-2022 / 2022-2023 (most recent program-specification approval 27-11-2022) · https://aun.edu.eg/medicine/sites/default/files/Postgraduate/Master$MD/ophthalmology/Ophthalmology%20master%20program%20%20and%20courses%20specification.pdf

This is a **source-0 Egyptian faculty postgraduate curriculum** (the ideal source class): it enumerates BOTH the topic/lecture list AND the level. Because the document is explicitly the **Master (MSC)** degree program, every course in it is an MSc-level course → **`level = 'msc'` on every lecture** (authoritatively sourced, not guessed). The MD/Doctorate ophthalmology curriculum (a separate Assiut spec) could be transcribed later to add `md`-level content.

Faithful transcription only — every topic and lecture traces to this document. Nothing invented; no memory padding.

---

## 🔄 Progress Checkpoint
- **Last updated:** 2026-07-10
- **Current step:** Phase 5 — finalize
- **Migration numbers reserved:** `1750000000215` (primary) + `1750000000217` (part 2). `216` is the sibling UROL agent's — do not touch.
- **Step status:**
  - [x] Phase 0 — reference found & cited (Assiut Master of Ophthalmology spec)
  - [x] Phase 1 — staging state loaded (OPHTHAL: fresh, 0 topics)
  - [x] Phase 2A — topics extracted (8)
  - [x] Phase 2B — lectures transcribed (219)
  - [x] Phase 2C — Arabic titles authored (all topics + lectures)
  - [x] Phase 3 — migrations written (215 + 217)
  - [x] Phase 4 — registered, applied, verified
  - [x] Phase 5 — record finalized
- **▶ Next action:** COMPLETE.

---

## Design

The reference's own top-level structure = **6 courses**, with Course 6 (Ophthalmology, the specialty course) divided into **3 modules** (Eye Medicine / Eye Surgery / Eye Pathology). These map onto **8 `lecture_topics`**. Lectures under each topic = exactly the items the course/module's "Course contents (topics/modules)" table + ILO disease lists enumerate.

Numbering `<chapter>.<section>.<lecture>` is stable ordering only (level comes from the source, not the number). For the clinical modules the **chapter digit preserves the source's subspecialty grouping** (refraction / cornea / glaucoma / …). `sortOrder = chapter·1e6 + section·1e3 + lecture·10`.

### Topics (sortOrder)
| # | topic (EN) | arTitle | source |
|---|---|---|---|
| 0 | anatomy of the eye | تشريح العين | Course 1 |
| 1 | physiology of the eye | فسيولوجيا العين | Course 2 |
| 2 | optics and refraction | البصريات والانكسار | Course 3 |
| 3 | general surgery | الجراحة العامة | Course 4 |
| 4 | internal medicine and neurological diseases | الأمراض الباطنية والعصبية | Course 5 (units 1+2) |
| 5 | eye medicine | طب العيون | Course 6 · Module 1 |
| 6 | eye surgery | جراحة العيون | Course 6 · Module 2 |
| 7 | eye pathology | باثولوجيا العين | Course 6 · Module 3 |

## Counts (plan)
- **Topics:** 8
- **Lectures:** 219 — **msc: 219, md: 0, null: 0**
  - anatomy 19 · physiology 25 · optics 16 · general surgery 8 · internal medicine & neurology 11 · eye medicine 77 · eye surgery 46 · eye pathology 17
- **Migration 215** = 8 topics + topics 0–5 lectures (156). **Migration 217** = topics 6–7 lectures (63).

## Migration log
- `1750000000215-AuthorOphthalLectures.ts` — topics + basic courses + eye medicine — [applied ✅]
- `1750000000217-AuthorOphthalLecturesPart2.ts` — eye surgery + eye pathology — [applied ✅]

## Still-open
- `level` for an MD/Doctorate split: this transcription is the Master (MSC) program → all `msc`. If the Assiut MD ophthalmology spec is later sourced, `md`-level lectures can be added.
- Arabic titles authored to standard medical Arabic; reviewable by a native ophthalmology reviewer.
