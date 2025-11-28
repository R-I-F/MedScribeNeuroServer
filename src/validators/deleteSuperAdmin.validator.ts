import { checkSchema } from "express-validator";

export const deleteSuperAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "super admin ID is required.",
    isMongoId: {
      errorMessage: "super admin ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

