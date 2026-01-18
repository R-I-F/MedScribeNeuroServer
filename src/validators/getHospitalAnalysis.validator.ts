import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getHospitalAnalysisValidator = checkSchema({
  hospitalId: {
    in: ["query"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  month: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 1, max: 12 },
      errorMessage: "Month must be between 1 and 12",
    },
    toInt: true,
  },
  year: {
    in: ["query"],
    optional: true,
    isInt: {
      options: { min: 2000, max: 2100 },
      errorMessage: "Year must be a valid year",
    },
    toInt: true,
  },
  startDate: {
    in: ["query"],
    optional: true,
    isISO8601: {
      errorMessage: "startDate must be a valid ISO 8601 date string",
    },
  },
  endDate: {
    in: ["query"],
    optional: true,
    isISO8601: {
      errorMessage: "endDate must be a valid ISO 8601 date string",
    },
  },
  groupBy: {
    in: ["query"],
    optional: true,
    isIn: {
      options: [["title", "alphaCode"]],
      errorMessage: "groupBy must be either 'title' or 'alphaCode'",
    },
  },
});

