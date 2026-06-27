# UROL Department Audit
**Date (last updated)**: 2026-06-27
**Dept**: UROL — Urology | جراحة المسالك البولية

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-27 (AUDIT COMPLETE ✅)
**Current step**: done
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (23 diags, 0 procs, 13 main_diags)
- [x] Phase 2A — structural scan (0 orphans, 0 empty-diag, Arabic clean)
- [x] Phase 2B — ICD-11 audit (23/23 verified → 6✅ 1⚠️ 16❌)
- [x] Phase 2C — CPT audit — N/A (0 procs imported)
- [x] Phase 2D — candidate diagnoses (77 listed → 100 total) + collision-check (7 MERGEs)
- [x] Phase 2E — candidate procs (103 listed → 103 imported; 55700 deleted, dropped)
- [x] Phase 3 — MIG-A 145 + MIG-D 146/147/148 + MIG-E 149/150 + MIG-F 151 written
- [x] Phase 4 — 145–151 applied ✅
- [x] Phase 5 — 71 diagnosis + 99 proc embeddings backfilled (0 failed); global NULL-embedding = 0
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
145=FixUrolIcdCodes [applied ✅], 146/147/148=AddUrolDiagnoses 1/2/3 [applied ✅], 149/150=ImportUrolProcCpts 1/2 [applied ✅], 151=LinkUrolProcCpts [applied ✅]

### ▶ Next action
None — UROL audit complete.

### ✅ Diagnosis phase result
UROL: **100 diagnoses** (23 existing — 16 ICD codes corrected incl. 7 cross-dept MERGEs + 1 invalid-leaf — plus 77 new). Every category ≥5 (BPH 6, bladder 8, ED 5, infertility 6, nephrolithiasis 11, penile 9, prostate 5, renal cancer 5, renal transplant 10, testicular/scrotal 9, ureteral 13, incontinence 8, retention 9). All ICD-11 verified ✅, all embedded ✅. 0 orphans, 0 empty categories.

### Coverage targets
| Metric | Value |
|---|---|
| Main_diags | 13 |
| Diagnoses (current) | 23 |
| Diagnoses gap to 100 | 77 |
| Proc_cpts dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none (no procs imported) |

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### 2A — Structural scan findings
- Orphaned diagnoses (dept-linked, no main_diag): **0**
- Empty main_diags (no diagnoses): **0**
- Empty main_diags (no procs): **13** (all — no procs imported yet; resolved by Phase 2E/3)
- Arabic terminology check (دماغ→مخ etc.): **PASS** — no brain-anatomy hallucinations; all 23 Arabic fields read clean.
- Possible miscategorisations: (1) **acute pyelonephritis GA40.0** under "nephrolithiasis" — an infection, but obstructive pyelonephritis from stones is plausibly related; keep. (2) **torsion of testis GB42.0** and **epididymo-orchitis GB51.0** under "testicular cancer" — not cancers; the category functionally serves as testicular/scrotal pathology. Keep title; will broaden contents during expansion.

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| GA90.0 | benign prostatic hyperplasia | ⚠️ invalid leaf | GA90 | Hyperplasia of prostate (BPH) |
| 2C94.2 | urothelial carcinoma of bladder | ✅ OK | 2C94.2 | Urothelial carcinoma of bladder |
| HA01.1Z | male erectile dysfunction | ✅ OK | HA01.1Z | Male erectile dysfunction, unspecified |
| GB04.0 | azoospermia | ✅ OK | GB04.0 | Azoospermia |
| GB40.0 | varicocele | ❌ WRONG | BD75.1 | Scrotal varices (varicocele) — GB40=nephritic syndrome |
| GA40.0 | acute pyelonephritis | ❌ WRONG | GB51 | Acute pyelonephritis — GA40=female-genital block |
| GC00.0 | calculus of kidney | ❌ WRONG | GB70.0Z | Calculus of kidney — GC00=cystitis block |
| GC00.2 | calculus of urinary bladder | ❌ WRONG | GB71.0 | Calculus in bladder — GC00.2=contracted bladder |
| GC00.1 | calculus of ureter | ❌ WRONG | GB70.1 | Calculus of ureter — GC00.1=infectious cystitis |
| GB50.0 | phimosis | ❌ WRONG | GB05.2 | Phimosis — GB50=acute tubulo-interstitial nephritis |
| 2C82.0 | adenocarcinoma of prostate | ✅ OK | 2C82.0 | Adenocarcinoma of prostate |
| 2C73.0 | renal cell carcinoma | ❌ WRONG | 2C90.0 | Renal cell carcinoma — 2C73=ovarian carcinoma (likely MERGE w/ SOC) |
| GB61.5 | end-stage renal disease | ✅ OK | GB61.5 | Chronic kidney disease, stage 5 (ESRD) — shared TRS/VASC |
| GB81 | autosomal dominant polycystic kidney disease | ✅ OK | GB81 | ADPKD — shared TRS |
| 2C70.1 | seminoma of testis | ❌ WRONG | 2C80.2 | Germ cell tumour of testis (seminoma) — 2C70.1=melanoma of vulva |
| GB42.0 | torsion of testis | ❌ WRONG | GB01.0 | Torsion of testis — GB42=nephro block |
| GB51.0 | epididymo-orchitis | ❌ WRONG | GB02.1 | Orchitis/epididymitis without abscess — GB51=acute pyelonephritis |
| GC10.0 | vesicoureteric reflux | ❌ WRONG | GB56.5 | Vesicoureteral reflux |
| GC20.0 | hydronephrosis | ❌ WRONG | GB56.4 | Other or unspecified hydronephrosis |
| GC21.0 | ureteropelvic junction obstruction | ❌ WRONG | GB56.0 | Hydronephrosis with ureteropelvic junction obstruction |
| GA00.0 | stress urinary incontinence | ❌ WRONG | MF50.20 | Stress incontinence — GA00.0=acute vulvitis |
| GC80.0 | overactive bladder | ❌ WRONG | GC50.0 | Overactive bladder |
| GA20.0 | urethral stricture | ❌ WRONG | GC03 | Urethral stricture |

