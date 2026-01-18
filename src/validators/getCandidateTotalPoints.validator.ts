import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getCandidateTotalPointsValidator = checkSchema({
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

