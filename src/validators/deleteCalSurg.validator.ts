import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteCalSurgValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "calSurg ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