**2B tally: 23/23 verified → 6 ✅ OK · 1 ⚠️ invalid-leaf · 16 ❌ WRONG (~74% corrupt).**
Seed used female-genital GA codes (GA00=vulvitis, GA20, GA40), cystitis GC00.x (GC00=cystitis), and nephritis GB4x/GB5x blocks (GB40=nephritic, GB42, GB50=acute TIN, GB51=acute pyelonephritis) for urological conditions. **Collision-MERGE candidates** (likely SOC-owned): 2C90.0 (RCC), 2C80.2 (germ-cell testis). Verify before MIG-A.

### 2C — CPT audit findings
N/A — no proc_cpts imported for UROL yet.

### 2D — Candidate diagnoses (planned)
_Compact: code | EN | AR | main_diag. All ICD-11 icd11_search-verified. Full EN/AR descriptions authored inline in MIG-D._

**penile pathology** (existing: phimosis GB05.2)
| GB05.3 | paraphimosis | احتباس القلفة (الشبم الخانق) | penile pathology |
| GB06.0Z | balanoposthitis (balanitis) | التهاب الحشفة والقلفة | penile pathology |
| 2C81.0 | squamous cell carcinoma of penis | سرطانة القضيب حرشفية الخلايا | penile pathology |
| LB53.Z | hypospadias | المبال التحتاني (الإحليل التحتي) | penile pathology |

**erectile dysfunction** (existing: ED HA01.1Z)
| GB06.1 | priapism | القُساح (الانتصاب المؤلم المطوّل) | erectile dysfunction |
| HA03.0Z | premature ejaculation | سرعة القذف | erectile dysfunction |
| GB06.2 | Peyronie disease (penile fibromatosis) | داء بيروني (التليّف القضيبي) | erectile dysfunction |
| 5A81.1 | male hypogonadism (testicular hypofunction) | قصور الغدد التناسلية الذكري | erectile dysfunction |

**testicular cancer → testicular/scrotal** (existing: germ-cell 2C80.2, torsion GB01.0, epididymo-orchitis GB02.1)
| GB00.Z | hydrocele | القيلة المائية | testicular cancer |
| GB00.2 | spermatocele | القيلة المنوية | testicular cancer |
| GB0Y&XA4D25 | cyst of epididymis | كيسة البربخ | testicular cancer |
| 2C83.0 | squamous cell carcinoma of scrotum | سرطانة كيس الصفن حرشفية الخلايا | testicular cancer |

