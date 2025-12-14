import { checkSchema } from "express-validator";

export const getSubmissionByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Submission ID is required.",
    isMongoId: {
      errorMessage: "Submission ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

