import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const createCalSurgValidator = checkSchema({
  hospital: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    custom: uuidValidator,
    errorMessage: "hospital must be a valid UUID",
  },
  patientName: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: {
        max: 255,
      },
      errorMessage: "patientName should have a maximum of 255 characters",
    },
  },
  gender: {
    in: ["body"],
    notEmpty: true,
    isIn: {
      options: [["male", "female"]],
      errorMessage: "gender must be either 'male' or 'female'",
    },
  },
  // Free-text procedure phrase as the clerk types it ("ورم بالمخ") — the learning pipeline
  // (clerk_procs) resolves it semantically; NOT a UUID anymore (plan §2).
  procedureText: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "procedureText should have a maximum of 500 characters",
    },
    errorMessage: "procedureText is required",
  },
  surgeryDate: {
    in: ["body"],
    notEmpty: true,
    isISO8601: {
      errorMessage: "surgeryDate must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  patientDob: {
    in: ["body"],
    optional: true,
    isISO8601: {
      errorMessage: "patientDob must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  // Department (mirror `departments` UUID). OPTIONAL: surgeries are dept-scoped, column nullable
  // during rollout (bulk external-import path).
  departmentId: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    isUUID: {
      errorMessage: "calSurg departmentId must be a valid UUID",
    },
    trim: true,
  },
});
