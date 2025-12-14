import { body } from "express-validator";

export const forgotPasswordValidator = [
  body("email")
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),
];

