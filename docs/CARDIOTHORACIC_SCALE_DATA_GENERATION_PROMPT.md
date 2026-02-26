# Engineered Prompt: Generate Cardio-Thoracic Department Scale Data

Use this prompt with another AI (or data team) to generate the **exact data structures** needed to scale this MedScribe server from **Neurosurgery** to a **Cardio-Thoracic** department. The target system uses **MariaDB + TypeORM**, **multi-tenant by institution** (each institution has its own DB), and the same schema across institutions.

---

## 1. Context: Current System (Neurosurgery)

### 1.1 Database tree you are extending

- **Main diagnoses** (`main_diags`): Each row = one “main diagnosis” (e.g. “Brain tumor”, “Spine trauma”). Linked via join tables to:
  - **ICD codes** (`diagnoses`) → `main_diag_diagnoses` (mainDiagId, diagnosisId)
  - **CPT procedure codes** (`proc_cpts`) → `main_diag_procs` (mainDiagId, procCptId)
- **Additional questions** (`additional_questions`): One row per main diagnosis (PK = `mainDiagDocId`). Six **flags** (0 or 1): `spOrCran`, `pos`, `approach`, `region`, `clinPres`, `intEvents`. Each flag means “show/require this extra field when the user selects this main diag.”
- **Reference / choice tables** (flat lists, no FK from submission; submission stores **string values**):
  - `diagnoses`: ICD-10 (icdCode, icdName, neuroLogName JSON array — in cardio you can repurpose as “altNames” or leave null).
  - `proc_cpts`: CPT (title, alphaCode, numCode, description).
  - `arab_procs`: Local/Arabic procedure codes (title, alphaCode, numCode, description).
  - `approaches`: id (UUID), approach (varchar 50).
  - `regions`: id (UUID), region (varchar 50).
  - `positions`: id (UUID), position (varchar 50).
  - `consumables`: id (UUID), consumables (varchar 100).
  - `equipment`: id (UUID), equipment (varchar 100).
- **Hospitals** (`hospitals`): id, arabName, engName, location (JSON `{ long, lat }`). Used by `cal_surgs` (calendar surgeries).
- **Calendar surgeries** (`cal_surgs`): timeStamp, patientName, patientDob, gender, hospitalId, arabProcId (optional), procDate, google_uid, formLink. No direct link to main_diag; main_diag is chosen at **submission** time.
- **Submissions** (`submissions`): Link to one `main_diags.id` (mainDiagDocId), many ICDs (via `submission_icds`), many CPTs (via `submission_proc_cpts`). Also store **free-text/copy** of names: diagnosisName (JSON array), procedureName (JSON array). Optional fields filled when “additional questions” are enabled: spOrCran, pos, approach, region, clinPres, IntEvents. Plus: insUsed, consUsed (comma-separated strings), consDetails, surgNotes, IntEvents, etc.

### 1.2 Validation vs reference data

- **Backend submission validator** (create submission) currently uses **hardcoded** allowed lists for:
  - `insUsed` (equipment) — must match one of a fixed list (neuro: endoscope, microscope, …).
  - `consUsed` (consumables) — must match a fixed list (neuro: artificial dural graft, …); some entries contain commas and are treated as one token.
  - `spOrCran`, `pos`, `region` — fixed enums (e.g. spinal/cranial, supine/prone/…, craniocervical/cervical/dorsal/lumbar).
- **References API** (e.g. GET /references) returns **from DB**: consumables, equipment, approaches, regions, positions. So the **UI dropdowns** can be driven by DB; **validation** may stay hardcoded unless the app is changed to validate against DB (or department-specific config). For scale, you are generating **DB seed data** that can later be used both for dropdowns and, if the app is updated, for validation.

### 1.3 Variable types and “additional questions”

- **Additional questions** are not a tree; they are **six toggles per main diagnosis**:
  - `spOrCran` (tinyint 0/1)
  - `pos` (tinyint 0/1)
  - `approach` (tinyint 0/1)
  - `region` (tinyint 0/1)
  - `clinPres` (tinyint 0/1)
  - `intEvents` (tinyint 0/1)
- When 1, the submission form shows/requires that field. Stored on submission as: spOrCran/pos/approach/region = string (varchar), clinPres/IntEvents = text.
- **Choices** for approach/region/position come from tables `approaches`, `regions`, `positions`. For cardio-thoracic you need **cardio-thoracic-specific** values in those tables (and optionally department-specific equipment/consumables).

---

## 2. What you must generate (output format)

Produce **structured data** (e.g. JSON or SQL inserts) that can be used to **seed** or **import** into the cardio-thoracic institution’s database. Use the same table and column names as in the schema below.

### 2.1 Table schemas (for reference)