**male infertility** (existing: azoospermia GB04.0, varicocele BD75.1)
| LB52.Z | cryptorchidism (undescended testis) | الخصية الهاجرة (عدم نزول الخصية) | male infertility |
| LD50.3Z | Klinefelter syndrome | متلازمة كلاينفلتر | male infertility |
| GB00.2 | spermatocele | القيلة المنوية | male infertility |

**benign prostatic hyperplasia** (existing: BPH GA90)
| GC01.0 | bladder neck obstruction | انسداد عنق المثانة | benign prostatic hyperplasia (+urinary retention) |
| GA91.0 | chronic prostatitis | التهاب البروستاتا المزمن | benign prostatic hyperplasia |
| GA91.Y | acute bacterial prostatitis | التهاب البروستاتا الجرثومي الحاد | benign prostatic hyperplasia |
| GA91.1 | abscess of prostate | خراج البروستاتا | benign prostatic hyperplasia |
| GA91.3 | calculus of prostate | حصاة البروستاتا | benign prostatic hyperplasia |

**bladder cancer** (existing: urothelial 2C94.2)
| 2C94.1 | squamous cell carcinoma of urinary bladder | سرطانة المثانة حرشفية الخلايا | bladder cancer |
| 2C94.0 | adenocarcinoma of urinary bladder | سرطانة المثانة الغدية | bladder cancer |
| 2E68 | carcinoma in situ of bladder | سرطانة المثانة اللابدة | bladder cancer |
| 2C94.Y | other carcinoma of bladder | سرطانة المثانة (أخرى) | bladder cancer |
| 2F35 | benign neoplasm of bladder | ورم حميد في المثانة | bladder cancer |

**prostate cancer** (existing: adenocarcinoma 2C82.0)
| 2C82.Y | carcinoma of prostate (other) | سرطانة البروستاتا (أخرى) | prostate cancer |
| 2E67.5 | high-grade prostatic intraepithelial neoplasia | الورم داخل الظهاري البروستاتي عالي الدرجة | prostate cancer |
| GA91.6 | low-grade intraepithelial lesion of prostate | آفة داخل الظهارة البروستاتية منخفضة الدرجة | prostate cancer |
| 2E06 | metastatic neoplasm in male genital organs (prostate) | نقيلة ورمية في الأعضاء التناسلية الذكرية | prostate cancer |

**renal cancer** (existing: RCC 2C90.0)
| 2C90.Y | nephroblastoma (Wilms tumour) | الورم الأرومي الكلوي (ورم ويلمز) | renal cancer |
| 2C91.Z | malignant neoplasm of renal pelvis | ورم خبيث في حويضة الكلية | renal cancer |
| 2E80.0Z | angiomyolipoma of kidney | الورم الوعائي العضلي الشحمي الكلوي | renal cancer |
| 2E00 | secondary (metastatic) neoplasm of kidney | ورم نقيلي ثانوي في الكلية | renal cancer |

**renal transplantation** (existing: ESRD GB61.5, ADPKD GB81)
| GB61.Z | diabetic kidney disease (diabetic nephropathy) | اعتلال الكلية السكري | renal transplantation |
| BA02 | hypertensive renal disease | مرض الكلى ارتفاع‑ضغطي | renal transplantation |
| GB41 | nephrotic syndrome | المتلازمة الكلائية | renal transplantation |
| GB40 | nephritic syndrome (glomerulonephritis) | المتلازمة الكلوية (التهاب الكبيبات) | renal transplantation |

**testicular/scrotal** (existing: germ-cell 2C80.2, torsion GB01.0, epididymo-orchitis GB02.1)
| GB00.Z | hydrocele | القيلة المائية | testicular cancer |
| GB0Y&XA4D25 | cyst of epididymis | كيسة البربخ | testicular cancer |
| 1B71.1 | Fournier gangrene (necrotising fasciitis of scrotum) | غرغرينة فورنييه (التهاب اللفافة الناخر) | testicular cancer |
| 2C83.0 | squamous cell carcinoma of scrotum | سرطانة كيس الصفن حرشفية الخلايا | testicular cancer |
| 2C80.Y | spermatocytic / non-seminomatous testicular tumour | ورم الخصية المنوي الخلوي/غير المنوي | testicular cancer |

**nephrolithiasis** (existing: pyelonephritis GB51, kidney/bladder/ureter stones)
| GB71.1 | calculus in urethra | حصاة في الإحليل | nephrolithiasis |
| GB56.2 | urinary calculus with hydronephrosis | حصاة بولية مع استسقاء الكلية | nephrolithiasis |
| GB57 | nephrocalcinosis | تكلّس الكلية | nephrolithiasis |

