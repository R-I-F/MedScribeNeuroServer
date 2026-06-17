# GS Department Audit
**Date**: 2026-06-17 (ICD-11 audit + coverage extension session)
**Migrations applied**: 052, 053, 054, 055, 056, 065, 066, 067, 068, 069
**Dept**: GS — General Surgery | الجراحة العامة

## Summary
| Metric | Count |
|---|---|
| Main_diags | 13 |
| Diagnoses (after extension) | **96** |
| Proc_cpts | **100** (99 GS-specific + MNR 00001-00 shared) |
| ICD-11 codes fixed (❌ wrong) | **22 + 1 swap** (MIG-065) |
| ICD-11 codes updated (⚠️ approximate) | 0 |
| CPT codes fixed (❌ wrong) | 0 |
| CPT codes updated (⚠️ partial) | 0 |
| Structural issues resolved | 0 |
| New diagnoses added | **61** (3 from MIG-052, 58 from MIG-066/067/068) |
| New proc_cpts added | **99** (64 from MIG-053, 35 from MIG-069) |
| Diagnoses with re-embedded vectors | 75 (25 earlier + 50 from MIG-066/067/068) |
| Proc_cpts with re-embedded vectors | 99 |

Also fixed in this session:
- **MIG-056**: NS main_diags were missing MNR 00001-00 link (MIG-041 bug used non-existent numCode 12001-00)

## ICD-11 Changes Applied (MIG-065, 2026-06-17)

Root cause: GS data was seeded with systematically wrong ICD-11 codes — likely from an incorrect ICD-10 to ICD-11 mapping. **22 out of 38 diagnoses** (58%) had wrong codes; 1 more had codes swapped. All fixed in MIG-065.

| # | Old code | New code | Old name | Notes |
|---|---|---|---|---|
| 1 | DB10.1 | **DB10.02** | appendicitis w/o abscess | .1 invalid; DB10.02 = without peritonitis |
| 2 | DB10.2 | **DB10.01** | appendicitis with abscess | .2 invalid; DB10.01 = with localised peritonitis |
| 3 | DB70.0 | **DB60.Z** | haemorrhoids | DB70 = anal abscess block; haemorrhoids = DB60 |
| 4 | DB71.0 | **DB50.0** | anal fissure | DB71 invalid; anal fissure = DB50.0 |
| 5 | DB72.0 | **DB70.01** | anorectal abscess | DB72 invalid; anorectal abscess = DB70.01 |
| 6 | LB90.0 | **EG63.1** | pilonidal cyst | LB = congenital anomalies; pilonidal = skin chapter EG |
| 7 | DB9A.0 | **DB30.1** | volvulus | DB9A invalid; volvulus large intestine = DB30.1 |
| 8 | DB96.0 | **DA91.2** | adhesion obstruction | DB96 invalid; intestinal adhesion obstruction = DA91.2 |
| 9 | DB96.1 | **DA93.0** | paralytic ileus | DB96 invalid; paralytic ileus = DA93.0 |
| 10 | GC51.1 | **GB21.0** | breast abscess | GC = obstetric chapter; breast = GB chapter |
| 11 | 2C61.1 | **2C61.0** | IDC of breast | .1 = lobular carcinoma; ductal = 2C61.0 |
| 12 | 5A00.0 | **5A01.1** | thyroid nodule | 5A00 invalid; nontoxic thyroid nodule = 5A01.1 |
| 13 | DC10.0 | **DC12.0Z** | acalculous cholecystitis | DC10 invalid; acute cholecystitis = DC12.0Z |
| 14 | DB31.0 | **DA60.Z** | gastric ulcer | DB31 invalid; gastric ulcer = DA60.Z |
| 15 | DB31.1 | **DA63.Z** | duodenal ulcer | DB31 invalid; duodenal ulcer = DA63.Z |
| 16 | DB97.0 | **DC50.Z** | peritonitis | DB97 invalid; peritonitis = DC50.Z |
| 17 | DD80.0 | **DD51** | inguinal hernia | DD80 invalid; inguinal hernia = DD51 |
| 18 | DD80.1 | **DD52** | femoral hernia | DD80 invalid; femoral hernia = DD52 |
| 19 | DD80.2 | **DD53** | umbilical hernia | DD80 invalid; umbilical hernia = DD53 |
| 20 | DD80.3 | **DD56** | incisional hernia | DD80 invalid; incisional hernia = DD56 |
| 21 | DC80.1 | **DC80.Z** | diverticulitis w/o complication | .1 invalid; use .Z (unspecified) |
| 22 | DB65.0 | **DA61** | perforated peptic ulcer | DB65 invalid; peptic ulcer unspecified = DA61 |
| 23 (swap) | 2D10.0 ↔ 2D10.1 | **swapped** | thyroid carcinomas | 2D10.0=follicular, 2D10.1=papillary (were reversed) |

