import { checkSchema } from "express-validator";

export const getConfByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "conf ID is required.",
    isMongoId: {
      errorMessage: "conf ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

