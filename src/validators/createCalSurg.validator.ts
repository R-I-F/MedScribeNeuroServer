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
  procedure: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
    custom: uuidValidator,
    errorMessage: "procedure must be a valid UUID",
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
});
