import { checkSchema } from "express-validator";

export const createPositionValidator = checkSchema({
  position: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "position must be at most 50 characters" },
    errorMessage: "position is required",
  },
});