✅ Correct codes confirmed (not changed): `DC31.Z`, `DC32`, `DC11.0`, `DC11.3`, `DC80.0`, `DC80.00`, `DC81.0`, `5A11`, `5B81.01`, `2B90`, `2E92.40`, `NB91.0`, `NB91.1`, `NB91.B`

## CPT Changes Applied
None — no prior proc_cpts existed for GS.

## Structural Fixes
None — no orphaned diagnoses, no empty main_diags at session start.

## New Diagnoses Added
| ICD-11 code | EN Name | AR Name | main_diag | Migration |
|---|---|---|---|---|
| DB31.1 | duodenal ulcer | قرحة الاثني عشر | peptic ulcer disease | 052 |
| 2D10.1 | follicular carcinoma of thyroid | سرطان الغدة الدرقية الجريبي | thyroid nodules | 052 |
| DC10.0 | acute acalculous cholecystitis | التهاب المرارة الحاد اللاحصوي | cholecystitis & cholelithiasis | 052 |

## New Proc_cpts Added
| alphaCode | numCode | Title | main_diags | Migration |
|---|---|---|---|---|
| ABDO | 49000-00 | Exploratory laparotomy | abdominal trauma, acute abdomen, bowel obstruction, diverticulitis, perforated viscus | 053 |
| ABDO | 44950-00 | Open appendectomy | acute abdomen, appendicitis | 053 |
| ABDO | 47600-00 | Open cholecystectomy | cholecystitis & cholelithiasis | 053 |
| ABDO | 43840-00 | Repair of perforated peptic ulcer (Graham patch) | acute abdomen, peptic ulcer disease, perforated viscus | 053 |
| ABDO | 44120-00 | Small bowel resection | bowel obstruction, perforated viscus | 053 |
| ABDO | 44005-00 | Open enterolysis | bowel obstruction | 053 |
| ABDO | 38100-00 | Open total splenectomy | abdominal trauma | 053 |
| ABDO | 44320-00 | Colostomy formation | bowel obstruction | 053 |
| ABDO | 44310-00 | Ileostomy formation | bowel obstruction | 053 |
| ABDO | 44620-00 | Closure of enterostomy | bowel obstruction | 053 |
| ABDO | 44800-00 | Meckel's diverticulectomy | bowel obstruction, acute abdomen | 053/055 |
| ABDO | 43830-00 | Open gastrostomy | peptic ulcer disease | 053 |
| ABDO | 49505-00 | Open inguinal hernia repair (initial) | hernias | 053 |
| ABDO | 49507-00 | Open inguinal hernia repair (recurrent) | hernias | 053 |
| ABDO | 49550-00 | Open femoral hernia repair | hernias | 053 |
| ABDO | 49560-00 | Open incisional hernia repair | hernias | 053 |
| ABDO | 49570-00 | Open epigastric/umbilical hernia repair | hernias | 053 |
| ABDO | 44900-00 | Drainage of appendiceal abscess | acute abdomen, appendicitis | 053 |
| LAPR | 47562-00 | Laparoscopic cholecystectomy | cholecystitis & cholelithiasis | 053 |
| LAPR | 47563-00 | Laparoscopic cholecystectomy with cholangiogram | cholecystitis & cholelithiasis | 053 |
| LAPR | 44970-00 | Laparoscopic appendectomy | acute abdomen, appendicitis | 053 |
| LAPR | 44202-00 | Laparoscopic enterolysis | bowel obstruction, diverticulitis | 053 |
| LAPR | 38120-00 | Laparoscopic splenectomy | abdominal trauma | 053 |
| LAPR | 43644-00 | Laparoscopic Roux-en-Y gastric bypass | bariatric conditions | 053 |
| LAPR | 43775-00 | Laparoscopic sleeve gastrectomy | bariatric conditions | 053 |
| LAPR | 43770-00 | Laparoscopic adjustable gastric band | bariatric conditions | 053 |
| LAPR | 49650-00 | Laparoscopic inguinal hernia repair (TEP/TAPP) | hernias | 053 |
| LAPR | 49652-00 | Laparoscopic umbilical/ventral hernia repair | hernias | 053 |
| LAPR | 49654-00 | Laparoscopic incisional hernia repair | hernias | 053 |
| LAPR | 43280-00 | Laparoscopic Nissen fundoplication | hernias (hiatal) | 053 |
| ENDO | 43235-00 | Diagnostic EGD | acute abdomen, peptic ulcer disease | 053 |
| ENDO | 43239-00 | EGD with biopsy | peptic ulcer disease | 053 |
| ENDO | 43255-00 | EGD with haemostasis | acute abdomen, peptic ulcer disease | 053 |
| ENDO | 43260-00 | ERCP | cholecystitis & cholelithiasis | 053 |
| ENDO | 45378-00 | Diagnostic colonoscopy | colorectal polyps & masses, diverticulitis | 053 |
| ENDO | 45380-00 | Colonoscopy with biopsy | colorectal polyps & masses | 053 |
| ENDO | 45385-00 | Colonoscopy with polypectomy | colorectal polyps & masses | 053 |
| ENDO | 45330-00 | Flexible sigmoidoscopy | colorectal polyps & masses, diverticulitis | 053/055 |
| COLO | 44140-00 | Partial colectomy (open) | colorectal polyps & masses, diverticulitis | 053 |
| COLO | 44143-00 | Hartmann's procedure | colorectal polyps & masses, diverticulitis, perforated viscus | 053 |
| COLO | 44145-00 | Low anterior resection (open) | colorectal polyps & masses | 053 |
| COLO | 45110-00 | Abdominoperineal resection (APR) | colorectal polyps & masses | 053 |
| COLO | 44204-00 | Laparoscopic partial colectomy | colorectal polyps & masses, diverticulitis | 053 |
| COLO | 44207-00 | Laparoscopic low anterior resection | colorectal polyps & masses | 053 |
| COLO | 45171-00 | Transanal excision of rectal tumour | colorectal polyps & masses | 053 |
| COLO | 46250-00 | Haemorrhoidectomy | acute abdomen | 053 |
| COLO | 46910-00 | Lateral internal sphincterotomy | acute abdomen | 053 |
| COLO | 46040-00 | Drainage of perianal/ischiorectal abscess | acute abdomen | 053 |
| COLO | 46060-00 | Fistulotomy | acute abdomen | 053 |
| COLO | 46020-00 | Seton placement for anal fistula | acute abdomen | 053/055 |
| COLO | 11770-00 | Excision of pilonidal cyst or sinus | acute abdomen | 053 |
| BREA | 19120-00 | Wide local excision of breast lesion | breast lumps & cancer | 053 |
| BREA | 19301-00 | Partial mastectomy (BCS) | breast lumps & cancer | 053 |
| BREA | 19303-00 | Simple total mastectomy | breast lumps & cancer | 053 |
| BREA | 19307-00 | Modified radical mastectomy | breast lumps & cancer | 053 |
| BREA | 19020-00 | Incision and drainage of breast abscess | breast lumps & cancer | 053 |
| BREA | 38525-00 | Axillary lymph node dissection | breast lumps & cancer | 053 |
| BREA | 38900-00 | Sentinel lymph node biopsy | breast lumps & cancer | 053 |
| THYR | 60100-00 | Thyroid FNA biopsy | thyroid nodules | 053 |
| THYR | 60210-00 | Partial thyroidectomy | thyroid nodules | 053 |
| THYR | 60220-00 | Total thyroid lobectomy (hemithyroidectomy) | thyroid nodules | 053 |
| THYR | 60240-00 | Total thyroidectomy | thyroid nodules | 053 |
| THYR | 60252-00 | Total thyroidectomy with central neck dissection | thyroid nodules | 053 |
| THYR | 60500-00 | Parathyroidectomy | thyroid nodules | 053 |

