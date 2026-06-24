# MFS Department Audit
**Date (last updated)**: 2026-06-23
**Dept**: MFS — Maxillofacial Surgery | جراحة الوجه والفكين

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-23
**Current step**: Phase 6 — finalized
**Status**: complete

### Step status
- [x] Phase 1/2A/2B/2B.5/2C — audit done (18 ❌ wrong, 3 ✅; ~86% corrupt; 2 cross-dept MERGE)
- [x] Phase 2D — candidate diagnoses (+80 → 100)
- [x] Phase 2E — candidate procs (104 AAPC-verified; 21310 deleted-excluded)
- [x] Phase 3/4 — migs 111-116 written & applied ✅
- [x] Phase 5 — embeddings backfilled (88 diagnoses + 94 procs) ✅
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
111=FixMfsIcdCodes [applied ✅], 112=AddMfsDiagnosesBatch1 [applied ✅], 113=AddMfsDiagnosesBatch2 [applied ✅], 114=ImportMfsProcCpts1 [applied ✅], 115=ImportMfsProcCpts2 [applied ✅], 116=LinkMfsProcCptsToMainDiags [applied ✅]

### ▶ Next action
Done. **FINAL STATE (verified on staging): 12 main_diags, 100 diagnoses (all ICD-11-verified ✅, all embedded ✅), 105 linked proc_cpts (104 AAPC-verified oral/maxillofacial ops + MNR, all embedded ✅), 0 orphans, 0 empty categories. Every category ≥5 diagnoses & ≥7 procs. Audit complete.**

### Migration numbers reserved
111=FixMfsIcdCodes [pending], 112=AddMfsDiagnosesBatch1 [pending], 113=AddMfsDiagnosesBatch2 [pending], 114=ImportMfsProcCpts1 [pending], 115=ImportMfsProcCpts2 [pending], 116=LinkMfsProcCptsToMainDiags [pending] (split TBD)

### ▶ Next action
Phase 2A structural scan, then Phase 2B verify the 21 ICD-11 codes via icd11_search in batches of ~10. **Known WRONG (from SOC/HBP audits): the 4 oncology codes 2C10.0/2C10.1/2C12.0/2C13.0 are pancreas/liver/gallbladder codes used for oral/lip/tongue/salivary cancers.** Also suspect: facial-fracture codes DA0E.0/DA0F.0/DA0F.1/DA0F.2/DA0G.0 (DA0x = dental/oral disease chapter; fractures belong in N* injury chapter); cleft DA03.0/DA03.1 (cleft = LA40/LA42 developmental).

