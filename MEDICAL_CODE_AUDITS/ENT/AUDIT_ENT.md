# ENT Department Audit
**Date (last updated)**: 2026-06-27
**Dept**: ENT — Otolaryngology (الأنف والأذن والحنجرة)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-27
**Current step**: COMPLETE
**Status**: complete
**Final state**: 102 ENT diagnoses (all ICD-11 verified ✅, all embedded ✅), 106 linked proc_cpts (105 AAPC-verified active + MNR; 81 ENT-specific imported + 24 reused shared GS/SOC/MFS rows, all embedded ✅), 13 main_diags; 0 orphans, every category ≥5 diagnoses & ≥5 dept-specific procs.

### Step status
- [x] Phase 1 — state loaded (29 diags, 0 procs, 13 main_diags)
- [x] Phase 2A — structural scan (0 orphans, 0 empty-diag; 13 no-proc → MIG-E/F)
- [x] Phase 2B — ICD-11 audit (29/29 — 18 OK + 3 name-fix + 4 approx + 4 wrong; ~14% corrupt)
- [x] Phase 2C — CPT audit | N/A (dept had 0 proc_cpts)
- [x] Phase 2D — candidate diagnoses (73 listed / +71 target ✅ → 102 total; every category ≥5)
- [x] Phase 2E — candidate procs (105 listed / +100 target ✅; 81 new + 24 reused shared)
- [x] Phase 3 — migrations written (132-138)
- [x] Phase 4 — migrations applied ✅ (all green first run)
- [x] Phase 5 — embeddings backfilled (64 diagnoses + 81 procs)
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
- 132 = FixEntIcdCodes (MIG-A) [applied ✅]
- 133 = AddEntDiagnosesBatch1 (ear/hearing/otitis/mastoid/TM, 23) [applied ✅]
- 134 = AddEntDiagnosesBatch2 (nose/sinus/larynx/pharynx/tonsil/OSA, 29) [applied ✅]
- 135 = AddEntDiagnosesBatch3 (H&N cancer/thyroid/salivary, 21) [applied ✅]
- 136 = ImportEntProcCpts1 (FESS/SEPT/NASF/TONS/OSAS, 41) [applied ✅]
- 137 = ImportEntProcCpts2 (MYRT/EARC/TYMP/MAST/STAP/LARY + 3 THYR + 1 HNCK, 40) [applied ✅]
- 138 = LinkEntProcCptsToMainDiags (105 procs + MNR) [applied ✅]

### ▶ Next action
NONE — ENT audit complete. (Not committed; commit only on explicit user request.)

## Coverage targets
| Metric | Value |
|---|---|
| Main_diags | 13 |
| Diagnoses (current) | 29 |
| Diagnoses gap to 100 | 71 |
| Proc_cpts dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none (0 procs) |

## 🔬 Working notes (verification log)

