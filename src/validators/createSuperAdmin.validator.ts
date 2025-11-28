import { checkSchema } from "express-validator";

export const createSuperAdminValidator = checkSchema({
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "super admin email is required.",
    isEmail: {
      errorMessage: "super admin email must be a valid email address",
    },
    trim: true,
  },
  password: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "super admin password is required.",
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "super admin password must be at least 8 characters long",
    },
    trim: true,
  },
  fullName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "super admin full name is required.",
    isLength: {
      options: {
        max: 100,
      },
      errorMessage: "super admin full name should have a maximum of 100 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "super admin phone number is required.",
    isLength: {
      options: {
        min: 11,
      },
      errorMessage: "super admin phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "super admin approval status must be a boolean value",
    },
  },
});

