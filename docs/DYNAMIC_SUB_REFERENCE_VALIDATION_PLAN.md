# Lightweight submission validation (remove hardcoded lists)

**Overview:** Remove hardcoded instruments, consumables, positions, and regions from submission validators so each institution can use its own values. The frontend already receives allowed choices from the institution DB (e.g. via references/bundler), so the backend does not re-validate against those lists — only type, length, and required/optional checks. Consumables parsing keeps the existing two hardcoded comma-containing strings (they cannot be changed); all other consumables have no commas in the value.

## Current state

- **Validators** ([createSubmission.validator.ts](../src/validators/createSubmission.validator.ts), [createSupervisorSubmission.validator.ts](../src/validators/createSupervisorSubmission.validator.ts)) use hardcoded `INS_USED`, `CONS_USED`, `POS`, `REGION` (and `SP_OR_CRAN`). Submissions are rejected if values are not in these fixed lists.
- **Consumables parsing** ([consUsedValidator.util.ts](../src/validators/consUsedValidator.util.ts)) hardcodes exactly two multi-comma consumables so comma-separated input is tokenized correctly:
  - `"omaya resevoir, ventricular stent"`
  - `"csf drainage system, otherwise than vp, lp and evd"`
  These two strings cannot be changed; all other consumables do not contain commas.
- **Frontend** gets equipment, consumables, positions, and regions from the institution DB (references/bundler). Re-validating those same inputs on the backend adds unnecessary load.

## Approach

- **No middleware**, no DB reads for reference data on submit.
- **Validators:** Drop "must be one of" checks for `insUsed`, `consUsed`, `pos`, `region`. Keep only: required/optional, `isString`, `isLength` (max) where applicable.
- **Consumables parsing:** Leave [consUsedValidator.util.ts](../src/validators/consUsedValidator.util.ts) **unchanged**. The two comma-containing consumables stay hardcoded for parsing; no dynamic list and no new comma-containing values.

## Implementation plan

### 1. Validators: remove list-based validation

- **Files:** [createSubmission.validator.ts](../src/validators/createSubmission.validator.ts), [createSupervisorSubmission.validator.ts](../src/validators/createSupervisorSubmission.validator.ts)
- **Remove:** Constants `INS_USED`, `CONS_USED`, `POS`, `REGION` and all validation that checks values against these lists (`isIn`, custom validators that call `isValidConsUsed` or compare to `INS_USED`).
- **Keep:** `ROLE_IN_SURG`, `OTHER_SURG_RANK`, `SP_OR_CRAN` as-is (unchanged for this plan).
- **Replace with:**
  - **insUsed:** required, `isString`, `isLength` (e.g. max 1000), `trim`.
  - **consUsed:** required, `isString`, `isLength` (e.g. max 1000), `trim`.
  - **pos:** optional, `isString`, `isLength` (e.g. max 255 if you have a limit), `trim`.
  - **region:** optional, `isString`, `isLength` (e.g. max 255 if you have a limit), `trim`.

No "must be one of" messages and no DB-backed checks.

### 2. Consumables parsing: leave as-is

- **File:** [src/validators/consUsedValidator.util.ts](../src/validators/consUsedValidator.util.ts)
- **No changes.** Keep `parseConsUsedTokens(value: string)` with the two hardcoded consumables:
  - `"omaya resevoir, ventricular stent"`
  - `"csf drainage system, otherwise than vp, lp and evd"`
- Only these two variables have commas within the string; they cannot be renamed. All other consumables avoid commas. The util remains for any code that needs to tokenize `consUsed` (e.g. display or storage); validators will no longer call `isValidConsUsed` for list-checking.

### 3. Types and provider

- **File:** [src/sub/interfaces/sub.interface.ts](../src/sub/interfaces/sub.interface.ts)
  - Change `TInsUsed` and `TConsUsed` from union literals to **`string`**.
  - Change `pos` in `ICnsTumor` and `region` in `ISpDegenDis` (and any other literal unions for pos/region) to **`string`**.
- **File:** [src/sub/sub.provider.ts](../src/sub/sub.provider.ts)
  - Remove casts to literal types for `pos`, `region`, `insUsed`, `consUsed`. Use `string` (e.g. `toReq(body.pos)`, `toOpt(body.region)` as appropriate).

### 4. No new middleware or router changes

- Do **not** add `subReferenceDataLoader` or any middleware.
- Do **not** change [src/sub/sub.router.ts](../src/sub/sub.router.ts) for this plan.

### 5. Docs (optional)

- In [API_DOCUMENTATION.md](../API_DOCUMENTATION.md), clarify that `insUsed`, `consUsed`, `pos`, and `region` are free-form strings (type/length validated only) and that valid options are provided by the institution reference endpoints; backend does not validate against those lists.

## Files to touch (summary)

| Area       | File                                                     | Action                                                                 |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Validation | `src/validators/createSubmission.validator.ts`           | Remove INS_USED/CONS_USED/POS/REGION; use type + length + required only |
| Validation | `src/validators/createSupervisorSubmission.validator.ts` | Same as above                                                          |
| Parsing    | `src/validators/consUsedValidator.util.ts`               | No change — keep two hardcoded comma-containing consumables            |
| Types      | `src/sub/interfaces/sub.interface.ts`                    | TInsUsed/TConsUsed/pos/region → string                                 |
| Provider   | `src/sub/sub.provider.ts`                                | Use string for pos/region/insUsed/consUsed (drop literal casts)       |

## Out of scope (unchanged)

- **roleInSurg**, **otherSurgRank**, **spOrCran**: Remain hardcoded.
- **External import** (`createFromExternalValidator`): No change.
- **Consumables with commas:** Only the two existing strings; no new comma-containing consumables.
