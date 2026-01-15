import { checkSchema } from "express-validator";

export const removeAttendanceValidator = checkSchema({
  eventId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    isMongoId: {
      errorMessage: "event ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
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

