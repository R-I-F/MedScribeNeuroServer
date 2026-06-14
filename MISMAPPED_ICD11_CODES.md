# Mismapped ICD-11 codes (for review)

> **STATUS: RESOLVED 2026-06-15** — all rows below were corrected by migration
> `1750000000024-FixMismappedIcdCodes` (DC31.0→DA20.3, DC31.1→DC32, JA00.0→JA01,
> JA40.0→JA8B.Z, 2C73.2→2C73.Z). Kept here as an audit record.


These existing `diagnoses` rows have an ICD-11 code that does **not** match the
condition named/used. The clinical name and department placement may be correct,
but the `icdCode` is wrong per WHO ICD-11 MMS. Semantic search is unaffected (it
runs on names/descriptions, not codes), but the codes are unreliable as references.

Found while filling empty main_diags (2026-06-14). **None are in Neurosurgery.**

| Stored code | Stored name | Correct per ICD-11 | Suggested fix |
|---|---|---|---|
| `DC31.0` | rupture or perforation of oesophagus | `DC31.0` = Acute idiopathic pancreatitis | oesophageal perforation ≈ `DA2Y`/`DA2Z` range — verify |
| `DC31.1` | chronic pancreatitis | `DC31.1` = Acute alcohol-induced pancreatitis | chronic pancreatitis = `DC32` — verify |
| `JA00.0` | ectopic pregnancy | `JA00.0` = Spontaneous abortion | ectopic pregnancy = `JA01` — verify |
| `JA40.0` | placenta praevia | `JA40.0` = Threatened abortion | placenta praevia = `JA42`/`JB05` range — verify |
| `2C73.2` | carcinoma of ovary (generic) | `2C73.2` = Granulosa cell malignant tumour of ovary | use generic `2C73` or specific subtype (`2C73.03` high-grade serous) — minor specificity mismatch |

> Note: the whole `DC31` branch is **acute pancreatitis** in ICD-11; chronic pancreatitis is `DC32`.

## Additional mismaps discovered later (NOT yet fixed)

Found incidentally while strengthening thin main_diags. None in Neurosurgery. These suggest a full audit of all original ICD-11 codes would be worthwhile.

| Stored code | Stored name | Correct per ICD-11 | Suggested fix |
|---|---|---|---|
| `DC10.2` | gallbladder polyp | `DC10.2` = Fistula of gallbladder or bile duct | gallbladder polyp ≈ `2E92.6`/`DC12` range — verify |

## Full audit 2026-06-15 (all 482 codes scanned by chapter consistency)

**CONFIRMED mismapped (web-verified this session):**
| Stored code | Stored name | ICD-11 says this code is | Correct code for the name |
|---|---|---|---|
| `BA41.0` | carotid artery stenosis | Acute STEMI | carotid stenosis ≈ `BD5x`/`8B22` — verify |
| `BD10.0` | peripheral arterial occlusive disease | Congestive heart failure (BD10) | PAD = `BD4Z`/`BD40` family |
| `BD10.1` | critical limb ischaemia | (child of BD10 = CHF) | `BD4x` |
| `BD10.2` | renal artery stenosis | (child of BD10 = CHF) | verify |
| `BD10.3` | mesenteric artery ischaemia | (child of BD10 = CHF) | verify |
| `BD10.4` | subclavian artery stenosis | (child of BD10 = CHF) | verify |
| `BD11.0` | acute limb ischaemia | Left ventricular failure (BD11 = HF) | `BD42`/`BD4x` |

