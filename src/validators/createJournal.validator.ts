import { checkSchema } from "express-validator";

export const createJournalValidator = checkSchema({
  journalTitle: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "journalTitle is required.",
    trim: true,
  },
  pdfLink: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "pdfLink is required.",
    trim: true,
    isURL: {
      errorMessage: "pdfLink must be a valid URL",
    },
  },
  google_uid: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "google_uid is required.",
    trim: true,
  },
});

