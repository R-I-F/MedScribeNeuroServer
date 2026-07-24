import { checkSchema } from "express-validator";

/**
 * Validators for the public semantic-search tool
 * (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md).
 *
 * NB: `website` on the session request is the HONEYPOT - it must PASS validation so the
 * provider can silently discard it (no 400 oracle). `elapsedMs` is the min-fill heuristic.
 */
export const publicSearchSessionValidator = checkSchema({
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "email is required",
    isEmail: { errorMessage: "email must be a valid email address" },
    isLength: { options: { max: 255 }, errorMessage: "email must be at most 255 characters" },
    trim: true,
  },
  website: {
    in: ["body"],
    optional: true,
    isString: { errorMessage: "website must be a string" },
    isLength: { options: { max: 255 } },
  },
  elapsedMs: {
    in: ["body"],
    optional: true,
    isInt: { options: { min: 0 }, errorMessage: "elapsedMs must be a non-negative integer" },
    toInt: true,
  },
});

export const publicSearchVerifyValidator = checkSchema({
  sessionId: {
    in: ["body"],
    notEmpty: true,
    isUUID: { errorMessage: "sessionId must be a valid id" },
  },
  code: {
    in: ["body"],
    notEmpty: true,
    isLength: { options: { min: 6, max: 6 }, errorMessage: "code must be 6 digits" },
    isNumeric: { errorMessage: "code must be numeric" },
    trim: true,
  },
});

export const publicSearchResendValidator = checkSchema({
  sessionId: {
    in: ["body"],
    notEmpty: true,
    isUUID: { errorMessage: "sessionId must be a valid id" },
  },
});

export const publicSearchQueryValidator = checkSchema({
  sessionId: {
    in: ["body"],
    notEmpty: true,
    isUUID: { errorMessage: "sessionId must be a valid id" },
  },
  query: {
    in: ["body"],
    notEmpty: true,
    isLength: { options: { min: 2, max: 500 }, errorMessage: "query must be 2-500 characters" },
    trim: true,
  },
  type: {
    in: ["body"],
    notEmpty: true,
    isIn: { options: [["procedure", "diagnosis"]], errorMessage: "type must be procedure or diagnosis" },
  },
  deptCodes: {
    in: ["body"],
    isArray: { options: { min: 1, max: 2 }, errorMessage: "pick 1 or 2 departments" },
  },
  "deptCodes.*": {
    in: ["body"],
    isString: { errorMessage: "department code must be a string" },
    isLength: { options: { min: 2, max: 10 }, errorMessage: "invalid department code" },
    matches: { options: [/^[A-Za-z]{2,10}$/], errorMessage: "invalid department code" },
    trim: true,
  },
});

export const publicSearchExplainValidator = checkSchema({
  sessionId: { in: ["body"], notEmpty: true, isUUID: { errorMessage: "sessionId must be a valid id" } },
  kind: { in: ["body"], notEmpty: true, isIn: { options: [["procedure", "diagnosis"]], errorMessage: "kind must be procedure or diagnosis" } },
  name: { in: ["body"], notEmpty: true, isLength: { options: { max: 300 } }, trim: true },
  code: { in: ["body"], optional: true, isLength: { options: { max: 40 } }, trim: true },
  departmentName: { in: ["body"], optional: true, isLength: { options: { max: 120 } }, trim: true },
  description: { in: ["body"], optional: true, isLength: { options: { max: 1000 } }, trim: true },
  language: { in: ["body"], optional: true, isIn: { options: [["en", "ar"]] } },
});
