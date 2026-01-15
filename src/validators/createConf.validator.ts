import { checkSchema } from "express-validator";

export const createConfValidator = checkSchema({
  confTitle: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "confTitle is required.",
    trim: true,
  },
  google_uid: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "google_uid is required.",
    trim: true,
  },
  presenter: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "presenter is required.",
    isMongoId: {
      errorMessage: "presenter must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  date: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "date is required.",
    isISO8601: {
      errorMessage: "date must be a valid ISO 8601 date",
    },
    toDate: true,
  },
});

