import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateSupervisorApprovedValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Supervisor ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  approved: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "approved is required.",
    isBoolean: {
      errorMessage: "approved must be a boolean value",
    },
  },
});
