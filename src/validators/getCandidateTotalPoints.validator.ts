import { checkSchema } from "express-validator";

export const getCandidateTotalPointsValidator = checkSchema({
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "candidate ID is required.",
    isMongoId: {
      errorMessage: "candidate ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

