import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateEquipmentValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Equipment ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  equipment: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 100 }, errorMessage: "equipment must be at most 100 characters" },
  },
});
