/**
 * Validator pieces for person data, so every route that writes a name, phone or nationality
 * stores the same canonical form (docs/DATA_NORMALIZATION_PLAN.md, stage N1).
 * The rules themselves live in src/utils/personData.ts.
 */
import { normalizePhone, normalizePersonName, canonicalNationality } from "../utils/personData";

export const PHONE_ERROR = "phone number must be a valid mobile number, for example 01012345678 or +201012345678";
export const NATIONALITY_ERROR = "nationality must be one of the listed nationalities";

/** Canonical E.164 when valid; otherwise the trimmed input, which assertPhone then rejects. */
export const sanitizePhone = (v: unknown) => normalizePhone(v) ?? (typeof v === "string" ? v.trim() : v);
export const assertPhone = (v: unknown) => {
  if (!normalizePhone(v)) throw new Error(PHONE_ERROR);
  return true;
};

export const sanitizeName = (v: unknown) => (typeof v === "string" ? normalizePersonName(v) : v);

/** Canonical list value when recognised; otherwise the trimmed input, which assertNationality rejects. */
export const sanitizeNationality = (v: unknown) => canonicalNationality(v) ?? (typeof v === "string" ? v.trim() : v);
export const assertNationality = (v: unknown) => {
  if (!canonicalNationality(v)) throw new Error(NATIONALITY_ERROR);
  return true;
};

/** checkSchema fragments. */
export const phoneSchema = {
  customSanitizer: { options: sanitizePhone },
  custom: { options: assertPhone, errorMessage: PHONE_ERROR },
};
export const nameSanitizerSchema = { customSanitizer: { options: sanitizeName } };
export const nationalitySchema = {
  customSanitizer: { options: sanitizeNationality },
  custom: { options: assertNationality, errorMessage: NATIONALITY_ERROR },
};