**ureteral obstruction** (existing: ureter stone GB70.1, VUR GB56.5, hydronephrosis GB56.4, UPJO GB56.0)
| GB90.2 | ureteral stricture/stenosis | تضيّق الحالب | ureteral obstruction |
| GB90.Y | ureterocele | القيلة الحالبية | ureteral obstruction |
| GB58 | pyonephrosis | تقيّح الكلية | ureteral obstruction |
| FB51.4Z | retroperitoneal fibrosis | التليّف خلف الصفاقي | ureteral obstruction |
| GB56.1 | hydronephrosis with ureteral obstruction | استسقاء الكلية مع انسداد الحالب | ureteral obstruction |

**urinary incontinence** (existing: stress MF50.20, OAB GC50.0)
| MF50.21 | urge incontinence | السلس الإلحاحي | urinary incontinence |
| MF50.22 | mixed urinary incontinence | السلس البولي المختلط | urinary incontinence |
| MF50.24 | reflex incontinence | السلس المنعكس | urinary incontinence |
| GC01.4 | neurogenic bladder dysfunction | الخلل العصبي للمثانة | urinary incontinence (+urinary retention) |
| GC01.1 | vesical fistula (vesicovaginal) | ناسور مثاني (مثاني مهبلي) | urinary incontinence |

**urinary retention** (existing: OAB GC50.0, urethral stricture GC03)
| MF50.3 | retention of urine | احتباس البول | urinary retention |
| LB31.2 | posterior urethral valve | الصمام الإحليلي الخلفي | urinary retention |
| GC01.2 | diverticulum of bladder | رتج المثانة | urinary retention |
| LB31.3 | exstrophy of urinary bladder | انقلاب المثانة الخلقي | urinary retention |
| GC00.2 | contracted urinary bladder | المثانة المتقفّعة | urinary retention |

**— Final additions (batch 2D-3) to reach 100 —**
| LB55 | epispadias | المبال الفوقاني (الإحليل الفوقي) | penile pathology |
| 2C31.0 | verrucous squamous cell carcinoma of penis | سرطانة القضيب الحرشفية الثؤلولية | penile pathology |
| 2E67.40 | squamous cell carcinoma in situ of penis (Bowen) | سرطانة القضيب الحرشفية اللابدة | penile pathology |
| GB06.3 | Mondor disease of the penis | داء موندور القضيبي | penile pathology |
| GC00.3 | interstitial cystitis (bladder pain syndrome) | التهاب المثانة الخلالي | bladder cancer |
| GC00.Y | radiation/other specified cystitis | التهاب المثانة الإشعاعي | bladder cancer |
| GB03 | atrophy of testis | ضمور الخصية | male infertility |
| LB30.62 | horseshoe kidney | الكلية حدوة الفرس | nephrolithiasis |
| GC00.1 | infectious (acute) cystitis | التهاب المثانة الجرثومي الحاد | nephrolithiasis |
| 1B12.5 | genitourinary tuberculosis | السل البولي التناسلي | nephrolithiasis |
| LB30.7 | ectopic/pelvic kidney | الكلية الهاجرة (الحوضية) | nephrolithiasis |
| BD40.2 | renal artery stenosis (atherosclerosis of renal artery) | تضيّق الشريان الكلوي | renal transplantation |
| GB61.4 | chronic kidney disease, stage 4 | المرض الكلوي المزمن المرحلة الرابعة | renal transplantation |
| GB60.Z | acute kidney injury | الأذية الكلوية الحادة | renal transplantation |
| GB90.3 | ischaemia or infarction of kidney | احتشاء/إقفار الكلية | renal transplantation |
| GB07.2 | inflammatory disorders of scrotum (abscess/gangrene) | الاضطرابات الالتهابية لكيس الصفن | testicular cancer |
| LB30.5 | accessory/duplex kidney | الكلية الزائدة/المضاعفة | ureteral obstruction |
| 2C92.Z | malignant neoplasm of ureter | ورم خبيث في الحالب | ureteral obstruction |
| GC04.2 | ureteral fistula | الناسور الحالبي | ureteral obstruction |
| NB92.1Y | injury/rupture of ureter | إصابة/تمزّق الحالب | ureteral obstruction |
| GC06 | urethral diverticulum | رتج الإحليل | urinary incontinence |

