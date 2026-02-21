import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateConsumableValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Consumable ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  consumables: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 100 }, errorMessage: "consumables must be at most 100 characters" },
  },
});
