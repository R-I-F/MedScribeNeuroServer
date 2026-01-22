import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteProcCptValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "ProcCpt ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
