import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const setEventAttendanceOpenValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  open: {
    in: ["body"],
    exists: { errorMessage: "open is required." },
    isBoolean: { options: { strict: true }, errorMessage: "open must be true or false." },
    toBoolean: true,
  },
});
