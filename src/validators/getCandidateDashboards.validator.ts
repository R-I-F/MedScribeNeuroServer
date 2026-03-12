import { query } from "express-validator";

export const getCandidateDashboardsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be an integer greater than or equal to 1"),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be an integer between 1 and 100"),
];

