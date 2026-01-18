import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const addAttendanceValidator = checkSchema({
  eventId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  candidateId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

