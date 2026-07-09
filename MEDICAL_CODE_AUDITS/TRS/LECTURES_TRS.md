# LECTURES AUDIT — TRS (Transplant Surgery) · جراحة زراعة الأعضاء

**Reference (cited, web-found):** *Curriculum and Syllabus — Transplantation (Transplant Surgery)* —
**UEMS (Union Européenne des Médecins Spécialistes), Section of Surgery, Division of Transplantation**
(European Board of Surgery / EBSQ in Transplant Surgery), **2021**. URL (curriculum page):
`https://uemssurg.org/surgicalspecialties/transplant-surgery/curriculum/` (PDF:
`https://uemssurg.icognitus.com/wp-content/uploads/2021/06/CURRICULUM-AND-SYLLABUS-TRANSPLANTATION.pdf`
— host unreachable at audit time; transcribed from the official UEMS curriculum page, which enumerates
the full syllabus). Chosen because TRS (Transplant Surgery) is a **subspecialty**, not a standalone
ISCP specialty — the UEMS EBSQ curriculum is the authoritative European specialty-board curriculum
(avoids overlapping the GS/HBP lectures). Transcribed faithfully; nothing invented.

**Granularity decision (documented):** the curriculum is organised into **4 Modules**, each with a
Subject objective + Knowledge / Clinical skills / Professional skills bullet lists. Mapping onto the
framework: **lecture_topics = the 4 MODULES, lectures = each module's Knowledge (section 1) + Clinical
skills (section 2) bullets** (numbered `<topic>.<section>.<n>`). **Excluded (documented):** the
**Professional skills** lists — a generic, cross-cutting professional-competency overlay (communication,
teamwork, audit/evidence-based medicine, multidisciplinary working, medico-legal/ethics, database
record-keeping) repeated near-verbatim under every module (GPC-style, not module-specific academic
content); and the Subject objective (the module aim, not a lecture). This is the same scoping applied
to SOC (generic clinical-skills/training sections) and MFS (generic Common Content).

**No Egyptian MSc source retrievable:** transplant surgery in Egypt is delivered within general/HPB/
urology programmes; no standalone openly-published Egyptian transplant-surgery MSc course-spec surfaced.
Level backfill deferred.

**Level policy:** every lecture `level = NULL`. The UEMS EBSQ curriculum has no MSc/MD tiering, so
`level` cannot be set from it (that would be a guess). Left NULL, consistent with the other depts.
(query.js shows `🔴 NO_LEVEL` flags — expected. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-10
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ UEMS Transplant Surgery Curriculum & Syllabus (2021)
- **Migration:** 1750000000211 — applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (TRS fresh: 0 topics)
  - [x] Phase 2A — 4 topics (modules) extracted (EN+AR)
  - [x] Phase 2B — 54 lectures (Knowledge + Clinical skills bullets) transcribed
  - [x] Phase 2C — Arabic authored (all 54 + 4 topics; 0 missing)
  - [x] Phase 3 — migration written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian transplant-surgery MSc source.)

## ✅ Final result (verified on staging 2026-07-10)
**4 topics / 54 lectures** (msc:0 md:0 null:54), **0 missing arTitle**. Per-topic counts match the
plan exactly: multi-organ retrieval 12 (7 knowledge + 5 clinical), kidney transplantation 15 (6+9),
pancreas transplantation 13 (6+7), liver transplantation 14 (6+8). Numbered `<topic>.<section>.<n>`
(section 1 = knowledge, 2 = clinical skills). down()/re-apply cycle clean (TRS→0→54 identical).
`npx tsc --noEmit` clean. All `level = NULL` (UEMS EBSQ curriculum has no MSc/MD tiering —
`🔴 NO_LEVEL` flags expected). Nothing committed — awaiting user's explicit ask.

## Numbering & structure
`<topicIdx>.<section>.<n>` — section **1 = KNOWLEDGE**, **2 = CLINICAL SKILLS**;
`sortOrder = topicIdx*1e6 + section*1e3 + n`. All `level = NULL`.

## 2A. Topics (4 UEMS modules, document order)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | multi-organ retrieval | استئصال الأعضاء المتعددة للزرع | 12 (7 knowledge + 5 clinical) |
| 2 | kidney transplantation | زراعة الكلى | 15 (6 + 9) |
| 3 | pancreas transplantation | زراعة البنكرياس | 13 (6 + 7) |
| 4 | liver transplantation | زراعة الكبد | 14 (6 + 8) |

**Σ = 4 topics / 54 lectures (msc:0 md:0 null:54).** One migration: **211**.

## Migration log
- 211 AuthorTrsLectures — [applied ✅] 4 topics + 54 lectures (Knowledge + Clinical skills)

## Still-open
- `level` MSc/MD backfill for all 54 rows (from an Egyptian transplant-surgery MSc/MD source once located; never guessed).
- The Professional-skills competency overlay + Subject objectives remain in the cited source if a wider curriculum is wanted.
