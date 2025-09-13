import { checkSchema } from "express-validator";

export const createBulkDiagnosisValidator = checkSchema({
  "diagnoses": {
    in: ["body"],
    isArray: {
      options: {
        min: 1,
      },
      errorMessage: "Request body must contain a non-empty 'diagnoses' array",
    },
  },
  "diagnoses.*.icdCode": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdCode is required and must be a string",
  },
  "diagnoses.*.icdName": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdName is required and must be a string",
  },
  "diagnoses.*.neuroLogName": {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    errorMessage: "neuroLogName must be a string if provided",
  },
});
