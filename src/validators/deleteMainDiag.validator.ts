import { checkSchema } from "express-validator";

export const deleteMainDiagValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "mainDiag ID is required.",
    isMongoId: {
      errorMessage: "mainDiag ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});
