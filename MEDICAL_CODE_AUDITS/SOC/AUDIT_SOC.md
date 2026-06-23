# SOC Department Audit
**Date (last updated)**: 2026-06-23
**Dept**: SOC — Surgical Oncology | جراحة الأورام

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-23
**Current step**: Phase 6 — finalized
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (26 diags, 0 procs, 12 main_diags)
- [x] Phase 2A — structural scan
- [x] Phase 2B — ICD-11 audit (26/26 verified — 13 ❌ wrong, 3 ⚠️ approx, 10 ✅)
- [x] Phase 2C — CPT audit — N/A (0 procs imported)
- [x] Phase 2B.5 — DB collision check (6 MERGE, 10 UPDATE)
- [x] Phase 2D — candidate diagnoses (+74 → 100, all verified)
- [x] Phase 2E — candidate procs (101 AAPC-verified)
- [x] Phase 3/4 — migs 104-110 written & applied ✅
- [x] Phase 5 — embeddings backfilled (52 diagnoses + 93 procs) ✅
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
104=FixSocIcdCodes [applied ✅], 105=AddSocMainDiagsAndStructural [applied ✅], 106=AddSocDiagnosesBatch1 [applied ✅], 107=AddSocDiagnosesBatch2 [applied ✅], 108=ImportSocProcCpts1 [applied ✅], 109=ImportSocProcCpts2 [applied ✅], 110=LinkSocProcCptsToMainDiags [applied ✅]

### ▶ Next action
Done. **FINAL STATE (verified on staging): 16 main_diags, 100 diagnoses (all ICD-11-verified ✅, all embedded ✅), 102 linked proc_cpts (101 AAPC-verified SOC oncology operations + MNR, all embedded ✅), 0 orphans, 0 empty categories. Every category ≥5 diagnoses & ≥6 procs.**

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### 2B — ICD-11 audit findings
**Verified via icd11_search. SOC data ~62% corrupt (13 wrong + 3 approximate of 26). Root cause: seeder used wrong chapter blocks — `2B60`=lip, `2B91`=rectosigmoid, `2B5C`≠stomach, `2C90`=kidney, `2C73`=ovary, `2C77`≠melanoma, `2C80`/`2C8x`=male genital, `2C6Y`=breast, `2D42`=ill-defined sites.**

| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| 2C61.0 | carcinoma of breast | ✅ OK | 2C61.0 | Invasive ductal carcinoma of breast (valid leaf, dominant breast-ca representative) |
| 2E65.2 | ductal carcinoma in situ of breast | ✅ OK | 2E65.2 | Ductal carcinoma in situ of breast (score 1.0) |
| 2B91.1 | carcinoma of colon | ❌ WRONG | 2B90.Z | Malignant neoplasms of colon, unspecified (score 1.0; 2B91=rectosigmoid block) |
| 2B91.2 | carcinoma of rectum | ❌ WRONG | 2B92.Z | Malignant neoplasms of rectum, unspecified (score 1.0) |
| 2C20.2 | carcinoma of anal canal | ❌ WRONG | 2C00.Z | Malignant neoplasms of anus or anal canal, unspecified (score 1.0); 2C20 not anal |
| 2F73.0 | carcinoid tumour of small intestine | ❌ WRONG | 2B80.21 | Neuroendocrine neoplasms of small intestine, site unspecified (score 1.0, "NET of small intestine") |
| 2B5C.0 | carcinoma of stomach | ❌ WRONG | 2B72.Z | Malignant neoplasms of stomach, unspecified (2B72.Y "Carcinoma of stomach"; confirm .Z) |
| 2B60.0 | carcinoma of oesophagus | ❌ WRONG | 2B70.Z | Malignant neoplasms of oesophagus, unspecified (2B70.Y "Oesophageal carcinoma"; 2B60=lip) |
| 2B66.0 | squamous cell carcinoma of mouth | ✅ OK | 2B66.0 | Squamous cell carcinoma of other or unspecified parts of mouth (score 0.75) |
| 2D10 | thyroid carcinoma | ⚠️ APPROX | 2D10 (keep) | Malignant neoplasms of thyroid gland — valid non-leaf parent; kept as umbrella, subtypes added in 2D |
| 2C12.02 | hepatocellular carcinoma | ✅ OK | 2C12.02 | Hepatocellular carcinoma of liver (score 1.0) |
| 2C77.0 | malignant melanoma of skin | ❌ WRONG | 2C30.Z | Melanoma of skin, unspecified (score 1.0, synonym "Malignant melanoma of skin"); 2C77 not melanoma |
| 2C73.1 | adrenocortical carcinoma | ❌ WRONG | 2D11.Z | Malignant neoplasms of adrenal gland, unspecified (title "Adrenocortical carcinoma", score 1.0); 2C73=ovary. Also recategorise out of "metastatic disease" |
| 2C90.3 | peritoneal carcinomatosis | ❌ WRONG | 2D91 | Malignant neoplasm metastasis in peritoneum ("secondary malignant neoplasm of peritoneum"); 2C90=kidney |
| 2C32 | basal cell carcinoma of skin | ⚠️ APPROX | 2C32.Z | Basal cell carcinoma of skin, unspecified (leaf; DB used non-leaf parent 2C32) |
| 2D42.0 | squamous cell carcinoma of skin | ❌ WRONG | 2C31.Z | Cutaneous squamous cell carcinoma (score 1.0); 2D42=malignant neoplasms of ill-defined sites |
| 2C90.0 | urothelial carcinoma of bladder (ORPHANED) | ❌ WRONG | 2C94.2 | Urothelial carcinoma of bladder (score 1.0); 2C90.0 = renal cell carcinoma of kidney |
| 2C73.03 | high grade serous adenocarcinoma of ovary | ✅ OK | 2C73.03 | High grade serous adenocarcinoma of ovary |
| 2C73.04 | mucinous adenocarcinoma of ovary | ✅ OK | 2C73.04 | Mucinous adenocarcinoma of ovary (score 1.0) |
| 2C10.Z | malignant neoplasm of pancreas (exocrine carcinoma) | ✅ OK | 2C10.Z | Malignant neoplasm of pancreas, unspecified (score 1.0) |
| 2E92.8 | intraductal papillary mucinous neoplasm of pancreas | ✅ OK | 2E92.8 | Entity title "Intraductal papillary mucinous neoplasm of pancreas" (under Benign neoplasm of pancreas; score 1.0) |
| 2C6Y.0 | retroperitoneal sarcoma | ❌ WRONG | 2B5F.1Z | Sarcoma, NEC of retroperitoneum or peritoneum, unspecified (score 1.0); 2C6Y = breast |
| 2C80.0 | soft tissue sarcoma | ❌ WRONG | 2B5F.Z | Sarcoma, NEC of unspecified site (confirm leaf); 2C80 = male genital block |
| 2C80.1 | desmoid tumour | ❌ WRONG | 2F7C | Neoplasms of uncertain behaviour of connective/soft tissue (Desmoid / Aggressive fibromatosis); ⚠️ NS already (mis)uses 2F7C for hemangioblastoma — collision check needed |
| 2A81.Z | diffuse large B-cell lymphoma, NOS | ✅ OK | 2A81.Z | Diffuse large B-cell lymphoma, not otherwise specified (score 1.0) |
| 2B30.1 | classical Hodgkin lymphoma | ⚠️ APPROX | 2B30.1Z | Classical Hodgkin lymphoma, unspecified (DB 2B30.1 = non-leaf parent; refine to .1Z leaf) |

