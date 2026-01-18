import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const deleteLectureValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "lecture ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});

