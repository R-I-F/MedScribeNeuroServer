import { checkSchema } from "express-validator";

export const createSupervisorValidator = checkSchema({
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisor email is required.",
    isEmail: {
      errorMessage: "supervisor email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisor password is required.",
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "supervisor password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisor full name is required.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "supervisor full name should have a maximum of 100 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisor phone number is required.",
    isLength: {
      options: {
        min: 11,
      },
      errorMessage: "supervisor phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisor approval status is required.",
    isBoolean: {
      errorMessage: "supervisor approval status must be a boolean value",
    },
  },
});
