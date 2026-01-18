import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getConfByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "conf ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

