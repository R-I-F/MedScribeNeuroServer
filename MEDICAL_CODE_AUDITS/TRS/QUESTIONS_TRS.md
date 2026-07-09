# TRS Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 10 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (6 questions: donorType, approach, laterality, region, urgency, intraopEvents)
- [x] Phase 2C — option sets authored (21 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (25 links, 20 narrowing rows)
- [x] Phase 3 — migrations written (178 AuthorTrsAdditionalQuestions, 179 AddTrsQuestionNarrowing)
- [x] Phase 4 — applied + verified: **6 questions / 21 options / 25 links / 20 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 179+178 → re-apply → identical); all 10 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
178=AuthorTrsAdditionalQuestions [applied ✅ 2026-07-09], 179=AddTrsQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): rejectionType, complicationType, cold-ischaemia time — single-category / numeric keys deferred.

---

## 🔬 Working notes

### 2B — Question set (6 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `donorType` | single_choice | Donor type / نوع المتبرع | NEW TRS key — THE transplant question: living / deceased-DBD / deceased-DCD. The 6 recipient transplants; narrowed to deceased-only where living donation isn't practice (heart/lung/pancreas/multi-organ). Living-donor liver & kidney kept (the dominant Egyptian model). |
| `approach` | single_choice | Surgical approach / المدخل الجراحي | Canonical. Only the 2 donor operations, where the open-vs-lap-vs-robotic debate is real (recipient implants are standardised open). |
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused. Donor nephrectomy (left preferred — longer renal vein), renal transplant (iliac fossa side), lung transplant (single L/R vs bilateral). 3 categories. |
| `region` | single_choice | Organ / graft involved / العضو / الطُعم المعني | Canonical, relabelled. Only where the graft isn't pinned by the category: multi-organ transplant, transplant complications. 2 categories. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). immunologic rejection (urgent graftectomy vs medical) + transplant complications (emergency re-op). The transplants themselves are organ-availability-driven, captured by donorType. |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 10; sortOrder 9. |

Skipped (justified): `surgicalDomain` (abdominal/thoracic axis duplicates the categories), `position` (supine-dominant; thoracic implied by organ), `clinicalPresentation` (preOpClinCond exists), `graftType` (VASC key = vascular conduits, semantically wrong for whole-organ grafts).

**Still-open (single-category keys deferred by the ≥2 rule):** rejectionType (hyperacute / acute cellular / antibody-mediated / chronic — only immunologic rejection); complicationType (vascular thrombosis / biliary leak / urological / lymphocele — only transplant complications); cold-ischaemia time (wants a numeric inputType — future framework extension, like burns TBSA%).

Question sortOrder: donorType 0, approach 1, laterality 2, region 3, urgency 4, intraopEvents 9.

### 2C — Option sets (21 options, EN + AR)

`donorType` (4): living donor متبرع حي · deceased donor - brain death (dbd) متبرع متوفى - موت دماغي (DBD) · deceased donor - circulatory death (dcd) متبرع متوفى - موت دوري (DCD) · other أخرى

`approach` (5): open مفتوح · laparoscopic تنظير البطن · hand-assisted laparoscopic تنظيري بمساعدة اليد · robotic-assisted بمساعدة الروبوت · other أخرى

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`region` (6): liver graft طُعم الكبد · kidney graft طُعم الكلية · pancreas graft طُعم البنكرياس · heart graft طُعم القلب · lung graft طُعم الرئة · combined grafts طُعوم مشتركة

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

### 2D — Link matrix (25 links) + narrowing (20 rows)

| category | donor | appr | lat | region | urg | ie | n |
|---|---|---|---|---|---|---|---|
| donor hepatectomy | | ✓ | | | | ✓ | 2 |
| donor nephrectomy | | ✓ | ✓ | | | ✓ | 3 |
| heart transplant | ✓ | | | | | ✓ | 2 |
| immunologic rejection | | | | | ✓ | ✓ | 2 |
| liver transplant | ✓ | | | | | ✓ | 2 |
| lung transplant | ✓ | | ✓ | | | ✓ | 3 |
| multi-organ transplant | ✓ | | | ✓ | | ✓ | 3 |
| pancreas transplant | ✓ | | | | | ✓ | 2 |
| renal transplant | ✓ | | ✓ | | | ✓ | 3 |
| transplant complications | | | | ✓ | ✓ | ✓ | 3 |

**donor hepatectomy / donor nephrectomy = living-donor operations** — donorType is invariantly "living", so it's non-discriminating and omitted; the real axis is approach (± laterality for the kidney).

Per-question: donorType 6 · approach 2 · laterality 3 · region 2 · urgency 2 · intraopEvents 10 → **Σ 25**.

`donorType` narrowing (12): heart transplant → dbd, dcd, other (3) · lung transplant → dbd, dcd, other (3) · pancreas transplant → dbd, dcd, other (3) · multi-organ transplant → dbd, dcd, other (3). liver & renal transplant un-narrowed (living-donor common).

`approach` narrowing (4): donor hepatectomy → open, laparoscopic, robotic-assisted, other (no hand-assisted — a nephrectomy technique). donor nephrectomy un-narrowed (all 5 real).

`laterality` narrowing (4): donor nephrectomy → right, left (no bilateral — single kidney donated) · renal transplant → right, left (iliac fossa, no bilateral). lung transplant un-narrowed (single-L / single-R / bilateral).

`region` un-narrowed: a complication can involve any graft; a multi-organ transplant can combine any grafts. Σ narrowing = 12 + 4 + 4 = **20**.

### Expected totals after 178+179
questions **6** · options **21** · links **25** · narrowing **20** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000178 | AuthorTrsAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000179 | AddTrsQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- TRS: questions=6, options=21, links=25, narrowing=20, NULL arValue=0 — exact match with 2D.
- All 10 categories covered (≥2 questions each); donorType narrowed to deceased-only for heart/lung/pancreas/multi-organ; donor operations get approach (± laterality) not donorType (invariantly living).
- down() tested: revert 179+178 → re-apply → identical counts. All 10 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach/laterality/region/urgency/intraopEvents; new TRS key `donorType` justified in 2B.
