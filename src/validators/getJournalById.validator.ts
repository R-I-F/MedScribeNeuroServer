import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getJournalByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "journal ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

