import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteSupervisorValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "supervisor ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
