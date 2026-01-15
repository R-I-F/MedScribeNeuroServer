import { checkSchema } from "express-validator";

export const getEventByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "event ID is required.",
    isMongoId: {
      errorMessage: "event ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});


