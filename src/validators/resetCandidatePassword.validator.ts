import { checkSchema } from "express-validator";

export const resetCandidatePasswordValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    isMongoId: {
      errorMessage: "Candidate ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

