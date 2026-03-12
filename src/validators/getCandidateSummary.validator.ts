import { query } from "express-validator";

export const getCandidateSummaryValidator = [
  query("search")
    .optional()
    .isString()
    .withMessage("search must be a string")
    .trim(),
];
