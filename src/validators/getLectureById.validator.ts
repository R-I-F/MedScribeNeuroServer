import { checkSchema } from "express-validator";

export const getLectureByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "lecture ID is required.",
    isMongoId: {
      errorMessage: "lecture ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

