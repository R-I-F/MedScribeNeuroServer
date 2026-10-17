import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const changeEventPresenterValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  presenterId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "presenterId is required.",
    custom: uuidValidator,
    trim: true,
  },
});
