import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateDiagnosisValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Diagnosis ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  icdCode: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    errorMessage: "icdCode must be a string if provided",
  },
  icdName: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    errorMessage: "icdName must be a string if provided",
    custom: {
      options: (value: string) => value == null || value === "" || !value.includes(","),
      errorMessage: "icdName must not contain commas",
    },
  },
  neuroLogName: {
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
