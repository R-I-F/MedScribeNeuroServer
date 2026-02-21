import { checkSchema } from "express-validator";

export const createRegionValidator = checkSchema({
  region: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 50 }, errorMessage: "region must be at most 50 characters" },
    errorMessage: "region is required",
  },
});
