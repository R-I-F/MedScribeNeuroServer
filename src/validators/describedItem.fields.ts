import { ParamSchema } from "express-validator";

/**
 * Shared body fields for both submission create validators (candidate + supervisor):
 * the item the catalogue did not have, and the "Not listed?" search that preceded it
 * (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md). All optional; the provider enforces the rule.
 */
const describedText: ParamSchema = {
  in: ["body"],
  optional: { options: { values: "falsy" } },
  isString: { errorMessage: "must be a string" },
  trim: true,
  isLength: { options: { min: 3, max: 120 }, errorMessage: "must be 3-120 characters" },
};

const searchEventId: ParamSchema = {
  in: ["body"],
  optional: { options: { values: "falsy" } },
  isUUID: { errorMessage: "must be a UUID" },
};

export const describedItemFields: Record<string, ParamSchema> = {
  otherProcedureText: describedText,
  otherDiagnosisText: describedText,
  otherProcedureSearchEventId: searchEventId,
  otherDiagnosisSearchEventId: searchEventId,
};
