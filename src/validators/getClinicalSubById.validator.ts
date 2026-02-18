import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getClinicalSubByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "clinical sub ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
