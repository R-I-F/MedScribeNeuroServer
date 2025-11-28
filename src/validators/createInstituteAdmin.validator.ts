import { checkSchema } from "express-validator";

export const createInstituteAdminValidator = checkSchema({
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "institute admin email is required.",
    isEmail: {
      errorMessage: "institute admin email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "institute admin password is required.",
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "institute admin password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "institute admin full name is required.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "institute admin full name should have a maximum of 100 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "institute admin phone number is required.",
    isLength: {
      options: {
        min: 11,
      },
      errorMessage: "institute admin phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "institute admin approval status must be a boolean value",
    },
  },
});

