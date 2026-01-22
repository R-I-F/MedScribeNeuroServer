import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteDiagnosisValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Diagnosis ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
