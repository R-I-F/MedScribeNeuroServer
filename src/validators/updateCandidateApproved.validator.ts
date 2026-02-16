import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const updateCandidateApprovedValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  approved: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "approved is required.",
    isBoolean: {
      errorMessage: "approved must be a boolean value",
    },
  },
});
