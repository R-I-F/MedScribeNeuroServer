import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteHospitalValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Hospital ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
