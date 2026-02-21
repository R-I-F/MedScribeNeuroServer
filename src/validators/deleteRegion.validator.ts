import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteRegionValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Region ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
