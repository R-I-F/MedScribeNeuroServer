import { body } from "express-validator";

export const resetPasswordValidator = [
  body("token")
    .isString()
    .notEmpty()
    .withMessage("Token is required"),

  body("newPassword")
    .isString()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
    .withMessage("New password must contain at least one special character"),
];

