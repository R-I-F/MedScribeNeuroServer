import { checkSchema } from "express-validator";
import { phoneSchema, nameSanitizerSchema } from "./personFields";
import { uuidValidator } from "./uuidValidator.util";

export const updateClerkValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "clerk ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "clerk email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "clerk password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "clerk full name should have a maximum of 100 characters",
    },
    trim: true,
    ...nameSanitizerSchema,
  },
  phoneNum: {
    in: ["body"],
    optional: true,
    trim: true,
    ...phoneSchema,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "clerk approval status must be a boolean value",
    },
  },
});
