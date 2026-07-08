import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getRefQuestionsByMainDiagIdValidator = checkSchema({
  mainDiagId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiagId is required.",
    custom: uuidValidator,
    trim: true,
  },
});
