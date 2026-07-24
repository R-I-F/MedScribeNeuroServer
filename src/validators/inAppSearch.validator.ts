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
});
