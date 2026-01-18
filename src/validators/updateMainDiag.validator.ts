import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateMainDiagValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiag ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  title: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "mainDiag title should have a maximum of 200 characters",
    },
    trim: true,
  },
  procs: {
    in: ["body"],
    optional: true,
    isArray: {
      options: {
        min: 1,
      },
      errorMessage: "procs must be a non-empty array if provided",
    },
    custom: {
      options: (value: any) => {
        if (value && Array.isArray(value)) {
          return value.every((item: any) => typeof item === 'string' && item.trim().length > 0);
        }
        return true;
      },
      errorMessage: "procs must contain only non-empty strings",
    },
  },
  diagnosis: {
    in: ["body"],
    optional: true,
    isArray: {
      options: {
        min: 1,
      },
      errorMessage: "diagnosis must be a non-empty array if provided",
    },
    custom: {
      options: (value: any) => {
        if (value && Array.isArray(value)) {
          return value.every((item: any) => typeof item === 'string' && item.trim().length > 0);
        }
        return true;
      },
      errorMessage: "diagnosis must contain only non-empty strings",
    },
  },
});
