import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const removeMainDiagProcsValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiag ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  numCodes: {
    in: ["body"],
    isArray: {
      options: { min: 1 },
      errorMessage: "numCodes must be a non-empty array",
    },
    custom: {
      options: (value: unknown) => {
        if (value && Array.isArray(value)) {
          return value.every((item: unknown) => typeof item === "string" && (item as string).trim().length > 0);
        }
        return false;
      },
      errorMessage: "numCodes must contain only non-empty strings",
    },
  },
});