- **main_diags**: id (UUID), title (varchar 200), createdAt, updatedAt.
- **diagnoses**: id (UUID), icdCode (varchar 255), icdName (varchar 500), neuroLogName (json array, nullable), createdAt, updatedAt.
- **proc_cpts**: id (UUID), title (varchar 100), alphaCode (varchar 10), numCode (varchar 10), description (varchar 500), createdAt, updatedAt.
- **main_diag_diagnoses**: mainDiagId, diagnosisId (composite PK).
- **main_diag_procs**: mainDiagId, procCptId (composite PK).
- **additional_questions**: mainDiagDocId (PK), spOrCran (tinyint 0/1), pos (tinyint 0/1), approach (tinyint 0/1), region (tinyint 0/1), clinPres (tinyint 0/1), intEvents (tinyint 0/1).
- **approaches**: id (UUID), approach (varchar 50).
- **regions**: id (UUID), region (varchar 50).
- **positions**: id (UUID), position (varchar 50).
- **consumables**: id (UUID), consumables (varchar 100).
- **equipment**: id (UUID), equipment (varchar 100).
- **hospitals**: id (UUID), arabName (varchar 100), engName (varchar 100), location (json nullable), createdAt, updatedAt.
- **arab_procs**: id (UUID), title (varchar 100), alphaCode (varchar 10), numCode (varchar 255), description (text), createdAt, updatedAt.

All IDs must be valid UUIDs (v4). Character set: utf8mb4_unicode_ci.

---

## 3. Instructions for the AI / data generator

Copy the block below and give it to the other AI (or use it as a spec for manual data creation).

---

**PROMPT START**

You are generating **seed/import data** to scale a surgical log and assessment system from **Neurosurgery** to a **Cardio-Thoracic** department. The database is MariaDB; tables use UUID primary keys and utf8mb4_unicode_ci.

**Deliverables:** For each section, output either (1) JSON arrays of records keyed by table name, or (2) SQL INSERT statements, so that the data can be loaded into the existing schema without changing table structures.

**1) Main diagnoses (main_diags)**  
- List **cardio-thoracic main diagnoses** (e.g. “Coronary artery disease”, “Valve replacement”, “Thoracic aortic aneurysm”, “Lung resection”, “Congenital heart repair”, “Pacemaker/ICD”, etc.).  
- For each: provide `id` (UUID), `title` (string, max 200 chars).  
- Create a **representative set** (e.g. 15–25 main diags) covering adult cardiac, thoracic, and congenital as appropriate.

**2) ICD-10 (diagnoses)**  
- For each main diagnosis above, list **relevant ICD-10 codes** (e.g. I25.1, I35.0, I71.0, C34.x, Z95.x, Q20–Q28, etc.).  
- Each diagnosis row: `id` (UUID), `icdCode`, `icdName` (official or common name, max 500 chars), `neuroLogName` (null or JSON array of alternative names).  
- Build the **main_diag_diagnoses** link table: for each main diag, list which diagnosis IDs (ICD) are linked (many-to-many).  
- Ensure every main diag has at least one linked ICD; each ICD can link to one or more main diags.

**3) CPT procedure codes (proc_cpts)**  
- List **CPT codes** relevant to cardio-thoracic surgery (e.g. CABG, valve repair/replacement, thoracic aorta, lung resection, pacemaker/ICD, congenital repair, etc.).  
- Each row: `id` (UUID), `title` (max 100), `alphaCode`, `numCode` (max 10 each), `description` (max 500).  
- Build **main_diag_procs**: for each main diag, list which proc_cpt IDs are linked (many-to-many).  
- Ensure every main diag has at least one linked CPT where applicable.

**4) Additional questions (additional_questions)**  
- One row **per main diagnosis** (same UUID as main_diag.id for mainDiagDocId).  
- Columns: mainDiagDocId, spOrCran, pos, approach, region, clinPres, intEvents. Each is 0 or 1.  
- **Semantic mapping for cardio-thoracic:**  
  - **spOrCran**: repurpose as “cardiac vs thoracic” or “surgery type” (e.g. 1 = show field “Cardiac / Thoracic / Both”).  
  - **pos**: 1 = show “Patient position” (supine, lateral, etc.).  
  - **approach**: 1 = show “Surgical approach” (sternotomy, thoracotomy, minimally invasive, etc.).  
  - **region**: 1 = show “Region” (e.g. coronary territory, valve, aorta, lung, mediastinum).  
  - **clinPres**: 1 = show “Clinical presentation”.  
  - **intEvents**: 1 = show “Intraoperative events”.  
- Set 0/1 per main diag based on clinical relevance (e.g. for “CABG” you might set approach=1, region=1, clinPres=1, intEvents=1).

