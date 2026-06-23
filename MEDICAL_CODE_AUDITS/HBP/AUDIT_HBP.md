# HBP Department Audit
**Date (last updated)**: 2026-06-23
**Dept**: HBP — Hepatobiliary & Pancreatic Surgery (جراحة الكبد والقنوات الصفراوية والبنكرياس)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-23 (COMPLETE)
**Current step**: Done
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (27 diags, 0 procs, 12 main_diags)
- [x] Phase 2A — structural scan (1 orphan→delete; pseudocyst miscategorised→relink; no Arabic hits)
- [x] Phase 2B — ICD-11 audit (27/27 verified: 11 ✅, 14 ❌, 1 ⚠️, 1 orphan)
- [x] Phase 2C — CPT audit  | N/A (no procs at audit start)
- [x] Phase 2D — candidate diagnoses (74 listed → 100 total)
- [x] Phase 2E — candidate procs (75 new + 25 reused → 100+; all AAPC-verified)
- [x] Phase 3 — migrations written (098-103)
- [x] Phase 4 — migrations applied ✅ (098-103)
- [x] Phase 5 — embeddings backfilled ✅ (74 diagnoses + 75 procs)
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
- 098 = FixHbpIcdCodes [applied ✅]
- 099 = AddHbpDiagnosesBatch1 [applied ✅]
- 100 = AddHbpDiagnosesBatch2 [applied ✅]
- 101 = ImportHbpProcCpts1 [applied ✅]
- 102 = ImportHbpProcCpts2 [applied ✅]
- 103 = LinkHbpProcCptsToMainDiags [applied ✅]

### ▶ Next action
Done. Final state: 100 diagnoses (all verified ✅, all embedded ✅), 101 proc_cpts (75
HBP-specific AAPC-verified + 25 reused GS + MNR, all embedded ✅), 12 main_diags, 0 orphans,
0 empty categories. Every category ≥5 diagnoses (except metastatic liver disease=4, documented)
and ≥8 procs.

### ✅ DIAGNOSES DONE — verified state (after 098-100)
100 diagnoses (all ICD-11 verified ✅, all embedded ✅), 0 orphans, 0 empty categories.
Per-category: acute pancreatitis 11, ampullary cancer 7, benign liver lesions 9, bile duct
injuries 5, biliary stricture 6, cholangiocarcinoma 5, cholecystitis & choledocholithiasis
14, chronic pancreatitis 9, HCC 6, cirrhosis & portal htn 15, metastatic liver disease 4
(documented narrow), pancreatic cancer 10. (Category-sum 101 = 100 distinct + DC10.02 shared
across bile duct injuries & biliary stricture.)

---

## Coverage targets (from Phase 1 dump)
| Metric | Value |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 27 |
| Diagnoses gap to 100 | 73 |
| Proc_cpts — dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups (HBP) | none |

> ⚠️ **Reuse note**: GS already owns shared proc_cpt rows that cover core HBP operations —
> groups **BILI** (47490/47760/47720/47120/47382/43274), **PANC** (48150/48154/48140/48520/48105),
> **OESO** (43107/43117/43246/43248), plus **ABDO** 47600 (open cholecystectomy), 38100
> (splenectomy), 49000/49002/49020, **LAPR** 47562/47563/47370/48145, **ENDO** 43260 (ERCP)/
> 43255/43244/43235. These must be **reused** (link to HBP main_diags) — never duplicated
> under a new alphaCode (`ON CONFLICT(alphaCode,numCode)` + the "no duplicate numCode" rule).

