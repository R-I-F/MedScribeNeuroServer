import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

export const getSupervisorSubmissionsValidator = checkSchema({
  supervisorId: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Supervisor ID is required.",
    custom: uuidValidator,
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

