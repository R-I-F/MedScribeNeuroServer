import { checkSchema } from "express-validator";

export const createConsumableValidator = checkSchema({
  consumables: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 100 }, errorMessage: "consumables must be at most 100 characters" },
    errorMessage: "consumables is required",
  },
});