### 2A — Structural scan findings
- 0 orphaned diagnoses, 0 empty-of-diagnosis categories. 13 no-proc (expected; 0 procs) → MIG-E/F.
- Arabic/encoding fixes (rename, embedding NULL): AB31.0 EN "MeniÃ¨re disease"(mojibake)→"Meniere disease"; AB12 AR "ورم كوليستيروليني"→"الورم الصفراوي"; CA0H.1 AR "ورم حليمي"(papilloma)→"سَليلة"(polyp).
- **Collision check (staging query)**: 2 recode targets pre-exist → MERGEs: DA50.2→DA04.4 (sialolithiasis, MFS-owned); DA50.3→DA05.Y (branchial cleft cyst, PEDSURG-owned). Other 6 targets free (in-place recodes). All ENT source rows are ENT-only.

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| CA01 | acute bacterial rhinosinusitis | ✅ OK | CA01 | Acute sinusitis |
| CA0A.Z | chronic rhinosinusitis | ✅ OK | CA0A.Z | Chronic rhinosinusitis, unspecified |
| CA01.0 | deviated nasal septum | ❌ WRONG (CA01=acute sinusitis) | CA0D | Deviated nasal septum |
| AB31.0 | MeniÃ¨re disease | ⚠️ NAME (mojibake) | AB31.0 | Meniere disease |
| AB31.2 | benign paroxysmal positional vertigo | ✅ OK | AB31.2 | Benign positional paroxysmal vertigo |
| AB33 | otosclerosis | ✅ OK | AB33 | Otosclerosis |
| AB51.1 | sudden sensorineural hearing loss | ⚠️ APPROX (AB51.1=acquired SNHL) | AB55 | Sudden idiopathic hearing loss |
| AB11.0 | acute mastoiditis | ✅ OK | AB11.0 | Acute mastoiditis |
| AB11.1 | chronic mastoiditis | ✅ OK | AB11.1 | Chronic mastoiditis |
| AB12 | cholesteatoma of middle ear | ✅ OK (AR name-fix) | AB12 | Cholesteatoma of middle ear |
| CA0J | nasal polyp | ⚠️ APPROX (parent→leaf; AR fix) | CA0J.Z | Nasal polyp, unspecified |
| MD20 | epistaxis | ✅ OK | MD20 | Epistaxis |
| CA62.0 | obstructive sleep apnoea | ❌ WRONG (OSA is ch.7 sleep) | 7A41 | Obstructive sleep apnoea |
| AB00 | acute otitis media | ✅ OK | AB00 | Acute otitis media |
| AA91.Z | chronic suppurative otitis media | ✅ OK | AA91.Z | Chronic suppurative otitis media |
| AB13 | tympanic membrane perforation | ⚠️ APPROX (parent→leaf) | AB13.Z | Perforation of tympanic membrane, unspecified |
| 2B6B.1 | carcinoma of nasopharynx | ✅ OK (AR name-fix) | 2B6B.1 | Malignant epithelial neoplasms of nasopharynx |
| 2C23.Z | carcinoma of larynx | ✅ OK | 2C23.Z | Malignant neoplasms of larynx, unspecified |
| 2F00.1 | recurrent respiratory papillomatosis | ✅ OK | 2F00.1 | Recurrent respiratory papillomatosis |
| CA0H.1 | polyp of vocal cord or larynx | ✅ OK (AR=papilloma, fix to polyp) | CA0H.1 | Polyp of vocal cord or larynx |
| CA0H.5 | stenosis of larynx | ✅ OK | CA0H.5 | Stenosis of larynx |
| DA50.2 | parotid gland calculus | ❌ WRONG (sialolithiasis=DA04.4) | DA04.4 | Sialolithiasis |
| DA50.3 | branchial cyst | ❌ WRONG (DA50.3=salivary) | DA05.Y | Branchial cleft cyst (other cysts of oral/facial-neck) |
| 2D10.1 | papillary carcinoma of thyroid | ✅ OK | 2D10.1 | Papillary carcinoma of thyroid gland |
| 5A01.2 | nontoxic multinodular goitre | ✅ OK | 5A01.2 | Nontoxic multinodular goitre |
| 5A02.0 | thyrotoxicosis with diffuse goitre | ✅ OK | 5A02.0 | Thyrotoxicosis with diffuse goitre (Graves) |
| 5A51.0 | primary hyperparathyroidism | ✅ OK | 5A51.0 | Primary hyperparathyroidism |
| CA03 | tonsillitis | ⚠️ APPROX (parent→leaf) | CA03.Z | Acute tonsillitis, unspecified |
| CA0K.1 | peritonsillar abscess | ✅ OK | CA0K.1 | Peritonsillar abscess |

