import { checkSchema } from "express-validator";

/**
 * POST /demoRequest — public landing-page "Book a demo" form
 * (docs/BOOK_A_DEMO_PLAN.md).
 *
 * NB: `website` is the HONEYPOT — it must PASS validation (bots that fill it
 * still get a clean 400-free run) so the provider can silently discard it.
 * `elapsedMs` is the min-fill-time heuristic input.
 */
export const requestDemoValidator = checkSchema({
  fullName: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "fullName is required",
    isLength: {
      options: { min: 2, max: 120 },
      errorMessage: "fullName must be 2-120 characters",
    },
    trim: true,
  },
  email: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "email is required",
    isEmail: {
      errorMessage: "email must be a valid email address",
    },
    isLength: {
      options: { max: 255 },
      errorMessage: "email must be at most 255 characters",
    },
    trim: true,
  },
  organization: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    isLength: {
      options: { max: 160 },
      errorMessage: "organization must be at most 160 characters",
    },
    trim: true,
  },
  phoneNum: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    isLength: {
      options: { max: 32 },
      errorMessage: "phoneNum must be at most 32 characters",
    },
    trim: true,
  },
  message: {
    in: ["body"],
    optional: { options: { values: "falsy" } },
    isLength: {
      options: { max: 2000 },
      errorMessage: "message must be at most 2000 characters",
    },
    trim: true,
  },
  website: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "website must be a string",
    },
    isLength: {
      options: { max: 255 },
      errorMessage: "website must be at most 255 characters",
    },
  },
  elapsedMs: {
    in: ["body"],
    optional: true,
    isInt: {
      options: { min: 0 },
      errorMessage: "elapsedMs must be a non-negative integer",
    },
    toInt: true,
  },
});