## 🔬 Working notes (verification log — written incrementally)

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| DC31.2 | acute biliary pancreatitis | ✅ | DC31.2 | Acute biliary pancreatitis |
| DC31.5 | acute exacerbation of chronic pancreatitis | ✅ | DC31.5 | Acute exacerbation of chronic pancreatitis |
| DC31.Z | acute pancreatitis, unspecified | ✅ | DC31.Z | Acute pancreatitis, unspecified |
| 2C16.0 | adenocarcinoma of ampulla of Vater | ✅ | 2C16.0 | Adenocarcinoma of ampulla of Vater |
| DA95.0 | hepatic haemangioma | ❌ | 2E81.0Y | Neoplastic haemangioma of other specified site (Haemangioma of liver) |
| DA96.0 | focal nodular hyperplasia of liver | ❌ | DB99.Y | Other diseases of liver (Focal nodular hyperplasia of liver) |
| DA97.0 | hydatid cyst of liver | ❌ | 1F73.0 | Echinococcus infection of liver (Hydatid liver cyst) — maybe shared w/ GS |
| DB01.0 | pancreatic pseudocyst | ❌ | DC30.1 | Pseudocyst of pancreas |
| DC00.0 | liver abscess | ❌ | DB90.0 | Abscess of liver — maybe shared w/ GS |
| DC15.0 | biliary stricture | ❌ | DC10.02 | Obstruction of bile duct (Stricture of bile duct) |
| DB96.2Z | primary sclerosing cholangitis | ✅ | DB96.2Z | Primary sclerosing cholangitis, unspecified |
| 2C18.0 | hilar cholangiocarcinoma | ✅ | 2C18.0 | Hilar cholangiocarcinoma (Klatskin tumour) |
| DA9B.0 | intrahepatic cholangiocarcinoma | ❌ | 2C12.10 | Intrahepatic cholangiocarcinoma |
| DC10.3 | gallbladder polyp | ✅ | DC10.3 | Polyp of gallbladder (shared w/ GS) |
| DC11.0 | cholelithiasis with acute cholecystitis | ✅ | DC11.0 | Cholelithiasis with acute cholecystitis |
| DC11.Z | cholelithiasis | ✅ | DC11.Z | Cholelithiasis, unspecified |
| DC13.0 | acute cholangitis | ❌ | DC13 | Cholangitis (acute) — MERGE into GS shared row |
| DC14.1 | choledocholithiasis | ❌ | DC11.6 | Calculus of bile duct (choledocholithiasis) — MERGE into GS shared row |
| DC32 | chronic pancreatitis | ✅ | DC32 | Chronic pancreatitis (established stem; HBP-only) |
| DA92.0 | hepatocellular carcinoma | ❌ | 2C12.02 | Hepatocellular carcinoma of liver — MERGE into GS row; **shared w/ SOC** (cross-dept) |
| 5C81.0 | portal hypertension | ❌ | DB98.7Z | Portal hypertension, unspecified (5C81 was metabolic chapter) |
| DA26.0 | oesophageal varices | ⚠️→MERGE | DA26.0Z | Oesophageal varices, unspecified — MERGE into GS's DA26.0Z (already exists) |
| DB93.1 | hepatic cirrhosis | ✅ | DB93.1 | Hepatic cirrhosis |
| DA93.Z | secondary malignant neoplasm of liver | ❌ | 2D80.0 | Malignant neoplasm metastasis in liver |
| DB00.0 | exocrine pancreatic carcinoma | ❌ | 2C10.Z | Malignant neoplasm of pancreas, unspecified — recode (avoid 2C10.0 oral/pancreas mismap); **shared w/ SOC** |
| DB01.1 | intraductal papillary mucinous neoplasm of pancreas | ❌ | 2E92.8 | Benign neoplasm of pancreas (IPMN) — recode; **shared w/ SOC** |
| DA20.3 | rupture or perforation of oesophagus | 🔴 ORPHAN | — | out of HBP scope → DELETE from HBP |

**Tally:** 27 codes → 11 ✅, 14 ❌, 1 ⚠️(merge), 1 orphan-delete.

### MIG-A plan — MERGE vs RECODE
**MERGES** (target row already exists, GS-owned → delete HBP wrong row + link to existing):
1. DA97.0 → 1F73.0 (hydatid; benign liver lesions)
2. DB01.0 → DC30.1 (pancreatic pseudocyst; relink to **acute pancreatitis**, was mis-filed in benign liver lesions)
3. DC00.0 → DB90.0 (liver abscess; benign liver lesions)
4. DC13.0 → DC13 (acute cholangitis; cholecystitis & choledocholithiasis)
5. DC14.1 → DC11.6 (choledocholithiasis; cholecystitis & choledocholithiasis)
6. DA92.0 → 2C12.02 (HCC; **HBP + SOC** hepatocellular carcinoma — cross-dept merge)
7. DA26.0 → DA26.0Z (oesophageal varices; liver cirrhosis & portal hypertension)

**FREE RECODES** (in-place UPDATE, target unused; junctions incl. SOC preserved automatically):
1. DA95.0 → 2E81.0Y (hepatic haemangioma)
2. DA96.0 → DB99.Y (focal nodular hyperplasia)
3. DC15.0 → DC10.02 (biliary stricture)
4. DA9B.0 → 2C12.10 (intrahepatic cholangiocarcinoma)
5. 5C81.0 → DB98.7Z (portal hypertension)
6. DA93.Z → 2D80.0 (liver metastases)
7. DB00.0 → 2C10.Z (exocrine pancreatic carcinoma; HBP+SOC)
8. DB01.1 → 2E92.8 (IPMN; HBP+SOC)

