import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const reviewSubmissionValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  status: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "Status is required.",
    isIn: {
      options: [["approved", "rejected"]],
      errorMessage: "Status must be either 'approved' or 'rejected'",
    },
    trim: true,
  },
  review: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "Review must be a string",
    },
    isLength: {
      options: {
        max: 2000,
      },
      errorMessage: "Review must not exceed 2000 characters",
    },
    trim: true,
  },
});

