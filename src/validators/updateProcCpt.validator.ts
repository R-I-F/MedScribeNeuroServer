import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateProcCptValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "ProcCpt ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  title: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "ProcCpt title should have a maximum of 200 characters",
    },
    trim: true,
    custom: {
      options: (value: string) => value == null || value === "" || !value.includes(","),
      errorMessage: "ProcCpt title must not contain commas",
    },
  },
  alphaCode: {
    in: ["body"],
    optional: true,
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
    optional: true,
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
    optional: true,
    isLength: {
      options: {
        max: 500,
      },
      errorMessage: "ProcCpt description should have a maximum of 500 characters",
    },
    trim: true,
  },
});
