import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getEquipmentByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Equipment ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
