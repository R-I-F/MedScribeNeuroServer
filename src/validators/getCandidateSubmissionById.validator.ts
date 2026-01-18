import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getCandidateSubmissionByIdValidator = checkSchema({
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  submissionId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

