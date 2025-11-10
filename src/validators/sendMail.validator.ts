import { body } from "express-validator";

export const sendMailValidator = [
  body("to").isEmail().withMessage("'to' must be a valid email address"),
  body("subject")
    .isString()
    .notEmpty()
    .withMessage("'subject' must be a non-empty string"),
  body("text")
    .optional({ nullable: true })
    .isString()
    .withMessage("'text' must be a string when provided"),
  body("html")
    .optional({ nullable: true })
    .isString()
    .withMessage("'html' must be a string when provided"),
  body("from")
    .optional({ nullable: true })
    .isEmail()
    .withMessage("'from' must be a valid email address when provided"),
];

