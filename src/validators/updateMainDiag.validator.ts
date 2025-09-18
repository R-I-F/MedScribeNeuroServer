import { checkSchema } from "express-validator";

export const updateMainDiagValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiag ID is required.",
    isMongoId: {
      errorMessage: "mainDiag ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  title: {
    in: ["body"],
    optional: true,
    isLength: {
      options: {
        max: 200,
      },
      errorMessage: "mainDiag title should have a maximum of 200 characters",
    },
    trim: true,
  },
  procs: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "procs must be an array",
    },
  },
  diagnosis: {
    in: ["body"],
    optional: true,
    isArray: {
      errorMessage: "diagnosis must be an array",
    },
  },
});
