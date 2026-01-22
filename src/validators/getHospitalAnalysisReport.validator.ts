import { query } from "express-validator";
import { isValidUuidOrObjectId } from "./uuidValidator.util";

export const getHospitalAnalysisReportValidator = [
  query("hospitalId")
    .optional()
    .custom((value) => {
      if (value && typeof value === "string") {
        if (!isValidUuidOrObjectId(value)) {
          throw new Error("hospitalId must be a valid UUID");
        }
      }
      return true;
    }),
  query("month")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("month must be an integer between 1 and 12"),
  query("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("year must be an integer between 2000 and 2100"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("startDate must be a valid ISO 8601 date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("endDate must be a valid ISO 8601 date"),
  query("groupBy")
    .optional()
    .isIn(["title", "alphaCode"])
    .withMessage("groupBy must be either 'title' or 'alphaCode'"),
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
