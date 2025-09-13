import { checkSchema } from "express-validator";

export const createBulkDiagnosisValidator = checkSchema({
  "*": {
    in: ["body"],
    isArray: {
      options: {
        min: 1,
      },
      errorMessage: "Request body must be a non-empty array of diagnosis objects",
    },
  },
  "*.icdCode": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdCode is required and must be a string",
  },
  "*.icdName": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdName is required and must be a string",
  },
  "*.neuroLogName": {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    errorMessage: "neuroLogName must be a string if provided",
  },
});
