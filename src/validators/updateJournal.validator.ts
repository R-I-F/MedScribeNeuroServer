import { checkSchema } from "express-validator";

export const updateJournalValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "journal ID is required.",
    isMongoId: {
      errorMessage: "journal ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  journalTitle: {
    in: ["body"],
    optional: true,
    trim: true,
  },
  pdfLink: {
    in: ["body"],
    optional: true,
    trim: true,
    isURL: {
      errorMessage: "pdfLink must be a valid URL",
    },
  },
  google_uid: {
    in: ["body"],
    optional: true,
    trim: true,
  },
});