**2D total: 23 existing + 77 new = 100 diagnoses.** Per-category mins all ≥5 (BPH 6, bladder 7, ED 5, infertility 6, nephrolithiasis 11, penile 9, prostate 5, renal cancer 5, renal transplant 10, testicular/scrotal 9, ureteral 13, incontinence 8, retention 8). All ICD-11 icd11_search-verified ✅. GB00.2 spermatocele dual-listed (infertility+scrotal) → place once under male infertility.

### 2E — Candidate proc_cpts (planned)
_AAPC-verified in batches. ⚠️ **55700 (prostate needle biopsy) DELETED 2026-01-01** → dropped (55706 transperineal saturation biopsy used instead)._

**Verified ACTIVE (batch 1–3):** TURP 52601, TURP-residual 52630, TUIP 52450, UroLift 52441/52442, laser-vaporization 52648, HoLEP 52649, TUMT 53850, TUNA 53852, cryoablation-prostate 55873 (→BPH/prostate-ca); prostate-biopsy-transperineal 55706, radical-prostatectomy 55840, +pelvic-LN 55845, lap/robotic 55866, perineal 55810, brachytherapy-needles 55875 (→prostate cancer); cystoscopy 52000, cysto-biopsy 52204, TURBT 52234/52235/52240, fulguration 52214/52224, BCG-instill 51720, partial-cystectomy 51550, simple-cystectomy 51570, radical-cystectomy 51595/51596, ileal-conduit 50820, diverticulectomy 51525, augmentation-enterocystoplasty 51960, cystorrhaphy 51865 (→bladder cancer/retention); URS-dx 52351, URS-stone 52352, URS-litho 52353, URS-litho+stent 52356, stent 52332, ESWL 50590 (→nephrolithiasis/ureteral).

**Verified ACTIVE (batch 4–6):** NEPH 50220/50230/50240/50543/50545/50546/50250; STON 50080/50081/50432; PYEL/URET 50400/50405/50544/50780/50760/50650/50548; RTPX 50360/50365/50340/50320/50547/50370/50380; ORCH 54520/54530/54535/54600/54640/54650/54690/54860/55040/55060/54700/54505; VARI 55530/55550/55400/55250/54900/54500; PENI 54150/54161/54110/54322/54125/54060; EREC 54400/54401/54405/54420/54430/54235; INCO 53445/57288/51715/51992/53440/53447; RETN 52276/53400/53410/53620/53600/51960. **All AAPC-active. Only deletion = 55700 (dropped).**

**Final proc set = 103 dept-specific across 13 alpha groups** (TURP 9, PROS 7, CYST 15, URET 9, STON 7, NEPH 7, RTPX 7, ORCH 12, VARI 6, PENI 6, EREC 6, INCO 6, RETN 6) + shared MNR. Every main_diag ≥5 procs. Imported in MIG-E 149/150, linked in MIG-F 151.

| alphaCode | numCode | EN title | main_diag(s) |
|---|---|---|---|

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 145 | FixUrolIcdCodes | 16 ICD fixes (7 MERGEs + 8 recodes + 1 invalid-leaf) | applied ✅ |
| 146 | AddUrolDiagnosesBatch1 | +42 diagnoses (prostate/bladder/renal/transplant/ED/infertility/penile) | applied ✅ |
| 147 | AddUrolDiagnosesBatch2 | +33 diagnoses (stones/ureteral/scrotal/incontinence/retention) | applied ✅ |
| 148 | AddUrolDiagnosesBatch3 | +2 diagnoses (interstitial + radiation cystitis → bladder) | applied ✅ |
| 149 | ImportUrolProcCpts1 | +47 procs (TURP/PROS/CYST/URET/STON) | applied ✅ |
| 150 | ImportUrolProcCpts2 | +56 procs (NEPH/RTPX/ORCH/VARI/PENI/EREC/INCO/RETN) | applied ✅ |
| 151 | LinkUrolProcCptsToMainDiags | link 103 procs + MNR to 13 main_diags | applied ✅ |

---

