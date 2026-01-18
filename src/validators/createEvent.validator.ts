import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const createEventValidator = checkSchema({
  type: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "type is required.",
    isIn: {
      options: [["lecture", "journal", "conf"]],
      errorMessage: "type must be one of: lecture, journal, conf",
    },
    trim: true,
  },
  lecture: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  journal: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  conf: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  dateTime: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "dateTime is required.",
    isISO8601: {
      errorMessage: "dateTime must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  location: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "location is required.",
    trim: true,
  },
  presenter: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "presenter is required.",
    custom: uuidValidator,
    trim: true,
  },
  attendance: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "attendance must be an array of candidate IDs",
    },
  },
  "attendance.*": {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  status: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [["booked", "held", "canceled"]],
      errorMessage: "status must be one of: booked, held, canceled",
    },
    trim: true,
  },
});


