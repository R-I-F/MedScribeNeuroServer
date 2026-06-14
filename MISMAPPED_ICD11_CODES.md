# Mismapped ICD-11 codes (for review)

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