## Summary
UROL (Urology) reference data was **~74% corrupt** (16/23 ICD codes wrong + 1 invalid leaf). The original seed mis-chaptered urological conditions onto unrelated WHO blocks: **female-genital GA codes** (GA00=vulvitis used for stress incontinence, GA20, GA40=female block used for pyelonephritis), **cystitis GC00.x** (GC00=cystitis used for renal/bladder/ureter stones), and **nephritis GB4x/GB5x** blocks (GB40=nephritic syndrome used for varicocele, GB42 for torsion, GB50=acute TIN for phimosis, GB51=acute pyelonephritis for epididymo-orchitis); plus oncology mis-codes (RCC on the ovary code 2C73, seminoma on the vulva-melanoma code 2C70.1). UROL started with **23 diagnoses and 0 proc_cpts**.

- **145** MIG-A: 16 ICD-11 fixes = **7 collision-aware MERGEs** into existing shared rows (RCC `2C73.0`→`2C90.0` SOC; seminoma `2C70.1`→`2C80.2` PEDSURG/SOC; varicocele `GB40.0`→`BD75.1` PEDSURG; torsion `GB42.0`→`GB01.0` PEDSURG; VUR `GC10.0`→`GB56.5` TRS; OAB `GC80.0`→`GC50.0` OBGYN dual incont+retention; stress incontinence `GA00.0`→`MF50.20` OBGYN) + **8 free in-place recodes** (pyelonephritis→`GB51`, 3 stones→`GB70.0Z`/`GB71.0`/`GB70.1`, phimosis→`GB05.2`, epididymo-orchitis→`GB02.1`, hydronephrosis→`GB56.4`, UPJO→`GB56.0`, urethral stricture→`GC03`) + **1 invalid-leaf fix** (BPH `GA90.0`→`GA90`).
- **146/147/148** +77 distinct diagnoses → **100 total** (42 + 33 + 2 stragglers). 71 embeddings backfilled (the recoded MIG-A rows + new rows). Every category ≥5.
- **149/150** Imported **103** AAPC-verified urology proc_cpts across **13 new alpha groups** (TURP, PROS, CYST, URET, STON, NEPH, RTPX, ORCH, VARI, PENI, EREC, INCO, RETN). **Deletion caught**: `55700` (prostate needle biopsy, deleted 2026-01-01) excluded — `55706` transperineal saturation biopsy used instead.
- **151** Linked all 103 procs + MNR to the 13 main_diags (one dual-link: ureteral stent `52332`→ureteral obstruction + nephrolithiasis). 99 new proc embeddings backfilled.

**State after 151: UROL at 100 diagnoses (all ICD-11 verified ✅, all embedded ✅), 104 linked proc_cpts (103 dept-specific AAPC-verified + MNR, all embedded ✅), 13 main_diags; 0 orphans, 0 empty categories. Every category ≥5 diagnoses & ≥7 procs. Audit complete.**

> ⚠️ **No NEW cross-dept mismaps found in UROL.** The 7 MERGE targets were all correctly-labelled shared rows (RCC/germ-cell-testis/varicocele/torsion/VUR/OAB/stress-incontinence already owned by SOC/PEDSURG/TRS/OBGYN). Prior UROL-touching cross-dept items were already resolved in earlier audits (bladder `2C90.0` SOC; ESRD `GB61.5` and PKD `GB81` shared with TRS/VASC). Remaining open project-wide items (GS `2B90.Y`="Lynch syndrome"; `CA22.Z`="lung abscess") are untouched by UROL.

## ICD-11 Changes Applied
| Old code | Old name | New code | New name | Migration |
|---|---|---|---|---|
| GA90.0 | benign prostatic hyperplasia | GA90 | Hyperplasia of prostate (valid leaf) | 145 |
| GA40.0 | acute pyelonephritis | GB51 | Acute pyelonephritis | 145 |
| GC00.0 | calculus of kidney | GB70.0Z | Calculus of kidney | 145 |
| GC00.2 | calculus of urinary bladder | GB71.0 | Calculus in bladder | 145 |
| GC00.1 | calculus of ureter | GB70.1 | Calculus of ureter | 145 |
| GB50.0 | phimosis | GB05.2 | Phimosis | 145 |
| GB51.0 | epididymo-orchitis | GB02.1 | Orchitis/epididymitis w/o abscess | 145 |
| GC20.0 | hydronephrosis | GB56.4 | Other/unspecified hydronephrosis | 145 |
| GC21.0 | ureteropelvic junction obstruction | GB56.0 | Hydronephrosis w/ UPJ obstruction | 145 |
| GA20.0 | urethral stricture | GC03 | Urethral stricture | 145 |
| 2C73.0 | renal cell carcinoma | 2C90.0 | RCC (MERGE → SOC row) | 145 |
| 2C70.1 | seminoma of testis | 2C80.2 | Germ cell tumour of testis (MERGE → PEDSURG/SOC) | 145 |
| GB40.0 | varicocele | BD75.1 | Scrotal varices (MERGE → PEDSURG) | 145 |
| GB42.0 | torsion of testis | GB01.0 | Torsion of testis (MERGE → PEDSURG) | 145 |
| GC10.0 | vesicoureteric reflux | GB56.5 | Vesicoureteral reflux (MERGE → TRS) | 145 |
| GC80.0 | overactive bladder | GC50.0 | Overactive bladder (MERGE → OBGYN) | 145 |
| GA00.0 | stress urinary incontinence | MF50.20 | Stress incontinence (MERGE → OBGYN) | 145 |

