import { checkSchema } from "express-validator";

export const deleteInstituteAdminValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "institute admin ID is required.",
    isMongoId: {
      errorMessage: "institute admin ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
});

