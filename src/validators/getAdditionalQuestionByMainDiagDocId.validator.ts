import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getAdditionalQuestionByMainDiagDocIdValidator = checkSchema({
  mainDiagDocId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiagDocId is required.",
    custom: uuidValidator,
    trim: true,
  },
});