**2B RESULT (29 codes): 18 clean ✅ + 3 name-only fixes (AB31.0 mojibake, AB12 AR, CA0H.1 AR) + 4 ⚠️ recodes (AB51.1→AB55, CA0J→CA0J.Z, AB13→AB13.Z, CA03→CA03.Z) + 4 ❌ recodes (CA01.0→CA0D, CA62.0→7A41, DA50.2→DA04.4, DA50.3→DA05.Y).** ENT least corrupt yet (~14% code-wrong; earlier migrations 026/035 fixed the bulk). Collision check needed before MIG-A.
### 2C — CPT audit findings
N/A — ENT has 0 proc_cpts imported yet.

### 2D — Candidate diagnoses (planned)
> AR names + EN/AR descriptions authored in MIG-D. All codes icd11_search-verified.

**Hearing loss / otitis / ear (batch 1)**
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| AB54 | presbycusis (age-related hearing loss) | hearing loss | NO |
| AB37 | noise-induced hearing loss | hearing loss | NO |
| AB51.0 | acquired conductive hearing loss | hearing loss | NO |
| MC41 | tinnitus | hearing loss | NO |
| 2A02.3 | vestibular schwannoma (acoustic neuroma) | hearing loss | NO |
| AB30.1 | labyrinthitis | hearing loss | NO |
| AB30.0 | vestibular neuritis | hearing loss | NO |
| AA82 | chronic serous/mucoid otitis media (OME) | otitis media with effusion | NO |
| AA3Z | otitis externa | otitis media with effusion | NO |
| AA02 | malignant (necrotising) otitis externa | otitis media with effusion | NO |
| AB10.Z | Eustachian tube dysfunction | otitis media with effusion | NO |
| AB17 | adhesive middle ear disease | otitis media with effusion | NO |
| AA42 | impacted cerumen | otitis media with effusion | NO |
| 8B88.0 | facial nerve (Bell) palsy | mastoiditis | NO |
| AB16 | tympanosclerosis | tympanic membrane perforation | NO |

**Nose/sinus/larynx/tonsil (batch 2)**
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| CA08.0Z | allergic rhinitis | chronic sinusitis | NO |
| CA0C | cyst or mucocele of nose/nasal sinus | chronic sinusitis | NO |
| CA0E | hypertrophy of nasal turbinates | deviated septum | NO |
| CA0Y&XA8D47 | perforation of nasal septum | deviated septum | NO |
| CA0J.Y | antrochoanal polyp (other specified nasal polyp) | nasal polyps | NO |
| 2E90.6 | juvenile nasopharyngeal angiofibroma (benign nasopharynx) | nasal polyps | NO |
| CA0H.0 | paralysis of vocal cords or larynx | laryngeal pathology | NO |
| CA0H.2 | nodules of vocal cords | laryngeal pathology | NO |
| CA05.0 | acute laryngitis | laryngeal pathology | NO |
| LA71.0 | congenital laryngomalacia | laryngeal pathology | NO |
| CA0G | chronic laryngitis or laryngotracheitis | laryngeal pathology | NO |
| ND72.3 | foreign body in larynx | laryngeal pathology | NO |
| CA0F.1 | hypertrophy of adenoids | tonsillitis & adenoid hypertrophy | NO |
| CA0F.0 | hypertrophy of tonsils | tonsillitis & adenoid hypertrophy | NO |
> NOTE: inverted papilloma skipped — its code 2F7Z is occupied by NS's mislabeled "epidermoid/dermoid tumours" (MISMAPPED open item); no free code.

