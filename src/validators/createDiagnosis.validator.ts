import { checkSchema } from "express-validator";

export const createDiagnosisValidator = checkSchema({
  "icdCode": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdCode is required and must be a string",
  },
  "icdName": {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    errorMessage: "icdName is required and must be a string",
  },
  "neuroLogName": {
    in: ["body"],
    optional: true,
    isArray: {
      options: {
        min: 1,
      },
      errorMessage: "neuroLogName must be a non-empty array if provided",
    },
    custom: {
      options: (value: any) => {
        if (value && Array.isArray(value)) {
          return value.every((item: any) => typeof item === 'string' && item.trim().length > 0);
        }
        return true; // Allow undefined/null since it's optional
      },
      errorMessage: "neuroLogName array must contain only non-empty strings",
    },
  },
});

