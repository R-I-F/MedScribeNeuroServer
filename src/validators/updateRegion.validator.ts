import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateRegionValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Region ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  region: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "region must be at most 50 characters" },
  },
});
