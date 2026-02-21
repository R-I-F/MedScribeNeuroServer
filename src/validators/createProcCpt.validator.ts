import { checkSchema } from "express-validator";

export const createProcCptValidator = checkSchema({
  title: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "ProcCpt title is required.",
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "ProcCpt title should have a maximum of 200 characters",
    },
    trim: true,
    custom: {
      options: (value: string) => !value.includes(","),
      errorMessage: "ProcCpt title must not contain commas",
    },
  },
  alphaCode: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "ProcCpt alphaCode is required.",
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "ProcCpt alphaCode should have a maximum of 50 characters",
    },
    trim: true,
  },
  numCode: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "ProcCpt numCode is required.",
    isLength: {
      options: {
        max: 50,
      },
      errorMessage: "ProcCpt numCode should have a maximum of 50 characters",
    },
    trim: true,
  },
  description: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "ProcCpt description is required.",
    isLength: {
      options: {
        max: 500,
      },
      errorMessage: "ProcCpt description should have a maximum of 500 characters",
    },
    trim: true,
  },
});