**DELETE:** DA20.3 (orphan, out of scope; HBP-only row).

### 2C — CPT audit findings
N/A — HBP has no proc_cpts yet (first import this cycle).

### 2D — Candidate diagnoses (planned, verified codes — AR + descriptions authored inline in migration)
| icdCode | EN name | main_diag | In DB? |
|---|---|---|---|
| DC31.0 | acute idiopathic pancreatitis | acute pancreatitis | NO |
| DC31.1 | acute alcohol-induced pancreatitis | acute pancreatitis | NO |
| DC31.3 | acute drug-induced pancreatitis | acute pancreatitis | NO |
| DC31.Y | acute necrotising pancreatitis | acute pancreatitis | NO |
| DC34 | obstructive pancreatitis | acute pancreatitis | NO |
| DC32.0 | calcific (chronic) pancreatitis | chronic pancreatitis | NO |
| DC32.1 | groove pancreatitis | chronic pancreatitis | NO |
| DC32.2 | hereditary chronic pancreatitis | chronic pancreatitis | NO |
| DC32.3 | chronic alcohol-induced pancreatitis | chronic pancreatitis | NO |
| DC33 | autoimmune pancreatitis (IgG4, type 1) | chronic pancreatitis | NO |
| 2C10.0&XH3PG9 | acinar cell carcinoma of pancreas | pancreatic cancer | NO |
| 2C10.1&XH8DS0 | pancreatic neuroendocrine tumour | pancreatic cancer | NO |
| 2C10.Y | pancreatic carcinoma (ductal, NEC) | pancreatic cancer | NO |
| 2E92.9 | benign pancreatic neuroendocrine tumour (insulinoma) | pancreatic cancer | NO |
| DC30.Z | pancreatic cystic neoplasm (mucinous/serous) | pancreatic cancer | NO |
| 2E92.6 | adenoma of ampulla of Vater | ampullary cancer | NO |
| 2E61.3 | carcinoma in situ of ampulla of Vater | ampullary cancer | NO |
| 2B80.00 | adenocarcinoma of duodenum (periampullary) | ampullary cancer | NO |
| 2C16.Y | malignant neoplasm of ampulla of Vater (NEC) | ampullary cancer | NO |
| 2E92.7 | hepatocellular adenoma | benign liver lesions | NO |
| DB99.1Z | simple hepatic cyst | benign liver lesions | NO |
| DB99.10 | polycystic liver disease | benign liver lesions | NO |
| DB98.2 | nodular regenerative hyperplasia of liver | benign liver lesions | NO |
| 2C12.01 | hepatoblastoma | hepatocellular carcinoma | NO |
| 2B56.3 | angiosarcoma of liver | hepatocellular carcinoma | NO |
| 2C12.00 | combined hepatocellular-cholangiocarcinoma | hepatocellular carcinoma | NO |
| 2C12.0Y | carcinoma of liver (NEC, incl. fibrolamellar) | hepatocellular carcinoma | NO |
| DA43.0 | gastric varices | liver cirrhosis & portal hypertension | NO |
| DB99.5 | hepatic encephalopathy | liver cirrhosis & portal hypertension | NO |
| DB99.2 | hepatorenal syndrome | liver cirrhosis & portal hypertension | NO |
| DB98.3 | portal vein thrombosis | liver cirrhosis & portal hypertension | NO |
| ME04.Z | ascites | liver cirrhosis & portal hypertension | NO |
| DB98.5 | Budd-Chiari syndrome | liver cirrhosis & portal hypertension | NO |
| 2C17.0 | extrahepatic (distal) cholangiocarcinoma | cholangiocarcinoma | NO |
| 2C13.0 | adenocarcinoma of the gallbladder | cholangiocarcinoma | NO |
| 2C12.1Y | intrahepatic bile duct carcinoma (NEC) | cholangiocarcinoma | NO |
| DC12.0Z | acute acalculous cholecystitis | cholecystitis & choledocholithiasis | NO |
| DC12.1 | chronic cholecystitis | cholecystitis & choledocholithiasis | shared w/ GS |
| DC12.0Y | empyema of gallbladder | cholecystitis & choledocholithiasis | NO |
| DC11.Y | Mirizzi syndrome | cholecystitis & choledocholithiasis | NO |
| DA91.30 | gallstone ileus of small intestine | cholecystitis & choledocholithiasis | NO |
| LB20.20 | choledochal cyst | biliary stricture | shared w/ PEDSURG |
| LB20.00 | Caroli disease (fibropolycystic liver) | biliary stricture | NO |
| LB20.22 | congenital stenosis/stricture of bile ducts | biliary stricture | NO |
| DC10.2 | fistula of gallbladder or bile duct (bile leak) | bile duct injuries | NO |
| NB91.2 | injury of gallbladder | bile duct injuries | NO |
| ME24.35 | perforation of gallbladder or bile ducts | bile duct injuries | NO |
| DC10.0Z | obstruction of gallbladder or bile ducts | bile duct injuries | NO |
| DC35.2 | pancreatic (exocrine) steatorrhoea/insufficiency | chronic pancreatitis | NO |
| DC35.Z | pancreatic duct calculus / certain pancreatic disease | chronic pancreatitis | NO |
| DB98.4 | splenic vein thrombosis | liver cirrhosis & portal hypertension | NO |
| DC50.00 | spontaneous bacterial peritonitis | liver cirrhosis & portal hypertension | NO |
| DB94.1Z | alcoholic hepatitis | liver cirrhosis & portal hypertension | NO |
| DB92.1 | non-alcoholic steatohepatitis (NASH) | liver cirrhosis & portal hypertension | maybe shared w/ GS |
| DB96.1Z | primary biliary cholangitis | liver cirrhosis & portal hypertension | NO |
| 2B5Y&XH9GF8 | epithelioid haemangioendothelioma (liver) | hepatocellular carcinoma | NO |
| 2D82 | metastasis in extrahepatic bile ducts | metastatic liver disease | NO |
| 2D91 | metastasis in peritoneum (carcinomatosis) | metastatic liver disease | NO |
| 2E2Z | malignant neoplasm metastasis, unspecified | metastatic liver disease | NO |
| NB91.4Z | injury of pancreas (pancreatic trauma) | acute pancreatitis | NO |
| DC31.4 | hereditary acute pancreatitis | acute pancreatitis | NO |
| 2C16.1 | neuroendocrine neoplasm of ampulla of Vater | ampullary cancer | NO |
| 2B80.01 | neuroendocrine neoplasm of duodenum (periampullary) | ampullary cancer | NO |
| DC11.4&XA4415 | hepatolithiasis with cholangitis (recurrent pyogenic) | biliary stricture | NO |
| DC14.3 | adenomyomatosis of gallbladder | cholecystitis & choledocholithiasis | NO |
| DC10.4 | cholesterolosis of gallbladder | cholecystitis & choledocholithiasis | NO |
| DC10.00 | obstruction of cystic duct | cholecystitis & choledocholithiasis | NO |
| LB21.1 | pancreas divisum | chronic pancreatitis | NO |
| DA43.3 | portal hypertensive gastropathy | liver cirrhosis & portal hypertension | NO |
| DC30.0 | true cyst of pancreas | pancreatic cancer | NO |
| 2C10.1&XH0U20 | neuroendocrine carcinoma of pancreas | pancreatic cancer | NO |
| 2C10.0&XH7CY5 | mixed ductal-neuroendocrine carcinoma of pancreas | pancreatic cancer | NO |
| 2E81.2Y | infantile haemangioma of liver | benign liver lesions | NO |

