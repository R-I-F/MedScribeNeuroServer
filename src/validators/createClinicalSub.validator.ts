import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";
import { ClinicalActivityType } from "../clinicalSub/clinicalSub.mDbSchema";

const typeCAValues = Object.values(ClinicalActivityType);

export const createClinicalSubValidator = checkSchema({
  candDocId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "candDocId is required.",
    custom: uuidValidator,
    trim: true,
  },
  supervisorDocId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "supervisorDocId is required.",
    custom: uuidValidator,
    trim: true,
  },
  dateCA: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "dateCA is required.",
    isISO8601: { errorMessage: "dateCA must be a valid ISO 8601 date" },
    toDate: true,
  },
  typeCA: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "typeCA is required.",
    isIn: {
      options: [typeCAValues],
      errorMessage: `typeCA must be one of: ${typeCAValues.join(", ")}`,
    },
    trim: true,
  },
  description: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
  },
});
