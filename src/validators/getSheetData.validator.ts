import { checkSchema } from "express-validator";

export const getSheetDataValidator = checkSchema({
  spreadsheetName: {
    in: ["query"],
    notEmpty: true,
  },
  sheetName: {
    in: ["query"],
    notEmpty: true,
  },
  row: {
    in: ["query"],
    optional: true,
  },
});
