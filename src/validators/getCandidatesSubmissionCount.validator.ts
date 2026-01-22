import { query } from "express-validator";

export const getCandidatesSubmissionCountValidator = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query().custom((_, { req }) => {
    const { startDate, endDate } = req.query as any;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
        throw new Error("startDate/endDate must be valid dates");
      }
      if (e < s) {
        throw new Error("endDate must be greater than or equal to startDate");
      }
    }
    return true;
  }),
];
