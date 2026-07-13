import { checkSchema } from "express-validator";

export const createArabProcValidator = checkSchema({
  title: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  alphaCode: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  numCode: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  description: {
    in: ["body"],
    notEmpty: true,
    isString: true,
    trim: true,
  },
  // Department (mirror `departments` UUID). OPTIONAL: arab_procs are dept-scoped, but the column
  // is nullable during rollout; omit for cross-department / bulk-imported procedures.
  departmentId: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    isUUID: {
      errorMessage: "arabProc departmentId must be a valid UUID",
    },
    trim: true,
  },
});
