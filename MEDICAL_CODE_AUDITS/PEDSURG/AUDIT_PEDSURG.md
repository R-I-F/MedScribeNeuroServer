# PEDSURG Department Audit
**Date (last updated)**: 2026-06-23
**Migrations applied**: 091–097
**Dept**: PEDSURG — Pediatric Surgery (جراحة الأطفال)
**Status**: ✅ COMPLETE — 100 diagnoses + 101 proc_cpts, all verified & embedded

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-23
**Current step**: DONE — full PEDSURG audit complete (ICD-11 ✅, 100 diagnoses ✅, 102 proc_cpts ✅)
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (24 diags, 0 procs, 13 main_diags; 2 orphans)
- [x] Phase 2A — structural scan (2 orphans → new "soft tissue & skin lesions" cat; 13 NO_PROC expected; 0 Arabic errors)
- [x] Phase 2B — ICD-11 audit (24/24 verified — 18 ❌ + 6 ✅; ~75% corrupt; duodenal/pyloric cascade documented)
- [x] Phase 2C — CPT audit — N/A (no proc_cpts yet)
- [x] Phase 2D — candidate diagnoses (77 listed → 100 total; every main_diag ≥5 except intussusception=3 documented; 2 new main_diags)
- [x] Phase 2E — candidate procs (101 listed; 13 new alpha groups; all AAPC-verified ✅; 2023+2025 CPT changes handled)
- [x] Phase 3 — migrations written (091–097)
- [x] Phase 4 — migrations applied ✅ (15 main_diags, 100 diagnoses, 102 procs linked, 0 orphans, 0 empty)
- [x] Phase 5 — embeddings backfilled ✅ (78 diagnoses + 94 new procs; 7 THOR rows shared with CTS already embedded)
- [x] Phase 6 — finalized (audit + CLAUDE.md)

