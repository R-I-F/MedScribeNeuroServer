import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updatePositionValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Position ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  position: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "position must be at most 50 characters" },
  },
});
