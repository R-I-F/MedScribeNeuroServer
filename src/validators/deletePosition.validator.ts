import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deletePositionValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Position ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
