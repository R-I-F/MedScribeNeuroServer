import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateEventValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  type: {
    in: ["body"],
    optional: true,
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
    optional: true,
    isISO8601: {
      errorMessage: "dateTime must be a valid ISO 8601 date",
    },
    toDate: true,
  },
  location: {
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