**Phase 2D total: 74 new diagnoses verified → 26 existing + 74 = 100.** Per-category final
counts (each ≥5 except metastatic liver disease=4, documented narrow — limited distinct
ICD-11 secondary-neoplasm entities exist): acute pancreatitis 11, ampullary cancer 7, benign
liver lesions 9, bile duct injuries 5, biliary stricture 6, cholangiocarcinoma 5,
cholecystitis & choledocholithiasis 13, chronic pancreatitis 9, HCC 6, cirrhosis & portal
htn 15, metastatic liver disease 4, pancreatic cancer 10.

### 2E — Candidate proc_cpts (planned)

**REUSED existing GS shared rows (25)** — linked to HBP main_diags, no new rows:
ABDO 47600/38100/49000/49002/49020; LAPR 47562/47563/47370/48145/38120; BILI 47490/47760/
47720/47120/47382/43274; PANC 48150/48154/48140/48520/48105; ENDO 43260/43255/43244; OESO 43246.

**NEW HBP-specific (75)** — all CPTs AAPC-verified active (deletion-prone families checked):
- **LIVR (20)** liver: 47000 47010 47011 47015 47100 47122 47125 47130 47133 47135 47140 47141 47142 47350 47360 47362 47371 47380 47381 47383
- **BILE (17)** open biliary: 47480 47550 47605 47610 47612 47620 47700 47711 47712 47715 47721 47740 47765 47780 47800 47801 47900
- **PTBD (14)** percutaneous biliary (2016 set, all current): 47531 47532 47533 47534 47535 47536 47537 47538 47539 47540 47541 47542 47543 47544
- **PANC (11)** pancreatic: 48000 48020 48100 48102 48120 48146 48155 48160 48500 48510 48548
- **SPLN (3)** splenic: 38101 38102 38115
- **PORT (6)** portosystemic shunt: 37140 37160 37180 37181 37182 37183
- **ERCP (4)** therapeutic ERCP: 43261 43262 43264 43265

