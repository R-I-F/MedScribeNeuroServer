import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteInstituteAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "institute admin ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