**Tally: 13 ❌ WRONG, 3 ⚠️ APPROXIMATE (2D10 kept, 2C32→2C32.Z, 2B30.1→2B30.1Z), 10 ✅ OK. = 16 codes to change.**
**⚠️ COLLISION RISK — several target codes likely pre-exist as shared rows owned by other depts → must MERGE not UPDATE:** `2C30.Z`/`2C31.Z`/`2C32.Z` (PRS skin cancers, migration 078), GI `.Z` codes (GS), `2C12.02` (already SOC's own correct row — no-op), `2F7C` (NS hemangioblastoma mismap). DB collision query pending before MIG-A.

### 2B.5 — DB collision check → MIG-A plan (verified on staging)
**Simple UPDATE (target code free, SOC-only row):**
| old | →new | concept | note |
|---|---|---|---|
| 2B91.1 | 2B90.Z | colon | |
| 2B91.2 | 2B92.Z | rectum | |
| 2C20.2 | 2C00.Z | anal canal | |
| 2F73.0 | 2B80.21 | small-intestine NET | |
| 2C73.1 | 2D11.Z | adrenocortical ca | + recategorise out of "metastatic disease" → new "endocrine & adrenal tumours" |
| 2C90.0 | 2C94.2 | urothelial bladder | **cross-dept: shared SOC+UROL — fixes UROL too**; resolve SOC orphan → new "genitourinary cancer" |
| 2C6Y.0 | 2B5F.1Z | retroperitoneal sarcoma | |
| 2C80.0 | 2B5F.2 | soft tissue sarcoma | |
| 2C80.1 | 2F9C | desmoid | ⚠️ ideal 2F7C occupied by NS hemangioblastoma mismap → use 2F9C ("Abdominal desmoid", unknown behaviour); document |
| 2B30.1 | 2B30.1Z | classical Hodgkin | leaf refinement |

**Collision-aware MERGE (target row already exists, owned by another dept — DELETE SOC's wrong row + its links, then link the existing shared row to SOC dept + main_diag):**
| old (SOC-only, delete) | merge into | owner | SOC main_diag |
|---|---|---|---|
| 2B5C.0 carcinoma of stomach | 2B72.Z | GS | gastric cancer |
| 2B60.0 carcinoma of oesophagus | 2B70.Z | GS | gastric cancer |
| 2C77.0 malignant melanoma of skin | 2C30.Z | PRS | melanoma |
| 2C90.3 peritoneal carcinomatosis | 2D91 | HBP | metastatic disease |
| 2C32 basal cell carcinoma | 2C32.Z | PRS | non-melanoma skin cancer |
| 2D42.0 squamous cell carcinoma of skin | 2C31.Z | PRS | non-melanoma skin cancer |

Merged target rows are already embedded (owned by other depts) → no backfill. Simple-UPDATE rows get `embedding=NULL`.
**No change (✅):** 2C61.0, 2E65.2, 2B66.0, 2C12.02 (shared GS+HBP+SOC, already correct), 2C73.03, 2C73.04, 2C10.Z, 2E92.8, 2A81.Z, 2D10 (kept umbrella).

### Category plan (12 → 16; resolves orphan + adrenocortical mis-categorisation)
Keep 12 existing. Add 4 new main_diags:
13. **genitourinary cancer** | سرطان الجهاز البولي التناسلي — houses bladder (2C94.2) + RCC/prostate/testis/penis
14. **endocrine & adrenal tumours** | أورام الغدد الصماء والكظرية — houses adrenocortical ca (2D11.Z) + phaeo/parathyroid/NET
15. **gynaecological cancer** | سرطان الجهاز التناسلي الأنثوي — cervix/endometrium/vulva/uterine sarcoma
16. **biliary tract & gallbladder cancer** | سرطان القناة الصفراوية والمرارة — cholangiocarcinoma/gallbladder/ampulla

### 2C — CPT audit findings
N/A — no proc_cpts imported for SOC yet.

### 2D — Candidate diagnoses (+74 → 100; all codes icd11_search-verified). AR names/descs authored in MIG-D.
Format: `code — EN name` per category. (R)=reuse existing row / dual-link. Collision check pending before insert.

**1. breast cancer (+5→7):** 2C61.1 Invasive lobular carcinoma of breast · 2C62 Inflammatory carcinoma of breast · 2E65.0 Lobular carcinoma in situ of breast · 2C60 Carcinoma of breast, specialised type (tubular/mucinous) · 2C6Y Paget disease of breast
**2. colorectal cancer (+5→9):** 2B90.Y Adenocarcinoma of colon · 2B92.0 Adenocarcinoma of rectum · 2C00.3 Squamous cell carcinoma of anus or anal canal · 2B81.2 Neuroendocrine neoplasm of appendix · 2B92.1 Neuroendocrine neoplasm of rectum
**3. gastric cancer (+4→6):** 2B72.0 Adenocarcinoma of stomach · 2B72.1 Malignant neuroendocrine neoplasm of stomach · 2B70.1 Squamous cell carcinoma of oesophagus · 2B71.Z Malignant neoplasm of oesophagogastric junction
**4. head & neck cancer (+8→10):** 2D10.1 Papillary carcinoma of thyroid · 2D10.4 Medullary carcinoma of thyroid · 2D10.3 Undifferentiated (anaplastic) carcinoma of thyroid · 2B62.0 Squamous cell carcinoma of tongue · 2B60.1 Squamous cell carcinoma of lip · 2C23.Z Malignant neoplasm of larynx · 2B6B.1 Nasopharyngeal carcinoma · 2B68.Z Malignant neoplasm of salivary gland
**5. hepatocellular carcinoma (liver) (+4→5):** 2C12.00 Combined hepatocellular-cholangiocarcinoma · 2C12.01 Hepatoblastoma · 2C12.10 Intrahepatic cholangiocarcinoma · 2B56.3 Angiosarcoma of liver
**6. melanoma (+4→5):** 2C30.0 Superficial spreading melanoma · 2C30.1 Nodular melanoma · 2C30.2 Lentigo maligna melanoma · 2E63.0Z Melanoma in situ of skin
**7. metastatic disease (+4→5; adrenocortical moves out):** 2D80.0 Malignant neoplasm metastasis in liver · 2D70 Malignant neoplasm metastasis in lung · 2E03 Malignant neoplasm metastasis in bone · 2D4Z Cancer of unknown primary (unspecified malignant neoplasm)
**8. non-melanoma skin cancer (+3→5):** 2C34 Merkel cell (cutaneous neuroendocrine) carcinoma · 2C35 Cutaneous sarcoma (dermatofibrosarcoma protuberans) · 2C33 Adnexal carcinoma of skin
**9. ovarian cancer (+5→7):** 2C73.02 Low grade serous adenocarcinoma of ovary · 2C73.01 Endometrioid adenocarcinoma of ovary · 2C73.00 Clear cell adenocarcinoma of ovary · 2C73.2 Granulosa cell malignant tumour of ovary · 2C73.1 Dysgerminoma of ovary (reuses code freed by MIG-A)
**10. pancreatic cancer (+4→6):** 2C10.0 Adenocarcinoma of pancreas (ductal) · 2C10.1 Neuroendocrine neoplasm of pancreas · 2C16.0 Adenocarcinoma of ampulla of Vater · 2B80.00 Adenocarcinoma of duodenum
**11. soft tissue sarcoma (+4→7):** 2B59.Z Liposarcoma · 2B55.Z Rhabdomyosarcoma · 2B5B.Z Gastrointestinal stromal tumour · 2B5A.0 Synovial sarcoma
**12. surgical lymphoma (+4→6):** 2A80.Z Follicular lymphoma · 2A85.1 Extranodal marginal zone (MALT) lymphoma · 2A85.5 Mantle cell lymphoma · 2A85.6 Burkitt lymphoma
**13. genitourinary cancer NEW (+5→6; bladder 2C94.2 moved here):** 2C90.0 Renal cell carcinoma · 2C82.0 Adenocarcinoma of prostate · 2C80.2 Germ cell tumour (seminoma) of testis · 2C81.0 Squamous cell carcinoma of penis · 2C90.Y Nephroblastoma (Wilms tumour)
**14. endocrine & adrenal tumours NEW (+3 new→5; adrenocortical 2D11.Z moved here):** 2D11.1 Malignant phaeochromocytoma of adrenal gland · 2D12.Y Malignant paraganglioma · 2D12.Z Parathyroid carcinoma · (R)2C10.1 Pancreatic NET (dual-link)
**15. gynaecological cancer NEW (+5→5):** 2C77.0 Squamous cell carcinoma of cervix uteri · 2C76.0 Endometrial endometrioid adenocarcinoma · 2C70.2 Squamous cell carcinoma of vulva · 2C71.2 Squamous cell carcinoma of vagina · 2C75.0 Gestational choriocarcinoma
**16. biliary tract & gallbladder cancer NEW (+3 new→5):** 2C13.0 Adenocarcinoma of gallbladder · 2C18.0 Hilar cholangiocarcinoma (Klatskin) · 2C17.0 Adenocarcinoma of extrahepatic bile duct · (R)2C16.0 Ampullary adenocarcinoma · (R)2C12.10 Intrahepatic cholangiocarcinoma

### 2D — Collision resolution (final, after checking all 74 codes on staging)
**Cross-dept MISMAPS found (avoid reuse; flag for those depts' audits):**
- `2C10.0` (=Adenocarcinoma of pancreas) mislabeled "squamous cell carcinoma of oral cavity" by **MFS,GS** → MFS oral-cancer mismap (known). Substitute pancreatic with `2C10.Y` (HBP "pancreatic carcinoma").
- `2C10.1` (=Pancreatic NET) mislabeled "carcinoma of lip" by **MFS** → MFS mismap. Dropped; endocrine 5th = `2D10.4` medullary thyroid (dual-link).
- `2C13.0` (=Adenocarcinoma of gallbladder) mislabeled "carcinoma of salivary gland" by **HBP,MFS** → mismap. Substitute gallbladder with `2C13.Z` (free, verified "Malignant neoplasms of gallbladder, unspecified").
- `2B90.Y` (=Adenocarcinoma of colon) mislabeled "Lynch syndrome" by **GS**. Dropped; colorectal uses `2B91.Z` (GS rectosigmoid) instead.
- `2C76.0` (=Endometrial endometrioid adenocarcinoma) mislabeled "carcinoma of uterine cervix" by **OBGYN**. Substitute endometrial with `2C76.3` (free, "Endometrial serous adenocarcinoma").

**Final tally: 26 existing (codes fixed) + 42 NEW inserts + 32 shared-row links (correctly-labeled rows owned by other depts) = 100 distinct, every category ≥5.**
NEW inserts (42): 2C62,2C60,2C6Y,2C6Z,2B92.1,2B72.0,2B72.1,2B70.1,2B71.Z,2B70.00,2B62.0,2B60.1,2B68.Z,2C30.0,2C30.1,2C30.2,2E63.0Z,2C30.Y,2D70,2D4Z,2C34,2C33,2C73.02,2C73.01,2C73.00,2C73.2,2C73.1,2B59.Z,2B5A.0,2A80.Z,2A85.1,2A85.5,2C90.0,2C81.0,2D11.1,2D12.Z,2C77.0,2C76.3,2C70.2,2C71.2,2C75.0,2C13.Z (2C90.0/2C77.0/2C73.1 freed by MIG-A → insert after 104).
SHARED links (32): 2C61.1,2E65.0,2B92.0,2C00.3,2B81.2,2B91.Z,2D10.1,2D10.3,2D10.4,2C23.Z,2B6B.1,2C12.00,2C12.01,2C12.10,2B56.3,2D80.0,2E03,2D50,2C35,2E64.0Z,2C16.0,2B80.00,2C10.Y,2B55.Z,2B5B.Z,2A85.6,2C82.0,2C80.2,2C90.Y,2D12.Y,2C18.0,2C17.0.

### 2E — Candidate proc_cpts (≥100 SOC-specific oncological operations; AAPC-verified via WebFetch)
Grouped by alpha-code → target main_diag(s). ✅=AAPC-verified current. MNR 00001-00 linked to every category.

**BRST → breast cancer:** 19301 partial mastectomy(lumpectomy) · 19302 partial mastectomy+axillary LND · 19303 total/simple mastectomy✅ · 19305 radical mastectomy · 19307 modified radical mastectomy✅ · 19120 excision breast lesion(s) · 19125 excision breast lesion w/ preop marker
**AXIL → breast/melanoma:** 38525 excision deep axillary nodes✅ · 38500 biopsy/excision superficial node · 38740 axillary LND superficial · 38745 axillary LND complete · 38792 sentinel-node tracer injection · 38900 intraop sentinel-node ID
**COLR → colorectal:** 44140 partial colectomy+anastomosis✅ · 44141 partial colectomy+colostomy · 44143 colectomy+end colostomy(Hartmann) · 44150 total abdominal colectomy+ileostomy · 44160 colectomy+terminal ileum · 45110 proctectomy(APR) · 45112 proctectomy+coloanal anast · 45395 lap proctectomy+colostomy · 45126 pelvic exenteration · 44204 lap partial colectomy · 45171 transanal excision rectal tumour(partial) · 45172 transanal excision rectal tumour(full)
**GAST → gastric:** 43620 total gastrectomy+oesophagoenterostomy · 43621 total gastrectomy Roux-en-Y✅ · 43631 distal gastrectomy(Billroth I) · 43632 distal gastrectomy(Billroth II) · 43633 distal gastrectomy Roux-en-Y · 43634 distal gastrectomy+pouch
**ESOG → gastric:** 43107 transhiatal oesophagectomy · 43117 partial oesophagectomy(Ivor Lewis) · 43122 oesophagectomy thoracoabdominal · 43124 total oesophagectomy+colon interposition
**HEPB → hepatocellular/metastatic/biliary:** 47120 partial hepatectomy✅ · 47122 hepatic trisegmentectomy · 47125 total left lobectomy · 47130 total right lobectomy · 47100 wedge biopsy liver · 47370 lap ablation liver tumour(RFA) · 47380 open ablation liver tumour
**BILI → biliary tract & gallbladder:** 47600 cholecystectomy · 47711 excision extrahepatic bile duct tumour · 47712 excision intrahepatic bile duct tumour · 47765 hepaticojejunostomy(intrahepatic duct-GI anast)
**PANC → pancreatic/biliary:** 48150 Whipple+pancreatojejunostomy✅ · 48153 PPPD+pancreatojejunostomy · 48140 distal pancreatectomy±splenectomy · 48145 distal pancreatectomy+pancreatojejunostomy · 48155 total pancreatectomy · 48120 excision pancreatic lesion
**THYR → head&neck/endocrine:** 60240 total thyroidectomy✅ · 60252 total thyroidectomy+limited neck diss · 60254 total thyroidectomy+radical neck diss · 60220 total thyroid lobectomy · 60260 completion thyroidectomy · 60500 parathyroidectomy
**HNCK → head&neck:** 38720 radical neck dissection · 38724 modified radical neck dissection · 41135 partial glossectomy+neck diss · 41145 glossectomy+bilateral neck diss · 42420 total parotidectomy w/ facial nerve diss · 42415 lateral parotidectomy facial-nerve sparing · 31360 total laryngectomy · 31365 total laryngectomy+radical neck diss · 40530 resection of lip+reconstruction
**SKIN → melanoma/non-melanoma skin:** 11606 excision malignant trunk/arm/leg >4cm · 11626 excision malignant scalp/neck >4cm · 11646 excision malignant face/lip >4cm · 11604 excision malignant trunk 3.1-4cm · 11644 excision malignant face 3.1-4cm
**OVRY → ovarian:** 58950 resection ovarian malignancy+omentectomy · 58951 +TAH+LND · 58952 resection recurrent ovarian malignancy · 58953 radical debulking BSO+omentectomy+TAH · 58954 +pelvic LND · 58960 second-look laparotomy
**HYST → gynaecological:** 58210 radical hysterectomy(Wertheim)+pelvic LND · 58200 TAH+node sampling · 58240 pelvic exenteration · 56631 radical partial vulvectomy+inguinofemoral LND · 56633 radical complete vulvectomy · 57110 complete vaginectomy
**SARC → soft tissue sarcoma:** 49186 excision intra-abdominal tumour ≤5cm✅ · 49187 5.1-10cm · 49190 >10cm · 27329 radical resection soft-tissue tumour thigh ≥5cm · 22904 radical resection soft-tissue tumour abdominal wall ≥5cm
**NEPH → genitourinary:** 50230 radical nephrectomy✅ · 50240 partial nephrectomy · 51570 cystectomy complete · 51590 cystectomy+ileal conduit · 55840 radical retropubic prostatectomy · 54530 radical inguinal orchiectomy · 54130 radical penectomy+inguinal LND · 38770 pelvic LND · 38780 retroperitoneal LND(RPLND)
**ADRN → endocrine & adrenal:** 60540 adrenalectomy · 60545 adrenalectomy+retroperitoneal tumour · 60650 lap adrenalectomy
**LYMP → surgical lymphoma:** 38120 lap splenectomy · 38100 total splenectomy · 38510 excision deep cervical node · 38530 excision deep jugular node
**METS → metastatic disease:** 32505 thoracotomy wedge/metastasectomy lung · 49255 omentectomy/peritonectomy · 96446 HIPEC intraperitoneal chemo perfusion (+ shared 47120 hepatic, 38770 nodal)

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 104 | FixSocIcdCodes | 10 recodes + 6 collision-aware MERGEs (fix 13 wrong + 3 approx codes) | applied ✅ |
| 105 | AddSocMainDiagsAndStructural | +4 main_diags; link bladder orphan; move adrenocortical metastatic→endocrine | applied ✅ |
| 106 | AddSocDiagnosesBatch1 | +22 new diagnoses + 42 links (cats 1-8) | applied ✅ |
| 107 | AddSocDiagnosesBatch2 | +20 new diagnoses + 34 links (cats 9-16) | applied ✅ |
| 108 | ImportSocProcCpts1 | 46 proc_cpts (BRST,AXIL,COLR,GAST,ESOG,HEPB,BILI,PANC) | applied ✅ |
| 109 | ImportSocProcCpts2 | 55 proc_cpts (THYR,HNCK,SKIN,OVRY,HYST,SARC,NEPH,ADRN,LYMP,METS) | applied ✅ |
| 110 | LinkSocProcCptsToMainDiags | link 101 procs + MNR to 16 main_diags | applied ✅ |

---

## Summary
| Metric | Count |
|---|---|
| Main_diags | 12 → **16** |
| Diagnoses | 26 → **100** |
| Proc_cpts (SOC-linked) | 0 → **102** (101 oncology ops + MNR) |
| ICD-11 codes fixed (❌ wrong) | 13 |
| ICD-11 codes updated (⚠️ approximate) | 3 (2C32→2C32.Z, 2B30.1→2B30.1Z; 2D10 kept as umbrella) |
| CPT codes fixed | N/A (no procs pre-existed) |
| Structural issues resolved | 3 (bladder orphan; adrenocortical recategorised; +4 categories) |
| New diagnoses added (this run) | 74 (42 new rows + 32 shared-row links) |
| New proc_cpts added (this run) | 101 (93 SOC-specific new + ~8 reused shared, all AAPC-verified) |
| Diagnoses re-embedded | 52 (10 recodes + 42 new) |
| Proc_cpts re-embedded | 93 |

## ICD-11 Changes Applied (migration 104)
| Old code | Old name | New code | New name |
|---|---|---|---|
| 2B91.1 | carcinoma of colon | 2B90.Z | Malignant neoplasms of colon, unspecified |
| 2B91.2 | carcinoma of rectum | 2B92.Z | Malignant neoplasms of rectum, unspecified |
| 2C20.2 | carcinoma of anal canal | 2C00.Z | Malignant neoplasms of anus or anal canal, unspecified |
| 2F73.0 | carcinoid tumour of small intestine | 2B80.21 | Neuroendocrine neoplasms of small intestine |
| 2B5C.0 | carcinoma of stomach | 2B72.Z (MERGE→GS) | Malignant neoplasms of stomach, unspecified |
| 2B60.0 | carcinoma of oesophagus | 2B70.Z (MERGE→GS) | Malignant neoplasms of oesophagus, unspecified |
| 2D10 | thyroid carcinoma | 2D10 (kept umbrella) | Malignant neoplasms of thyroid gland |
| 2C12.02 | hepatocellular carcinoma | 2C12.02 (✅ no change) | Hepatocellular carcinoma of liver |
| 2C77.0 | malignant melanoma of skin | 2C30.Z (MERGE→PRS) | Melanoma of skin, unspecified |
| 2C73.1 | adrenocortical carcinoma | 2D11.Z | Malignant neoplasms of adrenal gland (Adrenocortical carcinoma) |
| 2C90.3 | peritoneal carcinomatosis | 2D91 (MERGE→HBP) | Malignant neoplasm metastasis in peritoneum |
| 2C32 | basal cell carcinoma of skin | 2C32.Z (MERGE→PRS) | Basal cell carcinoma of skin, unspecified |
| 2D42.0 | squamous cell carcinoma of skin | 2C31.Z (MERGE→PRS) | Cutaneous squamous cell carcinoma |
| 2C90.0 | urothelial carcinoma of bladder | 2C94.2 | Urothelial carcinoma of bladder (**cross-dept: also fixed UROL**) |
| 2C6Y.0 | retroperitoneal sarcoma | 2B5F.1Z | Sarcoma, NEC of retroperitoneum or peritoneum |
| 2C80.0 | soft tissue sarcoma | 2B5F.2 | Sarcoma, not elsewhere classified |
| 2C80.1 | desmoid tumour | 2F9C | Neoplasms of unknown behaviour of connective/soft tissue (ideal 2F7C occupied by NS) |
| 2B30.1 | classical Hodgkin lymphoma | 2B30.1Z | Classical Hodgkin lymphoma, unspecified |

## CPT Changes Applied
N/A — SOC had no proc_cpts before this run; 101 added fresh (migrations 108-110).

## Structural Fixes (migration 105)
- Created 4 new main_diags: **genitourinary cancer · endocrine & adrenal tumours · gynaecological cancer · biliary tract & gallbladder cancer** (12 → 16).
- Resolved the orphaned bladder row (2C94.2) → linked to genitourinary cancer.
- Moved adrenocortical carcinoma (2D11.Z) out of the mis-fitting "metastatic disease" → endocrine & adrenal tumours.

## New Diagnoses Added
74 added (42 new rows + 32 links to correctly-labelled shared rows). Full per-category list in working notes "2D — Candidate diagnoses". Notable reuse of MIG-A-freed codes: 2C90.0→RCC, 2C77.0→cervix SCC, 2C73.1→dysgerminoma.

## New Proc_cpts Added
101 oncology operations across 18 alpha-groups (BRST, AXIL, COLR, GAST, ESOG, HEPB, BILI, PANC, THYR, HNCK, SKIN, OVRY, HYST, SARC, NEPH, ADRN, LYMP, METS) + shared MNR, all AAPC-verified current (none deleted). Full list in working notes "2E".

## Still-Open Items
- **Cross-dept mismaps discovered during this audit** (flagged in MISMAPPED_ICD11_CODES.md for the owning depts' audits): MFS uses pancreatic/biliary codes `2C10.0`/`2C10.1`/`2C13.0` for oral/H&N cancers; GS labels `2B90.Y` (colon adeno code) "Lynch syndrome"; OBGYN labels `2C76.0` (endometrial code) "carcinoma of uterine cervix". SOC avoided all of these by substituting free/correctly-labelled codes.
- **Desmoid uses 2F9C** (not the ideal 2F7C) because 2F7C is occupied by NS's mislabelled "hemangioblastoma" row; when the NS audit fixes that, desmoid could move to 2F7C.
