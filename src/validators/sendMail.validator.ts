import { body, CustomValidator } from "express-validator";

// Custom validator to ensure at least one of 'text' or 'html' is provided
const validateTextOrHtml: CustomValidator = (value, { req }) => {
  const { text, html } = req.body ?? {};
  
  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasHtml = typeof html === "string" && html.trim().length > 0;
  
  if (!hasText && !hasHtml) {
    throw new Error("Provide at least one of 'text' or 'html' in the request body.");
  }
  
  return true;
};

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
  body().custom(validateTextOrHtml),
];

