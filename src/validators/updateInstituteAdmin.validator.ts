import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateInstituteAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "institute admin ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "institute admin email must be a valid email address",
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
      errorMessage: "institute admin password must be at least 8 characters long",
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
      errorMessage: "institute admin full name should have a maximum of 100 characters",
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
  // Self-service department switch. UUID only — an admin cannot null their own scope
  // (going institution-wide is a DB-level/super-admin decision, not self-service).
  departmentId: {
    in: ["body"],
    optional: true,
    isUUID: {
      errorMessage: "departmentId must be a valid UUID",
    },
    trim: true,
  },
});

