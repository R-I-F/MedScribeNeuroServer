import { checkSchema } from "express-validator";

export const createBulkJournalsFromExternalValidator = checkSchema({
  spreadsheetName: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "spreadsheetName must be a string",
    },
    trim: true,
  },
  sheetName: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "sheetName must be a string",
    },
    trim: true,
  },
  row: {
    in: ["body"],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: "row must be a positive integer",
    },
  },
});

