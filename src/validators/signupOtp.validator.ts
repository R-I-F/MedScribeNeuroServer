import { checkSchema } from "express-validator";

/** POST /auth/verifySignupOtp — { signupId, code } */
export const verifySignupOtpValidator = checkSchema({
  signupId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "signupId is required",
    isUUID: {
      errorMessage: "signupId must be a valid UUID",
    },
    trim: true,
  },
  code: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "code is required",
    matches: {
      options: [/^\d{6}$/],
      errorMessage: "code must be a 6-digit number",
    },
    trim: true,
  },
});

/** POST /auth/resendSignupOtp — { signupId } */
export const resendSignupOtpValidator = checkSchema({
  signupId: {
    in: ["body"],
    notEmpty: true,
    errorMessage: "signupId is required",
    isUUID: {
      errorMessage: "signupId must be a valid UUID",
    },
    trim: true,
  },
});
