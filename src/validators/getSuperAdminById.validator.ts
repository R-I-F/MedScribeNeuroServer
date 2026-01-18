import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getSuperAdminByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "super admin ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

