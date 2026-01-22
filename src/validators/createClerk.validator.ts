import { checkSchema } from "express-validator";

export const createClerkValidator = checkSchema({
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "clerk email is required.",
    isEmail: {
      errorMessage: "clerk email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "clerk password is required.",
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
    notEmpty: true,
    errorMessage: "clerk full name is required.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "clerk full name should have a maximum of 100 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "clerk phone number is required.",
    isLength: {
      options: {
        min: 11,
      },
      errorMessage: "clerk phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "clerk approval status is required.",
    isBoolean: {
      errorMessage: "clerk approval status must be a boolean value",
    },
  },
});
