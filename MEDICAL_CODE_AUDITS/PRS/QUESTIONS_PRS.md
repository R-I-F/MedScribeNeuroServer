# PRS Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (5 questions: laterality, region, urgency, reconstructionMethod, intraopEvents)
- [x] Phase 2C — option sets authored (31 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (36 links, 87 narrowing rows)
- [x] Phase 3 — migrations written (166 AuthorPrsAdditionalQuestions, 167 AddPrsQuestionNarrowing)
- [x] Phase 4 — applied + verified: **5 questions / 31 options / 36 links / 87 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 167+166 → re-apply → identical); ORTHO/GS/CTS/NS untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
166=AuthorPrsAdditionalQuestions [applied ✅ 2026-07-09], 167=AddPrsQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): burns TBSA% (needs a numeric input type — future framework extension), cleft repair technique, nerve repair type (single-category keys deferred by the ≥2 rule).

---

## 🔬 Working notes

### 2B — Question set (5 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused ORTHO key + a 4th option `midline` (PRS operates on midline structures — cleft palate, neck contracture). 6 categories where side is real and not in the diagnosis. |
| `region` | single_choice | Anatomical site / الموضع التشريحي | Canonical. 15 sites incl. the pressure-ulcer classics (sacrum/ischium/trochanter/heel) and post-burn contracture sites (neck/axilla). Only the 5 categories where the diagnosis doesn't already encode the site. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). Only the 4 trauma-facing categories (burns, hand trauma, nerve injuries, traumatic lacerations). The rest of PRS is elective — one-answer question. |
| `reconstructionMethod` | single_choice | Reconstruction method (ladder) / طريقة إعادة البناء (السلم الترميمي) | NEW PRS key — THE plastic-surgery viva: where on the reconstructive ladder did you close the defect (primary closure → secondary intention → sTSG/FTSG → local/pedicled/free flap → tissue expansion)? 9 categories. |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; sortOrder 9 (renders last). |

Skipped (justified): `approach` — PRS has no open/lap axis; reconstructionMethod IS the plastics-native approach question. `surgicalDomain` — aesthetic-vs-reconstructive duplicates the categories. `position` — supine-dominant; the pressure-ulcer exception follows the ulcer site (redundant with region). `clinicalPresentation` — submissions carry preOpClinCond. **burnDepth** — already encoded in the burn diagnoses (ND92.1/.2/.3 depth ladder).

**Still-open (single-category keys deferred by the ≥2-categories rule):** burns TBSA% (wants a numeric input type — future framework extension); cleft repair technique (millard/furlow/von langenbeck); nerve repair type (direct/graft/transfer).

Question sortOrder: laterality 0, region 1, urgency 2, reconstructionMethod 3, intraopEvents 9.

### 2C — Option sets (31 options, EN + AR)

`laterality` (4): right أيمن · left أيسر · bilateral ثنائي الجانب · midline خط الوسط

`region` (15): face الوجه · scalp فروة الرأس · neck الرقبة · trunk الجذع · breast الثدي · axilla الإبط · upper limb الطرف العلوي · hand اليد · lower limb الطرف السفلي · foot القدم · sacrum العجز · ischium الحدبة الإسكية · trochanter مدور الفخذ · heel الكعب · perineum العجان

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`reconstructionMethod` (9): primary closure إغلاق أولي · healing by secondary intention التئام ثانوي · split-thickness skin graft رقعة جلدية جزئية السماكة · full-thickness skin graft رقعة جلدية كاملة السماكة · local flap شريحة موضعية · regional / pedicled flap شريحة إقليمية / معنَّقة · free flap (microvascular) شريحة حرة (مفاغرة وعائية دقيقة) · tissue expansion توسيع الأنسجة · other أخرى

### 2D — Link matrix (36 links) + narrowing (87 rows)

| category | lat | region | urg | recon | ie | n |
|---|---|---|---|---|---|---|
| aesthetic surgery | | | | | ✓ | 1 |
| breast reconstruction | ✓ | | | ✓ | ✓ | 3 |
| burn injuries | | | ✓ | ✓ | ✓ | 3 |
| cleft lip & palate | ✓ | | | | ✓ | 2 |
| congenital anomalies | ✓ | | | ✓ | ✓ | 3 |
| contractures | ✓ | ✓ | | ✓ | ✓ | 4 |
| hand trauma | ✓ | | ✓ | ✓ | ✓ | 4 |
| nerve injuries | ✓ | | ✓ | | ✓ | 3 |
| pressure ulcers | | ✓ | | ✓ | ✓ | 3 |
| scar revision | | ✓ | | ✓ | ✓ | 3 |
| traumatic lacerations & avulsions | | ✓ | ✓ | ✓ | ✓ | 4 |
| tumor reconstruction | | ✓ | | ✓ | ✓ | 3 |

**aesthetic surgery = intraopEvents only, justified**: elective by definition, and the operation itself (rhinoplasty, abdominoplasty…) is fully captured by proc_cpts — no additional axis discriminates.
**cleft lip & palate**: lip-vs-palate is in the diagnosis; laterality (left/right/bilateral/midline) is the real per-case variable; repair technique deferred (still-open).

Per-question: laterality 6 · region 5 · urgency 4 · reconstructionMethod 9 · intraopEvents 12 → **Σ 36**.

`region` narrowing (35): contractures → neck, axilla, hand, upper limb, lower limb, face (6) · pressure ulcers → sacrum, ischium, trochanter, heel (4) · scar revision → face, scalp, neck, trunk, breast, upper limb, hand, lower limb (8) · traumatic lacerations → face, scalp, neck, trunk, upper limb, hand, lower limb, foot (8) · tumor reconstruction → face, scalp, neck, trunk, breast, upper limb, hand, lower limb, foot (9)

`reconstructionMethod` narrowing (43): breast recon → pedicled flap, free flap, tissue expansion, other (4) · burns → sTSG, FTSG, secondary intention, local flap, other (5) · congenital → primary closure, FTSG, local flap, sTSG, other (5) · contractures → local flap, sTSG, FTSG, pedicled flap, tissue expansion, other (6) · hand trauma → primary closure, local flap, pedicled flap, sTSG, FTSG, free flap, other (7) · pressure ulcers → local flap, pedicled flap, secondary intention, primary closure, other (5) · scar revision → primary closure, local flap, tissue expansion, FTSG, other (5) · traumatic lacerations → primary closure, sTSG, local flap, FTSG, pedicled flap, other (6) · **tumor reconstruction → un-narrowed** (the whole ladder legitimately applies)

`laterality` narrowing (9): breast recon → right, left, bilateral (3) · hand trauma → right, left, bilateral (3) · nerve injuries → right, left, bilateral (3) · cleft/congenital/contractures **un-narrowed** (midline is real there: cleft palate, neck contracture)

Σ narrowing = 35 + 43 + 9 = **87**.

### Expected totals after 166+167
questions **5** · options **31** · links **36** · narrowing **87** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000166 | AuthorPrsAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000167 | AddPrsQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- PRS: questions=5, options=31, links=36, narrowing=87, NULL arValue=0 — exact match with 2D.
- All 12 categories deliberately decided (aesthetic surgery = intraopEvents only, justified).
- down() tested: revert 167+166 → re-apply → identical counts. ORTHO/GS/CTS/NS untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: laterality (ORTHO, +midline option), region, urgency, intraopEvents; new PRS key `reconstructionMethod` (the reconstructive ladder) justified in 2B.
