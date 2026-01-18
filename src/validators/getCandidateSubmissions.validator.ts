import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getCandidateSubmissionsValidator = checkSchema({
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

