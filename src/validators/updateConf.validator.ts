import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateConfValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "conf ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  confTitle: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  google_uid: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  presenter: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  date: {
    in: ["body"],
    optional: true,
    isISO8601: {
      errorMessage: "date must be a valid ISO 8601 date",
    },
    toDate: true,
  },
});