**Head & neck cancer / thyroid / salivary / pharynx (batch 3)**
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| 2B66.0 | squamous cell carcinoma of mouth (oral cavity) | head & neck cancer | NO |
| 2B62.Z | malignant neoplasm of tongue | head & neck cancer | NO |
| 2B69.Z | malignant neoplasm of tonsil (oropharyngeal ca) | head & neck cancer | NO |
| 2B6D.Z | malignant neoplasm of hypopharynx | head & neck cancer | NO |
| 2C22.Z | malignant neoplasm of accessory (maxillary) sinus | head & neck cancer | NO |
| 2C20.Z | malignant neoplasm of nasal cavity | head & neck cancer | NO |
| 2B67.Z | malignant neoplasm of parotid gland | head & neck cancer + salivary gland disease | NO |
| 2D10.4 | medullary carcinoma of thyroid | thyroid & parathyroid diseases | NO |
| 2D10.3 | undifferentiated (anaplastic) carcinoma of thyroid | thyroid & parathyroid diseases | NO |
| 2D10.0 | follicular carcinoma of thyroid | thyroid & parathyroid diseases | NO |
| DA05.Y&XA0SH3 | thyroglossal duct cyst | thyroid & parathyroid diseases | NO |
| 5A03.20 | Hashimoto thyroiditis | thyroid & parathyroid diseases | NO |
| 2E91.0 | pleomorphic adenoma (benign neoplasm of parotid) | salivary gland disease | NO |
| 2E91.Z | Warthin tumour (benign major salivary gland) | salivary gland disease | NO |
| DA04.2 | sialoadenitis | salivary gland disease | NO |
| DA04.5 | mucocele/ranula of salivary gland | salivary gland disease | NO |
| CA0K.0 | retropharyngeal or parapharyngeal abscess | tonsillitis & adenoid hypertrophy | NO |
| MD11.Y | snoring | obstructive sleep apnea | NO |
| AB11.2 | petrositis | mastoiditis | NO |
| CB62 | postprocedural (acquired) subglottic stenosis | laryngeal pathology | NO |

**Gap-fillers (batch 4)**
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| CA01&XA1R64 | acute maxillary sinusitis | chronic sinusitis | NO |
| 1F20.11 | chronic aspergillosis of paranasal sinuses (fungal sinusitis) | chronic sinusitis | NO |
| CA0K.Y&XA43C9 | furuncle of nose | deviated septum | NO |
| LA70.2 | choanal atresia | deviated septum | NO |
| 7A40.Z | central sleep apnoea | obstructive sleep apnea | NO |
| 7A42.0 | obesity hypoventilation syndrome | obstructive sleep apnea | NO |
| NA0A.2 | traumatic rupture of ear drum | tympanic membrane perforation | NO |
| AB18 | discontinuity or dislocation of ear ossicles | tympanic membrane perforation | NO |
| AB53 | ototoxic hearing loss | hearing loss | NO |
| AB51.Z | acquired hearing impairment (deafness) | hearing loss | NO |
| CA0H.Y | granuloma of larynx (other specified larynx disease) | laryngeal pathology | NO |
| CA06.1 | acute epiglottitis and supraglottitis | laryngeal pathology | NO |
| 2B60.1 | squamous cell carcinoma of lip | head & neck cancer | NO |
| DA01.00 | oral leukoplakia | head & neck cancer | NO |
| 2D6Z | metastatic malignant neoplasm to lymph node (cervical nodal metastasis) | head & neck cancer | NO |
| 5A03.1 | subacute (de Quervain) thyroiditis | thyroid & parathyroid diseases | NO |
| DA01.30 | Ludwig angina (cellulitis/abscess of mouth soft tissue) | tonsillitis & adenoid hypertrophy | NO |
| AA40.2 | cholesteatoma of external auditory canal | otitis media with effusion | NO |

**Top-up (batch 5)**
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| ND72.1 | foreign body in nostril | nasal polyps | NO |
| NA00.3&XJ1C6 | nasal septal haematoma | deviated septum | NO |
| NA00.2&XJ1C6&XA4E71 | haematoma of auricle (pinna) | otitis media with effusion | NO |
| AA04&XA6ZY6 | perichondritis of external ear (auricle) | otitis media with effusion | NO |
| 2F37.Y | parathyroid adenoma | thyroid & parathyroid diseases | NO |
| LA71.Y | congenital laryngeal web | laryngeal pathology | NO |
> Dual-links planned (no new row): CA0F.0/CA0F.1 (tonsil/adenoid hypertrophy) → also obstructive sleep apnea; 2B67.Z (parotid ca) → also salivary gland disease.

