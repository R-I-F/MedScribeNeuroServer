import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteArabProcValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "ArabProc ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