> ⚠️ **CPT deletion caught**: **47802** (U-tube hepaticoenterostomy) was DELETED effective
> 2025-01-01 — excluded. (Reusable note: the percutaneous biliary codes 47510/47511/47525/
> 47530/47560/47561/47630 were deleted 2016-01-01 → replaced by the 47531–47544 family used here.)

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 098 | FixHbpIcdCodes | 8 recodes + 7 merges (incl. cross-dept SOC HCC) + orphan delete | applied ✅ |
| 099 | AddHbpDiagnosesBatch1 | +40 diagnoses (pancreatic/ampullary/cholangio/bile-duct) | applied ✅ |
| 100 | AddHbpDiagnosesBatch2 | +34 diagnoses (liver/cholecystitis/cirrhosis/metastatic) | applied ✅ |
| 101 | ImportHbpProcCpts1 | +37 HBP proc_cpts (LIVR/BILE) | applied ✅ |
| 102 | ImportHbpProcCpts2 | +38 HBP proc_cpts (PTBD/PANC/SPLN/PORT/ERCP) | applied ✅ |
| 103 | LinkHbpProcCptsToMainDiags | linked 75 new + 25 reused GS procs + MNR to 12 main_diags | applied ✅ |

---

## Summary
| Metric | Count |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 100 |
| Proc_cpts (current, HBP-linked) | 101 (75 new HBP-specific + 25 reused GS + MNR) |
| ICD-11 codes fixed (❌ wrong) | 14 |
| ICD-11 codes updated (⚠️ approximate / parent→leaf) | 1 (DA26.0→DA26.0Z, via merge) |
| CPT codes fixed | 0 (none existed; 1 deletion 47802 avoided in selection) |
| Structural issues resolved | 2 (orphan DA20.3 removed; pseudocyst recategorised) |
| New diagnoses added (this run) | 74 |
| New proc_cpts added (this run) | 75 (HBP-specific) |
| Diagnoses re-embedded | 74 |
| Proc_cpts embedded | 75 |

**Data quality**: HBP seed was ~52% corrupt (14/27 ICD codes wrong — fabricated sequential
codes in the DA9x/DB0x/DC0x/DC1x ranges; portal hypertension in the metabolic chapter 5C81.0).

## ICD-11 Changes Applied
| Old code | Old name | New code | New name | Migration |
|---|---|---|---|---|
| DA95.0 | hepatic haemangioma | 2E81.0Y | Haemangioma of liver | 098 (recode) |
| DA96.0 | focal nodular hyperplasia of liver | DB99.Y | FNH of liver | 098 (recode) |
| DC15.0 | biliary stricture | DC10.02 | Stricture of bile duct | 098 (recode) |
| DA9B.0 | intrahepatic cholangiocarcinoma | 2C12.10 | Intrahepatic cholangiocarcinoma | 098 (recode) |
| 5C81.0 | portal hypertension | DB98.7Z | Portal hypertension (was metabolic chapter) | 098 (recode) |
| DA93.Z | secondary malignant neoplasm of liver | 2D80.0 | Malignant neoplasm metastasis in liver | 098 (recode) |
| DB00.0 | exocrine pancreatic carcinoma | 2C10.Z | Malignant neoplasm of pancreas | 098 (recode, HBP+SOC) |
| DB01.1 | IPMN of pancreas | 2E92.8 | Benign neoplasm of pancreas (IPMN) | 098 (recode, HBP+SOC) |
| DA97.0 | hydatid cyst of liver | 1F73.0 | Echinococcus infection of liver | 098 (MERGE→GS) |
| DB01.0 | pancreatic pseudocyst | DC30.1 | Pseudocyst of pancreas | 098 (MERGE→GS; recategorised) |
| DC00.0 | liver abscess | DB90.0 | Abscess of liver | 098 (MERGE→GS) |
| DC13.0 | acute cholangitis | DC13 | Cholangitis | 098 (MERGE→GS) |
| DC14.1 | choledocholithiasis | DC11.6 | Calculus of bile duct | 098 (MERGE→GS) |
| DA92.0 | hepatocellular carcinoma | 2C12.02 | Hepatocellular carcinoma of liver | 098 (MERGE→GS; **HBP+SOC** cross-dept) |
| DA26.0 | oesophageal varices | DA26.0Z | Oesophageal varices, unspecified | 098 (MERGE→GS, parent→leaf) |

