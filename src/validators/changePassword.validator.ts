import { body, CustomValidator } from "express-validator";

// Custom validator to ensure either currentPassword or token is provided
const validatePasswordChangeMethod: CustomValidator = (value, { req }) => {
  const hasCurrentPassword = req.body.currentPassword && req.body.currentPassword.trim().length > 0;
  const hasToken = req.body.token && req.body.token.trim().length > 0;
  
  if (!hasCurrentPassword && !hasToken) {
    throw new Error("Either currentPassword or token must be provided");
  }
  
  if (hasCurrentPassword && hasToken) {
    throw new Error("Cannot provide both currentPassword and token. Use one method only.");
  }
  
  return true;
};

export const changePasswordValidator = [
  body("currentPassword")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Current password must be a non-empty string"),

  body("token")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Token must be a non-empty string"),

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

  body().custom(validatePasswordChangeMethod),
];