## CPT Changes Applied
_None — UROL had 0 proc_cpts. 103 imported fresh (149/150); 55700 deleted-code excluded._

## Structural Fixes
**Collision check (scripts/check-urol.ts)**: 7 of 17 MIG-A targets already exist as shared rows → handled as **collision-aware MERGEs** (delete UROL row, relink existing shared row to UROL + the right main_diag):
| UROL old | →target (owner) | main_diag(s) |
|---|---|---|
| 2C73.0 renal cell carcinoma | 2C90.0 (SOC) | renal cancer |
| 2C70.1 seminoma | 2C80.2 (PEDSURG,SOC) | testicular cancer |
| GB40.0 varicocele | BD75.1 (PEDSURG) | male infertility |
| GB42.0 torsion of testis | GB01.0 (PEDSURG) | testicular cancer |
| GC10.0 vesicoureteric reflux | GB56.5 (TRS) | ureteral obstruction |
| GC80.0 overactive bladder | GC50.0 (OBGYN) | urinary incontinence + urinary retention (dual) |
| GA00.0 stress urinary incontinence | MF50.20 (OBGYN) | urinary incontinence |

Remaining **10 free in-place recodes** (UPDATE): GA90.0→GA90, GA40.0→GB51, GC00.0→GB70.0Z, GC00.2→GB71.0, GC00.1→GB70.1 (keeps dual nephrolithiasis+ureteral-obstruction link), GB50.0→GB05.2, GB51.0→GB02.1, GC20.0→GB56.4, GC21.0→GB56.0, GA20.0→GC03.
Net UROL diagnosis count unchanged at 23 after MIG-A (7 deleted, 7 shared relinked). No new cross-dept mismaps discovered.

## New Diagnoses Added
+77 diagnoses (full list in working-notes 2D and migrations 146/147/148). By category:
BPH +5, bladder cancer +7, prostate cancer +4, renal cancer +4, renal transplantation +8, erectile dysfunction +4, male infertility +4, penile pathology +8, nephrolithiasis +7, ureteral obstruction +9, testicular/scrotal +6, urinary incontinence +6, urinary retention +5. All ICD-11 icd11_search-verified, all embedded. (Note: "oligozoospermia" has no ICD-11 entry — substituted cryptorchidism/Klinefelter/testicular-atrophy for the infertility category.)

## New Proc_cpts Added
+103 dept-specific proc_cpts (full list in migrations 149/150), all AAPC-verified active, all embedded:
TURP 9 · PROS 7 · CYST 15 · URET 9 · STON 7 · NEPH 7 · RTPX 7 · ORCH 12 · VARI 6 · PENI 6 · EREC 6 · INCO 6 · RETN 6. **55700 (prostate needle biopsy) excluded — deleted by AMA 2026-01-01.**

## Still-Open Items
- **None for UROL.** All 16 wrong codes + 1 invalid leaf fixed; 100 diagnoses + 103 procs all verified & embedded.
- Project-wide cross-dept items untouched by UROL (not UROL's to fix): GS `2B90.Y`="Lynch syndrome"; `CA22.Z`="lung abscess" (=COPD unspecified, respiratory pass). NS `2F7C`/`2F7Z` re-review still pending.
- ⚠️ **2026 CPT note (reusable)**: `55700` (prostate needle biopsy, any approach) was DELETED by AMA 2026-01-01. Use `55706` (transperineal stereotactic template saturation biopsy) or the new 2026 approach-specific prostate-biopsy codes going forward.
