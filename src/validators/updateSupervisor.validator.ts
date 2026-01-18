import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateSupervisorValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "supervisor ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  email: {
    in: ["body"],
    optional: true,
    isEmail: {
      errorMessage: "supervisor email must be a valid email address",
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
      errorMessage: "supervisor password must be at least 8 characters long",
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
      errorMessage: "supervisor full name should have a maximum of 100 characters",
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
      errorMessage: "supervisor phone number must be at least 11 digits",
    },
    trim: true,
  },
  approved: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "supervisor approval status must be a boolean value",
    },
  },
  canValidate: {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "canValidate must be a boolean value",
    },
  },
  position: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [["Professor", "Assistant Professor", "Lecturer", "Assistant Lecturer", "Guest Doctor", "unknown"]],
      errorMessage: "position must be one of: Professor, Assistant Professor, Lecturer, Assistant Lecturer, Guest Doctor, unknown",
    },
    trim: true,
  },
});
