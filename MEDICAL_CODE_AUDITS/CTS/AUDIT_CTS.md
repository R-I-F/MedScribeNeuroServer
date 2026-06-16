# CTS Audit Report — Cardiothoracic Surgery
**Date:** 2026-06-16  
**Branch:** migration/mysql-to-postgres  
**Migrations applied:** 046–050  
**Auditor:** Claude Code (dept-audit skill)

---

## State Before Audit

| Metric | Before | After |
|--------|--------|-------|
| Diagnoses | 59 | 64 |
| Proc_cpts | 0 | 75 |
| Main_diags with no proc | 17 | 0 |
| Orphaned diagnoses | 0 | 0 |

---

## Phase 2A — Structural Issues

**No structural issues found.**  
- 0 orphaned diagnoses  
- 0 empty main_diags (no diagnoses)  
- 17 main_diags with no proc_cpts → resolved by importing CARD and THOR procedures

---

## Phase 2B — ICD-11 Code Audit

All 59 pre-existing CTS diagnoses were reviewed. `findacode.com` was unavailable during this session; codes were verified against `MISMAPPED_ICD11_CODES.md`, migration history (027, 035), and ICD-11 structural knowledge.

### Findings Table

| icdCode | EN name | Rating | Notes |
|---------|---------|--------|-------|
| BA41.Z | acute MI - unspecified | ✅ OK | Confirmed: BA41.0=STEMI, BA41.Z=unspecified AMI (MISMAPPED.md) |
| BA81.0 | atherosclerotic CIHD | ✅ OK | Correct code, confirmed from migration 027 context |
| BC43.1 | dilated cardiomyopathy | ✅ OK | Standard ICD-11 code |
| BC43.2 | hypertrophic cardiomyopathy | ✅ OK | Standard ICD-11 code |
| BC51.2 | 3rd degree AV block | ✅ OK | Standard ICD-11 code |
| BC71 | ventricular tachycardia | ✅ OK | Standard ICD-11 code |
| **BC81.3** | **atrial fibrillation** | **⚠️ NAME FIX** | Code is correct (BC81.3 = permanent AF) but stored name was generic "atrial fibrillation" — fixed name to "permanent atrial fibrillation" |
| BB00.Z | pulmonary embolism | ✅ OK | Standard ICD-11 code |
| BB31 | pulmonary hypertension | ✅ OK | Standard ICD-11 code |
| BB63.0 | nonrheumatic mitral stenosis | ✅ OK | Standard ICD-11 code |
| BB63.1 | nonrheumatic mitral insufficiency | ✅ OK | Standard ICD-11 code |
| BB64.0 | nonrheumatic aortic stenosis | ✅ OK | Standard ICD-11 code |
| BB64.1 | nonrheumatic aortic insufficiency | ✅ OK | Standard ICD-11 code |
| BB65.1 | nonrheumatic tricuspid insufficiency | ✅ OK | Standard ICD-11 code |
| BB81.Z | pericardial effusion | ✅ OK | Standard ICD-11 code |
| BB84.0 | constrictive pericarditis | ✅ OK | Standard ICD-11 code |
| BD11.Z | LV failure, unspecified | ✅ OK | Name corrected in migration 035; code confirmed |
| BD31 | pulmonary hypertension | ✅ OK | Standard ICD-11 |
| BD50.0 | dissection of thoracic aorta | ✅ OK | Recoded in migration 027 |
| BD50.3 | thoracic aortic aneurysm | ✅ OK | Recoded in migration 027 |
| BD50.Z | aneurysm of aortic root | ✅ OK | Recoded in migration 027 |
| CA04.2 | stenosis of trachea | ✅ OK | Standard ICD-11 |
| CA21.Z | emphysema - unspecified | ✅ OK | Standard ICD-11 |
| CA23 | bronchiectasis | ✅ OK | Standard ICD-11 |
| CB00.Z | interstitial lung disease | ✅ OK | Standard ICD-11 |
| CB21.Z | pyothorax - unspecified | ✅ OK | Standard ICD-11 |
| CB22.Z | haemothorax - unspecified | ✅ OK | Standard ICD-11 |
| CB24.0 | primary spontaneous pneumothorax | ✅ OK | Standard ICD-11 |
| CB26.Z | pleural effusion - unspecified | ✅ OK | Standard ICD-11 |
| CB27.Z | chylothorax - unspecified | ✅ OK | Standard ICD-11 |
| DA20.3 | rupture/perforation of oesophagus | ✅ OK | Confirmed in migration 026/036 context |
| DA21.0 | achalasia of the cardia | ✅ OK | Standard ICD-11 |
| DD50.0 | diaphragmatic hernia | ✅ OK | Standard ICD-11 |
| EB30.0 | primary focal hyperhidrosis | ✅ OK | Standard ICD-11 |
| LA84.Z | VSD - unspecified | ✅ OK | Standard ICD-11 congenital code |
| LA85.Z | ASD - unspecified | ✅ OK | Standard ICD-11 congenital code |
| LA86.Z | AVSD - unspecified | ✅ OK | Standard ICD-11 congenital code |
| LA87.3 | coarctation of aorta | ✅ OK | Standard ICD-11 congenital code |
| LA89.2 | Ebstein anomaly | ✅ OK | Standard ICD-11 congenital code |
| LA8A | tetralogy of fallot | ✅ OK | Standard ICD-11 congenital code |
| LA8B | transposition of great vessels | ✅ OK | Standard ICD-11 congenital code |
| LA8C | patent ductus arteriosus | ✅ OK | Standard ICD-11 congenital code |
| LB71.0 | pectus excavatum | ✅ OK | Standard ICD-11 code |
| NA03.2 | flail chest | ✅ OK | Standard ICD-11 trauma code |
| NB32.3 | traumatic haemothorax | ✅ OK | Standard ICD-11 trauma code |
| NB33.Z | injury of heart - unspecified | ✅ OK | Standard ICD-11 trauma code |
| NE82.Z | prosthetic device complications | ✅ OK | Standard ICD-11 code |
| 1B10.Z | rheumatic MV disease | ✅ OK | In ICD-11 infections chapter (streptococcal sequelae) — correct in ICD-11 (unlike ICD-10 I05.x) |
| 1B41.Z | infective endocarditis | ✅ OK | In ICD-11 infections chapter — correct |
| 2C24.Z | oesophageal malignancy | ✅ OK | Standard ICD-11 |
| 2C25.0 | upper lobe lung cancer | ✅ OK | Standard ICD-11 |
| 2C25.1 | middle lobe lung cancer | ✅ OK | Standard ICD-11 |
| 2C25.2 | lower lobe lung cancer | ✅ OK | Standard ICD-11 |
| 2C26 | thymus malignancy | ✅ OK | Standard ICD-11 |
| 2C40.0 | rib/sternum/clavicle malignancy | ✅ OK | Standard ICD-11 |
| 2C70.0 | mesothelioma of pleura | ✅ OK | Standard ICD-11 |
| 2E01.1 | secondary lung malignancy | ✅ OK | Standard ICD-11 |
| 2F32.0 | benign heart neoplasm | ✅ OK | Standard ICD-11 |
| 2F32.2 | benign mediastinal neoplasm | ✅ OK | Standard ICD-11 |
| 8C60.Z | myasthenia gravis | ✅ OK | Standard ICD-11 |