## New Diagnoses Added (MIG-066/067/068, 2026-06-17)

### Migration 066 — ExtendGsDiagnosesBatch1 (15 diagnoses)
| ICD-11 code | EN Name | AR Name | main_diag(s) | Migration |
|---|---|---|---|---|
| NB91.4Z | injury of pancreas | إصابة البنكرياس | abdominal trauma | 066 |
| NB91.7Z | injury of small intestine | إصابة الأمعاء الدقيقة | abdominal trauma | 066 |
| NB91.8Z | injury of colon | إصابة القولون | abdominal trauma | 066 |
| DD30.0 | acute mesenteric ischaemia | نقص تروية المساريق الحاد | acute abdomen | 066 |
| ME24.9Z | gastrointestinal bleeding, unspecified | نزيف الجهاز الهضمي | acute abdomen | 066 |
| ME24.A1 | haemorrhage of anus and rectum | نزيف الشرج والمستقيم | acute abdomen | 066 |
| DB50.1 | anal fistula | ناسور شرجي | acute abdomen | 066 |
| DB31.2 | rectal prolapse | استرخاء المستقيم | acute abdomen | 066 |
| DA91.0 | intussusception of small intestine | انغلاف الأمعاء الدقيقة | acute abdomen + bowel obstruction | 066 |
| DB61 | perianal venous thrombosis | تجلط وريدي حول الشرج | acute abdomen | 066 |
| LB15.0 | Meckel diverticulum | رتج ميكل | acute abdomen + bowel obstruction | 066 |
| DB10.00 | perforated appendicitis with generalised peritonitis | التهاب الزائدة المثقوب مع التهاب صفاق عام | appendicitis + perforated viscus | 066 |
| 5A44 | metabolic syndrome | متلازمة التمثيل الغذائي | bariatric conditions | 066 |
| DB92.0 | non-alcoholic fatty liver disease | مرض الكبد الدهني غير الكحولي | bariatric conditions | 066 |
| DB92.1 | non-alcoholic steatohepatitis | التهاب الكبد الدهني غير الكحولي | bariatric conditions | 066 |

