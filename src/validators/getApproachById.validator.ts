import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getApproachByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Approach ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
