# CTS Additional-Questions Audit (professor review)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-08
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (4 questions, 21 options, 63 links, 0 narrowing, 17 main_diags)
- [x] Phase 2A — critique of existing config
- [x] Phase 2B — question set decided (+urgency, +cpbStrategy; surgicalDomain/clinicalPresentation skipped, justified)
- [x] Phase 2C — option sets authored (+10 options on existing questions, 9 on new)
- [x] Phase 2D — link matrix + narrowing designed (links 63→83, narrowing 0→99)
- [x] Phase 3 — migrations written (159 ReviseCtsQuestionSet, 160 AddCtsQuestionNarrowing)
- [x] Phase 4 — applied + verified: **6 questions / 39 options / 83 links / 99 narrowing — exact match**; down() cycle tested (revert 160+159 → re-apply → counts identical); NS untouched (6/14); tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
159=ReviseCtsQuestionSet [applied ✅], 160=AddCtsQuestionNarrowing [applied ✅]

### ▶ Next action
None — audit complete. (Option `arValue` Arabic translations added for all 39 CTS options by migration 161, 2026-07-08.) Still-open (optional, future): per-category position narrowing if ever needed.

---

## 🔬 Working notes

### 2A — Critique of existing config (production-mirrored seed, authored under the old six-flag system)

| item | verdict | fix |
|---|---|---|
| `position` label/AR + 4 options | ✅ real, standard terms | append `other` (list not exhaustive) |
| `position` missing on *congenital acyanotic heart defect* | ❌ wrong — PDA ligation & coarctation repair (core acyanotic ops) are done via left posterolateral thoracotomy in lateral decubitus; positioning varies | ADD link |
| `position` off aortic valve / cad / arrhythmias / heart failure | ✅ correct — essentially always supine; answer doesn't discriminate | keep off |
| `approach` 8 options | ⚠️ asymmetric/incomplete — has *left* posterolateral thoracotomy but not *right* (standard open lung approach both sides); no MIDCAB approach (left anterolateral thoracotomy); no mediastinoscopy (mediastinal staging/biopsy workhorse); no catch-all | ADD `right posterolateral thoracotomy`, `left anterolateral thoracotomy`, `mediastinoscopy`, `other` |
| `region` ("Target structure") 9 options | ❌ gaps — the *chest wall deformities / tumors* category has NO valid answer; trachea/airway missing though "benign lung / airway disease" exists; arrhythmia surgery target (atria/appendage) missing; transplant/VAD target missing | ADD `chest wall`, `trachea / airway`, `atria / appendage`, `whole heart` |
| `region` linked to all 17 with identical full list | ❌ un-narrowed — lung categories offer "mitral valve" etc. | narrowing rows (see 2D) |
| `region` on 8 single-target categories (aortic valve, mitral, cad, arrhythmias, heart failure, pericardial, mediastinal, chest wall) | ❌ non-discriminating — after narrowing each would have exactly ONE valid option; a one-answer question teaches nothing | DELETE those 8 links (target is implied by the category) |
| `intraopEvents` on all 17 | ✅ keep | move sortOrder 3→9 so the narrative lands last in the form |
| no `surgicalDomain` | ✅ correctly absent — cardiac-vs-thoracic is fully derivable from the main_diag itself (unlike NS where one category spans both) | skip, documented |
| no `clinicalPresentation` | ✅ acceptable — operative-decision context is captured in structured form by the new `urgency` question; free-text presentation on every case adds burden without discriminating | skip, documented |

### 2B — Question set (final: 6 questions)

Kept: `position`, `approach`, `region`, `intraopEvents` (canonical keys, labels unchanged).
New dept-specific keys (both used by ≥2 categories, no canonical key fits):

| key | inputType | label / arLabel | rationale |
|---|---|---|---|
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | EuroSCORE-style operative status; the first thing an examiner asks about any cardiothoracic case; applies to all 17 categories |
| `cpbStrategy` | single_choice | Cardiopulmonary bypass strategy / استراتيجية المجازة القلبية الرئوية | THE cardiac-surgery viva question (on-pump/off-pump/DHCA); cardiac categories + pericardial only |

Question sortOrder after revision: position 0, approach 1, region 2, urgency 4, cpbStrategy 5, intraopEvents 9.

### 2C — Option sets (final values, lowercase; sortOrder in listed order)

- `position` (5): right lateral decubitus, supine, left lateral decubitus, semi-fowler, **+ other**
- `approach` (12): vats (video-assisted thoracoscopic surgery), mini-sternotomy, right anterolateral thoracotomy, clamshell incision, robotic-assisted thoracoscopy, median sternotomy, subxiphoid approach, left posterolateral thoracotomy, **+ right posterolateral thoracotomy, left anterolateral thoracotomy, mediastinoscopy, other**
- `region` (13): mitral valve, coronary arteries, right lung, thoracic aorta, left lung, aortic valve, pericardium / pleura, mediastinum, tricuspid / pulmonary valves, **+ chest wall, trachea / airway, atria / appendage, whole heart**
- `urgency` (4, new): elective, urgent, emergency, salvage
- `cpbStrategy` (5, new): on-pump - cardioplegic arrest, on-pump - beating heart, off-pump, hypothermic circulatory arrest, none

