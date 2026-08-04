import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";
import { SupervisorPosition } from "../types/supervisorPosition.types";

/**
 * POST /cand/:id/promote (docs/CANDIDATE_TO_SUPERVISOR_PROMOTION_PLAN.md).
 * Every body field is optional: the supervisor account inherits the candidate's identity
 * (email, password hash, name, phone, department) and only these three are an admin choice.
 */
export const promoteCandidateValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "Candidate ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  position: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [Object.values(SupervisorPosition)],
      errorMessage: `position must be one of: ${Object.values(SupervisorPosition).join(", ")}`,
    },
  },
  canValidate: {
    in: ["body"],
    optional: true,
    isBoolean: { errorMessage: "canValidate must be a boolean value" },
    toBoolean: true,
  },
  canValClin: {
    in: ["body"],
    optional: true,
    isBoolean: { errorMessage: "canValClin must be a boolean value" },
    toBoolean: true,
  },
});
