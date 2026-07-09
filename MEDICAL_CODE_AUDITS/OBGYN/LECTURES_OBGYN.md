# LECTURES AUDIT — OBGYN (Obstetrics & Gynaecology) · النساء والتوليد

**Reference (cited, web-found):** *MRCOG Syllabus and Knowledge Requirements for Core Curriculum* —
**Royal College of Obstetricians and Gynaecologists (RCOG)**, 2019 (the knowledge syllabus underpinning
the O&G Core Curriculum / MRCOG examination). URL:
`https://www.rcog.org.uk/media/j1slwmul/mrcog-syllabus-curriculum-2019.pdf`. Chosen because the RCOG
Curriculum 2024 itself is CiP/competency-based (not a topic list), whereas the MRCOG Syllabus enumerates
the knowledge content as **15 core Knowledge Areas**, each with "Detailed Knowledge Requirements" — the
authoritative enumerated OBGYN topic list. No standalone Egyptian OBGYN MSc course-spec was retrievable.
Transcribed faithfully; nothing invented.

**Granularity decision (documented):** **lecture_topics = the MRCOG Knowledge Areas; lectures = each
area's Detailed Knowledge Requirement topics** (numbered `<topic>.1.<n>`). **Excluded (documented):**
the two generic professional Knowledge Areas — **KA1 Clinical skills** (history-taking, communication,
breaking bad news, teamwork, note-keeping) and **KA2 Teaching and research** (teaching methods, research,
statistics, audit) — as generic cross-cutting professional competencies, not OBGYN-specific academic
content (same scoping as TRS professional-skills / SOC generic clinical-skills). The 13 clinical/surgical
Knowledge Areas (KA3–15) are kept.

**Extraction notes (faithful):** parsed the "Detailed Knowledge Requirements" section only (skipping the
Part-1/2/3 Summary competency statements and their duplicates). The MRCOG uses a verbose/inconsistent
style: (1) maternal-medicine & gynae-problems bullets repeat "understand the epidemiology, aetiology …
management of **<condition>**: <details>" — the boilerplate prefix was stripped to the condition name;
(2) compound "Topic: exhaustive sub-list" bullets were reduced to the topic name (the sub-list is the
lecture's scope/content); (3) boilerplate descriptor-list summaries ending "… of/regarding" were dropped
(their conditions are captured as individual bullets elsewhere). A few titles are the reference's terse
category names (e.g. "genetic", "placental"). **Known gap:** gynaecological oncology's specific cancers
were listed by the MRCOG only as one compound "premalignant and malignant conditions of: …" summary
bullet (dropped as boilerplate) — that KA is therefore thinner (8 lectures: FIGO, screening, imaging,
palliative care, HPV, MDT, etc.).

**Level policy:** every lecture `level = NULL`. The MRCOG Part 1/2/3 competence levels are exam-stage
tiers, NOT the Egyptian MSc/MD construct, so `level` is left NULL (never guessed). Consistent with the
other depts. (query.js shows `🔴 NO_LEVEL` flags — expected. Load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-10
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ MRCOG Syllabus (RCOG, 2019)
- **Migrations:** 1750000000212 / 213 — all applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (OBGYN fresh: 0 topics)
  - [x] Phase 2A — 13 topics (clinical Knowledge Areas) extracted (EN+AR)
  - [x] Phase 2B — 217 lectures (Detailed Knowledge Requirements) transcribed (parser + validated; boilerplate/summary cleanup)
  - [x] Phase 2C — Arabic authored (EN→AR map; generator reports 0 missing)
  - [x] Phase 3 — 2 migrations generated
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian OBGYN MSc source.)

## ✅ Final result (verified on staging 2026-07-10)
**13 topics / 217 lectures** (msc:0 md:0 null:217), **0 missing arTitle**. Per-topic counts match the
plan exactly: core surgical skills 26, postoperative care 6, antenatal care 26, maternal medicine 18,
management of labour 35, management of delivery 25, postpartum problems 27, gynaecological problems 12,
subfertility 7, sexual & reproductive health 16, early pregnancy care 5, gynaecological oncology 8,
urogynaecology 6. down()/re-apply cycle clean (OBGYN→0→217 identical). `npx tsc --noEmit` clean. All
`level = NULL` (MRCOG Part-stage competence tiers, not MSc/MD — `🔴 NO_LEVEL` flags expected). Nothing
committed — awaiting user's explicit ask.

## Numbering & structure
All lectures section **1 = KNOWLEDGE**, numbered `<topicIdx>.1.<n>`;
`sortOrder = topicIdx*1e6 + 1*1e3 + n`. All `level = NULL`.

## 2A. Topics (13 MRCOG clinical Knowledge Areas, document order)
| # | EN title | AR title | lectures |
|---|----------|----------|----------|
| 1 | core surgical skills | المهارات الجراحية الأساسية | 26 |
| 2 | postoperative care | الرعاية بعد الجراحة | 6 |
| 3 | antenatal care | الرعاية قبل الولادة | 26 |
| 4 | maternal medicine | طب الأمومة | 18 |
| 5 | management of labour | تدبير المخاض | 35 |
| 6 | management of delivery | تدبير الولادة | 25 |
| 7 | postpartum problems | مشاكل ما بعد الولادة | 27 |
| 8 | gynaecological problems | المشاكل النسائية | 12 |
| 9 | subfertility | نقص الخصوبة | 7 |
| 10 | sexual and reproductive health | الصحة الجنسية والإنجابية | 16 |
| 11 | early pregnancy care | رعاية الحمل المبكر | 5 |
| 12 | gynaecological oncology | أورام النساء | 8 |
| 13 | urogynaecology and pelvic floor problems | طب المسالك البولية النسائية ومشاكل قاع الحوض | 6 |

**Σ = 13 topics / 217 lectures (msc:0 md:0 null:217).** Migrations: 212 (111) / 213 (106).

## Migration log
- 212 AuthorObgynLecturesSurgicalAntenatalMaternalLabour — [applied ✅] core surgical/postop/antenatal/maternal medicine/labour (111)
- 213 AuthorObgynLecturesDeliveryPostpartumGynae — [applied ✅] delivery/postpartum/gynae problems/subfertility/SRH/early pregnancy/oncology/urogynae (106)

## Still-open
- `level` MSc/MD backfill for all 217 rows (from an Egyptian OBGYN MSc/MD source once located; never guessed).
- Gynaecological-oncology specific cancers (compound MRCOG summary bullet) + the excluded KA1/KA2 generic areas remain in the source.
