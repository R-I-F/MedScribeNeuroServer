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


export const createSubmissionValidator = checkSchema({
  procDocId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "procDocId (calendar procedure ID) is required.",
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
  assRoleDesc: {
    in: ["body"],
    optional: true,
    isString: true,
    isLength: { options: { max: 1000 }, errorMessage: "assRoleDesc must not exceed 1000 characters." },
    trim: true,
  },
  preOpClinCond: {
    in: ["body"],
    optional: true,
    isString: true,
    isLength: { options: { max: 1000 }, errorMessage: "preOpClinCond must not exceed 1000 characters." },
    trim: true,
  },
  consDetails: {
    in: ["body"],
    optional: true,
    isString: true,
    isLength: { options: { max: 1000 }, errorMessage: "consDetails must not exceed 1000 characters." },
    trim: true,
  },
  surgNotes: {
    in: ["body"],
    optional: true,
    isString: true,
    trim: true,
  },
  // Dynamic additional-question answers (hub framework). Optional during the dual-write
  // transition; each item: { questionId (uuid), questionKey?, optionId?, value? }.
  answers: {
    in: ["body"],
    optional: true,
    isArray: { errorMessage: "answers must be an array." },
    custom: {
      options: (val: unknown) => {
        if (!Array.isArray(val)) return true;
        for (const a of val as any[]) {
          if (!a || typeof a !== "object") throw new Error("each answer must be an object");
          if (typeof a.questionId !== "string" || a.questionId.trim() === "") throw new Error("answer.questionId is required");
        }
        return true;
      },
    },
  },
});
