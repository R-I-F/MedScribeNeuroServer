import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getClerkByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "clerk ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
