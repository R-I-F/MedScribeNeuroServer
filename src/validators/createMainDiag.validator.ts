import { checkSchema } from "express-validator";

export const createMainDiagValidator = checkSchema({
  title: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "mainDiag title is required.",
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "mainDiag title should have a maximum of 200 characters",
    },
    trim: true,
  },
  procsArray: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "procsArray must be an array",
    },
  },
  diagnosis: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "diagnosis must be an array",
    },
  },
});
