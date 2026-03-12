import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getSubmissionReportValidator = checkSchema({
  submissionId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
