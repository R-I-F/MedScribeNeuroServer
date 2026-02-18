import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";
import { ClinicalActivityType, ClinicalSubStatus } from "../clinicalSub/clinicalSub.mDbSchema";

const typeCAValues = Object.values(ClinicalActivityType);
const subStatusValues = Object.values(ClinicalSubStatus);

export const updateClinicalSubValidator = checkSchema({
  id: {
    in: ["params"],
    notEmpty: true,
    errorMessage: "clinical sub ID is required.",
    custom: uuidValidator,
    trim: true,
  },
  candDocId: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  supervisorDocId: {
    in: ["body"],
    optional: true,
    custom: uuidValidator,
    trim: true,
  },
  dateCA: {
    in: ["body"],
    optional: true,
    isISO8601: { errorMessage: "dateCA must be a valid ISO 8601 date" },
    toDate: true,
  },
  typeCA: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [typeCAValues],
      errorMessage: `typeCA must be one of: ${typeCAValues.join(", ")}`,
    },
    trim: true,
  },
  subStatus: {
    in: ["body"],
    optional: true,
    isIn: {
      options: [subStatusValues],
      errorMessage: `subStatus must be one of: ${subStatusValues.join(", ")}`,
    },
    trim: true,
  },
  description: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
  },
  review: {
    in: ["body"],
    optional: true,
    isString: true,
  },
  reviewedAt: {
    in: ["body"],
    optional: true,
    isISO8601: { errorMessage: "reviewedAt must be a valid ISO 8601 date" },
    toDate: true,
  },
});
