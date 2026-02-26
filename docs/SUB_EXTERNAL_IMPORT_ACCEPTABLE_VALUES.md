# Acceptable Values for Sub (Submission) External Import

Use these exact values when importing or posting submission data from external sources (e.g. bulk import, spreadsheets). Validation is **case-insensitive** (values are compared in lowercase).

**Source in code:** `src/validators/createSubmission.validator.ts`, `src/sub/interfaces/sub.interface.ts`

---

## 1. Role in surgery (`roleInSurg`)

**Format:** Single value per submission.

| Value |
|-------|
| `operator` |
| `operator with supervisor scrubbed (assisted)` |
| `supervising, teaching a junior colleague (scrubbed)` |
| `assistant` |
| `observer (Scrubbed)` |

---

## 2. Other surgeon rank (`otherSurgRank`)

**Format:** Single value per submission.

| Value |
|-------|
| `professor` |
| `assistant professor` |
| `lecturer` |
| `assistant lecturer` |
| `resident (cairo university)` |
| `guest specialist` |
| `guest resident` |
| `consultant` |
| `specialist` |
| `other` |

---

## 3. Consumables (`consUsed`)

**Format:** Comma-separated string. Each token must be one of the values below. Max length 1000 characters.

**Note:** Two options contain commas; treat each as a single token:
- `omaya resevoir, ventricular stent`
- `csf drainage system, otherwise than vp, lp and evd`

| Value |
|-------|
| `artificial dural graft` |
| `external ventricular drain` |
| `bone cement` |
| `intervertebral cage` |
| `nervous system stimulator` |
| `pedicle screws` |
| `lp shunt` |
| `omaya resevoir, ventricular stent` |
| `titanium mesh/ and or miniplates` |
| `vp shunt- fixed pressure` |
| `vp shunt- programmable` |
| `csf drainage system, otherwise than vp, lp and evd` |
| `other` |
| `none` |

**Example:** `pedicle screws, bone cement, none`

---

## 4. Equipment / instruments (`insUsed`)

**Format:** Comma-separated string. Each token must be one of the values below. Max length 1000 characters.

| Value |
|-------|
| `endoscope` |
| `microscope` |
| `high speed drill` |
| `neuro-monitoring` |
| `ultrasonic aspirator` |
| `ultrasound and or doppler /intraoperative` |
| `stereotactic frame` |
| `radiofrequency device` |
| `neuronavigation` |
| `c-Arm` |
| `none` |

**Example:** `microscope, neuronavigation, none`

---

## Quick reference

| Field | Sub property | Format | Count |
|-------|--------------|--------|-------|
| Role in surgery | `roleInSurg` | Single value | 5 |
| Other surgeon rank | `otherSurgRank` | Single value | 10 |
| Consumables | `consUsed` | Comma-separated | 14 |
| Equipment (instruments) | `insUsed` | Comma-separated | 11 |
