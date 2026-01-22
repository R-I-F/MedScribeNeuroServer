import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteCandValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
