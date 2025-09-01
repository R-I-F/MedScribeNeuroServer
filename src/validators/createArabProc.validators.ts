import { checkSchema } from "express-validator";

export const createArabProcValidator = checkSchema({
  title: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  alphaCode: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  numCode: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  description: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
});
