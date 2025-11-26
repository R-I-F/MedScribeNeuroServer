import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("password is required"),
];