### Migration 067 — ExtendGsDiagnosesBatch2 (17 diagnoses)
| ICD-11 code | EN Name | AR Name | main_diag(s) | Migration |
|---|---|---|---|---|
| DD51/ME24.2 | strangulated inguinal hernia | فتق إربي مختنق | bowel obstruction + hernias | 067 |
| DB30.Z | large bowel obstruction, unspecified | انسداد الأمعاء الغليظة | bowel obstruction | 067 |
| DB30.0 | intussusception of the large intestine | انغلاف الأمعاء الغليظة | bowel obstruction | 067 |
| 2F30.5 | fibroadenoma of breast | ورم ليفي غدي في الثدي | breast lumps & cancer | 067 |
| 2E65.2 | ductal carcinoma in situ of breast | سرطان القنوات في مكانه | breast lumps & cancer | 067 |
| 2C61.1 | invasive lobular carcinoma of breast | سرطان الفصيصات الغازي | breast lumps & cancer | 067 |
| 2E65.5 | Paget disease of the nipple | مرض باجيت للحلمة | breast lumps & cancer | 067 |
| GB20.0 | fibrocystic change of breast | تغيرات ليفية كيسية في الثدي | breast lumps & cancer | 067 |
| GB22 | gynaecomastia | تثدي رجالي | breast lumps & cancer | 067 |
| 2F30.3 | benign phyllodes tumour of breast | ورم أوراق حميد في الثدي | breast lumps & cancer | 067 |
| 2E65.0 | lobular carcinoma in situ of breast | سرطان الفصيصات في مكانه | breast lumps & cancer | 067 |
| 2B92.0 | rectal adenocarcinoma | سرطان الغدد في المستقيم | colorectal polyps & masses | 067 |
| 2C00.3 | squamous cell carcinoma of anus | سرطان الخلايا الحرشفية في الشرج | colorectal polyps & masses | 067 |
| 2B5B.Z | gastrointestinal stromal tumour | ورم السدى الهضمي | colorectal polyps & masses | 067 |
| 2B90.Y | Lynch syndrome | متلازمة لينش | colorectal polyps & masses | 067 |
| 2B91.Z | malignant neoplasm of rectosigmoid junction | ورم خبيث في الوصل السيني المستقيمي | colorectal polyps & masses | 067 |
| 2C12.02 | hepatocellular carcinoma | سرطان الكبد الخلوي | colorectal polyps & masses | 067 |

