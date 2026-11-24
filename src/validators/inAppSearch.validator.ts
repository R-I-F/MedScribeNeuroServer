import { checkSchema } from "express-validator";

/** POST /inAppSearch/query - authenticated in-form semantic search. */
export const inAppSearchQueryValidator = checkSchema({
  query: {
    in: ["body"],
    notEmpty: true,
    isLength: { options: { min: 2, max: 500 }, errorMessage: "query must be 2-500 characters" },
    trim: true,
  },
  type: {
    in: ["body"],
    notEmpty: true,
    isIn: { options: [["procedure", "diagnosis"]], errorMessage: "type must be procedure or diagnosis" },
  },
  purpose: {
    in: ["body"],
    optional: true,
    isIn: { options: [["assist", "missing"]], errorMessage: "purpose must be assist or missing" },
  },
  mainDiagId: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isUUID: { errorMessage: "mainDiagId must be a UUID" },
  },
});

/** POST /inAppSearch/events/:id/outcome - what the user did after a search. */
export const inAppSearchOutcomeValidator = checkSchema({
  id: { in: ["params"], isUUID: { errorMessage: "id must be a UUID" } },
  outcome: {
    in: ["body"],
    isIn: { options: [["picked", "none"]], errorMessage: "outcome must be picked or none" },
  },
  pickedCode: {
    in: ["body"],
    optional: { options: { values: "null" } },
    isString: true,
    trim: true,
    isLength: { options: { min: 1, max: 32 }, errorMessage: "pickedCode must be 1-32 characters" },
  },
});
