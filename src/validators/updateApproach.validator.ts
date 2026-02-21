import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateApproachValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Approach ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  approach: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "approach must be at most 50 characters" },
  },
});