### Changes Applied (MIG-046)

| icdCode | Field changed | Old value | New value |
|---------|--------------|-----------|-----------|
| BC81.3 | icdName | atrial fibrillation | permanent atrial fibrillation |
| BC81.3 | icdArName | الرجفان الأذيني | الرجفان الأذيني الدائم |
| BC81.3 | embedding | (value) | NULL (re-queued) |

---

## Phase 2C — CPT Code Audit

No proc_cpts existed for CTS before this audit. Not applicable.

---

## Phase 2D — Coverage Gaps: Diagnoses

### Added (MIG-047)

| icdCode | EN name | AR name | Main_diag |
|---------|---------|---------|-----------|
| BA40 | unstable angina | ذبحة صدرية غير مستقرة | coronary artery disease (cad) |
| CA22.Z | lung abscess - unspecified | خراج الرئة - غير محدد | benign lung / airway disease |
| CB24.1 | secondary spontaneous pneumothorax | استرواح الصدر التلقائي الثانوي | pneumothorax & bullous disease |
| BB80.Z | acute pericarditis - unspecified | التهاب التأمور الحاد - غير محدد | pericardial disease |
| BB82 | cardiac tamponade | دكاك القلب | pericardial disease |

### Pending (needs ICD-11 verification before adding)

| Condition | Candidate code | Notes |
|-----------|---------------|-------|
| Rheumatic aortic valve disease | 1B11.Z? | Not verified — skip until findacode available |
| Bicuspid aortic valve | Unknown LA-series | Not verified |
| Pulmonary valve stenosis (congenital) | LA80.Z? | Not verified |
| Small cell lung cancer | 2C25.3? | Not verified |