**5) Reference tables – choices and variable types**  
- **approaches**: List **surgical approaches** for cardio-thoracic (e.g. median sternotomy, anterolateral thoracotomy, posterolateral thoracotomy, VATS, mini-thoracotomy, subxiphoid, etc.). Each: id (UUID), approach (varchar 50).  
- **regions**: List **anatomic/clinical regions** (e.g. coronary, aortic valve, mitral valve, thoracic aorta, lung R/L, mediastinum, etc.). Each: id (UUID), region (varchar 50).  
- **positions**: List **patient positions** (e.g. supine, lateral, prone, other). Each: id (UUID), position (varchar 50).  
- **equipment**: List **instruments/equipment** used in cardio-thoracic (e.g. heart-lung machine, sternal saw, vessel sealers, endoscope, thoracoscope, ultrasound, pacing leads, etc.). Each: id (UUID), equipment (varchar 100).  
- **consumables**: List **consumables** (e.g. grafts, valves, conduits, sternal wires, chest tubes, cannulae, biological glue, etc.). Each: id (UUID), consumables (varchar 100). If any name contains a comma, note it; the system may treat comma-containing names as a single token in comma-separated input.

**6) Hospitals**  
- Provide **3–5 example hospitals** (or use “Cardio-Thoracic Hospital A/B/C” if real names are not to be used). Each: id (UUID), arabName, engName, location (null or { "long": number, "lat": number }).

**7) Arabic / local procedure codes (arab_procs)**  
- If the current system uses local procedure codes for calendar surgeries, provide a small set (e.g. 5–10) for cardio-thoracic: id (UUID), title, alphaCode, numCode, description. If not used, provide an empty list and state that arab_procs can be left empty.

**8) Optional: submission validation enums**  
- The **current** app validates submissions with **hardcoded** lists for roleInSurg, otherSurgRank, insUsed, consUsed, spOrCran, pos, region.  
- Output a **recommended list** for cardio-thoracic for:  
  - **insUsed** (equipment): same as the `equipment` table values (exact strings, comma-separated in submission).  
  - **consUsed** (consumables): same as the `consumables` table values; list any multi-word or comma-containing values explicitly.  
  - **spOrCran** (repurposed): e.g. ["cardiac", "thoracic", "both"] or keep ["spinal", "cranial"] if the field is not repurposed.  
  - **pos**: e.g. ["supine", "lateral", "prone", "other"].  
  - **region**: list of allowed region strings matching `regions.region`.  
- This will be used to update the server’s validation (or config) when scaling to cardio-thoracic.

**Constraints:**  
- All strings must be within the column length limits above.  
- Use valid ICD-10 and CPT codes; prefer commonly used codes in cardio-thoracic practice.  
- Keep naming consistent in English (and Arabic where required); avoid special characters that could break CSV/JSON import.

**PROMPT END**

---

## 4. Summary: What is scalable

| Area | Scalable? | Notes |
|------|-----------|--------|
| main_diags | Yes | New titles + links to ICD/CPT. |
| diagnoses (ICD) | Yes | New codes; link via main_diag_diagnoses. |
| proc_cpts (CPT) | Yes | New codes; link via main_diag_procs. |
| arab_procs | Yes | Department-specific local codes. |
| additional_questions | Yes | One row per main diag; same 6 flags; semantics can be department-specific (e.g. spOrCran → cardiac/thoracic). |
| approaches | Yes | New list per department. |
| regions | Yes | New list per department. |
| positions | Yes | Can overlap or differ. |
| consumables | Yes | New list; note comma-in-name handling. |
| equipment | Yes | New list. |
| hospitals | Yes | Per-institution; add as needed. |
| cal_surgs | N/A | Created at runtime; no seed. |
| submissions | N/A | Created at runtime; no seed. |
| roleInSurg / otherSurgRank | Config | Currently hardcoded; recommend cardio-thoracic enum list in prompt section 8. |

---

## 5. After you receive the generated data

1. **Load order:** diagnoses → proc_cpts → main_diags → main_diag_diagnoses, main_diag_procs → additional_questions → approaches, regions, positions, consumables, equipment → hospitals → arab_procs (if any).
2. **Institution:** Create or use an institution with `department = 'cardiothoracic'` (or similar) and its own database; load the generated data into that DB.
3. **Validation:** If the server still validates with hardcoded lists, update `createSubmission.validator.ts` (or move to DB/config) using the “recommended list” from section 8 of the prompt.
4. **consUsed parsing:** If new consumables contain commas, extend `parseConsUsedTokens()` in `consUsedValidator.util.ts` with the new multi-part tokens so they are validated as a single option.

This document and the prompt above are the single reference for generating cardio-thoracic scale data that matches the existing database tree, main diag ↔ ICD/CPT links, additional-questions flags, and reference tables (choices, variable types, hospitals, consumables, equipment).
