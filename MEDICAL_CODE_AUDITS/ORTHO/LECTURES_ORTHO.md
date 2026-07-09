# LECTURES AUDIT — ORTHO (Orthopedic Surgery) · جراحة العظام والمفاصل

**Reference (cited, web-found):** *Curriculum: Trauma & Orthopaedic Surgery* — **Intercollegiate
Surgical Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (approved Oct 2020), **Appendix 2:
Trauma and Orthopaedic Surgery Syllabus** (pp. 42–86). URL:
`https://www.iscp.ac.uk/media/1114/trauma-orthopaedic-surgery-curriculum-aug-2021-approved-oct-20.pdf`
Same issuing body / structure as the CTS and GS lectures work. The Appendix-2 syllabus has two
distinct components: **(A) Applied Clinical Knowledge** — the knowledge syllabus, organised into
modules (Applied Basic Science + the regional/system modules) each with condition/assessment/
treatment knowledge topics; and **(B) Applied Clinical Skills** — a *procedure competency list*
which the document itself states is "a reflection of the procedures that have been recorded in
trainee logbooks." Transcribed faithfully; nothing invented.

**Scope decision (documented, not a trim-to-target):** the ORTHO **lecture curriculum = the Applied
Clinical KNOWLEDGE syllabus (Part A)** — the ~397 knowledge topics that constitute what is actually
taught. Part B (Applied Clinical Skills, ~546 hyper-granular logbook procedure-variants, e.g. the
4-way "external fixation / MUA+wires / MUA+POP / ORIF" expansions per fracture) is a **surgical
logbook competency list, not an academic lecture syllabus** — the source frames it as logbook-
derived. It was **reviewed in full and intentionally excluded** from the lecture curriculum (it
would misrepresent 546 logbook entries as "lectures"). It remains available in the cited source for
a future dedicated "procedures/logbook" artifact. This differs from GS (whose ISCP "Technical
Skills" were a compact per-module operative list presented inside the knowledge syllabus, not a
separately-framed logbook appendix).

**Secondary Egyptian source (for future MSc/MD level backfill only):** *Program Specification for
Master Degree in Orthopedic Surgery (Orth800)* — **Cairo University, Kasr El Ainy Faculty of
Medicine** (`medicine.cu.edu.eg/.../MSCs/Orth800.pdf` — currently returns 404 after a site
restructure; citable by title). Also an openly-published Assiut University Master Orthopedic course
spec exists (`b.aun.edu.eg`). To be used later to backfill the msc/md `level` from the Egyptian
ماجستير/دكتوراه taxonomy — the institution-matched (Cairo University) MSc source.

**Level policy:** every lecture `level = NULL`. The ISCP competence numbers (1–4 = "knows of" →
"knows specifically and broadly") are **knowledge-depth levels, NOT the Egyptian MSc/MD construct**,
so they cannot set `level` (that would be a guess). Left NULL, consistent with CTS and GS.
(query.js shows `🔴 NO_LEVEL` flags — expected/correct here. The load-bearing check is **Lectures
missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP Trauma & Orthopaedic Surgery Syllabus (Aug 2021, Appendix 2, Part A)
- **Migrations:** 1750000000200 / 201 / 202 — all applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (ORTHO fresh: 0 topics)
  - [x] Phase 2A — 10 topics extracted (EN+AR)
  - [x] Phase 2B — 397 knowledge lectures transcribed (parser + validated; PDF-interleaving of
        Foot&Ankle→Knee fixed; sub-region prefixes fixed; within-topic dups removed; source typos fixed)
  - [x] Phase 2C — Arabic authored (all 397; 0 missing)
  - [x] Phase 3 — 3 migrations generated
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from the CU ortho MSc/MD bylaw;
  transcribe Part B logbook as a separate procedures artifact if desired.)

## ✅ Final result (verified on staging 2026-07-09)
**10 topics / 397 lectures** (msc:0 md:0 null:397), **0 missing arTitle**. Per-topic counts match
the plan exactly: basic science 73, foot & ankle 34, knee 31, hip 20, spine 41, hand 31, elbow 27,
shoulder 23, trauma 68, paediatric 49. down()/re-apply cycle clean (ORTHO→0→397 identical).
`npx tsc --noEmit` clean. All `level = NULL` (ISCP competence numbers are knowledge-depth, not
MSc/MD — `🔴 NO_LEVEL` flags are the intended state). Part B (Applied Clinical Skills logbook)
reviewed and excluded by scope. Nothing committed — awaiting user's explicit ask.

## Numbering & structure
All lectures are section **1 = KNOWLEDGE/CLINICAL** (Part B skills excluded), numbered
`<topicIdx>.1.<n>`; `sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (10, ISCP Part-A module order)
| # | EN title | AR title |
|---|----------|----------|
| 1 | applied clinical (basic) science | العلوم السريرية التطبيقية (الأساسية) |
| 2 | foot and ankle | القدم والكاحل |
| 3 | knee | الركبة |
| 4 | hip | الورك |
| 5 | spine | العمود الفقري |
| 6 | hand | اليد |
| 7 | elbow | المرفق |
| 8 | shoulder | الكتف |
| 9 | trauma | الإصابات |
| 10 | paediatric orthopaedic surgery | جراحة عظام الأطفال |

## 2B. Lecture counts (Phase-2 plan) — see migrations for full EN+AR
- basic science 73, foot & ankle 34, knee 31, hip 20, spine 41, hand 31, elbow 27, shoulder 23,
  trauma 68, paediatric 49 → **Σ = 10 topics / 397 lectures (msc:0 md:0 null:397)**

Migration split:
- **200** — 10 topics + basic science (73) + foot & ankle (34) + knee (31) = 138 lectures
- **201** — hip (20) + spine (41) + hand (31) + elbow (27) = 119 lectures
- **202** — shoulder (23) + trauma (68) + paediatric (49) = 140 lectures

## Migration log
- 200 AuthorOrthoLecturesTopicsBasicFootKnee — [applied ✅] 10 topics + basic(73)+foot&ankle(34)+knee(31) = 138 lectures
- 201 AuthorOrthoLecturesHipSpineHandElbow — [applied ✅] hip(20)+spine(41)+hand(31)+elbow(27) = 119 lectures
- 202 AuthorOrthoLecturesShoulderTraumaPaediatric — [applied ✅] shoulder(23)+trauma(68)+paediatric(49) = 140 lectures

## Still-open
- `level` MSc/MD backfill for all 397 rows (from the Cairo University ortho MSc/MD bylaw; never guessed).
- Part B (Applied Clinical Skills / surgical logbook, ~546 procedures) available in the cited source
  for a future procedures artifact if desired.
