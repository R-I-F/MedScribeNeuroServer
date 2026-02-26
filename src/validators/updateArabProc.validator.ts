import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateArabProcValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "ArabProc ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  title: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 100 }, errorMessage: "title must be at most 100 characters" },
  },
  alphaCode: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 10 }, errorMessage: "alphaCode must be at most 10 characters" },
  },
  numCode: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
    isLength: { options: { max: 255 }, errorMessage: "numCode must be at most 255 characters" },
  },
  description: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
  },
});
