# LECTURES AUDIT — GS (General Surgery) · الجراحة العامة

**Reference (cited, web-found):** *Curriculum: General Surgery* — **Intercollegiate Surgical
Curriculum Programme (ISCP)**, JCST (UK), **August 2021** (version 2, July 2023), **Appendix 2:
General Surgery Syllabus** (pp. 44–75). URL:
`https://www.iscp.ac.uk/media/1372/general-surgery-curriculum-august-2021-version-2-july-2023.pdf`
Same issuing body / structure as the CTS lectures work — the syllabus enumerates training MODULES,
each with KNOWLEDGE/CLINICAL objective topics + a TECHNICAL SKILLS list. Transcribed faithfully;
nothing invented.

**Secondary Egyptian source (for future MSc/MD level backfill only):** *Master (MSc) Degree Program
and Courses Specifications for General Surgery* — **General Surgery Department, Faculty of Medicine,
Minia University, 2023** (`https://med.minia.edu.eg/Files/0%20Master_General%20Surgery_2023.pdf`).
Its clinical "General Surgery" course lists 26 coarse MSc topic-blocks (shock/haemorrhage,
lymphatic, abdominal wall/hernia/testis, breast, neck/thyroid, trauma, GIT/peritoneum,
pancreas/biliary, vascular, chest, paediatric, neuro, plastic). Too coarse for a per-lecture
curriculum and does not map 1:1 to the ISCP granularity — so the LIST comes from ISCP and **`level`
stays NULL** (consistent with CTS). Level can later be sourced from an Egyptian MSc/MD bylaw.

**Level policy:** every lecture `level = NULL`. The MSc/MD split is a Cairo-University/Egyptian-bylaw
construct that ISCP does not carry; not guessed. (query.js will show `🔴 NO_LEVEL` flags — expected
and correct here, exactly as for CTS. The load-bearing check is **Lectures missing AR = 0**.)

---

## 🔄 Progress Checkpoint — ✅ COMPLETE
- **Last updated:** 2026-07-09
- **Current step:** DONE — all phases complete, verified on staging
- **Reference chosen:** ✅ ISCP General Surgery Syllabus (Aug 2021, Appendix 2)
- **Migrations:** 1750000000197 / 198 / 199 — all applied ✅
- **Step status:**
  - [x] Phase 0 — reference found & cited
  - [x] Phase 1 — state loaded (GS fresh: 0 topics)
  - [x] Phase 2A — 11 topics extracted (EN+AR)
  - [x] Phase 2B — lectures transcribed per topic (numbered)
  - [x] Phase 2C — Arabic authored (inline in migrations)
  - [x] Phase 3 — migrations written
  - [x] Phase 4 — registered / applied / verified (down+re-apply clean, tsc clean)
  - [x] Phase 5 — finalized
- **▶ Next action:** none. (Optional future: backfill `level` from an Egyptian MSc/MD bylaw.)

## ✅ Final result (verified on staging 2026-07-09)
**11 topics / 493 lectures** (msc:0 md:0 null:493), **0 missing arTitle**. Per-topic counts match
the plan exactly: elective 20, emergency 73, upper-GI 72, colorectal 69, childhood 18, breast 58,
endocrine 19, transplant 41, vascular 4, remote & rural 54, trauma 65. down()/re-apply cycle clean
(GS→0→493 identical). `npx tsc --noEmit` clean. All `level = NULL` (query.js `🔴 NO_LEVEL` flags are
the intended/expected state under the level policy). Nothing committed — awaiting user's explicit ask.

---

## Numbering & structure
`<topicIdx>.<section>.<n>` — section **1 = KNOWLEDGE/CLINICAL** objective topics, **2 = TECHNICAL
SKILLS**. `sortOrder = topicIdx*1e6 + section*1e3 + n`. All `level = NULL`.

### De-duplication note (faithful)
The ISCP module **"Gastrointestinal and General Surgery of Childhood"** re-lists the Upper-GI +
Colorectal knowledge/technical items (identical wording) for the childhood-surgery training pathway,
then adds the genuinely childhood-specific topics. To avoid a verbatim duplicate topic, GS topic 5
= **"general surgery of childhood"** carries only the child-specific objectives + childhood
technical skills; the module's re-listed GI content is already covered by topics 3 (Upper GI) and 4
(Colorectal) and is deliberately **not** re-transcribed. Recorded, not trimmed-from-source.

## 2A. Topics (11, ISCP module order)
| # | EN title | AR title |
|---|----------|----------|
| 1 | elective general surgery | الجراحة العامة الاختيارية |
| 2 | emergency general surgery | جراحة الطوارئ العامة |
| 3 | upper gastrointestinal surgery | جراحة الجهاز الهضمي العلوي |
| 4 | colorectal surgery | جراحة القولون والمستقيم |
| 5 | general surgery of childhood | الجراحة العامة للأطفال |
| 6 | breast surgery | جراحة الثدي |
| 7 | endocrine surgery | جراحة الغدد الصماء |
| 8 | transplantation surgery | جراحة زرع الأعضاء |
| 9 | vascular surgery | جراحة الأوعية الدموية |
| 10 | remote and rural surgery | الجراحة في المناطق النائية والريفية |
| 11 | trauma surgery | جراحة الإصابات |

## 2B/2C. Lectures — see the three migrations for the full EN+AR content
Expected totals (Phase-2 plan):
- T1 elective: 11 knowledge + 9 technical = 20
- T2 emergency: 38 + 35 = 73
- T3 upper GI: 24 + 48 = 72
- T4 colorectal: 18 + 51 = 69
- T5 childhood: 7 + 11 = 18
- T6 breast: 7 + 51 = 58
- T7 endocrine: 5 + 14 = 19
- T8 transplant: 7 + 34 = 41
- T9 vascular: 1 + 3 = 4
- T10 remote & rural: 19 + 35 = 54
- T11 trauma: 8 + 57 = 65
- **Σ = 11 topics / 493 lectures (msc:0 md:0 null:493)**

Migration split:
- **197** — 11 topics + T1 (20) + T2 (73) + T3 (72) = 165 lectures
- **198** — T4 (69) + T5 (18) + T6 (58) = 145 lectures
- **199** — T7 (19) + T8 (41) + T9 (4) + T10 (54) + T11 (65) = 183 lectures

## Migration log
- 197 AuthorGsLecturesTopicsAndElectiveEmergencyUpperGi — [applied ✅] 11 topics + T1(20)+T2(73)+T3(72) = 165 lectures
- 198 AuthorGsLecturesColorectalChildhoodBreast — [applied ✅] T4(69)+T5(18)+T6(58) = 145 lectures
- 199 AuthorGsLecturesEndocrineTransplantVascularRemoteTrauma — [applied ✅] T7(19)+T8(41)+T9(4)+T10(54)+T11(65) = 183 lectures

## Still-open
- `level` MSc/MD backfill for all 493 rows (from an authoritative Egyptian bylaw — Minia MSc spec
  captured above as a candidate coarse mapping; never guessed).