**2D TOTAL: 73 new candidate diagnoses → 29 + 73 = 102 ENT-linked. Per-category (final): chronic sinusitis 6, deviated septum 6, head & neck cancer 12, hearing loss 13, laryngeal pathology 14, mastoiditis 5, nasal polyps 5, obstructive sleep apnea 6 (incl. 2 dual-links), otitis media with effusion 11, salivary gland disease 7, thyroid & parathyroid 11, tonsillitis & adenoid hypertrophy 6, tympanic membrane perforation 6. Every category ≥5 ✅. Several rows are shared (MFS/SOC/NS/PEDSURG-owned): linked via ON CONFLICT.**

### 2E — Candidate proc_cpts (planned, AAPC-verified — all active unless noted)
| alphaCode | numCode | EN title | main_diag(s) |
|---|---|---|---|
| FESS | 31231 | nasal endoscopy, diagnostic | chronic sinusitis |
| FESS | 31237 | nasal/sinus endoscopy with biopsy/polypectomy/debridement | chronic sinusitis ; nasal polyps |
| FESS | 31254 | endoscopic anterior ethmoidectomy (partial) | chronic sinusitis |
| FESS | 31255 | endoscopic total ethmoidectomy | chronic sinusitis |
| FESS | 31256 | endoscopic maxillary antrostomy | chronic sinusitis |
| FESS | 31267 | endoscopic maxillary antrostomy with tissue removal | chronic sinusitis ; nasal polyps |
| FESS | 31276 | endoscopic frontal sinus exploration | chronic sinusitis |
| FESS | 31287 | endoscopic sphenoidotomy | chronic sinusitis |
| FESS | 31288 | endoscopic sphenoidotomy with tissue removal | chronic sinusitis |
| FESS | 31240 | endoscopic concha bullosa resection | chronic sinusitis ; deviated septum |
| SEPT | 30520 | septoplasty | deviated septum |
| SEPT | 30140 | submucous resection of inferior turbinate | deviated septum |
| SEPT | 30130 | excision of inferior turbinate | deviated septum |
| SEPT | 30802 | ablation of inferior turbinate, intramural | deviated septum |
| SEPT | 30630 | repair of nasal septal perforation | deviated septum |
| SEPT | 30560 | lysis of nasal synechiae | deviated septum |
| SEPT | 30420 | rhinoplasty, primary, including septum | deviated septum |
| SEPT | 30901 | control of anterior nasal hemorrhage, simple | deviated septum |
| SEPT | 30903 | control of anterior nasal hemorrhage, complex | deviated septum |
| SEPT | 30905 | control of posterior nasal hemorrhage, initial | deviated septum |
| NASF | 30110 | excision of nasal polyp, simple | nasal polyps |
| NASF | 30115 | excision of extensive nasal polyps | nasal polyps |
| NASF | 30300 | removal of intranasal foreign body | nasal polyps |
| NASF | 31040 | pterygomaxillary fossa surgery (juvenile angiofibroma) | nasal polyps |
| TONS | 42820 | tonsillectomy and adenoidectomy, age <12 | tonsillitis & adenoid hypertrophy ; obstructive sleep apnea |
| TONS | 42821 | tonsillectomy and adenoidectomy, age 12+ | tonsillitis & adenoid hypertrophy ; obstructive sleep apnea |
| TONS | 42825 | tonsillectomy, age <12 | tonsillitis & adenoid hypertrophy |
| TONS | 42826 | tonsillectomy, age 12+ | tonsillitis & adenoid hypertrophy |
| TONS | 42830 | adenoidectomy, primary, age <12 | tonsillitis & adenoid hypertrophy ; obstructive sleep apnea |
| TONS | 42831 | adenoidectomy, primary, age 12+ | tonsillitis & adenoid hypertrophy ; obstructive sleep apnea |
| TONS | 42836 | adenoidectomy, secondary, age 12+ | tonsillitis & adenoid hypertrophy |
| TONS | 42700 | incision & drainage of peritonsillar abscess | tonsillitis & adenoid hypertrophy |
| TONS | 42720 | I&D retropharyngeal/parapharyngeal abscess, intraoral | tonsillitis & adenoid hypertrophy |
| TONS | 42725 | I&D retropharyngeal/parapharyngeal abscess, external | tonsillitis & adenoid hypertrophy |
| TONS | 42960 | control of oropharyngeal hemorrhage (post-tonsillectomy) | tonsillitis & adenoid hypertrophy |
| OSAS | 42145 | palatopharyngoplasty (UPPP) | obstructive sleep apnea |
| MYRT | 69420 | myringotomy with aspiration/eustachian tube inflation | otitis media with effusion |
| MYRT | 69421 | myringotomy with aspiration, general anesthesia | otitis media with effusion |
| MYRT | 69433 | tympanostomy tube, local anesthesia | otitis media with effusion |
| MYRT | 69436 | tympanostomy tube, general anesthesia | otitis media with effusion |
| MYRT | 69540 | excision of aural polyp | otitis media with effusion |
| EARC | 69210 | removal of impacted cerumen, instrumentation | otitis media with effusion |
| EARC | 69200 | removal of foreign body, external auditory canal | otitis media with effusion |
| TYMP | 69610 | repair of tympanic membrane perforation | tympanic membrane perforation |
| TYMP | 69620 | myringoplasty | tympanic membrane perforation |
| TYMP | 69631 | tympanoplasty without mastoidectomy | tympanic membrane perforation |
| TYMP | 69632 | tympanoplasty with ossicular reconstruction | tympanic membrane perforation |
| TYMP | 69635 | tympanoplasty with antrotomy/mastoidectomy | tympanic membrane perforation ; mastoiditis |
| TYMP | 69641 | tympanoplasty with mastoidectomy | tympanic membrane perforation |
| MAST | 69501 | transmastoid antrotomy (simple mastoidectomy) | mastoiditis |
| MAST | 69502 | mastoidectomy, complete | mastoiditis |
| MAST | 69505 | mastoidectomy, modified radical | mastoiditis |
| MAST | 69511 | mastoidectomy, radical | mastoiditis |
| MAST | 69740 | suture/decompression of facial nerve, intratemporal | mastoiditis |
| MAST | 69955 | total facial nerve decompression/repair | mastoiditis |
| STAP | 69660 | stapedectomy/stapedotomy | hearing loss |
| STAP | 69661 | stapedectomy with footplate drill-out | hearing loss |
| STAP | 69930 | cochlear device implantation | hearing loss |
| STAP | 69915 | labyrinthectomy with mastoidectomy | hearing loss |
| STAP | 69990 | use of operating microscope (microsurgery) | hearing loss |
| LARY | 31505 | laryngoscopy, indirect, diagnostic | laryngeal pathology |
| LARY | 31525 | direct laryngoscopy, diagnostic | laryngeal pathology |
| LARY | 31535 | direct laryngoscopy with biopsy | laryngeal pathology |
| LARY | 31540 | direct laryngoscopy with tumour excision/cord stripping | laryngeal pathology |
| LARY | 31541 | direct laryngoscopy, cord stripping, operating microscope | laryngeal pathology |
| LARY | 31571 | laryngoscopy with vocal cord injection | laryngeal pathology |
| LARY | 31530 | direct laryngoscopy with foreign body removal | laryngeal pathology |
| LARY | 31580 | laryngoplasty for laryngeal web | laryngeal pathology |
| LARY | 31551 | laryngoplasty for laryngeal stenosis, with graft | laryngeal pathology |
| LARY | 31600 | tracheostomy, planned | laryngeal pathology |
| LARY | 31603 | tracheostomy, emergency | laryngeal pathology |
| LARY | 31300 | laryngotomy with removal of tumour/laryngocele | laryngeal pathology |
| OSAS | 41530 | submucosal ablation of tongue base, radiofrequency | obstructive sleep apnea |
| OSAS | 21685 | hyoid myotomy and suspension | obstructive sleep apnea |
| OSAS | 41512 | tongue base suspension | obstructive sleep apnea |
| OSAS | 64582 | implantation of hypoglossal nerve stimulator | obstructive sleep apnea |
| NASF | 31030 | Caldwell-Luc sinusotomy without polyp removal | nasal polyps |
| THYR* | 60271 | thyroidectomy incl substernal, cervical approach | thyroid & parathyroid (added to shared THYR) |
| THYR* | 60502 | parathyroidectomy, re-exploration | thyroid & parathyroid (added to shared THYR) |
| THYR* | 60505 | parathyroidectomy with mediastinal exploration | thyroid & parathyroid (added to shared THYR) |
| HNCK* | 42842 | radical resection of tonsil/pillars/retromolar trigone | head & neck cancer (added to shared HNCK) |

