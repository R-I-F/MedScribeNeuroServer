import { checkSchema } from "express-validator";

export const createFromExternalValidator = checkSchema({
  row: {
    in: ["body"],
    optional: true,
  },
  startRow: {
    in: ["body"],
    optional: true,
    isInt: { options: { min: 1 }, errorMessage: "startRow must be a positive integer" },
    toInt: true,
  },
});
