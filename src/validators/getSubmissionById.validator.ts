import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getSubmissionByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

