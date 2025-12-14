import { checkSchema } from "express-validator";

export const getSupervisorSubmissionsValidator = checkSchema({
  supervisorId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Supervisor ID is required.",
    isMongoId: {
      errorMessage: "Supervisor ID must be a valid MongoDB ObjectId",
    },
    trim: true,
  },
  status: {
    in: ["query"],
    optional: true,
    isIn: {
      options: [["approved", "pending", "rejected"]],
      errorMessage: "Status must be one of: approved, pending, rejected",
    },
  },
});

