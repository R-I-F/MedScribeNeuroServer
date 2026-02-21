import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteConsumableValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Consumable ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