Totals: options 21 → **39** (+18). Option `arValue`: all 39 filled in Arabic by migration 161 (2026-07-08).

### 2D — Link matrix changes + narrowing

Link changes (63 → **83**):
- `urgency` → ALL 17 categories (+17)
- `cpbStrategy` → 10: aortic valve disease, cardiac arrhythmias, congenital acyanotic heart defect, congenital cyanotic heart defect, coronary artery disease (cad), heart failure & cardiomyopathy, mitral valve disease, pericardial disease, thoracic aortic aneurysm / dissection, tricuspid / multi-valve disease (+10)
- `position` → congenital acyanotic heart defect (+1)
- `region` → REMOVED from the 8 single-target categories listed in 2A (−8)

Narrowing (0 → **99** rows). Full value names used in migration ("vats…" = the full option value).

`approach` narrowing (74 rows):
| category | allowed approaches (n) |
|---|---|
| aortic valve disease | median sternotomy, mini-sternotomy, right anterolateral thoracotomy, other (4) |
| mitral valve disease | median sternotomy, mini-sternotomy, right anterolateral thoracotomy, robotic, other (5) |
| tricuspid / multi-valve disease | median sternotomy, mini-sternotomy, right anterolateral thoracotomy, robotic, other (5) |
| coronary artery disease (cad) | median sternotomy, left anterolateral thoracotomy, other (3) |
| cardiac arrhythmias | median sternotomy, vats, subxiphoid, robotic, other (5) |
| congenital acyanotic heart defect | median sternotomy, left posterolateral thoracotomy, vats, other (4) |
| congenital cyanotic heart defect | median sternotomy, left+right posterolateral thoracotomy, other (4) |
| heart failure & cardiomyopathy | median sternotomy, other (2) |
| pericardial disease | subxiphoid, median sternotomy, vats, left anterolateral thoracotomy, other (5) |
| thoracic aortic aneurysm / dissection | median sternotomy, left posterolateral thoracotomy, other (3) |
| primary lung cancer | vats, robotic, right+left posterolateral, mediastinoscopy, other (6) |
| metastatic/secondary lung disease | vats, robotic, right+left posterolateral, clamshell, other (6) |
| benign lung / airway disease | vats, robotic, right+left posterolateral, other (5) |
| pneumothorax & bullous disease | vats, right+left posterolateral, other (4) |
| pleural effusion & empyema | vats, right+left posterolateral, other (4) |
| mediastinal mass / thymoma | median sternotomy, vats, robotic, mediastinoscopy, other (5) |
| chest wall deformities / tumors | vats, right+left posterolateral, other (4) |

`region` narrowing (25 rows, only the 9 categories keeping region):
| category | allowed targets (n) |
|---|---|
| tricuspid / multi-valve disease | tricuspid / pulmonary valves, mitral valve, aortic valve (3) |
| congenital acyanotic heart defect | whole heart, thoracic aorta (2) |
| congenital cyanotic heart defect | whole heart, thoracic aorta (2) |
| thoracic aortic aneurysm / dissection | thoracic aorta, aortic valve (2) |
| primary lung cancer | right lung, left lung, mediastinum, chest wall, trachea / airway (5) |
| metastatic/secondary lung disease | right lung, left lung (2) |
| benign lung / airway disease | right lung, left lung, trachea / airway (3) |
| pneumothorax & bullous disease | right lung, left lung, pericardium / pleura (3) |
| pleural effusion & empyema | pericardium / pleura, right lung, left lung (3) |

No position/urgency/cpbStrategy narrowing (small, generally-applicable lists).

### Expected totals after 159+160
questions **6** · options **39** · links **83** (17×urgency + 17×approach + 17×intraopEvents + 13×position + 9×region + 10×cpbStrategy) · narrowing **99**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000159 | ReviseCtsQuestionSet | applied ✅ (2026-07-08) |
| 1750000000160 | AddCtsQuestionNarrowing | applied ✅ (2026-07-08) |

### Final verification (staging, 2026-07-08)
- CTS: questions=6, options=39, links=83, narrowing=99 — exact match with the 2D plan.
- Every category has a deliberate question set; 0 ⚠️ NO_QUESTIONS; every choice question ≥2 options.
- Region kept only where it discriminates (9 categories, narrowed 2–5 targets); the 8 single-target categories dropped it (target implied by category).
- down() tested: revert 160+159 → re-apply → identical counts. NS config untouched (6 questions / 14 links). `npx tsc --noEmit` clean.
