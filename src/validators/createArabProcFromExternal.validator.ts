import { checkSchema } from "express-validator";

export const createFromExternalValidator = checkSchema({
  row: {
    in: ["body"],
  },
});