### Migration 068 — ExtendGsDiagnosesBatch3 (26 diagnoses)
| ICD-11 code | EN Name | AR Name | main_diag(s) | Migration |
|---|---|---|---|---|
| DC11.6 | choledocholithiasis | حصى القناة الصفراوية | cholecystitis & cholelithiasis | 068 |
| DC13 | cholangitis | التهاب الأقنية الصفراوية | cholecystitis & cholelithiasis | 068 |
| DC30.1 | pancreatic pseudocyst | كيس بنكرياسي كاذب | cholecystitis & cholelithiasis | 068 |
| DC10.3 | gallbladder polyp | سليلة المرارة | cholecystitis & cholelithiasis | 068 |
| DC12.1 | chronic cholecystitis | التهاب المرارة المزمن | cholecystitis & cholelithiasis | 068 |
| DC11.1 | cholelithiasis with chronic cholecystitis | حصى المرارة مع التهاب مزمن | cholecystitis & cholelithiasis | 068 |
| DB90.0 | hepatic abscess | خراج الكبد | cholecystitis & cholelithiasis + acute abdomen | 068 |
| 1F73.0 | hydatid cyst of liver | كيس أكياس الكبد المائية | cholecystitis & cholelithiasis + acute abdomen | 068 |
| 2C10.0 | pancreatic adenocarcinoma | سرطان البنكرياس الغدي | cholecystitis & cholelithiasis | 068 |
| DA22.Z | gastro-oesophageal reflux disease | مرض الارتجاع المعدي المريئي | peptic ulcer disease | 068 |
| 2B72.Z | malignant neoplasm of stomach | ورم خبيث في المعدة | peptic ulcer disease | 068 |
| DA42.1 | Helicobacter pylori gastritis | التهاب المعدة بالحلزونية البوابية | peptic ulcer disease | 068 |
| DA40.0 | gastric outlet obstruction | انسداد مخرج المعدة | peptic ulcer disease | 068 |
| DA26.0Z | oesophageal varices | دوالي المريء | peptic ulcer disease | 068 |
| 2B70.Z | malignant neoplasm of oesophagus | ورم خبيث في المريء | peptic ulcer disease | 068 |
| DD55 | epigastric hernia | فتق شرسوفي | hernias | 068 |
| DD50.0 | hiatal hernia | فتق حجابي | hernias + peptic ulcer disease | 068 |
| DD52/ME24.2 | strangulated femoral hernia | فتق فخذي مختنق | hernias + bowel obstruction | 068 |
| DD53/ME24.2 | strangulated umbilical hernia | فتق سري مختنق | hernias + bowel obstruction | 068 |
| 5A02.0 | Graves disease | مرض جريفز | thyroid nodules | 068 |
| 5A01.2 | nontoxic multinodular goitre | تضخم الغدة الدرقية العقيدي غير السام | thyroid nodules | 068 |
| 5A03.20 | Hashimoto thyroiditis | التهاب الغدة الدرقية هاشيموتو | thyroid nodules | 068 |
| 2D10.4 | medullary carcinoma of thyroid | سرطان الغدة الدرقية النخاعي | thyroid nodules | 068 |
| 2D10.3 | anaplastic carcinoma of thyroid | سرطان الغدة الدرقية اللاتمايزي | thyroid nodules | 068 |
| 5A51.0 | primary hyperparathyroidism | فرط نشاط الغدة جارة الدرقية الأولي | thyroid nodules | 068 |
| 5A02.2 | thyrotoxicosis with toxic multinodular goitre | التسمم الدرقي مع تضخم الغدة العقيدي السام | thyroid nodules | 068 |

## Still-Open Items

### ICD-11 audit status
✅ **All 38 original diagnoses verified.** All 58 new diagnoses added with ICD-11 codes verified via WHO API.

### Coverage gaps (diagnoses still to add — target ≥100)
Currently 96 diagnoses; need +4 to reach 100. Minor remaining gaps:

**hernias**: Spigelian hernia (rare; low clinical priority)

**appendicitis**: chronic/recurrent appendicitis

**diverticulitis**: diverticular fistula (no clean standalone ICD-11 code found)

**colorectal**: carcinoid/NET of colon (NEC coding complexity)

✅ **Proc_cpts at 100** (MIG-069, 2026-06-17): 35 new procedures added across BILI, PANC, OESO, GASTR, ENDO, LAPR, COLO, NECK, BREA, THYR, ABDO alpha-code groups. All 35 embeddings backfilled.
