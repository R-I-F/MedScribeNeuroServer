import { body } from "express-validator";

export const adminLoginValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("password is required"),

  body("institutionId")
    .isUUID()
    .withMessage("institutionId must be a valid UUID")
    .notEmpty()
    .withMessage("institutionId is required for admin login"),
];