**REUSED SHARED ROWS (linked, not imported — owned by GS/SOC/MFS): 24** — THYR 60100/60220/60240/60252/60254/60260/60500/60512 (thyroid/parathyroid), SOFT 60280 (thyroglossal Sistrunk), SALV 42330/42335/42408/42410/42440 (sialolithotomy/parotid/submandibular), HNCK 31360/31365/38720/38724/41135/42415/42420, ONCO 40510/41130/38510. *THYR/HNCK additions inserted into the existing shared groups (down() removes only those rows).

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 132 | FixEntIcdCodes | MIG-A: 2 MERGEs + 6 recodes + 3 name/AR fixes | applied ✅ |
| 133 | AddEntDiagnosesBatch1 | +23 ear/hearing/otitis/mastoid/TM | applied ✅ |
| 134 | AddEntDiagnosesBatch2 | +29 nose/sinus/larynx/pharynx/tonsil/OSA | applied ✅ |
| 135 | AddEntDiagnosesBatch3 | +21 H&N cancer/thyroid/salivary | applied ✅ |
| 136 | ImportEntProcCpts1 | +41 procs (FESS/SEPT/NASF/TONS/OSAS) | applied ✅ |
| 137 | ImportEntProcCpts2 | +40 procs (MYRT/EARC/TYMP/MAST/STAP/LARY + 3 THYR + 1 HNCK) | applied ✅ |
| 138 | LinkEntProcCptsToMainDiags | link 105 procs + MNR to 13 main_diags | applied ✅ |

