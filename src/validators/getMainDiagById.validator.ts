import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getMainDiagByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiag ID is required.",
    custom: uuidValidator,
    trim: true,
  },
});