**STRONGLY SUSPECTED (chapter mismatch; pending web verification):**
ENT ear on respiratory(CA) codes: `CA09.0` otitis media, `CA22.0` otosclerosis (CA22=COPD), `CA23.0` CSOM, `CA23.2` cholesteatoma, `CA24.0` TM perforation, `CA30.0` hearing loss, `CA43.0` BPPV, `CA44.0` Meniere.
ENT nose/throat on `AA` codes: `AA05.0` epistaxis, `AA12.0/.1/.3` rhinosinusitis/polyp, `AA40.0/.2` tonsillitis/abscess.
GI/onc: `2A10.0` colorectal adenoca (colon=2B90/91), `2C71.0` thyroid carcinoma (thyroid=2D10), `DA22.0` achalasia (DA22=GORD), `DA24.0` diaphragmatic hernia (DA24=oesophagitis), `DC94.0` acute pancreatitis & `DC94.1` chronic pancreatitis (pancreatitis=DC31/DC32).
Other: `FA82.0` fracture of clavicle (FA82=spinal stenosis), `LB70.0` lipoma (LB70=cranium anomaly), `1B10.Z`/`1B41.Z` cardiac-on-infection codes.

> None of the above are in Neurosurgery.

### Resolution
**FIXED 2026-06-15** by migration `1750000000026-FixAuditedMismapsBatch1` (20 clean 1:1 recodes, verified):
CA09.0→AB00, CA22.0→AB33, CA23.0→AA91.Z, CA23.2→AB12, CA24.0→AB13, CA30.0→AB51.1,
CA43.0→AB31.2, CA44.0→AB31.0, AA05.0→MD20, AA12.0→CA01, AA12.1→CA0A.Z, AA12.3→CA0J,
AA40.0→CA03, AA40.2→CA0K.1, 2A10.0→2B90, 2C71.0→2D10, DA22.0→DA21.0, DA24.0→DD50.0,
LB70.0→2E80.0, FA82.0→NC12.0.

### RESOLVED 2026-06-15 — cardiovascular remodel (migration `1750000000027`)
Fixed: BD10.0→BD40.Z, BD10.1→BD4Z, BD10.2→BD40.2, BD10.3→BD40.Y, BD11.0→BD30.2,
BD40.0→BD50.Z, BD40.1→BD50.3, BD50.0(varicose)→BD74.1, BD42.1→BD50.0.
Merged duplicates: DC94.0→DC31.Z, DC94.1→DC32 (deleted, links repointed).
**Still left as-is (no distinct ICD-11 stenosis leaf — need site extension codes):**
`BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis.

### (historical) cardiovascular cluster — now resolved above
This section is tangled: multiple mismapped names compete for the same/adjacent codes, so
blind recoding would create new collisions or imprecise codes. Needs deliberate redesign:
| Stored code | Stored name | Issue |
|---|---|---|
| `BA41.0` | carotid artery stenosis | BA41.0 = STEMI; carotid stenosis has no clean leaf (cerebrovascular `8B22` grouping) |
| `BD10.0` | peripheral arterial occlusive disease | BD10 = congestive heart failure; PAD = `BD40`/`BD4Z` (but `BD40.0` is occupied below) |
| `BD10.1` | critical limb ischaemia | child of BD10 (CHF) |
| `BD10.2` | renal artery stenosis | should be `BD40.2` |
| `BD10.3` | mesenteric artery ischaemia | child of BD10 (CHF) |
| `BD10.4` | subclavian artery stenosis | child of BD10 (CHF); no clean leaf |
| `BD11.0` | acute limb ischaemia | BD11 = heart failure; acute limb ischaemia = `BD30.2` |
| `BD40.0` | aneurysm of aortic root | BD40.0 = lower limb atherosclerosis; aortic root aneurysm ≈ `BA80`/`BD50` |
| `BD40.1` | thoracic aortic aneurysm | BD40.1 = atherosclerosis of aorta; TAA ≈ `BD50.x` |
| `BD42.1` | dissection of thoracic aorta | BD42 = Raynaud phenomenon; dissection = `BD50.x` |
| `BD50.0` | varicose veins of lower extremity | BD50 = aortic aneurysm/dissection; varicose veins = `BD7x` |

### STILL OPEN — duplicate pancreatitis entries (need merge, not recode)
`DC94.0` (acute pancreatitis) and `DC94.1` (chronic pancreatitis) duplicate the correct
`DC31.Z` / `DC32` added earlier. Fix = repoint their links to DC31.Z/DC32 and delete the duplicates.