---

## Summary
ENT was the **least-corrupted department audited so far (~14% ICD codes wrong)** — the bulk of its
original seed mismaps had already been fixed by migrations 026/035. The residual fixes were: deviated
septum on an acute-sinusitis code (CA01.0→CA0D), obstructive sleep apnoea miscoded in the respiratory
chapter (CA62.0→7A41, which moved to ch.7 sleep-wake disorders), a salivary-gland calculus and a
branchial cyst on wrong salivary codes (MERGEd into the MFS sialolithiasis row DA04.4 and the PEDSURG
branchial-cleft-cyst row DA05.Y), a "MeniÃ¨re" mojibake, and three parent→leaf refinements. Coverage
was then extended from 29→102 diagnoses and 0→106 linked proc_cpts. ENT had ZERO procedures before
this audit; 81 ENT-specific CPTs were imported (11 new alpha groups) and 24 thyroid/salivary/neck
codes were reused from the existing shared GS/SOC/MFS groups. All 105 CPTs AAPC-verified active (none
deleted). **Final: 102 diagnoses + 106 procs, all verified & embedded; every category ≥5 dx & ≥5 procs.**

## ICD-11 Changes Applied
| Old code | Old name | New code | New name | Migration |
|---|---|---|---|---|
| CA01.0 | deviated nasal septum | CA0D | Deviated nasal septum | 132 |
| CA62.0 | obstructive sleep apnoea | 7A41 | Obstructive sleep apnoea (ch.7 sleep) | 132 |
| AB51.1 | sudden sensorineural hearing loss | AB55 | Sudden idiopathic hearing loss | 132 |
| CA0J | nasal polyp | CA0J.Z | Nasal polyp, unspecified (parent→leaf) | 132 |
| AB13 | tympanic membrane perforation | AB13.Z | Perforation of TM, unspecified (parent→leaf) | 132 |
| CA03 | tonsillitis | CA03.Z | Acute tonsillitis, unspecified (parent→leaf) | 132 |
| DA50.2 | parotid gland calculus | DA04.4 | Sialolithiasis (MERGE → MFS row) | 132 |
| DA50.3 | branchial cyst | DA05.Y | Branchial cleft cyst (MERGE → PEDSURG row) | 132 |
| AB31.0 | MeniÃ¨re disease (mojibake) | AB31.0 | Meniere disease (name-only) | 132 |
| AB12 | (AR mistranslation) | AB12 | cholesteatoma — AR fixed to الورم الصفراوي | 132 |
| CA0H.1 | (AR=papilloma) | CA0H.1 | vocal-cord polyp — AR fixed to سَليلة | 132 |