### Coverage targets
| Metric | Value |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 21 |
| Diagnoses gap to 100 | 79 |
| Proc_cpts (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none (0 procs) |

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### 2B — ICD-11 audit findings
**MFS heavily corrupt: facial fractures mis-chaptered into DA0x dental-disease chapter (belong NA02.x injury); DA4x cyst/tumour codes fabricated; cleft mis-coded; 4 oncology codes are pancreas/liver/gallbladder codes (the MFS oral-cancer mismap).**

| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| DA05.0 | developmental odontogenic cysts | ✅ OK | DA05.0 | Developmental odontogenic cysts (score 1.0) |
| DA4A.0 | ameloblastoma | ❌ WRONG | 2E83.1 | Benign osteogenic tumours of lower jaw (incl. ameloblastoma of lower jaw, score 0.89); DA4A not ameloblastoma |
| DA03.0 | cleft lip | ❌ WRONG | LA40.Z | Cleft lip, unspecified (score 1.0); cleft = developmental LA40 |
| DA03.1 | cleft palate | ❌ WRONG | LA42.Z | Cleft palate, unspecified (score 1.0) |
| DA0A.1 | loss of teeth due to accident/extraction/periodontal | ✅ OK | DA0A.1 | exact (score 0.84) |
| DA4B.0 | dentigerous cyst | ❌ WRONG | DA05.0 (MERGE) | Dentigerous cyst is a subtype under DA05.0 (no distinct leaf) → MERGE into existing DA05.0 row |
| DA4C.0 | periapical cyst | ❌ WRONG | DA09.8 | Radicular cyst (synonym "periapical cyst", score 0.83) |
| DA0G.0 | nasal fracture | ❌ WRONG | NA02.3 | Fracture of nasal bones (score 1.0); DA0G = oral-disease chapter |
| DA0F.1 | zygomatic fracture | ❌ WRONG | NA02.5 | Fracture of zygoma (score 0.84) |
| DA0F.2 | orbital floor fracture | ❌ WRONG | NA02.21 | Fracture of orbital floor (score 0.66) |
| DA07.8 | impacted teeth | ✅ OK | DA07.8 | Impacted teeth (score 1.0) |
| LA2A.0 | condylar hyperplasia of mandible | ❌ WRONG | DA0E.0Y&XA51B7 | Mandibular hyperplasia (synonym "unilateral condylar hyperplasia"); LA2A.0 not returned |
| DA12.0 | Ludwig angina | ❌ WRONG | DA01.30 | Cellulitis or abscess of soft tissues of the mouth (title "Cellulitis of floor of mouth", synonym "Ludwig's angina") |
| DA0E.0 | Le Fort fracture of maxilla | ❌ WRONG | NA02.4Z | Fracture of maxilla, unspecified (rename generic; add Le Fort I/II/III = NA02.40/.41/.42 as new) |
| DA0F.0 | mandibular fracture | ❌ WRONG | NA02.7Z | Fracture of mandible, unspecified (score 1.0) |
| 2C10.0 | squamous cell carcinoma of oral cavity | ❌ WRONG | 2B66.0 | SCC of other/unspecified parts of mouth. **2C10.0=Adenocarcinoma of pancreas, shared MFS+GS → MERGE (rename row→pancreatic adeno for GS, unlink MFS, link MFS→2B66.0)** |
| 2C10.1 | carcinoma of lip | ❌ WRONG | 2B60.Z | Malignant neoplasms of lip, unspecified. 2C10.1=Pancreatic NET (MFS-only) → recode if 2B60.Z free |
| 2C12.0 | carcinoma of tongue | ❌ WRONG | 2B62.Z | Malignant neoplasms of tongue, unspecified. 2C12.0=liver (MFS-only) → recode if 2B62.Z free |
| 2C13.0 | carcinoma of salivary gland | ❌ WRONG | 2B68.Z | Malignant neoplasm of major salivary gland NOS. **2C13.0=Adenocarcinoma of gallbladder, shared HBP+MFS → MERGE (rename row→gallbladder adeno for HBP, unlink MFS, link MFS→2B68.Z)** |
| DA50.0 | pleomorphic adenoma of parotid | ❌ WRONG | 2E91.x | Benign neoplasm of parotid/major salivary gland (mixed salivary gland tumour); confirm 2E91.0 parotid |
| DA0K.0 | temporomandibular joint disorder | ❌ WRONG | DA0E.8 | Temporomandibular joint disorders (score 1.0) |

**Tally: 18 ❌ WRONG, 0 ⚠️, 3 ✅ (~86% corrupt — worst yet).** 2 MERGEs (2C10.0→GS pancreatic, 2C13.0→HBP gallbladder); facial fractures DA0E/F/G→NA02.x; clefts→LA40/LA42; cysts/tumours DA4x→correct; TMJ/Ludwig/condylar mis-coded.

### 2B.5 — DB collision check → MIG-A plan (verified on staging)
**Simple RECODE (UPDATE, target free, MFS-only row):**
DA4A.0→2E83.1 (ameloblastoma) · DA4C.0→DA09.8 (radicular/periapical cyst) · DA0G.0→NA02.3 (nasal fx) · DA0F.1→NA02.5 (zygomatic fx) · DA0F.2→NA02.21 (orbital floor fx) · LA2A.0→DA0E.0Y&XA51B7 (mandibular/condylar hyperplasia) · DA12.0→DA01.30 (Ludwig angina) · DA0E.0→NA02.4Z (rename "fracture of maxilla") · DA0F.0→NA02.7Z (mandible fx) · DA50.0→2E91.0 (pleomorphic adenoma of parotid) · DA0K.0→DA0E.8 (TMJ disorders) · 2C10.1→2B60.Z (lip ca, MFS-only) · 2C12.0→2B62.Z (tongue ca, MFS-only)

**MERGE into existing shared rows (delete MFS row, link MFS to existing):**
- DA03.0 cleft lip → PRS **LA40.Z** (MFS:cleft lip & palate)
- DA03.1 cleft palate → PRS **LA42.Z** (MFS:cleft lip & palate)
- DA4B.0 dentigerous cyst → MFS's own **DA05.0** (relink to dentoalveolar surgery + jaw cysts; dentigerous has no distinct leaf)

**Cross-dept MERGE (rename shared row to its correct meaning for the other dept, unlink MFS, link MFS to correct code):**
- 2C10.0 "SCC oral cavity" (shared **GS**+MFS) → **rename row → "adenocarcinoma of pancreas"** (fixes GS, embedding NULL); unlink MFS; link MFS → SOC **2B66.0** (oral cancer)
- 2C13.0 "carcinoma of salivary gland" (shared **HBP**+MFS) → **rename row → "adenocarcinoma of the gallbladder"** (fixes HBP, embedding NULL); unlink MFS; link MFS → SOC **2B68.Z** (salivary gland pathology)

**✅ no-change (3):** DA05.0, DA0A.1, DA07.8.
**Targets free (recode/insert):** 2E83.1, DA09.8, NA02.3/.5/.21/.4Z/.7Z/.40/.41/.42, DA0E.0Y&XA51B7, DA01.30, 2B60.Z, 2B62.Z, 2E91.0, DA0E.8. **Targets shared (link):** 2B66.0/2B68.Z (SOC), LA40.Z/LA42.Z (PRS).
**MFS distinct after MIG-A: 20** (dentigerous merged into DA05.0). Then +80 → 100.

### 2C — CPT audit findings
N/A — no proc_cpts imported for MFS yet.

### 2D — Candidate diagnoses (+80 → 100; all codes icd11_search-verified). AR/desc authored in MIG-D.
Format: `code — EN` per category. (L)=link existing shared row; rest = new insert. Existing-after-MIG-A shown in [brackets].

**1. benign oral tumors** [DA05.0, 2E83.1] +5: DA05.1 nonodontogenic cyst · DA06.2 torus/exostosis of jaw · DA01.00 oral leukoplakia · FB80.0 fibrous dysplasia of jaw · DA01.15 recurrent aphthous/mouth ulcer
**2. cleft lip & palate** [LA40.Z, LA42.Z] +7: (L)LA40.0 unilateral cleft lip · (L)LA40.1 bilateral cleft lip · (L)LA42.0 cleft hard palate · (L)LA42.1 cleft soft palate · LA4Z cleft lip+alveolus+palate · LA51 facial cleft · LA56 Pierre Robin sequence
**3. dental implants** [DA0A.1] +4: DA0A.2 atrophy of edentulous alveolar ridge · DA0D.Y edentulous ridge disorder · LA30.0 anodontia · LA30.1 hypodontia
**4. dentoalveolar surgery** [DA09.8, DA05.0] +12: DA08.0 dental caries · DA08.3 nontraumatic tooth fracture · DA09.0 pulpitis · DA09.4 pulp degeneration · DA09.70 acute apical periodontitis · DA09.71 chronic apical periodontitis · DA0C.4 periodontal abscess · DA0C.0 acute periodontitis · DA0C.Y chronic periodontitis · DA0B.6 pericoronitis · DA0B.Y gingivitis · DA06.1 alveolar osteitis (dry socket) · CA0A.Y&XA1R64 oroantral fistula
**5. facial trauma** [NA02.3, NA02.5, NA02.21] +9: NA02.2Y orbital wall fracture · NA02.2Z orbital fracture NOS · NA02.20 orbital roof fracture · NA0D.02 fracture of tooth (enamel-dentin) · NA0D.03 complicated crown fracture · NA0D.06 root fracture · NA0D.13 lateral luxation of tooth · NA0D.15 avulsion of tooth · NA0D.1Z injury of periodontal tissues
**6. impacted teeth** [DA07.8] +4: DA07.6Y disturbances in tooth eruption · DA07.61 ankylosis of teeth · (dual)LA30.0 anodontia · (dual)LA30.1 hypodontia
**7. jaw cysts & pathology** [2E83.1, DA09.8, DA05.0, DA01.30, DA0E.0Y&XA51B7] +4: DA06.0 osteomyelitis of jaw · FB81.5 osteoradionecrosis of jaw · (L)FB81.2 MRONJ (drug-induced osteonecrosis) · LD24.22 cherubism
**8. jaw fractures** [NA02.5, NA02.21, NA02.4Z, NA02.7Z] +8: NA02.40 Le Fort I · NA02.41 Le Fort II · NA02.42 Le Fort III · NA02.70 condylar process fracture · NA02.73 fracture of ramus · NA02.74 fracture of angle · NA02.75 alveolar margin fracture · NA02.76 symphysis fracture
**9. oral cancer** [2B66.0, 2B60.Z, 2B62.Z] +8: 2B63.0 SCC of gum · 2B64.0 SCC of floor of mouth · 2B65.1 SCC of palate · 2B65.0 adenocarcinoma of palate · 2B61.Z cancer of base of tongue · 2E60.0 oral carcinoma in situ · (L)2B62.0 SCC of tongue · (L)2B60.1 SCC of lip
**10. orthognathic surgery** [DA0E.0Y&XA51B7] +6: DA0E.1 prognathism/retrognathism (jaw-cranial base) · DA0E.00 micrognathia · DA0E.5Z malocclusion · DA0E.6 dentofacial functional abnormality · LA52 facial asymmetry · LD2F.16 hemifacial microsomia
**11. salivary gland pathology** [2B68.Z, 2E91.0, DA01.30] +9: DA04.4 sialolithiasis · DA04.2 sialadenitis · DA04.5 mucocele/ranula · DA04.0 atrophy of salivary gland · DA04.1 hypertrophy of salivary gland · DA04.Y salivary fistula · 2B67.Z malignant neoplasm of parotid · 2B67.0 adenocarcinoma of parotid · 2E91.Z Warthin tumour
**12. temporomandibular joint disorders** [DA0E.8] +4: NA03.0 dislocation of jaw (TMJ) · FA34.2&XA2SM2 recurrent TMJ dislocation · FA34.4&XA2SM2 TMJ ankylosis · DA0E.7 dentofacial parafunctional disorder (bruxism)

**Total distinct = 100** (20 existing-after-MIG-A + 80 additions: 71 new inserts + 9 shared-row links). Shared links: LA40.0/.1/LA42.0/.1 (PRS), 2B62.0/2B60.1 (SOC), FB81.2 (ORTHO).

### 2E — proc_cpts (104 oral/maxillofacial CPTs; all AAPC-verified current). ⚠️ 21310 DELETED 2022 — excluded.
94 new inserts across alpha groups + 10 links to existing rows (PRS CLEF/EXCN, SOC HNCK). MNR linked to every category.
- **JCYS** (jaw cyst/tumour): 21030,21040,21046,21048,21025 (benign) + 21034,21044 (malignant) → benign oral tumors, jaw cysts, oral cancer
- **CLEF** (cleft; reuse PRS group): new 40702,42205,42210,42215,42226 + (link) 40700,40701,40720,42200,42235 → cleft
- **IMPL** (implant/graft): 21248,21249,21215,20900 → dental implants
- **VEST** (preprosthetic): 40840,40842,41874 → dental implants, dentoalveolar
- **DTAL** (dentoalveolar): 40810,41825,41826,41805,41115 → dentoalveolar, impacted teeth
- **ORIF** (fracture Tx): 21315,21320,21325,21330,21336,21338,21339,21346,21355,21356,21365,21385,21407,21408,21421,21422,21432,21445,21450,21453,21461,21462,21465,21470 → facial trauma, jaw fractures
- **ARCH** (fixation): 21110 → facial trauma, jaw fractures
- **ORTH** (orthognathic): 21141,21150,21154,21196,21193,21198,21206,21120,21121,21125,21127,21188,21208,21209,21247,21255 → orthognathic
- **TMJS** (TMJ surgery): 21010,21050,21060,21070,21073,21240,21480,21485,21490 → TMJ
- **SALV** (salivary): 42300,42330,42335,42340,42408,42409,42410,42440,42450 + (link HNCK)42415,42420 → salivary
- **ONCO** (oral cancer): 40510,41110,41112,41120,41130,41150,41155,42104,42106,42107,42120 + (link HNCK)40530,41135 + (link EXCN)21015 → oral cancer

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 111 | FixMfsIcdCodes | 13 recodes + 3 MERGEs + 2 cross-dept MERGEs (fix 18 wrong codes) | applied ✅ |
| 112 | AddMfsDiagnosesBatch1 | +37 new diagnoses + links (cats 1-6) | applied ✅ |
| 113 | AddMfsDiagnosesBatch2 | +36 new diagnoses + links (cats 7-12) | applied ✅ |
| 114 | ImportMfsProcCpts1 | 48 proc_cpts (JCYS,CLEF,IMPL,VEST,DTAL,ORIF) | applied ✅ |
| 115 | ImportMfsProcCpts2 | 46 proc_cpts (ARCH,ORTH,TMJS,SALV,ONCO) | applied ✅ |
| 116 | LinkMfsProcCptsToMainDiags | link 94 new + 10 shared procs + MNR to 12 main_diags | applied ✅ |

---

## Summary
| Metric | Count |
|---|---|
| Main_diags | 12 |
| Diagnoses | 21 → **100** |
| Proc_cpts (MFS-linked) | 0 → **105** (104 ops + MNR) |
| ICD-11 codes fixed (❌ wrong) | 18 |
| ICD-11 codes updated (⚠️ approximate) | 0 |
| CPT codes fixed | N/A (no procs pre-existed) |
| Structural issues resolved | 5 MERGEs (incl. 2 cross-dept fixing GS & HBP) |
| New diagnoses added (this run) | 80 (73 new rows + 7 shared-row links) |
| New proc_cpts added (this run) | 104 (94 new + 10 reused shared, all AAPC-verified) |
| Diagnoses re-embedded | 88 (15 recodes/renames + 73 new) |
| Proc_cpts re-embedded | 94 |

## ICD-11 Changes Applied (migration 111)
| Old code | Old name | New code | New name |
|---|---|---|---|
| DA4A.0 | ameloblastoma | 2E83.1 | Benign osteogenic tumours of lower jaw (ameloblastoma) |
| DA4C.0 | periapical cyst | DA09.8 | Radicular cyst |
| DA0G.0 | nasal fracture | NA02.3 | Fracture of nasal bones |
| DA0F.1 | zygomatic fracture | NA02.5 | Fracture of zygoma |
| DA0F.2 | orbital floor fracture | NA02.21 | Fracture of orbital floor |
| LA2A.0 | condylar hyperplasia of mandible | DA0E.0Y&XA51B7 | Mandibular hyperplasia |
| DA12.0 | Ludwig angina | DA01.30 | Cellulitis/abscess of soft tissues of mouth (Ludwig angina) |
| DA0E.0 | Le Fort fracture of maxilla | NA02.4Z | Fracture of maxilla, unspecified |
| DA0F.0 | mandibular fracture | NA02.7Z | Fracture of mandible, unspecified |
| DA50.0 | pleomorphic adenoma of parotid | 2E91.0 | Benign neoplasm of parotid gland |
| DA0K.0 | temporomandibular joint disorder | DA0E.8 | Temporomandibular joint disorders |
| 2C10.1 | carcinoma of lip | 2B60.Z | Malignant neoplasms of lip, unspecified |
| 2C12.0 | carcinoma of tongue | 2B62.Z | Malignant neoplasms of tongue, unspecified |
| DA03.0 | cleft lip | LA40.Z (MERGE→PRS) | Cleft lip, unspecified |
| DA03.1 | cleft palate | LA42.Z (MERGE→PRS) | Cleft palate, unspecified |
| DA4B.0 | dentigerous cyst | DA05.0 (MERGE→own) | Developmental odontogenic cysts (no distinct dentigerous leaf) |
| 2C10.0 | squamous cell carcinoma of oral cavity | 2B66.0 (MERGE); row→pancreatic adeno | SCC of mouth (MFS); **2C10.0 row renamed → Adenocarcinoma of pancreas — fixes GS** |
| 2C13.0 | carcinoma of salivary gland | 2B68.Z (MERGE); row→gallbladder adeno | Malignant neoplasm of salivary gland (MFS); **2C13.0 row renamed → Adenocarcinoma of gallbladder — fixes HBP** |

## CPT Changes Applied
N/A — MFS had no proc_cpts before this run; 104 oral/maxillofacial CPTs added (migrations 114-116; the deleted code 21310 was identified and excluded).

## Structural Fixes
- Resolved the long-flagged **MFS oral-cancer mismap**: the 4 oncology rows used pancreas/liver/gallbladder codes. `2C10.1`/`2C12.0` recoded to lip/tongue; `2C10.0`/`2C13.0` (shared with GS/HBP) **renamed in place to their correct meaning (pancreatic/gallbladder adeno), fixing GS & HBP**, with MFS relinked to proper oral/salivary cancer codes (SOC `2B66.0`/`2B68.Z`).
- Clefts (`DA03.0`/`DA03.1`) merged into PRS's `LA40.Z`/`LA42.Z`; dentigerous cyst merged into `DA05.0`.

## New Diagnoses Added
80 added (73 new rows + 7 shared-row links: PRS cleft subtypes LA40.0/.1/LA42.0/.1, SOC lip/tongue SCC 2B60.1/2B62.0, ORTHO MRONJ FB81.2). Full per-category list in working notes "2D".

## New Proc_cpts Added
104 oral/maxillofacial operations across 11 alpha-groups (JCYS, CLEF, IMPL, VEST, DTAL, ORIF, ARCH, ORTH, TMJS, SALV, ONCO) + shared MNR/HNCK/EXCN, all AAPC-verified current. Full list in working notes "2E".

## Still-Open Items
- **MFS oral-cancer mismap now RESOLVED** (was open across HBP/SOC audits). The MFS-side fix also corrected the shared GS (`2C10.0`) and HBP (`2C13.0`) rows.
- Condylar hyperplasia / TMJ-ankylosis / TMJ-recurrent-dislocation use postcoordinated codes (`DA0E.0Y&XA51B7`, `FA34.4&XA2SM2`, `FA34.2&XA2SM2`) as ICD-11 lacks single leaves; acceptable.
- Some odontogenic-tumour / developmental-cyst subtypes share `2E83.1`/`DA05.0` (ICD-11 lumping) so could not be separate rows; covered by the generic entries.
