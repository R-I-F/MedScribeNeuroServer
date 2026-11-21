import { body } from "express-validator";

export const instituteAdminLoginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("password is required"),
];
