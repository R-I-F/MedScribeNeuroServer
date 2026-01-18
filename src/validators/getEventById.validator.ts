import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getEventByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});


