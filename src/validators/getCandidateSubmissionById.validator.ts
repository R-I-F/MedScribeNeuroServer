import { checkSchema } from "express-validator";

export const getCandidateSubmissionByIdValidator = checkSchema({
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    isMongoId: {
      errorMessage: "Candidate ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  submissionId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    isMongoId: {
      errorMessage: "Submission ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