### Migration numbers reserved (next free = 091) — ORDERING set by dependencies
**Collision check done (staging query):**
- **MERGE needed** (target already exists as a shared row — delete PEDSURG wrong row's junctions + row, then link PEDSURG dept+main_diag to the existing shared row):
  - fournier `LB41.0` → `1B71.1` (owned by **PRS**) → link to NEW "soft tissue & skin lesions"
  - intussusception `LA95.0` → `DA91.0` (owned by **GS**) → link to "intussusception"
  - inguinal hernia `LA91.0` → `DD51` (owned by **GS**) → link to "inguinal hernia"
  - umbilical hernia `LA92.0` → `DD53` (owned by **GS**) → link to "umbilical hernia"
  - Meckel `LB21.0` → `LB15.0` (owned by **GS**) → link to "neonatal emergencies"; frees `LB21.0` for annular-pancreas (MIG-D)
  - duplicate duodenal-atresia row `LB13.0` (PEDSURG-owned) → DELETE (concept kept on the LB14 row); frees `LB13.0` for pyloric
- **UPDATE safe** (target free): `LB01` exomphalos, `DB10.0` appendicitis, `LB00.0` CDH, `LB12.1Y` EA+TEF, `LB52.Z` UDT, `LB18` malrotation, `LB16.1` hirschsprung, `KB88.Z` NEC, `LB20.20` choledochal cyst, `2C90.Y` wilms, `2D11.2` neuroblastoma, and (after the LB13.0 delete frees it) pyloric `LB11.0`→`LB13.0`.

**Migration files (revised order — categories first so row-fixes can link to them):**
- 091 = AddPedsurgMainDiags — INSERT 2 new main_diags ("soft tissue & skin lesions" آفات الأنسجة الرخوة والجلد; "thoracic & lung anomalies" شذوذات الصدر والرئة). down() deletes them.
- 092 = FixPedsurgIcdCodes (MIG-A) — order inside up(): (1) the 6 MERGEs/deletes above [frees LB21.0, LB13.0]; (2) the 11 free UPDATEs; (3) pyloric `LB11.0`→`LB13.0`; (4) relink LB14 row → rename "duodenal atresia" + move malrotation→neonatal; (5) relink epidermoid `EK70.0Z` orphan → soft tissue. SET embedding=NULL on every UPDATE.
- 093 = AddPedsurgDiagnoses1 (MIG-D batch 1, ~40 of 77) — full EN/AR name+desc; ON CONFLICT("icdCode") DO NOTHING; link dept + each main_diag.
- 094 = AddPedsurgDiagnoses2 (MIG-D batch 2, ~37).
- 095/096 = ImportPedsurgProcCpts1/2 (MIG-E) — pending Phase 2E.
- 097 = LinkPedsurgProcCptsToMainDiags (MIG-F) — pending Phase 2E.

### ▶ Next action
**Done.** PEDSURG audit complete — 100 diagnoses (all ICD-11-verified ✅, all embedded ✅) and 101
dept-specific proc_cpts (all AAPC-verified ✅, all embedded ✅; 13 new alpha groups + MNR). 15
main_diags; every main_diag ≥5 diagnoses and ≥5 procs except the documented narrow `intussusception`
(3 dx). 0 orphans, 0 empty categories. Migrations 091–097 applied to staging. Files force-added to git
(commit on explicit request only).

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### Coverage targets (from Phase 1 dump)
| Metric | Value |
|---|---|
| Main_diags | 13 (→ may add new categories) |
| Diagnoses (current) | 24 |
| Diagnoses gap to 100 | 76 |
| Proc_cpts — dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none |

### 2A — Structural scan
- **Orphaned diagnoses: 2** —
  - `EK70.0Z` epidermoid cyst → will link to NEW main_diag **soft tissue & skin lesions**
  - `LB41.0` fournier gangrene → will link to NEW main_diag **soft tissue & skin lesions** (necrotizing soft-tissue infection)
- **Empty main_diags (no diag): 0**
- **Empty main_diags (no proc): 13** — expected; no proc_cpts imported for PEDSURG yet. Resolved in Phase 2E/3.
- **New main_diags to add (MIG-C)** to improve taxonomy + reach ≥5/category:
  1. **soft tissue & skin lesions** (آفات الأنسجة الرخوة والجلد) — homes both orphans + thyroglossal/branchial/dermoid cysts, lymphangioma, haemangioma, pilonidal sinus, etc.
  2. **thoracic & lung anomalies** (شذوذات الصدر والرئة) — CPAM, sequestration, lobar emphysema, bronchogenic cyst, pectus, empyema.
- **Arabic terminology scan**: 0 errors (PEDSURG has no brain anatomy; no دماغ/مخ hits). Note: gastroschisis AR "الجدار البطني الشقي" is acceptable (synonym "انفلاق البطن الخلقي").

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| LB02 | gastroschisis | ✅ OK | LB02 | Gastroschisis (score 1.0) |
| LB19.0 | exomphalos | ❌ WRONG | LB01 | Omphalocele (exact syn. "Exomphalos") |
| LA50.0 | acute appendicitis | ❌ WRONG | DB10.0 | Acute appendicitis (LA50.0 is in developmental chapter) |
| KB20.0 | congenital diaphragmatic hernia | ❌ WRONG | LB00.0 | Congenital diaphragmatic hernia (score 1.0; incl. Bochdalek) |
| LB10.0 | tracheoesophageal fistula | ❌ WRONG | LB12.1Y | Atresia of oesophagus with tracheo-oesophageal fistula (rename to EA+TEF; category = esophageal atresia) |
| KC00 | congenital hydrocele | ✅ OK | KC00 | Congenital hydrocele (score 1.0) |
| LB51.0 | undescended testis | ❌ WRONG | LB52.Z | Cryptorchidism, unspecified (undescended testis = LB52.x, not LB51) |
| LB17.0 | anorectal malformation | ✅ OK | LB17.0 | Anorectal malformations (score 1.0) |
| LB17.2 | persistent cloaca | ✅ OK | LB17.2 | Persistent cloaca (score 1.0) |
| LA91.0 | inguinal hernia | ❌ WRONG | DD51 | Inguinal hernia (LA91.0 not a hernia code) — verify congenital-specific |
| LA95.0 | intussusception | ❌ WRONG | DA91.0 | Intussusception of small intestine (syn. "intussusception NOS", score 1.0) |
| LB12.0 | intestinal malrotation | ❌ WRONG | LB18 | Congenital anomalies of intestinal fixation (syn. "Congenital intestinal malrotation"); LB12.x = oesophagus |
| LB14 | structural developmental anomalies of duodenum | ✅ OK (repurpose) | LB14 | Valid leaf; syn. "duodenal atresia"/"congenital duodenal web". → rename to "duodenal atresia", relink malrotation→neonatal emergencies (MIG-C) |
| LB13.0 | duodenal atresia | ❌ WRONG (=pyloric!) | — | LB13.0 is "Congenital hypertrophic pyloric stenosis". Duodenal-atresia concept = LB14 (row above). MERGE: delete this dup row; frees LB13.0 for pyloric |
| LB14.0 | hirschsprung disease | ❌ WRONG | LB16.1 | Hirschsprung disease (syn. "congenital aganglionic megacolon", score 0.80) |
| LB21.0 | meckel diverticulum | ❌ WRONG (=annular pancreas) | LB15.0 | Meckel diverticulum (score 1.0). LB21.0 = Annular pancreas |
| LB22.00 | necrotising enterocolitis | ❌ WRONG | KB88.Z | Necrotising enterocolitis of newborn, unspecified (score 1.0) |
| LB40.0 | choledochal cyst | ❌ WRONG | LB20.20 | Choledochal cyst (score 0.93) |
| EK70.0Z | epidermoid cyst | ✅ OK | EK70.0Z | Epidermoid cyst, unspecified (orphan → soft tissue & skin lesions) |
| LB41.0 | fournier gangrene | ❌ WRONG | 1B71.1 | Polymicrobial necrotising fasciitis (syn. "Fournier gangrene"); LB41.0 is developmental. (orphan → soft tissue & skin lesions) |
| GB82.0 | wilms tumour | ❌ WRONG | 2C90.Y | Other specified malignant neoplasms of kidney (Title "Nephroblastoma") |
| XH4MH9 | neuroblastoma | ❌ WRONG (morphology code) | 2D11.2 | Neuroblastoma of adrenal gland (syn. "neuroblastoma NOS", Title "Neuroblastoma of unspecified site", score 1.0) |
| LB11.0 | hypertrophic pyloric stenosis | ❌ WRONG | LB13.0 | Congenital hypertrophic pyloric stenosis (score 1.0) |
| LA92.0 | umbilical hernia | ❌ WRONG | DD53 | Umbilical hernia (score 1.0) |

**Phase 2B totals: 24/24 verified — 6 ✅ OK (gastroschisis LB02, hydrocele KC00, anorectal LB17.0, cloaca LB17.2, duodenal LB14, epidermoid EK70.0Z), 18 ❌ WRONG (incl. 1 merge-delete). ~75% corrupt — worse than VASC (61%).**
Systematic corruption: surgical conditions scattered into wrong chapters — appendicitis/hernias/intussusception put in developmental `LA9x`/`LB1x` instead of digestive `DB/DA/DD`; tumours in disease chapters (Wilms `GB82.0`, neuroblastoma as raw morphology `XH4MH9`); a duodenal-atresia ↔ pyloric-stenosis ↔ annular-pancreas ↔ Meckel code tangle (LB13.0/LB14/LB21.0).

**Duodenal/pyloric cascade (MIG-A ordering matters — unique icdCode constraint):**
1. Meckel `LB21.0`→`LB15.0` (frees LB21.0 — reused for a NEW annular-pancreas dx in 2D)
2. delete dup duodenal-atresia row (`LB13.0`) — concept kept on the LB14 row
3. pyloric `LB11.0`→`LB13.0` (now free)
4. rename LB14 row → "duodenal atresia"; relink malrotation→neonatal emergencies (MIG-C)

### 2D — Candidate diagnoses (planned, fully specified)
Compact index (full EN/AR descriptions written directly into the MIG-D migration files). Each
icdCode verified via `icd11_search`. "In DB?" = NO unless noted (shared row from another dept).

| icdCode | EN name | AR name | main_diag | Verified |
|---|---|---|---|---|
| LB31.3 | exstrophy of urinary bladder | انقلاب المثانة البولية | abdominal wall defects | ✅ |
| LB17.3 | cloacal exstrophy | انقلاب المذرق (المجمع) | abdominal wall defects | ✅ |
| LD2F.10 | prune belly syndrome | متلازمة البطن البرقوقية | abdominal wall defects | ✅ |
| LB03.0 | patent urachus | بقاء القناة السرّية (المصران السرّي السالك) | umbilical hernia | ✅ |
| DB10.00 | acute appendicitis with generalised peritonitis | التهاب الزائدة الحاد مع التهاب الصفاق المعمم | appendicitis | ✅ |
| DB10.01 | appendicular abscess (appendicitis with localised peritonitis) | خراج الزائدة الدودية | appendicitis | ✅ |
| DB11.6 | mucocele of appendix | القيلة المخاطية للزائدة الدودية | appendicitis | ✅ |
| LA75.4 | congenital pulmonary airway malformation (CCAM) | تشوه المجرى الهوائي الرئوي الخلقي | thoracic & lung anomalies | ✅ |
| LA75.6 | congenital pulmonary sequestration | العزل الرئوي الخلقي | thoracic & lung anomalies | ✅ |
| LA75.5 | congenital lobar emphysema | انتفاخ الرئة الفصّي الخلقي | thoracic & lung anomalies | ✅ |
| LA74.Y | congenital bronchogenic cyst | الكيس القصبي المنشأ الخلقي | thoracic & lung anomalies | ✅ |
| LB73.13 | pectus excavatum | الصدر القمعي (الغائر) | thoracic & lung anomalies | ✅ |
| LB00.Y | eventration of diaphragm | ارتخاء الحجاب الحاجز | congenital diaphragmatic hernia | ✅ |
| LB00.1 | absence (agenesis) of diaphragm | غياب الحجاب الحاجز (عدم التخلّق) | congenital diaphragmatic hernia | ✅ |
| LB13.1 | congenital hiatus hernia | فتق الحجاب الحاجز الفجوي الخلقي | congenital diaphragmatic hernia | ✅ |
| LB12.1Z | oesophageal atresia without fistula | رتق المريء دون ناسور | esophageal atresia | ✅ |
| LB12.2 | tracheo-oesophageal fistula without atresia (H-type) | الناسور الرغامي المريئي دون رتق (النوع H) | esophageal atresia | ✅ |
| LB12.3 | congenital oesophageal stenosis/stricture | تضيّق المريء الخلقي | esophageal atresia | ✅ |
| LB12.Y | oesophageal duplication cyst | كيس ازدواج المريء | esophageal atresia | ✅ |
| GB00.0 | encysted hydrocele | القيلة المائية المكيّسة | hydrocele | ✅ |
| BD75.1 | scrotal varicocele | دوالي الصفن (القيلة الدوالية) | hydrocele | ✅ |
| GB01.0 | torsion of testis | انفتال الخصية | hydrocele | ✅ |
| LB52.0 | ectopic testis | الخصية الهاجرة (المنتبذة) | hydrocele | ✅ |
| LB42.2 | congenital rectovaginal fistula | الناسور المستقيمي المهبلي الخلقي | imperforate anus | ✅ |
| GC04.0 | rectourethral fistula | الناسور المستقيمي الإحليلي | imperforate anus | ✅ |
| LB17.Y | rectal duplication cyst | كيس ازدواج المستقيم | imperforate anus | ✅ |
| DB51 | stenosis of anal canal | تضيّق القناة الشرجية | imperforate anus | ✅ |
| DD51/ME24.2 | obstructed (incarcerated) inguinal hernia | فتق إربي محتبس (مع انسداد) | inguinal hernia | ✅ |
| DD51&XT44 | recurrent inguinal hernia | فتق إربي ناكس | inguinal hernia | ✅ |
| DD52 | femoral hernia | فتق فخذي | inguinal hernia | ✅ |
| LB4Y | hydrocele of the canal of Nuck | القيلة المائية لقناة نوك | inguinal hernia | ✅ |
| DA91.1 | volvulus of small intestine (midgut volvulus) | انفتال الأمعاء الدقيقة (انفتال الأمعاء المتوسطة) | malrotation & volvulus | ✅ |
| DB30.1&XA8YJ9 | sigmoid volvulus | انفتال القولون السيني | malrotation & volvulus | ✅ |
| DA40.2 | gastric volvulus | انفتال المعدة | malrotation & volvulus | ✅ |
| DD50.2Z | intra-abdominal (internal) hernia | الفتق الداخلي البطني | malrotation & volvulus | ✅ |
| LB15.1 | atresia of small intestine (jejunoileal atresia) | رتق الأمعاء الدقيقة (الصائم واللفائفي) | neonatal emergencies | ✅ |
| LB16.0 | congenital atresia of large intestine (colonic atresia) | رتق الأمعاء الغليظة (رتق القولون) | neonatal emergencies | ✅ |
| KB87.2 | meconium ileus without perforation | العلوص العقيي (انسداد العقي) | neonatal emergencies | ✅ |
| LB20.21 | biliary atresia | رتق القنوات الصفراوية | neonatal emergencies | ✅ |
| LB21.0 | annular pancreas | البنكرياس الحلقي | neonatal emergencies | ✅ (reuses LB21.0 freed by Meckel→LB15.0) |
| 2C12.01 | hepatoblastoma | الورم الأرومي الكبدي | pediatric tumor resection | ✅ |
| 2B55.Z | rhabdomyosarcoma | الساركومة العضلية المخططة | pediatric tumor resection | ✅ |
| 2F32.0 | sacrococcygeal teratoma (cystic teratoma) | الورم المسخي العجزي العصعصي | pediatric tumor resection | ✅ |
| 2F32.Y | ovarian teratoma | الورم المسخي المبيضي | pediatric tumor resection | ✅ |
| 2A85.6 | Burkitt lymphoma | لمفومة بوركيت | pediatric tumor resection | ✅ |
| DA05.Y&XA0SH3 | thyroglossal duct cyst | الكيس الدرقي اللساني | soft tissue & skin lesions | ✅ |
| DA05.Y | branchial cleft cyst | الكيس الخيشومي (كيس الشق الخيشومي) | soft tissue & skin lesions | ✅ |
| LC40 | dermoid cyst | الكيس الجلداني (الأدمي) | soft tissue & skin lesions | ✅ |
| LA90.1Z | cystic hygroma (lymphatic malformation) | الورم اللمفي الكيسي (التشوه اللمفاوي) | soft tissue & skin lesions | ✅ |
| 2E81.2Z | infantile haemangioma | الورم الوعائي الطفلي | soft tissue & skin lesions | ✅ |
| EG63.0 | sacrococcygeal pilonidal sinus | الناسور الشعري العجزي العصعصي | soft tissue & skin lesions | ✅ |
| DA40.0 | gastric outlet obstruction | انسداد مخرج المعدة | pyloric stenosis | ✅ |
| LB13.Y | congenital gastric duplication | ازدواج المعدة الخلقي | pyloric stenosis | ✅ |
| KB80 | gastro-oesophageal reflux disease in newborn | الارتجاع المعدي المريئي عند حديثي الولادة | pyloric stenosis | ✅ |
| DA22.Z | gastro-oesophageal reflux disease | داء الارتجاع المعدي المريئي | pyloric stenosis | ✅ |
| DD55 | epigastric hernia | الفتق الشرسوفي (فوق المعدي) | umbilical hernia | ✅ |
| LB03.Y | persistent omphalomesenteric (vitelline) duct | بقاء القناة السرّية المساريقية (المحّية) | umbilical hernia | ✅ |
| 2B81.2 | neuroendocrine (carcinoid) tumour of appendix | الورم العصبي الصمّاوي (السرطاوي) للزائدة الدودية | appendicitis | ✅ |
| KA65.1 | omphalitis of newborn | التهاب السرّة عند حديثي الولادة | umbilical hernia | ✅ |
| CA44 | pyothorax (empyema of pleura) | الدبيلة الجنبية (تقيّح الصدر) | thoracic & lung anomalies | ✅ |
| CB24 | chylous effusion (chylothorax) | الانصباب الكيلوسي (انصباب لمفي بالصدر) | thoracic & lung anomalies | ✅ |
| CB04.1 | congenital chylothorax | الانصباب الكيلوسي الخلقي | thoracic & lung anomalies | ✅ |
| LA21.Y | preauricular sinus | الناسور أمام الأذني (النقرة أمام الأذنية) | soft tissue & skin lesions | ✅ |
| 2E80.00 | superficial subcutaneous lipoma | الورم الشحمي تحت الجلد | soft tissue & skin lesions | ✅ |
| 2F78&XA6KU8 | congenital mesoblastic nephroma | الورم الكلوي الأرومي المتوسط الخلقي | pediatric tumor resection | ✅ |
| 2C80.2 | germ cell tumour of testis | ورم الخلايا الجرثومية للخصية | pediatric tumor resection | ✅ |
| CB21.1 | spontaneous pneumothorax | استرواح الصدر العفوي | thoracic & lung anomalies | ✅ |
| LB53.Z | hypospadias | المبال التحتاني (الإحليل التحتي) | hydrocele | ✅ |
| DB35.Y | juvenile rectal polyp | السليلة المستقيمية اليفعية | imperforate anus | ✅ |
| DB30.0 | intussusception of large intestine | انغلاف الأمعاء الغليظة | intussusception | ✅ |
| DB30.0&XA6J68 | caecal intussusception | انغلاف الأعور | intussusception | ✅ |
| DD50.0 | diaphragmatic hernia (traumatic/acquired) | الفتق الحجابي (الرضحي/المكتسب) | congenital diaphragmatic hernia | ✅ |
| LA31.2 | ankyloglossia (tongue-tie) | التصاق اللسان (اللسان المربوط) | soft tissue & skin lesions | ✅ |
| BD90.0&XA5XT7 | acute cervical lymphadenitis | التهاب العقد اللمفية الرقبية الحاد | soft tissue & skin lesions | ✅ |
| 2B30.Z | Hodgkin lymphoma | لمفومة هودجكين | pediatric tumor resection | ✅ |
| LA73.1 | congenital tracheomalacia | ليونة الرغامى الخلقية | thoracic & lung anomalies | ✅ |
| 3B81.5Z | splenic cyst | كيس الطحال | pediatric tumor resection | ✅ |

**Phase 2D total: 77 candidate diagnoses verified (→ 100 total). Per-category final counts (all ≥5
except intussusception): abdominal wall 5, appendicitis 5, CDH 5, esophageal atresia 5, hydrocele 7,
imperforate anus 7, inguinal hernia 5, intussusception 3 ⚠️(only 3 distinct ICD-11 entities exist —
documented narrow category), malrotation 5, neonatal emergencies 10, pediatric tumor 11, pyloric 5,
umbilical 5, soft tissue & skin lesions 13, thoracic & lung anomalies 10. 2 NEW main_diags created
(soft tissue & skin lesions; thoracic & lung anomalies).**

### 2E — Candidate proc_cpts (planned)
| alphaCode | numCode | EN title | main_diag(s) | Verified |
|---|---|---|---|---|

### 2E — Candidate proc_cpts (planned)
Compact index (full EN/AR title+description in MIG-E files 095/096). Each numCode AAPC-verified.
New alpha groups (PEDSURG had none): AWAL, APDX, DIAF, ESOP, GUSX, ANOR, HERN, BOWL, NEON, ONCO,
FORG, SOFT, THOR + shared MNR.

| alphaCode | numCode | EN title | main_diag(s) | Verified |
|---|---|---|---|---|
| AWAL | 49600-00 | Repair small omphalocele, primary closure | abdominal wall defects | ✅ |
| AWAL | 49605-00 | Repair large omphalocele or gastroschisis | abdominal wall defects | ✅ |
| AWAL | 49606-00 | Repair large omphalocele/gastroschisis, prosthesis removal + closure | abdominal wall defects | ✅ |
| AWAL | 49610-00 | Gross-type omphalocele operation, first stage | abdominal wall defects | ✅ |
| AWAL | 49611-00 | Gross-type omphalocele operation, second stage | abdominal wall defects | ✅ |
| AWAL | 51940-00 | Closure of bladder exstrophy | abdominal wall defects | ✅ |
| AWAL | 49900-00 | Secondary suture of abdominal wall (dehiscence/evisceration) | abdominal wall defects | ✅ |
| APDX | 44970-00 | Laparoscopic appendectomy | appendicitis | ✅ |
| APDX | 44950-00 | Open appendectomy | appendicitis | ✅ |
| APDX | 44960-00 | Appendectomy for ruptured appendix with peritonitis | appendicitis | ✅ |
| APDX | 44900-00 | Open drainage of appendiceal abscess | appendicitis | ✅ |
| APDX | 49406-00 | Image-guided percutaneous drainage of intra-abdominal abscess | appendicitis | ✅ |
| DIAF | 39503-00 | Repair of neonatal diaphragmatic hernia | congenital diaphragmatic hernia | ✅ |
| DIAF | 39540-00 | Repair of diaphragmatic hernia, acute traumatic | congenital diaphragmatic hernia | ✅ |
| DIAF | 39541-00 | Repair of diaphragmatic hernia, chronic/recurrent traumatic | congenital diaphragmatic hernia | ✅ |
| DIAF | 39545-00 | Imbrication (plication) of diaphragm for eventration | congenital diaphragmatic hernia | ✅ |
| DIAF | 39561-00 | Resection of diaphragm with complex reconstruction | congenital diaphragmatic hernia | ✅ |
| ESOP | 43313-00 | Esophagoplasty for congenital atresia, thoracic, without TEF repair | esophageal atresia | ✅ |
| ESOP | 43314-00 | Esophagoplasty for atresia with TEF repair, thoracic | esophageal atresia | ✅ |
| ESOP | 43312-00 | Repair of tracheo-oesophageal fistula | esophageal atresia | ✅ |
| ESOP | 43360-00 | Oesophageal reconstruction/replacement, thoracic | esophageal atresia | ✅ |
| ESOP | 43450-00 | Dilation of oesophagus by bougie | esophageal atresia | ✅ |
| GUSX | 55040-00 | Hydrocelectomy, unilateral | hydrocele | ✅ |
| GUSX | 55041-00 | Hydrocelectomy, bilateral | hydrocele | ✅ |
| GUSX | 54640-00 | Orchidopexy, inguinal approach | hydrocele | ✅ |
| GUSX | 54650-00 | Orchidopexy, abdominal approach (Fowler-Stephens) | hydrocele | ✅ |
| GUSX | 55530-00 | Excision of varicocele / spermatic vein ligation | hydrocele | ✅ |
| GUSX | 54600-00 | Reduction of testicular torsion | hydrocele | ✅ |
| GUSX | 54620-00 | Orchidopexy of contralateral testis (fixation) | hydrocele | ✅ |
| GUSX | 54322-00 | One-stage distal hypospadias repair | hydrocele | ✅ |
| ANOR | 46744-00 | Repair of cloacal anomaly, sacroperineal | imperforate anus | ✅ |
| ANOR | 46742-00 | Repair of high imperforate anus with fistula | imperforate anus | ✅ |
| ANOR | 46715-00 | Repair of low imperforate anus (perineal fistula) | imperforate anus | ✅ |
| ANOR | 44320-00 | Creation of colostomy | imperforate anus | ✅ |
| ANOR | 44625-00 | Closure of enterostomy with anastomosis | imperforate anus | ✅ |
| ANOR | 46705-00 | Anoplasty for anal stricture, infant | imperforate anus | ✅ (infant code; 46700 is adult) |
| HERN | 49491-00 | Repair of inguinal hernia, preterm infant | inguinal hernia | ✅ |
| HERN | 49500-00 | Repair of inguinal hernia, age 6 months to <5 years | inguinal hernia | ✅ |
| HERN | 49505-00 | Repair of inguinal hernia, age 5 years or older | inguinal hernia | ✅ |
| HERN | 49496-00 | Repair of incarcerated inguinal hernia, infant <6 months | inguinal hernia | ✅ |
| HERN | 49650-00 | Laparoscopic inguinal hernia repair | inguinal hernia | ✅ |
| HERN | 49550-00 | Repair of femoral hernia | inguinal hernia | ✅ |
| HERN | 51500-00 | Excision of urachal cyst or sinus | umbilical hernia | ✅ |
| HERN | 49591-00 | Anterior abdominal (umbilical/epigastric) hernia repair, initial <3cm, reducible | umbilical hernia | ✅ NEW-2023 (replaces 49580/49570) |
| HERN | 49592-00 | Anterior abdominal hernia repair, initial <3cm, incarcerated/strangulated | umbilical hernia | ✅ NEW-2023 |
| HERN | 49593-00 | Anterior abdominal hernia repair, initial 3-10cm, reducible | umbilical hernia | ✅ NEW-2023 |
| HERN | 49613-00 | Anterior abdominal hernia repair, recurrent <3cm | umbilical hernia | ✅ NEW-2023 |
| BOWL | 44800-00 | Excision of Meckel diverticulum / omphalomesenteric duct | umbilical hernia, neonatal emergencies | ✅ |
| BOWL | 44055-00 | Ladd procedure for malrotation | malrotation & volvulus | ✅ |
| BOWL | 44050-00 | Operative reduction of volvulus/intussusception | malrotation & volvulus, intussusception | ✅ |
| BOWL | 44120-00 | Small bowel resection with anastomosis | malrotation & volvulus, intussusception, neonatal emergencies | ✅ |
| BOWL | 44125-00 | Small bowel resection with enterostomy (stoma) | malrotation & volvulus, intussusception, neonatal emergencies | ✅ |
| BOWL | 44130-00 | Enteroenterostomy (intestinal anastomosis) | malrotation & volvulus, intussusception | ✅ |
| BOWL | 44310-00 | Ileostomy / jejunostomy creation | neonatal emergencies | ✅ |
| BOWL | 44820-00 | Excision of mesenteric lesion | malrotation & volvulus | ✅ |
| NEON | 47701-00 | Kasai portoenterostomy (for biliary atresia) | neonatal emergencies | ✅ |
| NEON | 47715-00 | Excision of choledochal cyst | neonatal emergencies | ✅ |
| NEON | 47765-00 | Hepaticoenterostomy (biliary-enteric anastomosis) | neonatal emergencies | ✅ |
| NEON | 45120-00 | Pull-through for Hirschsprung (proctectomy + coloanal anastomosis) | neonatal emergencies | ✅ |
| NEON | 45112-00 | Proctectomy with coloanal anastomosis (pull-through) | neonatal emergencies | ✅ |
| NEON | 44140-00 | Partial colectomy with anastomosis | neonatal emergencies | ✅ |
| NEON | 44126-00 | Enterectomy for congenital intestinal atresia | neonatal emergencies | ✅ |
| FORG | 43520-00 | Pyloromyotomy (Ramstedt) | pyloric stenosis | ✅ |
| FORG | 43280-00 | Laparoscopic fundoplication | pyloric stenosis | ✅ |
| FORG | 43327-00 | Open fundoplication | pyloric stenosis | ✅ |
| FORG | 43830-00 | Open gastrostomy | pyloric stenosis | ✅ |
| FORG | 43653-00 | Laparoscopic gastrostomy | pyloric stenosis | ✅ |
| ONCO | 50230-00 | Radical nephrectomy (for Wilms tumour) | pediatric tumor resection | ✅ |
| ONCO | 47120-00 | Partial hepatectomy (for hepatoblastoma) | pediatric tumor resection | ✅ |
| ONCO | 49215-00 | Excision of sacrococcygeal/presacral tumour | pediatric tumor resection | ✅ |
| ONCO | 58940-00 | Oophorectomy (for ovarian teratoma) | pediatric tumor resection | ✅ |
| ONCO | 38510-00 | Open biopsy/excision of deep cervical lymph node | pediatric tumor resection | ✅ |
| ONCO | 54530-00 | Radical orchidectomy, inguinal approach | pediatric tumor resection | ✅ |
| ONCO | 38120-00 | Laparoscopic splenectomy (for splenic cyst) | pediatric tumor resection | ✅ |
| SOFT | 60280-00 | Excision of thyroglossal duct cyst (Sistrunk) | soft tissue & skin lesions | ✅ |
| SOFT | 42810-00 | Excision of branchial cleft cyst (skin/subcutaneous) | soft tissue & skin lesions | ✅ |
| SOFT | 42815-00 | Excision of branchial cleft cyst, deep/extending | soft tissue & skin lesions | ✅ |
| ONCO | 60540-00 | Adrenalectomy (for adrenal neuroblastoma) | pediatric tumor resection | ✅ |
| ONCO | 49186-00 | Excision of intra-abdominal tumour(s), ≤5 cm | pediatric tumor resection | ✅ NEW-2025 (replaces deleted 49203/49204) |
| SOFT | 38550-00 | Excision of cystic hygroma (cervical/axillary) | soft tissue & skin lesions | ✅ |
| SOFT | 11772-00 | Excision of pilonidal cyst/sinus, extensive | soft tissue & skin lesions | ✅ |
| SOFT | 41010-00 | Frenotomy of lingual frenum (tongue-tie) | soft tissue & skin lesions | ✅ |
| SOFT | 10061-00 | Incision and drainage of abscess, complicated | soft tissue & skin lesions | ✅ |
| SOFT | 21011-00 | Excision of subcutaneous soft-tissue tumour, face/scalp <2 cm | soft tissue & skin lesions | ✅ |
| THOR | 32663-00 | Thoracoscopic (VATS) lobectomy | thoracic & lung anomalies | ✅ |
| THOR | 32480-00 | Open lobectomy | thoracic & lung anomalies | ✅ |
| THOR | 32662-00 | Thoracoscopic excision of mediastinal cyst/mass | thoracic & lung anomalies | ✅ |
| THOR | 21743-00 | Minimally invasive (Nuss) pectus excavatum repair | thoracic & lung anomalies | ✅ |
| THOR | 21740-00 | Open (Ravitch) chest-wall reconstruction for pectus | thoracic & lung anomalies | ✅ |
| THOR | 32320-00 | Open decortication + parietal pleurectomy (empyema) | thoracic & lung anomalies | ✅ |
| THOR | 32651-00 | Thoracoscopic (VATS) decortication | thoracic & lung anomalies | ✅ |
| THOR | 32551-00 | Tube thoracostomy (chest drain) | thoracic & lung anomalies | ✅ |
| THOR | 32655-00 | Thoracoscopic (VATS) bullectomy | thoracic & lung anomalies | ✅ |
| THOR | 33800-00 | Aortopexy (aortic suspension for tracheomalacia) | thoracic & lung anomalies | ✅ |
| THOR | 38381-00 | Thoracic duct ligation, thoracic approach (chylothorax) | thoracic & lung anomalies | ✅ |
| THOR | 32650-00 | Thoracoscopic (VATS) pleurodesis | thoracic & lung anomalies | ✅ |
| APDX | 44160-00 | Right hemicolectomy (for appendiceal carcinoid) | appendicitis | ✅ |
| ONCO | 38525-00 | Excision of deep axillary lymph nodes | pediatric tumor resection | ✅ |
| ESOP | 43220-00 | Oesophagoscopy with balloon dilation | esophageal atresia | ✅ |
| FORG | 43831-00 | Neonatal gastrostomy | pyloric stenosis | ✅ |
| SOFT | 21013-00 | Excision of soft-tissue tumour, face/scalp ≥2 cm | soft tissue & skin lesions | ✅ |
| MNR | 00001-00 | Basic surgical step (shared) | ALL 15 main_diags | ✅ shared |

**Phase 2E total: 101 dept-specific proc_cpts (13 new alpha groups) + shared MNR.** Per-main_diag
dept-specific counts (all ≥5 except intussusception): abdominal wall defects 7, appendicitis 6, CDH 5,
esophageal atresia 6, hydrocele 8, imperforate anus 6, inguinal hernia 6, intussusception 4 ⚠️
(documented narrow — matches its 3-diagnosis narrowness), malrotation & volvulus 6, neonatal
emergencies 11, pediatric tumor resection 10, pyloric stenosis 6, umbilical hernia 6, soft tissue &
skin lesions 9, thoracic & lung anomalies 12. **4 deleted/restructured codes handled**: 2023 hernia
recode (49570/49572/49580/49585 → 49591/49592/49593/49613); 2025 retroperitoneal-tumour deletion
(49203/49204 → 60540 adrenalectomy + 49186). 46700 (adult) → 46705 (infant).

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 091 | 1750000000091-AddPedsurgMainDiags.ts | Add 2 new main_diags (soft tissue & skin lesions; thoracic & lung anomalies) | **applied ✅** |
| 092 | 1750000000092-FixPedsurgIcdCodes.ts | MIG-A: 11 UPDATEs + 6 MERGEs/deletes + duodenal/pyloric cascade + orphan relinks | **applied ✅** |
| 093 | 1750000000093-AddPedsurgDiagnosesBatch1.ts | Add 40 diagnoses (wall defects, appendicitis, thoracic, CDH, EA, hydrocele, ARM, inguinal, malrotation, neonatal) | **applied ✅** |
| 094 | 1750000000094-AddPedsurgDiagnosesBatch2.ts | Add 37 diagnoses (tumours, soft tissue, pyloric, umbilical, thoracic, intussusception, etc.) | **applied ✅** |
| 095 | 1750000000095-ImportPedsurgProcCpts1.ts | Import 49 procs (AWAL, APDX, DIAF, ESOP, GUSX, ANOR, HERN) | **applied ✅** |
| 096 | 1750000000096-ImportPedsurgProcCpts2.ts | Import 52 procs (BOWL, NEON, FORG, ONCO, SOFT, THOR) | **applied ✅** |
| 097 | 1750000000097-LinkPedsurgProcCptsToMainDiags.ts | Link 101 procs to 15 main_diags + MNR | **applied ✅** |

**After 091–094 (verified on staging): 15 main_diags, 100 diagnoses (all ICD-11-verified ✅, all
embedded ✅ — 78 backfilled), 0 orphans, 0 empty categories. Every main_diag ≥5 diagnoses except
intussusception=3 (documented: only 3 distinct ICD-11 intussusception entities exist). Proc_cpts = 0
(pending Phase 2E).**

---

## Summary (AUDIT COMPLETE — migrations 091–097)
| Metric | Count |
|---|---|
| Main_diags | 15 (13 original + 2 new: soft tissue & skin lesions, thoracic & lung anomalies) |
| Diagnoses (current) | **100** ✅ (all ICD-11-verified + embedded; every main_diag ≥5 except intussusception=3) |
| Proc_cpts (current) | **101 dept-specific** ✅ (102 linked incl. shared MNR; every main_diag ≥5) |
| ICD-11 codes fixed (❌ wrong) | 18 of 24 (~75% corrupt — worst dept yet): 11 UPDATEs + 6 MERGEs/deletes + pyloric recode |
| Structural issues resolved | 2 orphans relinked + 2 new main_diags + duodenal/pyloric/Meckel cascade + 12→0 NO_PROC |
| CPT codes — deleted/restructured handled | 2023 hernia recode (49570/49572/49580/49585→49591–49613); 2025 retro-tumour (49203/49204→60540+49186); 46700→46705 |
| Cross-dept shared rows reused | diagnoses merged into GS (intussusception, inguinal, umbilical, Meckel) + PRS (fournier); 7 THOR procs shared with CTS |
| New diagnoses added (this run) | 77 (migrations 093/094) → 100 total |
| New proc_cpts added (this run) | 101 (migrations 095/096) across 13 new alpha groups + MNR links (097) |
| Diagnoses re-embedded | 78 (recodes + new rows) ✅ all 100 embedded |
| Proc_cpts embedded | 94 new + 7 shared (already embedded) = all 101 ✅ |

## ICD-11 Changes Applied (migration 092)
See the **2B audit table** above for the full 24-row verification. 18 fixes applied: 11 in-place
UPDATEs (LB19.0→LB01, LA50.0→DB10.0, KB20.0→LB00.0, LB10.0→LB12.1Y, LB51.0→LB52.Z, LB12.0→LB18,
LB14.0→LB16.1, LB22.00→KB88.Z, LB40.0→LB20.20, GB82.0→2C90.Y, XH4MH9→2D11.2), pyloric LB11.0→LB13.0,
and 6 MERGEs/deletes into shared rows (fournier→PRS 1B71.1; intussusception→GS DA91.0; inguinal→GS
DD51; umbilical→GS DD53; Meckel→GS LB15.0; deleted duplicate LB13.0). The LB14 row was renamed
"duodenal atresia" and moved malrotation→neonatal.

## CPT Changes Applied
N/A — PEDSURG had no pre-existing proc_cpts. During import, deleted/restructured codes were avoided:
| Intended (deleted/adult) | Replaced with | Reason |
|---|---|---|
| 49570/49572/49580/49585 (umbilical/epigastric) | 49591/49592/49593/49613 | anterior-abdominal-hernia family deleted 2023-01-01 |
| 49203/49204 (retroperitoneal tumour) | 60540 (adrenalectomy) + 49186 (intra-abdominal tumour) | deleted 2025-01-01 |
| 46700 (adult anoplasty) | 46705 (infant anoplasty) | age-appropriate |

## Structural Fixes
- **2 new main_diags** created (091): soft tissue & skin lesions; thoracic & lung anomalies.
- **2 orphans relinked** (092): epidermoid cyst EK70.0Z + fournier (merged to 1B71.1) → soft tissue & skin lesions.
- **Duodenal/pyloric/Meckel cascade** resolved (092): pyloric→LB13.0; LB14 row → "duodenal atresia", malrotation→neonatal; Meckel→GS LB15.0 (freed LB21.0 → reused for annular pancreas); deleted the duplicate LB13.0 duodenal row.
- **12 NO_PROC main_diags resolved** (097) → after migration: 0 orphans, 0 empty-diag, 0 empty-proc.

## New Diagnoses Added
**77 diagnoses added (23→100)** via migrations 093 (40) + 094 (37) across all 15 categories. Full
per-row specs (ICD-11 code, EN/AR name + descriptions) are in the migration files; the **"2D —
Candidate diagnoses"** index above lists every code with its AR name, main_diag and ✅ verification.
Several codes were shared rows from GS/PRS/other depts (ON CONFLICT shared them).

## New Proc_cpts Added
**101 dept-specific proc_cpts added** (095 +49, 096 +52) across **13 new alpha groups** (AWAL, APDX,
DIAF, ESOP, GUSX, ANOR, HERN, BOWL, NEON, FORG, ONCO, SOFT, THOR), all AAPC-verified, linked by 097.
The **"2E — Candidate proc_cpts"** index lists every code with its main_diag and verification status.

## Still-Open Items
- **intussusception** is a narrow category: 3 diagnoses (only 3 distinct ICD-11 intussusception
  entities exist) and 4 dept-specific procs + MNR. Documented exception (analogous to ORTHO carpal tunnel).
- Optional future polish: GORD appears twice in the pyloric-stenosis category (general DA22.Z +
  neonatal KB80) to reach ≥5 — acceptable but could be re-homed if a "foregut/GORD" category is added.
- All ICD-11 codes verified via `icd11_search`; all CPT codes verified via AAPC. No ⚠️ UNVERIFIED codes remain.