## CPT Changes Applied
(N/A — ENT had no existing procs; all 105 are new links. None of the imported codes were deleted by AMA.)

## Structural Fixes
- 0 orphaned diagnoses, 0 empty-of-diagnosis categories at start (clean structure).
- 2 cross-dept MERGEs (DA50.2→DA04.4 MFS; DA50.3→DA05.Y PEDSURG) removed 2 redundant ENT-only rows.
- Arabic/encoding repairs on 3 existing rows (AB31.0 EN mojibake; AB12 + CA0H.1 AR terminology).

## New Diagnoses Added
73 new diagnoses across all 13 categories (see Working-notes 2D for the full code list). Highlights:
ear/hearing (presbycusis, NIHL, tinnitus, vestibular schwannoma, labyrinthitis), otology
(OME, otitis externa, ETD, cholesteatoma of EAC, tympanosclerosis, ossicular discontinuity),
rhinology (allergic rhinitis, mucocele, turbinate hypertrophy, septal perforation/haematoma,
choanal atresia, antrochoanal polyp, JNA), laryngology (cord paralysis/nodules, laryngitis,
laryngomalacia, subglottic stenosis, epiglottitis, laryngeal web), H&N oncology (oral/tongue/
tonsil/hypopharynx/sinus/parotid/lip carcinoma, oral leukoplakia, nodal metastasis), endocrine
(medullary/anaplastic/follicular thyroid ca, thyroglossal cyst, Hashimoto, subacute thyroiditis,
parathyroid adenoma), salivary (pleomorphic adenoma, Warthin, sialadenitis, ranula), and sleep
(snoring, central SA, obesity hypoventilation). **Total ENT diagnoses: 102.**

## New Proc_cpts Added
105 CPTs linked (81 imported + 24 reused shared) + MNR — see Working-notes 2E and Migration log.
11 new ENT alpha groups: FESS, SEPT, NASF, TONS, OSAS, MYRT, EARC, TYMP, MAST, STAP, LARY.
**Total ENT-linked procs: 106 (incl. MNR).**

## Still-Open Items
- None for ENT. No new cross-dept ICD-11 mismaps were discovered during this audit (the earlier
  026/035 ENT fixes held). The only remaining open cross-dept item project-wide is GS `2B90.Y`
  mislabelled "Lynch syndrome" (to be fixed in a GS pass).
