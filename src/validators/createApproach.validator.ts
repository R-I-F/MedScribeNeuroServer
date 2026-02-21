import { checkSchema } from "express-validator";

export const createApproachValidator = checkSchema({
  approach: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "approach must be at most 50 characters" },
    errorMessage: "approach is required",
  },
});
