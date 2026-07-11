import { body } from "express-validator";

export const loginValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .notEmpty()
    .withMessage("password is required"),

  // Single-institution (KA spoke) mode: institutionId is accepted and ignored; optional.
  body("institutionId")
    .optional({ values: "falsy" })
    .isUUID()
    .withMessage("institutionId must be a valid UUID"),
];

