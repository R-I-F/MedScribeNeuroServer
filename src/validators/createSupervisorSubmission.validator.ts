import { checkSchema } from "express-validator";
import { uuidValidator } from "./uuidValidator.util";

const ROLE_IN_SURG = [
  "operator",
  "operator with supervisor scrubbed (assisted)",
  "supervising, teaching a junior colleague (scrubbed)",
  "assistant",
  "observer (Scrubbed)",
] as const;

const OTHER_SURG_RANK = [
  "professor",
  "assistant professor",
  "lecturer",
  "assistant lecturer",
  "resident (cairo university)",
  "guest specialist",
  "guest resident",
  "consultant",
  "specialist",
  "other",
] as const;

const SP_OR_CRAN = ["spinal", "cranial"] as const;

/**
 * Validator for supervisor submissions.
 * Same as createSubmissionValidator but without supervisorDocId (comes from JWT - the supervisor is the surgeon).
 */
export const createSupervisorSubmissionValidator = checkSchema({
  procDocId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "procDocId (calendar procedure ID) is required.",
    custom: uuidValidator,
    trim: true,
  },
  mainDiagDocId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "mainDiagDocId is required.",
    custom: uuidValidator,
    trim: true,
  },
  roleInSurg: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "roleInSurg is required.",
    isIn: {
      options: [ROLE_IN_SURG],
      errorMessage: `roleInSurg must be one of: ${ROLE_IN_SURG.join(", ")}`,
    },
    trim: true,
  },
  otherSurgRank: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "otherSurgRank is required.",
    isIn: {
      options: [OTHER_SURG_RANK],
      errorMessage: `otherSurgRank must be one of: ${OTHER_SURG_RANK.join(", ")}`,
    },
    trim: true,
  },
  otherSurgName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "otherSurgName is required.",
    isString: true,
    isLength: { options: { max: 255 }, errorMessage: "otherSurgName must not exceed 255 characters." },
    trim: true,
  },
  isItRevSurg: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "isItRevSurg is required.",
    isBoolean: { errorMessage: "isItRevSurg must be a boolean." },
  },
  insUsed: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "insUsed is required.",
    isString: { errorMessage: "insUsed must be a string." },
    isLength: { options: { max: 1000 }, errorMessage: "insUsed must not exceed 1000 characters." },
    trim: true,
  },
  consUsed: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "consUsed is required.",
    isString: { errorMessage: "consUsed must be a string." },
    isLength: { options: { max: 1000 }, errorMessage: "consUsed must not exceed 1000 characters." },
    trim: true,
  },
  diagnosisName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "diagnosisName is required.",
    isArray: { errorMessage: "diagnosisName must be an array of strings." },
    custom: {
      options: (value: unknown) => {
        if (!Array.isArray(value)) return false;
        return value.every((v) => typeof v === "string");
      },
      errorMessage: "Each diagnosisName element must be a string.",
    },
  },
  procedureName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "procedureName is required.",
    isArray: { errorMessage: "procedureName must be an array of strings." },
    custom: {
      options: (value: unknown) => {
        if (!Array.isArray(value)) return false;
        return value.every((v) => typeof v === "string");
      },
      errorMessage: "Each procedureName element must be a string.",
    },
  },
  assRoleDesc: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 1000 } }, trim: true },
  preOpClinCond: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 1000 } }, trim: true },
  consDetails: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 1000 } }, trim: true },
  surgNotes: { in: ["body"], optional: true, isString: true, trim: true },
  IntEvents: { in: ["body"], optional: true, isString: true, trim: true },
  spOrCran: { in: ["body"], optional: true, isIn: { options: [SP_OR_CRAN] }, trim: true },
  pos: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 255 } }, trim: true },
  approach: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 255 } }, trim: true },
  clinPres: { in: ["body"], optional: true, isString: true, trim: true },
  region: { in: ["body"], optional: true, isString: true, isLength: { options: { max: 255 } }, trim: true },
});
