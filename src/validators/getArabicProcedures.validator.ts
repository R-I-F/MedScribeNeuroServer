import { checkSchema } from "express-validator";

export const getArabicProceduresValidator = checkSchema({
  search: {
    in: ["query"],
    optional: true,
    isString: true,
    trim: true,
  },
});

