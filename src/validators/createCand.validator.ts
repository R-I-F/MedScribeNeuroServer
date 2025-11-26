import { body } from "express-validator";

export const createCandValidator = [
  body("email")
    .isEmail()
    .withMessage("email must be a valid email address"),

  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters long"),

  body("fullName")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("fullName is required"),

  body("phoneNum")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("phoneNum is required"),

  body("regNum")
    .isString()
    .withMessage("regNum must be a string"),

  body("nationality")
    .isString()
    .withMessage("nationality must be a string"),

  body("rank")
    .isString()
    .withMessage("rank must be a string"),

  body("regDeg")
    .isString()
    .withMessage("regDeg must be a string"),
];

