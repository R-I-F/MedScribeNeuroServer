import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getEventsByPresenterValidator = checkSchema({
  supervisorId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "supervisor ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
