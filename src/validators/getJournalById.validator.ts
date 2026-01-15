import { checkSchema } from "express-validator";

export const getJournalByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "journal ID is required.",
    isMongoId: {
      errorMessage: "journal ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

