import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteSuperAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "super admin ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

