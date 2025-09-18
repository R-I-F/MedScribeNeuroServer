import { checkSchema } from "express-validator";

export const getSupervisorByIdValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "supervisor ID is required.",
    isMongoId: {
      errorMessage: "supervisor ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});