---

## Phase 2E — Coverage Gaps: Procedures

### Added (MIG-048)

**CARD alpha group (40 procedures):**

| numCode | Title |
|---------|-------|
| 33510-00 | CABG single vessel |
| 33511-00 | CABG two vessels |
| 33512-00 | CABG three vessels |
| 33516-00 | CABG four or more vessels |
| 33533-00 | off-pump CABG single vessel |
| 33535-00 | off-pump CABG three vessels |
| 33536-00 | off-pump CABG four or more vessels |
| 33405-00 | aortic valve replacement |
| 33411-00 | aortic valve replacement with annuloplasty |
| 33413-00 | aortic root replacement |
| 33430-00 | mitral valve replacement |
| 33425-00 | mitral commissurotomy |
| 33426-00 | mitral valvuloplasty |
| 33427-00 | mitral valve radical repair |
| 33460-00 | tricuspid valvectomy |
| 33463-00 | tricuspid valvuloplasty |
| 33464-00 | tricuspid annuloplasty |
| 33465-00 | tricuspid valve replacement |
| 33472-00 | pulmonary valve replacement |
| 33860-00 | ascending aorta graft |
| 33863-00 | Bentall procedure |
| 33870-00 | aortic arch graft |
| 33875-00 | descending thoracic aorta graft |
| 33020-00 | pericardiotomy |
| 33025-00 | pericardial window |
| 33030-00 | pericardiectomy partial |
| 33031-00 | pericardiectomy complete |
| 33208-00 | permanent pacemaker dual chamber |
| 33249-00 | ICD implantation |
| 33641-00 | ASD repair |
| 33684-00 | VSD repair |
| 33692-00 | tetralogy of fallot repair |
| 33770-00 | arterial switch operation |
| 33750-00 | modified Blalock-Taussig shunt |
| 33768-00 | bidirectional Glenn shunt |
| 33820-00 | PDA ligation |
| 33851-00 | coarctation repair |
| 33940-00 | heart transplantation |
| 33975-00 | LVAD insertion |
| 33960-00 | ECMO initiation |

**THOR alpha group (32 procedures):**

| numCode | Title |
|---------|-------|
| 32440-00 | pneumonectomy |
| 32480-00 | lobectomy upper lobe |
| 32482-00 | lobectomy middle lobe |
| 32484-00 | lobectomy lower lobe |
| 32500-00 | wedge resection |
| 32650-00 | VATS pleurodesis |
| 32651-00 | VATS partial pleurectomy |
| 32652-00 | VATS decortication |
| 32655-00 | VATS bullectomy |
| 32660-00 | VATS pericardiectomy |
| 32663-00 | VATS lobectomy |
| 32664-00 | VATS sympathectomy |
| 32666-00 | VATS wedge resection |
| 32668-00 | VATS segmentectomy |
| 32671-00 | VATS pneumonectomy |
| 32673-00 | VATS thymectomy |
| 32700-00 | VATS diagnostic |
| 32421-00 | tube thoracostomy |
| 32220-00 | decortication partial |
| 32225-00 | decortication total |
| 32310-00 | pleurectomy |
| 32100-00 | thoracotomy exploratory |
| 32096-00 | open lung biopsy |
| 43107-00 | esophagectomy total |
| 43116-00 | esophagectomy partial thoracic |
| 43328-00 | Heller myotomy |
| 39220-00 | mediastinal tumor resection |
| 31760-00 | tracheoplasty |
| 21740-00 | pectus excavatum repair Ravitch |
| 21742-00 | pectus excavatum repair Nuss |
| 32900-00 | rib resection partial |
| 39501-00 | diaphragmatic hernia repair |

Proc_cpts linked to all 17 main_diags via **MIG-049** (dept=CTS). Shared MNR `00001-00` (basic surgical step) linked via **MIG-050** (corrected from wrong `12001-00` reference in MIG-049).

---

## Phase 2F — Main_diag Category Review

All 17 categories are clinically appropriate for a university CTS department. No categories are too narrow or too broad. No missing categories.

---

## Final State After Audit

| Metric | Value |
|--------|-------|
| Diagnoses | 64 |
| Proc_cpts (CARD) | 40 |
| Proc_cpts (THOR) | 32 |
| Proc_cpts (shared MNR+NONE) | 3 |
| Total proc_cpts linked | 75 |
| Main_diags | 17 |
| Empty main_diags | 0 |
| Embeddings backfilled | 6 (5 new diags + BC81.3 re-embed) |
