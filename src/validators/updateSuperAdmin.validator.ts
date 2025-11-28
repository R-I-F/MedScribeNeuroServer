import { checkSchema } from "express-validator";

export const updateSuperAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "super admin ID is required.",
    isMongoId: {
      errorMessage: "super admin ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "super admin email must be a valid email address",
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
      errorMessage: "super admin password must be at least 8 characters long",
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
      errorMessage: "super admin full name should have a maximum of 100 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    optional: true,
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