## CPT Changes Applied
None (HBP had no proc_cpts at audit start). 75 new HBP-specific CPTs imported (101-102), all
AAPC-verified active. The deleted code **47802** (U-tube hepaticoenterostomy, deleted
2025-01-01) was identified and excluded from the import.

## Structural Fixes
- **Orphan DA20.3** "rupture or perforation of oesophagus" — out of HBP scope (foregut/
  thoracic emergency; originated from HBP seed as DC31.0, recoded in mig 024). **Decision:
  DELETE from HBP** (HBP-only row; not a hepatobiliary condition).
- **Pancreatic pseudocyst miscategorised** — DB01.0 (pseudocyst) sat under "benign liver
  lesions". On merge to DC30.1, **relink to "acute pancreatitis"** (pseudocyst is a local
  complication of pancreatitis, not a liver lesion).
- **Arabic terminology check**: no دماغ/brain hits (HBP has no brain anatomy). No errors.
- Empty main_diags (no diag): 0. Empty main_diags (no proc): 12 → resolved by Phase 2E/3.

## New Diagnoses Added
74 diagnoses added (migrations 099-100) across all 12 categories — see the **2D — Candidate
diagnoses** working-notes table above for the full per-code list (icdCode → EN name → main_diag).
Final per-category diagnosis counts: acute pancreatitis 11, ampullary cancer 7, benign liver
lesions 9, bile duct injuries 5, biliary stricture 6, cholangiocarcinoma 5, cholecystitis &
choledocholithiasis 14, chronic pancreatitis 9, hepatocellular carcinoma 6, liver cirrhosis &
portal hypertension 15, metastatic liver disease 4, pancreatic cancer 10.

## New Proc_cpts Added
75 HBP-specific proc_cpts added (migrations 101-102) across 7 groups, plus 25 reused GS shared
rows linked to HBP main_diags (migration 103) — see the **2E — Candidate proc_cpts** working
notes above for the full list. Groups: LIVR (20), BILE (17), PTBD (14), PANC (11 new), SPLN (3),
PORT (6), ERCP (4). Final per-category proc counts: acute pancreatitis 11, ampullary cancer 8,
benign liver lesions 12, bile duct injuries 8, biliary stricture 17, cholangiocarcinoma 16,
cholecystitis & choledocholithiasis 15, chronic pancreatitis 10, HCC 12, cirrhosis & portal htn
19, metastatic liver disease 9, pancreatic cancer 10.

## Still-Open Items
- **metastatic liver disease = 4 diagnoses** (documented narrow): few distinct ICD-11
  secondary-neoplasm entities exist (2D80.0 liver, 2D82 EH bile ducts, 2D91 peritoneum, 2E2Z
  unspecified). Below the ≥5 target but exhaustive for the ontology.
- **Pre-existing MFS oral-cancer mismap** (out of HBP scope, flagged for an MFS audit): the
  seed used ICD-11 codes **2C10.0** (Adenocarcinoma of pancreas), **2C10.1** (Pancreatic
  neuroendocrine neoplasms) and **2C12.0** (Malignant neoplasm of liver) as MFS "oral cancer"
  rows. GS later reused 2C10.0 for pancreatic adenocarcinoma. HBP avoided these by using 2C10.Z
  (exocrine carcinoma) and postcoordinated 2C10.0&XH3PG9 / 2C10.1&XH8DS0 / 2C10.1&XH0U20 /
  2C10.0&XH7CY5 for its pancreatic neoplasms. Recorded in MISMAPPED_ICD11_CODES.md.
